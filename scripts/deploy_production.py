import os
import tarfile
import paramiko

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENT_DIST = os.path.join(ROOT, "frontend", "dist", "loomweaver-v2", "browser")
SERVER_PUB = os.path.join(ROOT, "backend", "publish")
CLIENT_TAR = os.path.join(ROOT, "frontend", "dist", "loomweaver_client.tar.gz")
SERVER_TAR = os.path.join(ROOT, "backend", "loomweaver_server.tar.gz")

print("Creating client and server archives...")
with tarfile.open(CLIENT_TAR, "w:gz") as tf:
    for item in os.listdir(CLIENT_DIST):
        tf.add(os.path.join(CLIENT_DIST, item), arcname=item)

with tarfile.open(SERVER_TAR, "w:gz") as tf:
    for item in os.listdir(SERVER_PUB):
        tf.add(os.path.join(SERVER_PUB, item), arcname=item)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("209.46.127.226", username="iamtrash", password="tZ-2jETuYpgVRzFBF=09")

print("Uploading archives to 209.46.127.226...")
sftp = ssh.open_sftp()
sftp.put(CLIENT_TAR, "/tmp/loomweaver_client.tar.gz")
sftp.put(SERVER_TAR, "/tmp/loomweaver_server.tar.gz")
sftp.close()

