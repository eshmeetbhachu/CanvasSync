"""Build a versioned train/validation/test dataset from collected and QuickDraw drawings.

Every drawing becomes a square image (see rasterize.py) and keeps its raw stroke.
Collected drawings are split by PERSON; QuickDraw drawings go to train only.

Usage (from the repo root):
    ml/.venv/Scripts/python ml/build_dataset.py --version v1
"""

import argparse
import hashlib
import json
import random
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from labels import LABELS
from rasterize import rasterize

ML_DIR = Path(__file__).resolve().parent
CONFIG_PATH = ML_DIR / "config.json"
DEFAULT_COLLECTED = ML_DIR / "data" / "raw" / "collected.jsonl"
DEFAULT_QUICKDRAW_DIR = ML_DIR / "data" / "raw" / "quickdraw"
DEFAULT_OUT_DIR = ML_DIR / "data" / "datasets"

SPLITS = ["train", "val", "test"]
MIN_PEOPLE = 3


def read_jsonl(path):
    with path.open(encoding="utf-8") as lines:
        return [json.loads(line) for line in lines if line.strip()]


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_collected(path):
    """Drawings from the app's /collect page; `person` is the account that drew them."""
    return [
        {"id": r["id"], "label": r["label"], "source": "collected", "person": r["user"], "points": r["points"]}
        for r in read_jsonl(path)
    ]


def load_quickdraw(directory):
    """Public QuickDraw drawings; they carry no person id, so they are only ever used for training."""
    records = []

    for path in sorted(directory.glob("*.jsonl")):
        for r in read_jsonl(path):
            records.append({"id": r["id"], "label": r["label"], "source": "quickdraw", "person": None, "points": r["points"]})

    return records


def split_people(drawings_per_person, val_fraction, test_fraction, seed):
    """Assign each person to exactly one split, so no one's drawings appear in two.

    People are shuffled with a fixed seed, then given to test, then to val, and the
    rest to train. A person joins test (or val) only if that brings it closer to its
    share of the collected drawings, so a few big contributors cannot overfill it.
    """
    people = sorted(drawings_per_person)

    if len(people) < MIN_PEOPLE:
        raise ValueError(
            f"Need drawings from at least {MIN_PEOPLE} people to split by person; found {len(people)}."
        )

    random.Random(seed).shuffle(people)
    total = sum(drawings_per_person.values())
    assignment = {}
    filled = {"test": 0, "val": 0}
    targets = {"test": test_fraction * total, "val": val_fraction * total}

    closed = set()

    def wants(split, count):
        if split in closed:
            return False
        # The first person always goes in; later ones only if they move the split closer to its target.
        if filled[split] == 0 or abs(filled[split] + count - targets[split]) < abs(filled[split] - targets[split]):
            return True
        closed.add(split)
        return False

    for position, person in enumerate(people):
        count = drawings_per_person[person]
        remaining = len(people) - position
        # Always leave at least one person for every split that still has to be filled.
        if remaining > 2 and wants("test", count):
            split = "test"
        elif remaining > 1 and wants("val", count):
            split = "val"
        else:
            split = "train"

        assignment[person] = split
        if split in filled:
            filled[split] += count

    return assignment


def summarize(records):
    per_label = Counter(r["label"] for r in records)
    per_source = Counter(r["source"] for r in records)

    return {
        "total": len(records),
        "per_label": {label: per_label.get(label, 0) for label in LABELS},
        "per_source": dict(sorted(per_source.items())),
        "people": sorted({r["person"] for r in records if r["person"]}),
    }


def build(version, collected_path, quickdraw_dir, out_dir, config):
    target = out_dir / version

    if target.exists():
        raise FileExistsError(f"{target} already exists. Dataset versions are never overwritten; pick a new --version.")

    records = load_collected(collected_path) + load_quickdraw(quickdraw_dir)

    usable = []
    skipped = Counter()

    for record in records:
        if record["label"] not in LABELS:
            skipped["unknown label"] += 1
            continue

        image = rasterize(record["points"], config["image_size"], config["padding"], config["line_width"])

        if image is None:
            skipped["no extent (a dot)"] += 1
            continue

        usable.append((record, image))

    drawings_per_person = Counter(r["person"] for r, _ in usable if r["source"] == "collected")
    assignment = split_people(
        drawings_per_person,
        config["split"]["val_fraction"],
        config["split"]["test_fraction"],
        config["seed"],
    )

    by_split = {split: [] for split in SPLITS}

    for record, image in usable:
        split = assignment[record["person"]] if record["source"] == "collected" else "train"
        by_split[split].append((record, image))

    target.mkdir(parents=True)
    warnings = []
    split_summaries = {}

    for split in SPLITS:
        items = by_split[split]
        size = config["image_size"]
        images = np.stack([image for _, image in items]) if items else np.zeros((0, size, size), dtype=np.uint8)
        label_ids = np.array([LABELS.index(r["label"]) for r, _ in items], dtype=np.int64)

        np.savez_compressed(target / f"{split}.npz", images=images, labels=label_ids)

        # Line N holds the raw stroke for image N.
        with (target / f"{split}.jsonl").open("w", encoding="utf-8", newline="\n") as out:
            for index, (record, _) in enumerate(items):
                out.write(json.dumps({"index": index, **record}, separators=(",", ":")) + "\n")

        split_summaries[split] = summarize([r for r, _ in items])

        if split != "train":
            missing = [label for label, count in split_summaries[split]["per_label"].items() if count == 0]
            if missing:
                warnings.append(f"{split} has no examples of: {', '.join(missing)}")

    manifest = {
        "version": version,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "labels": LABELS,
        "config": config,
        "inputs": {
            "collected": {"file": collected_path.name, "sha256": sha256(collected_path)},
            "quickdraw": {p.name: sha256(p) for p in sorted(quickdraw_dir.glob("*.jsonl"))},
        },
        "skipped": dict(skipped),
        "warnings": warnings,
        "splits": split_summaries,
    }
    (target / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    return manifest


def print_report(manifest, target):
    print(f"Dataset {manifest['version']} written to {target}")
    print(f"{'label':<11}" + "".join(f"{split:>8}" for split in SPLITS))
    for label in LABELS:
        print(f"{label:<11}" + "".join(f"{manifest['splits'][s]['per_label'][label]:>8}" for s in SPLITS))
    print(f"{'TOTAL':<11}" + "".join(f"{manifest['splits'][s]['total']:>8}" for s in SPLITS))
    print(f"{'people':<11}" + "".join(f"{len(manifest['splits'][s]['people']):>8}" for s in SPLITS))
    for name, count in manifest["skipped"].items():
        print(f"skipped {count}: {name}")
    for warning in manifest["warnings"]:
        print(f"WARNING: {warning}")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--version", required=True, help="name of the new dataset version, e.g. v1")
    parser.add_argument("--collected", type=Path, default=DEFAULT_COLLECTED)
    parser.add_argument("--quickdraw-dir", type=Path, default=DEFAULT_QUICKDRAW_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    if not args.collected.exists():
        raise SystemExit(f"{args.collected} not found. Run export_collected.py first.")

    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

    try:
        manifest = build(args.version, args.collected, args.quickdraw_dir, args.out_dir, config)
    except (ValueError, FileExistsError) as error:
        raise SystemExit(str(error))

    print_report(manifest, args.out_dir / args.version)


if __name__ == "__main__":
    main()
