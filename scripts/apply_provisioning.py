import os
import paramiko

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL_FILE = os.path.join(ROOT, "scripts", "provision_loomweaver_mysql.sql")
CYPHER_FILE = os.path.join(ROOT, "scripts", "provision_loomweaver_neo4j.cypher")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("209.46.127.226", username="iamtrash", password="tZ-2jETuYpgVRzFBF=09")

sftp = ssh.open_sftp()
sftp.put(SQL_FILE, "/tmp/provision_loomweaver_mysql.sql")
sftp.put(CYPHER_FILE, "/tmp/provision_loomweaver_neo4j.cypher")
sftp.close()

print("Applying MySQL schema & seed to 'loomweaver' database...")
_, out, err = ssh.exec_command('mysql -u root -p"Sp34kFri3nd4nd3nt3r!" < /tmp/provision_loomweaver_mysql.sql')
print(out.read().decode())
err_text = err.read().decode()
if err_text:
    print("MySQL stderr:", err_text)

_, out, _ = ssh.exec_command('mysql -u loomweaver_app -p"Sp34kFri3nd4nd3nt3r!" loomweaver -e "SHOW TABLES; SELECT id, slug, name, system_code FROM lw_campaigns; SELECT COUNT(*) AS total_entities FROM lw_entities;"')
print("=== Verified 'loomweaver' MySQL Database ===")
print(out.read().decode())

print("Applying Neo4j graph schema & seed to 'loomweaver' namespace...")
cypher_cmd = (
    'echo "tZ-2jETuYpgVRzFBF=09" | sudo -S docker cp /tmp/provision_loomweaver_neo4j.cypher mythweaver-neo4j:/tmp/provision_loomweaver_neo4j.cypher && '
    'echo "tZ-2jETuYpgVRzFBF=09" | sudo -S docker exec mythweaver-neo4j cypher-shell -u neo4j -p "Sp34kFri3nd4nd3nt3r!" -f /tmp/provision_loomweaver_neo4j.cypher'
)
_, out, err = ssh.exec_command(cypher_cmd)
print(out.read().decode())
err_cypher = err.read().decode()
if err_cypher:
    print("Neo4j stderr:", err_cypher)

verify_cypher = 'echo "tZ-2jETuYpgVRzFBF=09" | sudo -S docker exec mythweaver-neo4j cypher-shell -u neo4j -p "Sp34kFri3nd4nd3nt3r!" "MATCH (n:Entity {namespace: \'loomweaver\'}) OPTIONAL MATCH (n)-[r]->() RETURN count(DISTINCT n) AS loomweaver_nodes, count(r) AS loomweaver_edges;"'
_, out, _ = ssh.exec_command(verify_cypher)
print("=== Verified 'loomweaver' Neo4j Graph ===")
print(out.read().decode())

ssh.close()
