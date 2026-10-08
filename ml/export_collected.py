"""Export the labeled drawings collected by the whiteboard's /collect page from MongoDB.

Writes one drawing per line to data/raw/collected.jsonl and a count summary next to it.

Usage (from the repo root):
    ml/.venv/Scripts/python ml/export_collected.py
    ml/.venv/Scripts/python ml/export_collected.py --uri mongodb://127.0.0.1:27017/mydb
"""

import argparse
import json
import os
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from pymongo import MongoClient
from pymongo.errors import ConfigurationError

from labels import LABELS

ML_DIR = Path(__file__).resolve().parent
SERVER_ENV = ML_DIR.parent / "server" / ".env"
DEFAULT_OUT = ML_DIR / "data" / "raw" / "collected.jsonl"

# Mongoose uses this database when the connection string does not name one.
MONGOOSE_DEFAULT_DB = "test"
COLLECTION = "labeleddrawings"


def read_uri_from_server_env():
    if not SERVER_ENV.exists():
        return None

    for line in SERVER_ENV.read_text(encoding="utf-8").splitlines():
        key, _, value = line.partition("=")

        if key.strip() == "MONGODB_URI":
            return value.strip().strip("\"'")

    return None


def resolve_uri(cli_uri):
    uri = cli_uri or os.environ.get("MONGODB_URI") or read_uri_from_server_env()

    if not uri:
        raise SystemExit("No MongoDB URI: pass --uri, set MONGODB_URI, or add it to server/.env")

    return uri


def get_database(client, db_name):
    if db_name:
        return client[db_name]

    try:
        return client.get_default_database()
    except ConfigurationError:
        return client[MONGOOSE_DEFAULT_DB]


def to_record(doc):
    return {
        "id": str(doc["_id"]),
        "label": doc["label"],
        "user": str(doc["userId"]),
        "session": doc["sessionId"],
        "created_at": doc["createdAt"].replace(tzinfo=timezone.utc).isoformat(),
        # [x, y] pairs in the order they were drawn
        "points": [[point["x"], point["y"]] for point in doc["points"]],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--uri", help="MongoDB connection string (default: MONGODB_URI or server/.env)")
    parser.add_argument("--db", help="database name (default: the one in the URI, else 'test')")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help=f"output file (default: {DEFAULT_OUT})")
    args = parser.parse_args()

    client = MongoClient(resolve_uri(args.uri), serverSelectionTimeoutMS=10000)
    database = get_database(client, args.db)

    per_label = Counter()
    per_user = Counter()
    skipped = 0

    args.out.parent.mkdir(parents=True, exist_ok=True)

    # Sorted by _id so the same data always produces the same file.
    with args.out.open("w", encoding="utf-8", newline="\n") as out:
        for doc in database[COLLECTION].find().sort("_id", 1):
            if doc.get("label") not in LABELS or len(doc.get("points", [])) < 2:
                skipped += 1
                continue

            record = to_record(doc)
            out.write(json.dumps(record, separators=(",", ":")) + "\n")
            per_label[record["label"]] += 1
            per_user[record["user"]] += 1

    summary = {
        "exported_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "database": database.name,
        "total": sum(per_label.values()),
        "skipped": skipped,
        "people": len(per_user),
        "per_label": {label: per_label.get(label, 0) for label in LABELS},
        "per_person": dict(sorted(per_user.items())),
    }
    summary_path = args.out.with_suffix(".summary.json")
    summary_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print(f"Exported {summary['total']} drawings from {summary['people']} people (database '{database.name}')")
    for label in LABELS:
        print(f"  {label:<10} {summary['per_label'][label]}")
    if skipped:
        print(f"Skipped {skipped} unusable records")
    print(f"Wrote {args.out}\nWrote {summary_path}")


if __name__ == "__main__":
    main()
