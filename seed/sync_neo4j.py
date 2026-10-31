"""Project a committed MySQL campaign into Neo4j (run AFTER import_campaign --apply).

The source of truth is MySQL. This script reads the campaign's entities,
locations, adventure nodes, and links from lw_* tables, then MERGEs matching
`Entity` nodes and relationships using the same keys as
LoomWeaverNeo4jService (namespace, campaignId, compositeKey). It is idempotent:
re-running it updates existing nodes and edges and never deletes anything.

Protected campaigns 1-3 are counted in Neo4j before and after; the run aborts if
their counts change.

Usage:
    python seed/sync_neo4j.py [campaign_id]        (default 900029)

Requires LW_NEO4J_PASSWORD and the SSH/DB settings in ~/.loomweaver/deploy.env.
"""
from __future__ import annotations

import re
import secrets
import shlex
import socketserver
import sys
import threading
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import lw_deploy_env as env  # noqa: E402
import import_campaign as ic  # noqa: E402
from db_tunnel import make_handler  # noqa: E402

from neo4j import GraphDatabase  # noqa: E402

NAMESPACE = "loomweaver"
NEO4J_USER = "loomweaver"
PROTECTED_CAMPAIGN_IDS = [1, 2, 3]
SAFE_REL_RE = re.compile(r"[^A-Za-z0-9_]")


