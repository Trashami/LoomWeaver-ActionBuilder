"""Plan or apply a campaign seed against the LoomWeaver MySQL database.

Default mode is a READ-ONLY dry run: it runs SELECT statements on the server
and prints the change set it would make. It never issues INSERT/UPDATE/DELETE.

--apply runs the generated INSERT-only SQL in one transaction, after:
  1. re-checking that the campaign id, slug, and node ids are free;
  2. taking a mysqldump backup to ~/lw-backups on the server;
  3. verifying row deltas and that campaigns 1-3 are unchanged afterwards.
If the transaction fails, MySQL rolls it back. If verification fails after the
commit, restore from the backup printed below.

Usage:
    python seed/import_campaign.py seed/shadow-of-the-mountain.v2.json
    python seed/import_campaign.py seed/shadow-of-the-mountain.v2.json --apply

Requires LW_DB_PASSWORD (and the SSH settings) in ~/.loomweaver/deploy.env.
"""
from __future__ import annotations

import json
import re
import secrets
import shlex
import sys
import time
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import lw_deploy_env as env  # noqa: E402
import build_sql  # noqa: E402
from validate_seed import validate  # noqa: E402

DB_NAME = "loomweaver"
DB_USER = "loomweaver_app"
PROTECTED_CAMPAIGN_IDS = "1,2,3"
INSERT_TABLE_RE = re.compile(r"^INSERT INTO (\w+) ", re.M)


def _mysql(ssh, cnf_path: str, sql: str) -> list[list[str]]:
    command = (
        f"mysql --defaults-extra-file={shlex.quote(cnf_path)} -h127.0.0.1 "
        f"--batch --skip-column-names -D {DB_NAME} -e {shlex.quote(sql)}"
    )
    output = env.run(ssh, command).rstrip("\r\n")
    return [line.split("\t") for line in output.splitlines() if line]


def _read_only_checks(seed: dict) -> dict:
    campaign_slug = seed["campaign"]["slug"]
    adventure_id = seed["adventure"]["id"]
    version_id = seed["adventure_version"]["id"]
    node_ids = [node["id"] for node in seed["nodes"]]
    quoted_nodes = ",".join("'" + node_id + "'" for node_id in node_ids)
    queries = {
        "campaign_by_slug": f"SELECT id FROM lw_campaigns WHERE slug='{campaign_slug}'",
        "campaigns_existing": "SELECT id, slug FROM lw_campaigns ORDER BY id",
        "campaign_id_taken": f"SELECT id FROM lw_campaigns WHERE id={int(seed['campaign']['id'])}",
        "gm_user_exists": f"SELECT id FROM lw_users WHERE id={int(seed['campaign']['gm_user_id'])}",
        "adventure_exists": f"SELECT id FROM lw_adventures WHERE id='{adventure_id}' OR slug='{seed['adventure']['slug']}'",
        "version_exists": f"SELECT id FROM lw_adventure_versions WHERE id='{version_id}'",
        "node_collisions": f"SELECT id FROM lw_adventure_nodes WHERE id IN ({quoted_nodes})",
        "next_campaign_id": (
            "SELECT AUTO_INCREMENT FROM information_schema.TABLES "
            f"WHERE TABLE_SCHEMA='{DB_NAME}' AND TABLE_NAME='lw_campaigns'"
        ),
    }
    cnf_path = f"/tmp/lw_seed_{secrets.token_hex(6)}.cnf"
    ssh = env.connect()
    try:
        env.put_mysql_cnf(ssh, cnf_path, DB_USER, env.DB_PASSWORD)
        results = {name: _mysql(ssh, cnf_path, sql) for name, sql in queries.items()}
    finally:
        try:
            env.run(ssh, f"rm -f {shlex.quote(cnf_path)}", check=False)
        finally:
            ssh.close()
    return results


def _print_plan(seed: dict, checks: dict, expected: Counter) -> list[str]:
    problems: list[str] = []

    if checks["campaign_by_slug"]:
        problems.append(f"campaign slug already exists (id {checks['campaign_by_slug'][0][0]})")
    if checks["campaign_id_taken"]:
        problems.append(f"campaign id {seed['campaign']['id']} already exists")
    if not checks["gm_user_exists"]:
        problems.append(f"gm_user_id {seed['campaign']['gm_user_id']} not found in lw_users")
    if checks["adventure_exists"]:
        problems.append("adventure id or slug already exists")
    if checks["version_exists"]:
        problems.append("adventure version id already exists")
    if checks["node_collisions"]:
        problems.append(f"{len(checks['node_collisions'])} node id(s) already exist")

    next_id = seed["campaign"]["id"]
    if not 0 < next_id <= 2147483647:
        problems.append("campaign id is outside the int32 range shared with combat tables")

    print("== Existing campaigns (slug and id only, no personal data) ==")
    for campaign_id, slug in checks["campaigns_existing"]:
        print(f"  {campaign_id}\t{slug}")

    print("\n== Proposed changes (dry run; nothing written) ==")
    print(f"  campaign id={next_id} slug={seed['campaign']['slug']}")
    for table, count in sorted(expected.items()):
        print(f"  {table:<30}+{count}")
    print("  Campaigns 1-3, lw_users, and existing adventures: no changes")
    return problems


