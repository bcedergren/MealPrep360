#!/usr/bin/env python3
import csv, json, os, sys, subprocess

# --- Required env vars (set these before running) ---
PROJECT_OWNER = os.environ.get("PROJECT_OWNER") or "your-username"   # user or org that owns the Project
PROJECT_NUMBER = os.environ.get("PROJECT_NUMBER") or "1"             # the numeric part in the Project URL
REPO = os.environ.get("REPO") or "your-username/MealPrep360"         # target repo for new issues
CSV_PATH = os.environ.get("CSV", "MP360_GitHub_Projects_To_Do_List.csv")

def run(args):
    res = subprocess.run(args, capture_output=True, text=True)
    if res.returncode != 0:
        print("ERR:", " ".join(args))
        print(res.stderr.strip())
        sys.exit(res.returncode)
    return res.stdout.strip()

def gh_api_json(args):
    out = run(["gh","api"] + args + ["-H","Accept: application/vnd.github+json"])
    try:
        return json.loads(out)
    except Exception:
        print("Unexpected output from gh api:", out)
        sys.exit(1)

# Resolve ProjectV2 node ID (works for user-owned or org-owned projects)
def get_project_node_id(owner, number):
    q = """
    query($owner:String!, $number:Int!){
      user(login:$owner){ projectV2(number:$number){ id } }
      organization(login:$owner){ projectV2(number:$number){ id } }
    }"""
    data = gh_api_json(["graphql","-f",f"query={q}","-F",f"owner={owner}","-F",f"number={number}"])
    pid = (data.get("data",{}).get("user") or {}).get("projectV2",{}).get("id")
    if not pid:
        pid = (data.get("data",{}).get("organization") or {}).get("projectV2",{}).get("id")
    if not pid:
        print("Could not resolve ProjectV2 id. Check PROJECT_OWNER/PROJECT_NUMBER.")
        sys.exit(1)
    return pid

def add_item_to_project(project_id, issue_node_id):
    m = """
    mutation($project:ID!, $content:ID!){
      addProjectV2ItemById(input:{projectId:$project, contentId:$content}){ item { id } }
    }"""
    gh_api_json(["graphql","-f",f"query={m}","-F",f"project={project_id}","-F",f"content={issue_node_id}"])

def get_issue_node_id(owner_repo, number):
    owner, repo = owner_repo.split("/",1)
    q = """
    query($owner:String!,$repo:String!,$number:Int!){
      repository(owner:$owner,name:$repo){ issue(number:$number){ id } }
    }"""
    data = gh_api_json(["graphql","-f",f"query={q}",
                        "-F",f"owner={owner}","-F",f"repo={repo}","-F",f"number={number}"])
    return data["data"]["repository"]["issue"]["id"]

project_id = get_project_node_id(PROJECT_OWNER, int(PROJECT_NUMBER))

with open(CSV_PATH, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        title = (row.get("Title") or "").strip()
        body  = (row.get("Body")  or "").strip()
        labels_csv = (row.get("Labels") or "").strip()
        labels = [l.strip() for l in labels_csv.split(",") if l.strip()]

        # Create issue via REST
        args = ["-X","POST", f"repos/{REPO}/issues",
                "-f", f"title={title}",
                "-f", f"body={body}"]
        if labels:
            args += ["-f", f"labels={json.dumps(labels)}"]
        issue = gh_api_json(args)
        number = issue["number"]
        url = issue["html_url"]
        print(f"Created #{number}: {url}")

        # Add to Project
        node_id = get_issue_node_id(REPO, number)
        add_item_to_project(project_id, node_id)
        print(f"  → added to project {PROJECT_OWNER}/{PROJECT_NUMBER}")

print("Done.")
