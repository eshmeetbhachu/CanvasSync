"""Download single-stroke drawings for our shape classes from Google QuickDraw.

Streams each category file and stops once enough drawings are kept, so the full
26-47 MB files are never stored. Output: data/raw/quickdraw/<category>.jsonl

Usage (from the repo root):
    ml/.venv/Scripts/python ml/download_quickdraw.py
"""

import json
import urllib.request
from collections import Counter
from pathlib import Path

from labels import LABELS

ML_DIR = Path(__file__).resolve().parent
CONFIG_PATH = ML_DIR / "config.json"
OUT_DIR = ML_DIR / "data" / "raw" / "quickdraw"
BASE_URL = "https://storage.googleapis.com/quickdraw_dataset/full/simplified/{category}.ndjson"


def caps_per_category(categories, per_label_cap):
    """Share each label's cap equally between the QuickDraw categories that feed it."""
    sources_per_label = Counter(categories.values())

    return {category: per_label_cap // sources_per_label[label] for category, label in categories.items()}


def to_points(drawing):
    """QuickDraw stores a stroke as [[x0, x1, ...], [y0, y1, ...]]; we use [[x0, y0], [x1, y1], ...]."""
    xs, ys = drawing[0]

    return [[x, y] for x, y in zip(xs, ys)]


def keep(record):
    # One stroke only (the app recognises one stroke at a time), and Google's own check that it matches its label.
    return record["recognized"] and len(record["drawing"]) == 1 and len(record["drawing"][0][0]) >= 2


def download_category(category, label, cap):
    url = BASE_URL.format(category=category)
    out_path = OUT_DIR / f"{category}.jsonl"
    scanned = 0
    kept = 0

    with urllib.request.urlopen(url, timeout=60) as response, out_path.open("w", encoding="utf-8", newline="\n") as out:
        for line in response:
            if kept >= cap:
                break

            record = json.loads(line)
            scanned += 1

            if not keep(record):
                continue

            out.write(json.dumps({
                "id": f"qd-{record['key_id']}",
                "label": label,
                "category": category,
                "points": to_points(record["drawing"]),
            }, separators=(",", ":")) + "\n")
            kept += 1

    return {"category": category, "label": label, "url": url, "scanned": scanned, "kept": kept, "cap": cap}


def main():
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))["quickdraw"]
    categories = config["categories"]

    unknown = set(categories.values()) - set(LABELS)
    if unknown:
        raise SystemExit(f"config.json maps QuickDraw categories to unknown labels: {sorted(unknown)}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    caps = caps_per_category(categories, config["per_label_cap"])
    results = []

    for category, label in categories.items():
        result = download_category(category, label, caps[category])
        results.append(result)
        print(f"  {category:<9} -> {label:<10} kept {result['kept']:>5} of {result['scanned']:>6} scanned")

    per_label = Counter()
    for result in results:
        per_label[result["label"]] += result["kept"]

    summary = {"per_label": {label: per_label.get(label, 0) for label in LABELS}, "categories": results}
    (OUT_DIR / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print("QuickDraw drawings per label:")
    for label in LABELS:
        print(f"  {label:<10} {summary['per_label'][label]}")
    print(f"Wrote {OUT_DIR}")


if __name__ == "__main__":
    main()
