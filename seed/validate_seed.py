"""Offline validation for LoomWeaver campaign seed files. No database access.

Usage:
    python seed/validate_seed.py seed/shadow-of-the-mountain.v1.json
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

NODE_KINDS = {"adventure", "chapter", "location", "scene", "encounter", "npc", "character",
              "clue", "hazard", "treasure", "secret", "rule", "handout", "map_region"}
LOCATION_TYPES = {"none", "region", "city", "district", "site", "floor", "room", "wilderness_area"}
VISIBILITY = {"public", "players", "gm"}
DEFAULT_STATES = {"unresolved", "discovered", "completed", "optional"}
SYSTEM_CODES = {"dnd5e", "pf2e", "vampire_v5", "system-neutral"}
ADVENTURE_FORMATS = {"one-shot", "weekend", "campaign-act", "full-campaign"}
PROVENANCE = {"established_production", "established_user_report", "manuscript",
              "generated_draft", "unknown"}
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,94}$")
ID_PREFIX = "sotm-seed-"
EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
INT32_MAX = 2147483647


def _check_enum(errors: list[str], where: str, value, allowed: set[str]) -> None:
    if value not in allowed:
        errors.append(f"{where}: '{value}' not in {sorted(allowed)}")


def validate(seed: dict) -> list[str]:
    errors: list[str] = []

    campaign = seed.get("campaign", {})
    if not SLUG_RE.match(campaign.get("slug", "")):
        errors.append("campaign.slug is missing or malformed")
    _check_enum(errors, "campaign.system_code", campaign.get("system_code"), SYSTEM_CODES - {"system-neutral"})
    gm = campaign.get("gm_user_id")
    if not isinstance(gm, int) or not (1 <= gm <= INT32_MAX):
        errors.append("campaign.gm_user_id must be an integer in 1..2147483647")
    if EMAIL_RE.search(json.dumps(seed)):
        errors.append("seed contains an email-like string; remove personal data")

    adventure = seed.get("adventure", {})
    if not str(adventure.get("id", "")).startswith("adv-sotm-seed"):
        errors.append("adventure.id must start with 'adv-sotm-seed'")
    _check_enum(errors, "adventure.system_code", adventure.get("system_code"), SYSTEM_CODES)
    _check_enum(errors, "adventure.adventure_format", adventure.get("adventure_format"), ADVENTURE_FORMATS)

    version = seed.get("adventure_version", {})
    if version.get("schema_version") != "loomweaver.adventure/1":
        errors.append("adventure_version.schema_version must be 'loomweaver.adventure/1'")

    nodes = seed.get("nodes", [])
    if not nodes:
        errors.append("nodes is empty")
    ids: set[str] = set()
    parents: dict[str, str | None] = {}
    roots = 0
    for index, node in enumerate(nodes):
        where = f"nodes[{index}] ({node.get('id', '?')})"
        node_id = node.get("id", "")
        if not node_id.startswith(ID_PREFIX):
            errors.append(f"{where}: id must start with '{ID_PREFIX}' to avoid global PK collisions")
        if node_id in ids:
            errors.append(f"{where}: duplicate id")
        ids.add(node_id)
        _check_enum(errors, f"{where}.node_kind", node.get("node_kind"), NODE_KINDS)
        _check_enum(errors, f"{where}.location_type", node.get("location_type"), LOCATION_TYPES)
        _check_enum(errors, f"{where}.visibility", node.get("visibility"), VISIBILITY)
        _check_enum(errors, f"{where}.default_state", node.get("default_state"), DEFAULT_STATES)
        _check_enum(errors, f"{where}.provenance", node.get("provenance"), PROVENANCE)
        if not node.get("summary"):
            errors.append(f"{where}: summary is required (NOT NULL column)")
        parent = node.get("parent_node_id")
        parents[node_id] = parent
        if parent is None:
            roots += 1

    for node_id, parent in parents.items():
        if parent is not None and parent not in ids:
            errors.append(f"node {node_id}: parent '{parent}' does not exist in this seed")
        seen = {node_id}
        cursor = parent
        while cursor is not None:
            if cursor in seen:
                errors.append(f"node {node_id}: parent cycle detected")
                break
            seen.add(cursor)
            cursor = parents.get(cursor)
    if roots != 1:
        errors.append(f"expected exactly one root node, found {roots}")

    return errors


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2
    path = Path(argv[1])
    try:
        seed = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"FAIL cannot read {path}: {exc}")
        return 1
    errors = validate(seed)
    if errors:
        print(f"FAIL {path.name}: {len(errors)} problem(s)")
        for error in errors:
            print(f"  - {error}")
        return 1
    print(f"OK {path.name}: {len(seed.get('nodes', []))} nodes, no problems")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