def _snapshot(ssh, cnf_path: str, tables: list[str], campaign_id: int) -> dict:
    """Row counts per table: total, protected campaigns 1-3, and the new campaign id."""
    scoped = {row[0] for row in _mysql(
        ssh, cnf_path,
        "SELECT DISTINCT TABLE_NAME FROM information_schema.COLUMNS "
        f"WHERE TABLE_SCHEMA='{DB_NAME}' AND COLUMN_NAME='campaign_id'")}
    scoped.add("lw_campaigns")
    statements: list[str] = []
    keys: list[tuple[str, str]] = []
    for table in tables:
        statements.append(f"SELECT COUNT(*) FROM {table}")
        keys.append((table, "total"))
        if table not in scoped:
            continue
        column = "id" if table == "lw_campaigns" else "campaign_id"
        statements.append(f"SELECT COUNT(*) FROM {table} WHERE {column} IN ({PROTECTED_CAMPAIGN_IDS})")
        keys.append((table, "protected"))
        statements.append(f"SELECT COUNT(*) FROM {table} WHERE {column}={campaign_id}")
        keys.append((table, "new"))
    rows = _mysql(ssh, cnf_path, "; ".join(statements) + ";")
    if len(rows) != len(keys):
        raise SystemExit("Snapshot returned an unexpected number of rows")
    return {key: int(row[0]) for key, row in zip(keys, rows)}


def _verify(before: dict, after: dict, expected: Counter, campaign_id: int) -> list[str]:
    problems: list[str] = []
    for table, count in expected.items():
        delta = after[(table, "total")] - before[(table, "total")]
        if delta != count:
            problems.append(f"{table}: expected +{count} rows, found +{delta}")
        if (table, "new") in after and after[(table, "new")] != count:
            problems.append(f"{table}: {after[(table, 'new')]} rows for campaign {campaign_id}, expected {count}")
    for key, value in before.items():
        if key[1] == "protected" and after.get(key) != value:
            problems.append(f"{key[0]}: rows for campaigns 1-3 changed ({value} -> {after.get(key)})")
    return problems


def _backup(ssh, cnf_path: str) -> str:
    """Dump the database to ~/lw-backups on the server (gzipped, owner-only)."""
    stamp = time.strftime("%Y%m%d-%H%M%S")
    remote = f"~/lw-backups/{DB_NAME}-pre-seed-{stamp}.sql"
    script = (
        "umask 077 && mkdir -p ~/lw-backups && df -Pk ~ | tail -1 && "
        f"mysqldump --defaults-extra-file={shlex.quote(cnf_path)} -h127.0.0.1 "
        f"--single-transaction --no-tablespaces {DB_NAME} > {remote} && "
        f"gzip -f {remote} && ls -l {remote}.gz"
    )
    print(env.run(ssh, script).strip())
    return remote + ".gz"


def _apply(seed: dict, sql: str, expected: Counter) -> int:
    campaign_id = int(seed["campaign"]["id"])
    token = secrets.token_hex(6)
    cnf_path = f"/tmp/lw_seed_{token}.cnf"
    sql_path = f"/tmp/lw_seed_{token}.sql"
    tables = sorted(set(INSERT_TABLE_RE.findall(sql)))
    ssh = env.connect()
    try:
        env.put_mysql_cnf(ssh, cnf_path, DB_USER, env.DB_PASSWORD)
        before = _snapshot(ssh, cnf_path, tables, campaign_id)
        leftovers = [t for t in tables if before.get((t, "new"))]
        if leftovers:
            print(f"BLOCKED: rows already exist for campaign {campaign_id} in: {', '.join(leftovers)}")
            return 1

        print("\n== Backup ==")
        backup_path = _backup(ssh, cnf_path)
        print(f"Backup: {backup_path}")

        env.put_secret_file(ssh, sql_path, sql)
        print("\n== Applying single transaction ==")
        try:
            env.run(ssh, f"mysql --defaults-extra-file={shlex.quote(cnf_path)} -h127.0.0.1 "
                         f"-D {DB_NAME} < {shlex.quote(sql_path)}")
        except RuntimeError as exc:
            print("Apply FAILED. MySQL rolled back the uncommitted transaction. Server output:")
            print(str(exc)[:4000])
            return 1

        after = _snapshot(ssh, cnf_path, tables, campaign_id)
        problems = _verify(before, after, expected, campaign_id)
    finally:
        try:
            env.run(ssh, f"rm -f {shlex.quote(cnf_path)} {shlex.quote(sql_path)}", check=False)
        finally:
            ssh.close()

    if problems:
        print("\nApplied, but verification found problems (restore from backup if needed):")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    print(f"\nVerified: campaign {campaign_id} written; campaigns 1-3 unchanged.")
    print(f"Backup kept on server: {backup_path}")
    return 0


def main(argv: list[str]) -> int:
    apply = "--apply" in argv[1:]
    args = [arg for arg in argv[1:] if arg != "--apply"]
    if len(args) != 1 or args[0].startswith("--"):
        print(__doc__)
        return 2
    seed = json.loads(Path(args[0]).read_text(encoding="utf-8"))
    errors = validate(seed)
    if errors:
        print("Seed failed offline validation; fix before planning:")
        for error in errors:
            print(f"  - {error}")
        return 1
    sql = build_sql.build(seed)
    expected = Counter(INSERT_TABLE_RE.findall(sql))
    checks = _read_only_checks(seed)
    problems = _print_plan(seed, checks, expected)
    if problems:
        print("\nBLOCKED:")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    if not apply:
        print("\nDry run only; nothing written. Re-run with --apply to write.")
        return 0
    return _apply(seed, sql, expected)


if __name__ == "__main__":
    sys.exit(main(sys.argv))