remote_script = r"""#!/usr/bin/env bash
set -e

echo "1. Stopping legacy services..."
systemctl stop loom-weaver.service mythweaver.service actionbuilder.service effectbuilder.service 2>/dev/null || true
systemctl disable actionbuilder.service effectbuilder.service 2>/dev/null || true

echo "2. Preparing /var/www/loomweaver canonical structure and reorganizing map-assets..."
mkdir -p /var/www/loomweaver/client /var/www/loomweaver/server /var/www/loomweaver/assets

# Move 24GB of map assets from /var/www/loommaps/client/assets if not already moved
if [ -d /var/www/loommaps/client/assets ] && [ ! -L /var/www/loommaps/client/assets ]; then
    mv /var/www/loommaps/client/assets/* /var/www/loomweaver/assets/ 2>/dev/null || true
fi

# Organize canonical category directories inside /var/www/loomweaver/assets
cd /var/www/loomweaver/assets
mkdir -p models-3d stamps-2d terrain-textures lighting-and-overlays battlemaps-library catalogs

# Link organized categories while preserving direct paths for existing manifests
for d in models paired-3d object-library; do
    if [ -d "$d" ] && [ ! -e "models-3d/$d" ]; then
        ln -s "../$d" "models-3d/$d"
    fi
done

for d in stamps furnished-room-stamps-v1 modular-dungeon-stamps-v1 dungeon-atmosphere-stamps-v1 dungeon-infestation-stamps-v1 table-room-decor-v1 overhead-creatures-v1 overhead-aware-replacements-v1 stackable-limestone-cliffs-v2; do
    if [ -d "$d" ] && [ ! -e "stamps-2d/$d" ]; then
        ln -s "../$d" "stamps-2d/$d"
    fi
done

for d in textures alpine-battle-terrain-v1 biome-brush-library-v1 buried-sanctuary-terrain-v1 sewer-dungeon-wall-library-v1 terrain-repairs-and-hills-v1 desert-hide-completion-v1 underdark-feywild-encounters-v1; do
    if [ -d "$d" ] && [ ! -e "terrain-textures/$d" ]; then
        ln -s "../$d" "terrain-textures/$d"
    fi
done

for d in light-aware-assets-v1 light-aware-assets-v2 light-aware-assets-v3 light-aware-assets-v4 overlays paths; do
    if [ -d "$d" ] && [ ! -e "lighting-and-overlays/$d" ]; then
        ln -s "../$d" "lighting-and-overlays/$d"
    fi
done

ln -sfn /var/www/shared-uploads /var/www/loomweaver/assets/uploads
ln -sfn /var/www/jane-assets/5etools /var/www/loomweaver/assets/5etools

echo "3. Removing old legacy app files..."
rm -rf /var/www/actionbuilder /var/www/effectbuilder /var/www/vtt3d /var/www/generator /var/www/loommaps /var/www/loom-weaver /var/www/mythweaver
rm -rf /var/www/loomweaver/client/* /var/www/loomweaver/server/*

echo "4. Extracting new LoomWeaver V2 client and server..."
tar -xzf /tmp/loomweaver_client.tar.gz -C /var/www/loomweaver/client
tar -xzf /tmp/loomweaver_server.tar.gz -C /var/www/loomweaver/server
ln -sfn /var/www/loomweaver/assets /var/www/loomweaver/client/assets
ln -sfn /var/www/loomweaver/assets /var/www/loomweaver/map-assets

echo "5. Linking domain roots to /var/www/loomweaver..."
ln -sfn /var/www/loomweaver /var/www/loom-weaver
ln -sfn /var/www/loomweaver /var/www/mythweaver
mkdir -p /var/www/loommaps /var/www/vtt3d/current /var/www/actionbuilder/current /var/www/effectbuilder/current
ln -sfn /var/www/loomweaver/client /var/www/loommaps/client
ln -sfn /var/www/loomweaver/client /var/www/vtt3d/current/client
ln -sfn /var/www/loomweaver/client /var/www/actionbuilder/current/client
ln -sfn /var/www/loomweaver/client /var/www/effectbuilder/current/client

chown -R iamtrash:www-data /var/www/loomweaver
chmod -R 755 /var/www/loomweaver

echo "6. Updating systemd services to run LoomWeaver.Api.dll on database 'loomweaver'..."
cat << 'EOF' > /etc/systemd/system/loom-weaver.service
[Unit]
Description=LoomWeaver V2 ASP.NET Core Backend (Production)
After=network.target mysql.service docker.service

[Service]
Type=simple
User=iamtrash
WorkingDirectory=/var/www/loomweaver/server
ExecStart=/usr/share/dotnet/dotnet /var/www/loomweaver/server/LoomWeaver.Api.dll
Restart=always
RestartSec=5
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://127.0.0.1:5000
Environment=DOTNET_ROOT=/usr/share/dotnet
Environment=PATH=/usr/share/dotnet:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment="ConnectionStrings__LoomWeaverMySql=Server=127.0.0.1;Port=3306;Database=loomweaver;User ID=loomweaver_app;Password=Sp34kFri3nd4nd3nt3r!;SslMode=Preferred;"
Environment="Neo4j__Uri=bolt://127.0.0.1:7687"
Environment="Neo4j__Username=neo4j"
Environment="Neo4j__Password=Sp34kFri3nd4nd3nt3r!"
Environment="Neo4j__Database=neo4j"

[Install]
WantedBy=multi-user.target
EOF

cat << 'EOF' > /etc/systemd/system/mythweaver.service
[Unit]
Description=LoomWeaver V2 ASP.NET Core Backend (Port 5001 Mirror)
After=network.target mysql.service docker.service

[Service]
Type=simple
User=iamtrash
WorkingDirectory=/var/www/loomweaver/server
ExecStart=/usr/share/dotnet/dotnet /var/www/loomweaver/server/LoomWeaver.Api.dll
Restart=always
RestartSec=5
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://127.0.0.1:5001
Environment=DOTNET_ROOT=/usr/share/dotnet
Environment=PATH=/usr/share/dotnet:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment="ConnectionStrings__LoomWeaverMySql=Server=127.0.0.1;Port=3306;Database=loomweaver;User ID=loomweaver_app;Password=Sp34kFri3nd4nd3nt3r!;SslMode=Preferred;"
Environment="Neo4j__Uri=bolt://127.0.0.1:7687"
Environment="Neo4j__Username=neo4j"
Environment="Neo4j__Password=Sp34kFri3nd4nd3nt3r!"
Environment="Neo4j__Database=neo4j"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl restart loom-weaver.service mythweaver.service
systemctl reload nginx
sleep 2
systemctl is-active loom-weaver.service mythweaver.service nginx
curl -s http://127.0.0.1:5000/api/v2/health
echo ""
ls -la /var/www/loomweaver/assets
"""

sftp = ssh.open_sftp()
with sftp.open("/tmp/deploy_loomweaver_v2.sh", "w") as f:
    f.write(remote_script)
sftp.close()

print("Executing remote production deployment...")
_, out, err = ssh.exec_command(
    'echo "tZ-2jETuYpgVRzFBF=09" | sudo -S bash /tmp/deploy_loomweaver_v2.sh'
)
print(out.read().decode())
err_out = err.read().decode()
if err_out:
    print("Remote stderr:", err_out)

ssh.close()
for f in (CLIENT_TAR, SERVER_TAR):
    if os.path.exists(f):
        os.remove(f)