class _Server(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


def _safe_rel(relationship_type: str) -> str:
    cleaned = SAFE_REL_RE.sub("", relationship_type).upper()
    return cleaned or "CONNECTED_TO"


def _read_mysql(ssh, campaign_id: int) -> dict[str, list[list[str]]]:
    cnf_path = f"/tmp/lw_neo_{secrets.token_hex(6)}.cnf"
    queries = {
        "entities": (
            "SELECT CONCAT(campaign_id,':',entity_type,':',entity_key), name, entity_type, "
            f"visibility, canon_status FROM lw_entities WHERE campaign_id={campaign_id}"
        ),
        "locations": (
            "SELECT CONCAT(campaign_id,':Location:',location_key), name, location_type, visibility, "
            f"COALESCE(CONCAT(campaign_id,':Location:',parent_location_key),'') "
            f"FROM lw_world_locations WHERE campaign_id={campaign_id}"
        ),
        "adventure_nodes": (
            f"SELECT CONCAT({campaign_id},':AdventureNode:',id), title, node_kind, visibility "
            f"FROM lw_adventure_nodes WHERE campaign_id={campaign_id}"
        ),
        "relationships": (
            "SELECT from_composite_key, relationship_type, to_composite_key, visibility, "
            f"why_included_label, id FROM lw_entity_relationships WHERE campaign_id={campaign_id}"
        ),
        "links": (
            f"SELECT CONCAT({campaign_id},':AdventureNode:',from_node_id), link_type, "
            f"CONCAT({campaign_id},':AdventureNode:',to_node_id), visibility, why_included_label "
            f"FROM lw_adventure_links WHERE campaign_id={campaign_id}"
        ),
        "lore": (
            "SELECT composite_key, title, category, visibility, 'approved' "
            f"FROM lw_lore_entries WHERE campaign_id={campaign_id}"
        ),
    }
    try:
        env.put_mysql_cnf(ssh, cnf_path, ic.DB_USER, env.DB_PASSWORD)
        return {name: ic._mysql(ssh, cnf_path, sql) for name, sql in queries.items()}
    finally:
        env.run(ssh, f"rm -f {shlex.quote(cnf_path)}", check=False)


def _campaign_counts(session, campaign_ids: list[int]) -> dict[int, tuple[int, int]]:
    counts = {}
    for cid in campaign_ids:
        nodes = session.run(
            "MATCH (n:Entity {namespace:$ns, campaignId:$cid}) RETURN count(n) AS c",
            ns=NAMESPACE, cid=cid).single()["c"]
        edges = session.run(
            "MATCH (:Entity {namespace:$ns, campaignId:$cid})-[r]->() RETURN count(r) AS c",
            ns=NAMESPACE, cid=cid).single()["c"]
        counts[cid] = (nodes, edges)
    return counts


def _project(session, campaign_id: int, data: dict[str, list[list[str]]]) -> None:
    nodes = []
    for key, name, node_type, visibility, canon in data["entities"]:
        nodes.append({"key": key, "name": name, "type": node_type, "vis": visibility, "canon": canon})
    for key, name, node_type, visibility, _parent in data["locations"]:
        nodes.append({"key": key, "name": name, "type": "Location:" + node_type, "vis": visibility, "canon": "approved"})
    for key, title, kind, visibility in data["adventure_nodes"]:
        nodes.append({"key": key, "name": title, "type": "AdventureNode:" + kind, "vis": visibility, "canon": "approved"})
    for key, title, category, visibility, canon in data["lore"]:
        nodes.append({"key": key, "name": title, "type": "Lore:" + category, "vis": visibility, "canon": canon})
    session.run(
        "UNWIND $rows AS row "
        "MERGE (n:Entity {namespace:$ns, campaignId:$cid, compositeKey:row.key}) "
        "SET n.name=row.name, n.entityType=row.type, n.visibility=row.vis, n.canonStatus=row.canon",
        rows=nodes, ns=NAMESPACE, cid=campaign_id).consume()

    edges_by_type: dict[str, list[dict]] = defaultdict(list)
    for from_key, rel_type, to_key, visibility, why, sql_id in data["relationships"]:
        edges_by_type[_safe_rel(rel_type)].append(
            {"from": from_key, "to": to_key, "vis": visibility, "why": why, "sqlId": int(sql_id)})
    for key, _name, _type, _vis, parent in data["locations"]:
        if parent:
            edges_by_type["CONTAINS"].append(
                {"from": parent, "to": key, "vis": "players", "why": "Located within", "sqlId": 0})
    for from_key, link_type, to_key, visibility, why in data["links"]:
        edges_by_type[_safe_rel(link_type)].append(
            {"from": from_key, "to": to_key, "vis": visibility, "why": why or "", "sqlId": 0})

    for rel_type, rows in edges_by_type.items():
        session.run(
            "UNWIND $rows AS row "
            "MATCH (a:Entity {namespace:$ns, campaignId:$cid, compositeKey:row.from}) "
            "MATCH (b:Entity {namespace:$ns, campaignId:$cid, compositeKey:row.to}) "
            f"MERGE (a)-[r:{rel_type}]->(b) "
            "SET r.visibility=row.vis, r.whyIncluded=row.why, r.sqlRelationshipId=row.sqlId",
            rows=rows, ns=NAMESPACE, cid=campaign_id).consume()


def main(argv: list[str]) -> int:
    campaign_id = int(argv[1]) if len(argv) > 1 else 900029
    if campaign_id in PROTECTED_CAMPAIGN_IDS:
        print("Refusing to sync a protected campaign.")
        return 2
    if not env.NEO4J_PASSWORD:
        print("LW_NEO4J_PASSWORD is not set in deploy.env.")
        return 2

    ssh = env.connect()
    transport = ssh.get_transport()
    transport.set_keepalive(30)
    server = _Server(("127.0.0.1", 0), make_handler(transport, ("127.0.0.1", 7687)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    port = server.server_address[1]
    try:
        data = _read_mysql(ssh, campaign_id)
        print("MySQL rows read: " + ", ".join(f"{k}={len(v)}" for k, v in data.items()))

        driver = GraphDatabase.driver(
            f"bolt://127.0.0.1:{port}", auth=(NEO4J_USER, env.NEO4J_PASSWORD))
        try:
            with driver.session() as session:
                protected_before = _campaign_counts(session, PROTECTED_CAMPAIGN_IDS)
                _project(session, campaign_id, data)
                after = _campaign_counts(session, [campaign_id])
                protected_after = _campaign_counts(session, PROTECTED_CAMPAIGN_IDS)
        finally:
            driver.close()
    finally:
        server.shutdown()
        ssh.close()

    expected_nodes = (len(data["entities"]) + len(data["locations"]) + len(data["adventure_nodes"])
                      + len(data["lore"]))
    expected_edges = len(data["relationships"]) + sum(1 for row in data["locations"] if row[4]) + len(data["links"])
    nodes, edges = after[campaign_id]
    print(f"Neo4j campaign {campaign_id}: {nodes} nodes (expected {expected_nodes}), "
          f"{edges} edges (expected {expected_edges})")
    print("Protected campaigns (nodes, edges) before -> after: "
          + ", ".join(f"{cid}: {protected_before[cid]} -> {protected_after[cid]}"
                      for cid in PROTECTED_CAMPAIGN_IDS))
    if protected_before != protected_after:
        print("FAILED: protected campaign data changed in Neo4j.")
        return 1
    if nodes < expected_nodes or edges < expected_edges:
        print("FAILED: Neo4j has fewer nodes or edges than MySQL.")
        return 1
    print("Neo4j sync verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
