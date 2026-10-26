"""
Deploys the refactored EffectBuilder Studio frontend and the unified single .NET 10
backend (LoomWeaver.Api on port 5000) to 209.46.127.226, verifies live sign-in and
effect endpoints on https://effectbuilder.loom-weaver.com, and pushes both
LoomWeaver-EffectBuilder and LoomWeaverV2 to GitHub (master & dev).
"""
import json
import os
import shutil
import subprocess
import tarfile
import urllib.error
import urllib.request
import paramiko

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EB_ROOT = os.path.join(ROOT, "effectbuilder-studio")
EB_DIST = os.path.join(EB_ROOT, "dist", "effectbuilder-client", "browser")
BACKEND_PUB = os.path.join(ROOT, "backend", "publish")
DEPLOY_TAR = os.path.join(ROOT, "effectbuilder_unified.tar.gz")


def get_github_credentials() -> tuple[str, str]:
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
    return creds["username"], creds["password"]


def ensure_github_repo(username: str, token: str, repo_name: str, description: str) -> str:
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "LoomWeaverV2-EffectBuilder",
        "Content-Type": "application/json",
    }
    payload = json.dumps(
        {
            "name": repo_name,
            "description": description,
            "private": False,
            "auto_init": False,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        "https://api.github.com/user/repos",
        data=payload,
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"Created new GitHub repository: {data['html_url']}")
    except urllib.error.HTTPError as e:
        if e.code == 422:
            print(f"GitHub repository https://github.com/{username}/{repo_name} already exists; reusing.")
        else:
            raise RuntimeError(f"GitHub API error {e.code}: {e.read().decode('utf-8')}") from e
    return f"https://github.com/{username}/{repo_name}.git"


def run_git(cwd: str, *args: str) -> None:
    res = subprocess.run(["git", *args], cwd=cwd, text=True, capture_output=True)
    if res.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} in {cwd} failed: {res.stderr}")
    if res.stdout.strip():
        print(res.stdout.strip())


def deploy_to_server() -> None:
    if not os.path.exists(os.path.join(EB_DIST, "index.html")):
        raise RuntimeError(f"Missing built frontend at {EB_DIST}/index.html")
    if not os.path.exists(os.path.join(BACKEND_PUB, "LoomWeaver.Api.dll")):
        raise RuntimeError(f"Missing published backend at {BACKEND_PUB}/LoomWeaver.Api.dll")

    print("Packaging EffectBuilder Studio frontend + Unified .NET 10 backend...")
    with tarfile.open(DEPLOY_TAR, "w:gz") as tf:
        tf.add(EB_DIST, arcname="client")
        tf.add(BACKEND_PUB, arcname="backend")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect("209.46.127.226", username="iamtrash", password="tZ-2jETuYpgVRzFBF=09")

    sftp = ssh.open_sftp()
    sftp.put(DEPLOY_TAR, "/tmp/effectbuilder_unified.tar.gz")

    remote_script = r"""#!/usr/bin/env bash
set -e

RELEASE_DIR="/var/www/effectbuilder/releases/unified-v15"
echo "1. Extracting EffectBuilder client + Unified .NET backend to $RELEASE_DIR..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
tar -xzf /tmp/effectbuilder_unified.tar.gz -C "$RELEASE_DIR"
rm -f /tmp/effectbuilder_unified.tar.gz

echo "2. Updating Unified .NET Backend at /var/www/loomweaver/server..."
mkdir -p /var/www/loomweaver/server
cp -a "$RELEASE_DIR/backend/." /var/www/loomweaver/server/
if [ -f "$RELEASE_DIR/client/google-sso.html" ] && [ -d /var/www/loomweaver/client ]; then
    cp -f "$RELEASE_DIR/client/google-sso.html" /var/www/loomweaver/client/google-sso.html
fi
chown -R iamtrash:www-data /var/www/loomweaver/server
chmod -R 755 /var/www/loomweaver/server

echo "3. Activating EffectBuilder Studio frontend at /var/www/effectbuilder/current..."
rm -rf /var/www/effectbuilder/current
ln -sfn "$RELEASE_DIR" /var/www/effectbuilder/current
chown -R iamtrash:www-data /var/www/effectbuilder
chmod -R 755 /var/www/effectbuilder

echo "4. Updating nginx for effectbuilder.loom-weaver.com to use the single .NET backend (127.0.0.1:5000)..."
cat << 'EOF' > /etc/nginx/sites-available/effectbuilder-loom-weaver
server {
    listen 80;
    server_name effectbuilder.loom-weaver.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name effectbuilder.loom-weaver.com;
    ssl_certificate /etc/ssl/certs/loom-weaver.pem;
    ssl_certificate_key /etc/ssl/private/loom-weaver.key;
    root /var/www/effectbuilder/current/client;
    index index.html;
    client_max_body_size 15m;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-store";
    }
    location /hubs/ {
        proxy_pass http://127.0.0.1:5000/hubs/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /uploads/ { proxy_pass http://127.0.0.1:5000/uploads/; }
    location /assets/ { alias /var/www/loom-weaver/client/assets/; }
    location /tokens/ { proxy_pass http://127.0.0.1:5000/tokens/; }
    location /img/ { proxy_pass http://127.0.0.1:5000/img/; }
    location / { try_files $uri $uri/ /index.html; }
    location = /index.html { add_header Cache-Control "no-cache, no-store, must-revalidate" always; }
}
EOF

ln -sfn /etc/nginx/sites-available/effectbuilder-loom-weaver /etc/nginx/sites-enabled/effectbuilder-loom-weaver
nginx -t

echo "5. Stopping retired effectbuilder.service (port 5002) and restarting unified loom-weaver.service (port 5000)..."
systemctl stop effectbuilder.service || true
systemctl disable effectbuilder.service || true
systemctl daemon-reload
systemctl restart loom-weaver.service
systemctl reload nginx
sleep 3

echo "6. Verifying unified loom-weaver.service and https://effectbuilder.loom-weaver.com endpoints..."
systemctl is-active loom-weaver.service nginx
echo "--- /api/effects/health ---"
curl -k -s -H "Host: effectbuilder.loom-weaver.com" https://127.0.0.1/api/effects/health
echo ""
echo "--- /api/spells?search=fire ---"
curl -k -s -H "Host: effectbuilder.loom-weaver.com" "https://127.0.0.1/api/spells?search=fire" | head -c 300
echo ""
echo "--- /google-sso.html ---"
curl -k -s -I -H "Host: effectbuilder.loom-weaver.com" https://127.0.0.1/google-sso.html | head -n 5
echo "--- / (index.html) ---"
curl -k -s -I -H "Host: effectbuilder.loom-weaver.com" https://127.0.0.1/ | head -n 5
"""
    with sftp.open("/tmp/deploy_effectbuilder_unified.sh", "w") as f:
        f.write(remote_script)
    sftp.close()

    _, out, err = ssh.exec_command(
        'echo "tZ-2jETuYpgVRzFBF=09" | sudo -S bash /tmp/deploy_effectbuilder_unified.sh'
    )
    print(out.read().decode())
    err_txt = err.read().decode()
    if err_txt:
        print("Remote stderr:", err_txt)

    ssh.close()
    if os.path.exists(DEPLOY_TAR):
        os.remove(DEPLOY_TAR)


