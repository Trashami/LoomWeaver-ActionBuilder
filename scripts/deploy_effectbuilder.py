"""
Pushes effectbuilder-studio to a dedicated GitHub repository (LoomWeaver-EffectBuilder),
pushes LoomWeaverV2 to origin (master & dev), and deploys the EffectBuilder standalone
Angular application + updated .NET 10 backend to 209.46.127.226 (effectbuilder.loom-weaver.com
and dev/prod backend services).
"""
import json
import os
import subprocess
import tarfile
import urllib.error
import urllib.request
import paramiko

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EB_ROOT = os.path.join(ROOT, "effectbuilder-studio")
EB_DIST = os.path.join(EB_ROOT, "dist", "effectbuilder-studio", "browser")
SERVER_PUB = os.path.join(ROOT, "backend", "publish")
EB_TAR = os.path.join(EB_ROOT, "dist", "effectbuilder_client.tar.gz")
SERVER_TAR = os.path.join(ROOT, "backend", "loomweaver_server.tar.gz")


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


def push_repos() -> None:
    username, token = get_github_credentials()
    eb_remote = ensure_github_repo(
        username,
        token,
        "LoomWeaver-EffectBuilder",
        "Standalone Angular 22 + Babylon.js 3D Effect Builder Studio for effectbuilder.loom-weaver.com",
    )

    # 1. Push standalone effectbuilder-studio to its own GitHub repository (master & dev branches)
    eb_gitignore = os.path.join(EB_ROOT, ".gitignore")
    if not os.path.exists(eb_gitignore):
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
            "EffectBuilder Studio: Standalone Angular 22 + Babylon.js 3D Rune Vortex, Emitter Library & Multi-Track Timeline",
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
    print(f"Pushed standalone EffectBuilder Studio to {eb_remote} (master + dev)")

    # Remove nested .git before committing to parent LoomWeaverV2 so it tracks cleanly as normal files
    import shutil
    shutil.rmtree(os.path.join(EB_ROOT, ".git"), ignore_errors=True)

    # 2. Push parent LoomWeaverV2 repository (master & dev)
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
            "Add standalone effectbuilder-studio Angular app & .NET EffectStudio APIs for effectbuilder.loom-weaver.com",
        )
    run_git(ROOT, "push", "-u", "origin", "master")
    run_git(ROOT, "push", "origin", "master:dev", "--force")
    print("Pushed LoomWeaverV2 to origin (master + dev)")


def deploy_to_server() -> None:
    print("Packaging effectbuilder_client.tar.gz and loomweaver_server.tar.gz...")
    with tarfile.open(EB_TAR, "w:gz") as tf:
        for item in os.listdir(EB_DIST):
            tf.add(os.path.join(EB_DIST, item), arcname=item)

    with tarfile.open(SERVER_TAR, "w:gz") as tf:
        for item in os.listdir(SERVER_PUB):
            tf.add(os.path.join(SERVER_PUB, item), arcname=item)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect("209.46.127.226", username="iamtrash", password="tZ-2jETuYpgVRzFBF=09")

    sftp = ssh.open_sftp()
    sftp.put(EB_TAR, "/tmp/effectbuilder_client.tar.gz")
    sftp.put(SERVER_TAR, "/tmp/loomweaver_server.tar.gz")

    remote_script = r"""#!/usr/bin/env bash
set -e

echo "1. Deploying updated LoomWeaver.Api backend to /var/www/loomweaver/server..."
systemctl stop loom-weaver.service mythweaver.service 2>/dev/null || true
mkdir -p /var/www/loomweaver/server
rm -rf /var/www/loomweaver/server/*
tar -xzf /tmp/loomweaver_server.tar.gz -C /var/www/loomweaver/server

echo "2. Deploying standalone EffectBuilder Studio to /var/www/effectbuilder/current/client..."
rm -rf /var/www/effectbuilder/current/client
mkdir -p /var/www/effectbuilder/current/client
tar -xzf /tmp/effectbuilder_client.tar.gz -C /var/www/effectbuilder/current/client
mkdir -p /var/www/loomweaver/assets/lighting
cp -rf /var/www/effectbuilder/current/client/lighting/* /var/www/loomweaver/assets/lighting/ 2>/dev/null || true
rm -rf /var/www/effectbuilder/current/client/assets
ln -sfn /var/www/loomweaver/assets /var/www/effectbuilder/current/client/assets

chown -R iamtrash:www-data /var/www/effectbuilder /var/www/loomweaver/server
chmod -R 755 /var/www/effectbuilder /var/www/loomweaver/server

echo "3. Updating nginx configuration for effectbuilder.loom-weaver.com to route /api/ to unified backend..."
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
    location /assets/ { alias /var/www/loomweaver/assets/; }
    location / { try_files $uri $uri/ /index.html; }
    location = /index.html { add_header Cache-Control "no-cache, no-store, must-revalidate" always; }
}
EOF

ln -sfn /etc/nginx/sites-available/effectbuilder-loom-weaver /etc/nginx/sites-enabled/effectbuilder-loom-weaver
nginx -t
systemctl restart loom-weaver.service mythweaver.service
systemctl reload nginx
sleep 2

echo "4. Verifying services and EffectStudio API endpoints..."
systemctl is-active loom-weaver.service mythweaver.service nginx
curl -s http://127.0.0.1:5000/api/v2/effects/health
echo ""
curl -s "http://127.0.0.1:5000/api/v2/effects/campaigns/1/context?viewerRole=gm&username=GeoJason" | head -c 400
echo ""
curl -k -s -I -H "Host: effectbuilder.loom-weaver.com" https://127.0.0.1/ | head -n 5
"""
    with sftp.open("/tmp/deploy_effectbuilder.sh", "w") as f:
        f.write(remote_script)
    sftp.close()

    _, out, err = ssh.exec_command(
        'echo "tZ-2jETuYpgVRzFBF=09" | sudo -S bash /tmp/deploy_effectbuilder.sh'
    )
    print(out.read().decode())
    err_txt = err.read().decode()
    if err_txt:
        print("Remote stderr:", err_txt)

    ssh.close()
    for f in (EB_TAR, SERVER_TAR):
        if os.path.exists(f):
            os.remove(f)


if __name__ == "__main__":
    push_repos()
    deploy_to_server()
