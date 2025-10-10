#!/usr/bin/env python3
import csv
import subprocess
import os
import sys

# === Required environment variables ===
PROJECT_OWNER = os.environ.get("PROJECT_OWNER") or "your-username"
PROJECT_NUMBER = os.environ.get("PROJECT_NUMBER") or "1"
REPO = os.environ.get("REPO") or "your-username/MealPrep360"
CSV_PATH = os.environ.get("CSV", "Documents/new/MP360_GitHub_Projects_To_Do_List.csv")

# === Helper functions ===
def run(args):
    """Run subprocess safely, raise on error."""
    res = subprocess.run(args, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"❌ Error: {' '.join(args)}")
        print(res.stderr.strip())
        sys.exit(res.returncode)
    return res.stdout.strip()

# === Main process ===
with open(CSV_PATH, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        title = row.get("Title", "").strip()
        body = row.get("Body", "").strip()
        labels = [l.strip() for l in (row.get("Labels", "") or "").split(",") if l.strip()]

        print(f"📦 Creating issue: {title}")
        args = ["gh", "issue", "create", "-R", REPO, "-t", title, "-b", body]
        for label in labels:
            args += ["-l", label]

        # Create issue and get output
        out = run(args)
        # Find the issue URL in the output (usually last line)
        lines = out.splitlines()
        issue_url = next((line for line in lines if line.startswith("https://github.com/")), None)
        if not issue_url:
            print("❌ Could not find issue URL in gh output.")
            sys.exit(1)
        print(f"   → Created issue: {issue_url}")

        # Add issue to the project
        run([
            "gh", "project", "item-add",
            PROJECT_NUMBER,
            "--owner", PROJECT_OWNER,
            "--url", issue_url
        ])
        print(f"   ✅ Added to project {PROJECT_OWNER}/{PROJECT_NUMBER}")

print("🎉 All issues created and added to project!")