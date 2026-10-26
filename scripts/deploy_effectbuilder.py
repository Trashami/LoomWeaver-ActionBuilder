"""
Pushes the existing old EffectBuilder (brought over as-is into effectbuilder-studio) to
its dedicated GitHub repository (LoomWeaver-EffectBuilder), pushes LoomWeaverV2 to origin
(master & dev), and deploys the existing old EffectBuilder client + EffectBuilder.server
as-is to 209.46.127.226 (effectbuilder.loom-weaver.com).
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
OLD_WORK = r"C:\repos\Jane\Jane\.effectbuilder\work\MythWeaver"
EB_DIST = os.path.join(OLD_WORK, "EffectBuilder.client", "dist", "effectbuilder-client", "browser")
EB_SERVER_PUB = os.path.join(OLD_WORK, "EffectBuilder.server", "publish")
DEPLOY_TAR = os.path.join(ROOT, "effectbuilder_as_is.tar.gz")


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
        "EffectBuilder Studio (EffectBuilder.client + EffectBuilder.server) for effectbuilder.loom-weaver.com",
    )

    eb_gitignore = os.path.join(EB_ROOT, ".gitignore")
    with open(eb_gitignore, "w", encoding="utf-8") as f:
        f.write("node_modules/\ndist/\n.angular/\nserver/bin/\nserver/obj/\nserver/publish/\n*.tar.gz\n")

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
            "Restore existing EffectBuilder (EffectBuilder.client + EffectBuilder.server) as-is",
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
    print(f"Pushed existing EffectBuilder as-is to {eb_remote} (master + dev)")

    shutil.rmtree(os.path.join(EB_ROOT, ".git"), ignore_errors=True)

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
            "Bring existing EffectBuilder (EffectBuilder.client + EffectBuilder.server) over as-is",
        )
    run_git(ROOT, "push", "-u", "origin", "master")
    run_git(ROOT, "push", "origin", "master:dev", "--force")
    print("Pushed LoomWeaverV2 to origin (master + dev)")


def deploy_to_server() -> None:
    print("Packaging existing EffectBuilder client and server into effectbuilder_as_is.tar.gz...")
    with tarfile.open(DEPLOY_TAR, "w:gz") as tf:
        tf.add(EB_DIST, arcname="client")
        tf.add(EB_SERVER_PUB, arcname="server")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect("209.46.127.226", username="iamtrash", password="tZ-2jETuYpgVRzFBF=09")

    sftp = ssh.open_sftp()
    sftp.put(DEPLOY_TAR, "/tmp/effectbuilder_as_is.tar.gz")

    remote_script = r"""#!/usr/bin/env bash
set -e

RELEASE_DIR="/var/www/effectbuilder/releases/as-is-v14"
echo "1. Extracting existing EffectBuilder client + server to $RELEASE_DIR..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
tar -xzf /tmp/effectbuilder_as_is.tar.gz -C "$RELEASE_DIR"
rm -f /tmp/effectbuilder_as_is.tar.gz

ln -sfn "$RELEASE_DIR" /var/www/effectbuilder/current
chown -R iamtrash:www-data /var/www/effectbuilder
chmod -R 755 /var/www/effectbuilder

echo "2. Restoring original nginx config for effectbuilder.loom-weaver.com..."
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
    location /api/effects/ {
        proxy_pass http://127.0.0.1:5002/api/effects/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-store";
    }
    location /api/summon-assets/ {
        proxy_pass http://127.0.0.1:5002/api/summon-assets/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-store";
    }
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
    location /assets/ { alias /var/www/loom-weaver/client/assets/; }
    location /tokens/ { proxy_pass http://127.0.0.1:5000/tokens/; }
    location /img/ { proxy_pass http://127.0.0.1:5000/img/; }
    location / { try_files $uri $uri/ /index.html; }
    location = /index.html { add_header Cache-Control "no-cache, no-store, must-revalidate" always; }
}
EOF

ln -sfn /etc/nginx/sites-available/effectbuilder-loom-weaver /etc/nginx/sites-enabled/effectbuilder-loom-weaver
nginx -t
systemctl daemon-reload
systemctl restart effectbuilder.service
systemctl reload nginx
sleep 2

echo "3. Verifying effectbuilder.service and https://effectbuilder.loom-weaver.com..."
systemctl is-active effectbuilder.service nginx
curl -s http://127.0.0.1:5002/api/effects/health
echo ""
curl -k -s -H "Host: effectbuilder.loom-weaver.com" https://127.0.0.1/api/effects/health
echo ""
curl -k -s -I -H "Host: effectbuilder.loom-weaver.com" https://127.0.0.1/ | head -n 5
"""
    with sftp.open("/tmp/deploy_effectbuilder_as_is.sh", "w") as f:
        f.write(remote_script)
    sftp.close()

    _, out, err = ssh.exec_command(
        'echo "tZ-2jETuYpgVRzFBF=09" | sudo -S bash /tmp/deploy_effectbuilder_as_is.sh'
    )
    print(out.read().decode())
    err_txt = err.read().decode()
    if err_txt:
        print("Remote stderr:", err_txt)

    ssh.close()
    if os.path.exists(DEPLOY_TAR):
        os.remove(DEPLOY_TAR)


if __name__ == "__main__":
    push_repos()
    deploy_to_server()
