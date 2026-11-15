#!/usr/bin/env python3
"""Writes each record in the kit's JSON Lines files to its own pretty-printed JSON file, for browsing."""
import argparse
import json
import os
import sys

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Datasets whose records are filed in one subfolder per value of this field.
GROUP_BY = {"location-occupancy": "propertyId"}


def expand(path, out_dir, group):
    count = 0
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            if not line.strip():
                continue
            rec = json.loads(line)
            rec_dir = os.path.join(out_dir, str(rec[group])) if group else out_dir
            os.makedirs(rec_dir, exist_ok=True)
            with open(os.path.join(rec_dir, f"{rec['id']}.json"), "w", encoding="utf-8") as out:
                out.write(json.dumps(rec, ensure_ascii=False, indent=2) + "\n")
            count += 1
    return count


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("datasets", nargs="*", help="dataset names, such as residential-listings; all of them if omitted")
    ap.add_argument("--data", default=os.path.join(KIT, "data"), help="folder holding the .jsonl files")
    ap.add_argument("--out", default=os.path.join(KIT, "records"), help="folder to write the records into")
    args = ap.parse_args()

    available = sorted(f[:-6] for f in os.listdir(args.data) if f.endswith(".jsonl"))
    wanted = args.datasets or available
    unknown = [d for d in wanted if d not in available]
    if unknown:
        sys.exit(f"unknown dataset: {', '.join(unknown)}. Choose from: {', '.join(available)}")
    for name in wanted:
        group = GROUP_BY.get(name)
        n = expand(os.path.join(args.data, name + ".jsonl"), os.path.join(args.out, name), group)
        where = os.path.join(args.out, name) + (f"/<{group}>/" if group else "/")
        print(f"{name}: wrote {n:,} files to {where}")


if __name__ == "__main__":
    main()
