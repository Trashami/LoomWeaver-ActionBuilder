import json
import os
import subprocess
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

proc = subprocess.run(
    ["git", "credential", "fill"],
    input="protocol=https\nhost=github.com\n\n",
    text=True,
    capture_output=True,
    check=True,
)
creds = dict(
    line.split("=", 1) for line in proc.stdout.splitlines() if "=" in line
)
username = creds["username"]
token = creds["password"]

headers = {
    "Authorization": f"token {token}",
    "Accept": "application/vnd.github+json",
    "User-Agent": "LoomWeaverV2-Builder",
    "Content-Type": "application/json",
}

repo_name = "LoomWeaverV2"
create_payload = json.dumps(
    {
        "name": repo_name,
        "description": "LoomWeaver V2 — Modular Angular + .NET 10 + Babylon.js + MySQL + Neo4j TTRPG Operating System",
        "private": False,
        "auto_init": False,
    }
).encode("utf-8")

req = urllib.request.Request(
    "https://api.github.com/user/repos",
    data=create_payload,
    headers=headers,
    method="POST",
)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(f"Created new GitHub repository: {data['html_url']}")
except urllib.error.HTTPError as e:
    body = e.read().decode("utf-8")
    if e.code == 422:
        print(f"Repository https://github.com/{username}/{repo_name} already exists; reusing it.")
    else:
        raise RuntimeError(f"GitHub API error {e.code}: {body}") from e


def run_git(*args: str) -> None:
    res = subprocess.run(
        ["git", *args],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    if res.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed: {res.stderr}")
    if res.stdout.strip():
        print(res.stdout.strip())


if not os.path.exists(os.path.join(ROOT, ".git")):
    run_git("init", "-b", "master")

run_git("config", "user.name", username)
run_git("config", "user.email", f"{username}@users.noreply.github.com")
run_git("add", "-A")

status = subprocess.run(
    ["git", "status", "--porcelain"], cwd=ROOT, text=True, capture_output=True
).stdout.strip()
if status:
    run_git(
        "commit",
        "-m",
        "LoomWeaver V2: Site Architecture, Polyglot Core (MySQL + Neo4j), Character Studio & LoomMaps Babylon.js Engine",
    )

remote_url = f"https://github.com/{username}/{repo_name}.git"
remotes = subprocess.run(
    ["git", "remote"], cwd=ROOT, text=True, capture_output=True
).stdout.splitlines()
if "origin" in remotes:
    run_git("remote", "set-url", "origin", remote_url)
else:
    run_git("remote", "add", "origin", remote_url)

run_git("branch", "-M", "master")
run_git("push", "-u", "origin", "master", "--force")
print(f"Successfully pushed LoomWeaverV2 to https://github.com/{username}/{repo_name}")