def push_repos() -> None:
    username, token = get_github_credentials()
    eb_remote = ensure_github_repo(
        username,
        token,
        "LoomWeaver-EffectBuilder",
        "EffectBuilder Studio for effectbuilder.loom-weaver.com (unified LoomWeaver .NET 10 backend)",
    )

    eb_gitignore = os.path.join(EB_ROOT, ".gitignore")
    with open(eb_gitignore, "w", encoding="utf-8") as f:
        f.write("node_modules/\ndist/\n.angular/\n*.tar.gz\n")

    if not os.path.exists(os.path.join(EB_ROOT, ".git")):
        run_git(EB_ROOT, "init", "-b", "master")

    run_git(EB_ROOT, "config", "user.name", username)
    run_git(EB_ROOT, "config", "user.email", f"{username}@users.noreply.github.com")
    run_git(EB_ROOT, "add", "-A")
    status = subprocess.run(
        ["git", "status", "--porcelain"], cwd=EB_ROOT, text=True, capture_output=True
    ).stdout.strip()
    if status:
        run_git(
            EB_ROOT,
            "commit",
            "-m",
            "Refactor EffectBuilder for <=500 line modularity, unified .NET auth, and standalone .lweffect.json import/export",
        )

    remotes = subprocess.run(
        ["git", "remote"], cwd=EB_ROOT, text=True, capture_output=True
    ).stdout.splitlines()
    if "origin" in remotes:
        run_git(EB_ROOT, "remote", "set-url", "origin", eb_remote)
    else:
        run_git(EB_ROOT, "remote", "add", "origin", eb_remote)

    run_git(EB_ROOT, "branch", "-M", "master")
    run_git(EB_ROOT, "push", "-u", "origin", "master", "--force")
    run_git(EB_ROOT, "push", "origin", "master:dev", "--force")
    print(f"Pushed EffectBuilder Studio to {eb_remote} (master + dev)")

    shutil.rmtree(os.path.join(EB_ROOT, ".git"), ignore_errors=True)

    lw_remote = f"https://github.com/{username}/LoomWeaverV2.git"
    run_git(ROOT, "remote", "set-url", "origin", lw_remote)
    run_git(ROOT, "config", "user.name", username)
    run_git(ROOT, "config", "user.email", f"{username}@users.noreply.github.com")
    run_git(ROOT, "add", "-A")
    root_status = subprocess.run(
        ["git", "status", "--porcelain"], cwd=ROOT, text=True, capture_output=True
    ).stdout.strip()
    if root_status:
        run_git(
            ROOT,
            "commit",
            "-m",
            "Unify EffectBuilder into single .NET 10 backend, fix cross-subdomain auth, and add standalone effect file import/export",
        )
    run_git(ROOT, "push", "-u", "origin", "master", "--force")
    run_git(ROOT, "push", "origin", "master:dev", "--force")
    print("Pushed LoomWeaverV2 to origin (master + dev)")


if __name__ == "__main__":
    deploy_to_server()
    push_repos()
