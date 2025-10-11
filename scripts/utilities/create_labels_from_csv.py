#!/usr/bin/env python3
import csv
import subprocess
import os

CSV_PATH = os.environ.get("CSV", "Documents/new/MP360_GitHub_Projects_To_Do_List.csv")
REPO = os.environ.get("REPO") or "your-username/MealPrep360"

def run(args):
    res = subprocess.run(args, capture_output=True, text=True)
    return res.returncode, res.stdout.strip(), res.stderr.strip()

labels_set = set()
with open(CSV_PATH, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        labels = [l.strip() for l in (row.get("Labels", "") or "").split(",") if l.strip()]
        labels_set.update(labels)

for label in labels_set:
    print(f"Creating label: {label}")
    code, out, err = run(["gh", "label", "create", label, "--repo", REPO, "--color", "ededed"])
    if code == 0:
        print(f"✅ Created: {label}")
    elif "already exists" in err:
        print(f"ℹ️ Already exists: {label}")
    else:
        print(f"❌ Error creating {label}: {err}")

print("All labels processed.")
