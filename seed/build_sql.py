"""Generate a single-transaction MySQL seed script from a LoomWeaver campaign seed JSON.

Offline only: no database access. The output contains INSERT statements and
START TRANSACTION / COMMIT. It contains no DELETE, DROP, TRUNCATE, or UPDATE.

Usage:
    python seed/build_sql.py seed/shadow-of-the-mountain.v2.json [output.sql]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from validate_seed import validate  # noqa: E402

INT32_MAX = 2147483647
ENUMS = {
    "visibility": {"public", "players", "gm"},
    "node_kind": {"adventure", "chapter", "location", "scene", "encounter", "npc", "character",
                  "clue", "hazard", "treasure", "secret", "rule", "handout", "map_region"},
    "location_type": {"none", "region", "city", "district", "site", "floor", "room", "wilderness_area"},
    "default_state": {"unresolved", "discovered", "completed", "optional"},
    "block_kind": {"prose", "readAloud", "gmNote", "table", "image", "check", "reference",
                   "tactics", "reward", "condition"},
    "audience": {"public", "players", "gm"},
    "link_type": {"CONTAINS", "OCCURS_AT", "PLANS", "PLAYED", "FEATURES", "USES", "HAS_CLUE",
                  "HAS_HAZARD", "HAS_TREASURE", "REVEALS", "LEADS_TO", "DEPICTS", "REFERENCES",
                  "ASSIGNED_MAP"},
    "content_role": {"scene", "location", "room", "npc", "character", "encounter", "clue", "hazard",
                     "treasure", "handout", "battlemap", "rule"},
    "session_state": {"planned", "live", "completed"},
    "progress_state": {"unresolved", "discovered", "completed", "optional"},
    "member_role": {"gm", "player", "spectator"},
    "truth_assessment": {"unverified", "confirmed", "disputed", "disproven"},
    "discovery_status": {"visited", "known", "rumor", "undiscovered"},
    "hierarchy_level": {"World", "Continent", "Region", "Settlement", "District", "Building",
                        "Site", "Floor", "Room", "WildernessArea"},
    "canon_status": {"approved", "draft"},
    "system_code": {"dnd5e", "pf2e", "vampire_v5"},
}
MAX_LENGTH = {
    "feature_text": 255,
    "faction": 16,
    "excerpt": 500,
    "title": 160,
    "name": 160,
}
ABILITY_LABELS = {"STR": "Strength", "DEX": "Dexterity", "CON": "Constitution",
                  "INT": "Intelligence", "WIS": "Wisdom", "CHA": "Charisma"}


class Raw(str):
    """SQL fragment emitted without quoting (for subqueries)."""


def lit(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, Raw):
        return str(value)
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, (dict, list)):
        value = json.dumps(value, ensure_ascii=False)
    text = str(value).replace("\x00", "")
    return "'" + text.replace("\\", "\\\\").replace("'", "''") + "'"


def insert(table: str, columns: list[str], values: list) -> str:
    assert len(columns) == len(values), table
    cols = ", ".join(columns)
    vals = ", ".join(lit(v) for v in values)
    return f"INSERT INTO {table} ({cols}) VALUES ({vals});"


def check_enum(where: str, column: str, value) -> None:
    allowed = ENUMS[column]
    if value not in allowed:
        raise ValueError(f"{where}: {column}='{value}' is not a valid DB enum value")


def check_length(where: str, column: str, value) -> None:
    limit = MAX_LENGTH.get(column)
    if limit and value is not None and len(str(value)) > limit:
        raise ValueError(f"{where}: {column} is {len(str(value))} chars; limit {limit}")


def check_prefix(where: str, value: str, prefix: str = "sotm-seed-") -> None:
    if not str(value).startswith(prefix):
        raise ValueError(f"{where}: global key '{value}' must start with '{prefix}'")


def order_by_parent(items: list[dict], key: str = "parent_node_id", id_key: str = "id") -> list[dict]:
    """Return items so every parent appears before its children."""
    by_id = {item[id_key]: item for item in items}
    ordered: list[dict] = []
    placed: set[str] = set()

    def place(item: dict) -> None:
        if item[id_key] in placed:
            return
        parent = item.get(key)
        if parent is not None and parent in by_id:
            place(by_id[parent])
        placed.add(item[id_key])
        ordered.append(item)

    for item in items:
        place(item)
    return ordered


def build(seed: dict) -> str:
    errors = validate(seed)
    if errors:
        raise ValueError("seed failed validation:\n  " + "\n  ".join(errors))

    campaign = seed["campaign"]
    cid = campaign["id"]
    if not isinstance(cid, int) or not (1 <= cid <= INT32_MAX):
        raise ValueError("campaign.id must be an int32")
    check_enum("campaign", "system_code", campaign["system_code"])
    gm_user = campaign["gm_user_id"]

    adventure = seed["adventure"]
    version = seed["adventure_version"]
    check_prefix("adventure.id", adventure["id"], "adv-sotm-seed")
    check_prefix("adventure_version.id", version["id"], "adv-ver-sotm-seed")
    check_enum("adventure", "system_code", adventure["system_code"])
    adv_id = adventure["id"]
    ver_id = version["id"]

    out: list[str] = [
        f"-- LoomWeaver seed: {campaign['slug']} (campaign {cid})",
        "-- Generated by seed/build_sql.py. One transaction. INSERT-only.",
        "SET NAMES utf8mb4;",
        "START TRANSACTION;",
    ]

    out.append(insert("lw_campaigns",
                      ["id", "slug", "name", "subtitle", "system_code", "gm_user_id", "world_name",
                       "current_act", "current_session_number", "current_location_name"],
                      [cid, campaign["slug"], campaign["name"], campaign["subtitle"],
                       campaign["system_code"], gm_user, campaign["world_name"],
                       campaign["current_act"], campaign["current_session_number"],
                       campaign["current_location_name"]]))

    for member in seed.get("members", []):
        role = member["member_role"]
        check_enum("members", "member_role", role)
        out.append(
            "INSERT INTO lw_campaign_members (campaign_id, user_id, auth_email, member_role, "
            "assigned_character_key) SELECT "
            f"{cid}, id, email, {lit(role)}, {lit(member.get('assigned_character_key'))} "
            f"FROM lw_users WHERE id = {int(member['user_id'])};")

    out.append(insert("lw_adventures",
                      ["id", "slug", "title", "subtitle", "system_code", "adventure_format",
                       "expected_duration_minutes", "recommended_level_range", "author_user_id",
                       "author_handle", "premise", "background_truth"],
                      [adv_id, adventure["slug"], adventure["title"], adventure["subtitle"],
                       adventure["system_code"], adventure["adventure_format"],
                       adventure["expected_duration_minutes"], adventure["recommended_level_range"],
                       adventure["author_user_id"], adventure["author_handle"],
                       adventure["premise"], adventure["background_truth"]]))

    out.append(insert("lw_adventure_versions",
                      ["id", "adventure_id", "version_tag", "schema_version",
                       "is_immutable_published", "changelog_summary"],
                      [ver_id, adv_id, version["version_tag"], version["schema_version"],
                       version["is_immutable_published"], version["changelog_summary"]]))

    node_ids: set[str] = set()
    for node in order_by_parent(seed["nodes"]):
        where = f"node {node['id']}"
        check_prefix(where, node["id"])
        for column in ("node_kind", "location_type", "visibility", "default_state"):
            check_enum(where, column, node[column])
        check_length(where, "title", node["title"])
        node_ids.add(node["id"])
        out.append(insert("lw_adventure_nodes",
                          ["id", "campaign_id", "adventure_version_id", "parent_node_id",
                           "node_kind", "location_type", "title", "subtitle", "summary",
                           "visibility", "default_state", "metadata_json"],
                          [node["id"], cid, ver_id, node.get("parent_node_id"), node["node_kind"],
                           node["location_type"], node["title"], "", node["summary"],
                           node["visibility"], node["default_state"],
                           {"provenance": node["provenance"]}]))

    for block in seed["blocks"]:
        where = f"block {block['id']}"
        check_prefix(where, block["id"])
        check_enum(where, "block_kind", block["block_kind"])
        check_enum(where, "audience", block["audience"])
        if block["audience"] == "gm" and block["shareable"]:
            raise ValueError(f"{where}: GM-only block must not be shareable")
        if block["node_id"] not in node_ids:
            raise ValueError(f"{where}: node_id '{block['node_id']}' not in seed")
        out.append(insert("lw_adventure_blocks",
                          ["id", "campaign_id", "node_id", "sort_order", "block_kind", "audience",
                           "shareable", "title", "content"],
                          [block["id"], cid, block["node_id"], block["sort_order"],
                           block["block_kind"], block["audience"], block["shareable"],
                           block["title"], block["content"]]))

    for link in seed["links"]:
        where = f"link {link['from']}->{link['to']}"
        check_enum(where, "link_type", link["type"])
        check_enum(where, "visibility", link["visibility"])
        out.append(insert("lw_adventure_links",
                          ["campaign_id", "from_node_id", "to_node_id", "link_type",
                           "why_included_label", "sort_order", "visibility"],
                          [cid, link["from"], link["to"], link["type"], link["label"],
                           link["sort_order"], link["visibility"]]))

    for scene in seed["scenes"]:
        where = f"scene {scene['scene_key']}"
        check_prefix(where, scene["scene_key"])
        check_enum(where, "visibility", scene["visibility"])
        out.append(insert("lw_scenes",
                          ["campaign_id", "scene_key", "name", "region_name", "biome",
                           "weather_preset", "lighting_profile", "visibility"],
                          [cid, scene["scene_key"], scene["name"], scene["region_name"],
                           scene["biome"], scene["weather_preset"], scene["lighting_profile"],
                           scene["visibility"]]))

    location_keys: set[str] = {loc["location_key"] for loc in seed["locations"]}
    for loc in order_by_parent(seed["locations"], key="parent_location_key", id_key="location_key"):
        where = f"location {loc['location_key']}"
        check_prefix(where, loc["location_key"])
        for column in ("hierarchy_level", "discovery_status", "visibility"):
            check_enum(where, column, loc[column])
        if loc.get("parent_location_key") and loc["parent_location_key"] not in location_keys:
            raise ValueError(f"{where}: parent '{loc['parent_location_key']}' not in seed")
        out.append(insert("lw_world_locations",
                          ["location_key", "campaign_id", "composite_key", "name", "location_type",
                           "hierarchy_level", "parent_location_key", "discovery_status",
                           "visibility", "artwork_url", "description", "historical_background",
                           "culture_and_traditions", "local_myths"],
                          [loc["location_key"], cid, loc["composite_key"], loc["name"],
                           loc["location_type"], loc["hierarchy_level"],
                           loc.get("parent_location_key"), loc["discovery_status"],
                           loc["visibility"], "", loc["description"],
                           loc["historical_background"], loc["culture_and_traditions"],
                           loc["local_myths"]]))

    session_ids: set[str] = set()
    for session in seed["sessions"]:
        where = f"session {session['session_id']}"
        check_prefix(where, session["session_id"])
        check_enum(where, "session_state", session["session_state"])
        check_length(where, "title", session["title"])
        session_ids.add(session["session_id"])
        out.append(insert("lw_sessions",
                          ["session_id", "campaign_id", "adventure_version_id", "session_number",
                           "title", "chapter_node_id", "primary_location_node_id",
                           "assigned_scene_key", "session_state", "scheduled_date_label",
                           "epigraph", "summary", "objectives_json", "stopping_points_json"],
                          [session["session_id"], cid, ver_id, session["session_number"],
                           session["title"], session.get("chapter_node_id"),
                           session.get("primary_location_node_id"),
                           session.get("assigned_scene_key"), session["session_state"],
                           session["scheduled_date_label"], session["epigraph"],
                           session["summary"], session["objectives_json"],
                           session["stopping_points_json"]]))

    for row in seed["session_content"]:
        check_enum("session_content", "content_role", row["content_role"])
        out.append(insert("lw_session_content",
                          ["campaign_id", "session_id", "node_id", "content_role", "sort_order",
                           "why_included_label", "is_optional"],
                          [cid, row["session_id"], row["node_id"], row["content_role"],
                           row["sort_order"], row["why_included_label"], row["is_optional"]]))

    for row in seed["progress"]:
        check_enum("progress", "progress_state", row["progress_state"])
        out.append(insert("lw_adventure_progress",
                          ["campaign_id", "session_id", "node_id", "beat_key", "label",
                           "progress_state", "is_done", "outcome_notes"],
                          [cid, row["session_id"], row["node_id"], row["beat_key"], row["label"],
                           row["progress_state"], row["is_done"], row["outcome_notes"]]))

    for event in seed["play_events"]:
        out.append(insert("lw_play_events",
                          ["campaign_id", "session_id", "node_id", "event_kind", "actor_label",
                           "summary", "payload_json"],
                          [cid, event["session_id"], event.get("node_id"), event["event_kind"],
                           event.get("actor_label", "GM"), event["summary"], event.get("payload")]))

    for char in seed["characters"]:
        key = char["character_key"]
        check_length(f"character {key}", "name", char["name"])
        out.append(insert("lw_characters",
                          ["campaign_id", "character_key", "name", "ancestry", "class_name",
                           "system_code", "level", "current_xp", "next_level_xp", "max_hp",
                           "current_hp", "armor_class", "initiative_bonus", "speed_feet",
                           "proficiency_bonus"],
                          [cid, key, char["name"], char["ancestry"], char["class_name"],
                           "dnd5e", char["level"], char["current_xp"], char["next_level_xp"],
                           char["max_hp"], char["current_hp"], char["armor_class"],
                           char["initiative_bonus"], char["speed_feet"],
                           char["proficiency_bonus"]]))
        char_ref = Raw(f"(SELECT id FROM lw_characters WHERE campaign_id = {cid} "
                       f"AND character_key = {lit(key)})")
        for code, score in char["abilities"].items():
            out.append(insert("lw_character_abilities",
                              ["character_id", "code", "label", "score"],
                              [char_ref, code, ABILITY_LABELS[code], score]))
        for index, item in enumerate(char["equipment"]):
            out.append(insert("lw_character_equipment",
                              ["character_id", "item_id", "name", "slot", "bonus_summary",
                               "ac_bonus", "attack_bonus", "equipped", "sort_order"],
                              [char_ref, item["item_id"], item["name"], item["slot"],
                               item["bonus_summary"], item["ac_bonus"], item["attack_bonus"],
                               item["equipped"], index + 1]))
        for index, text in enumerate(char["features"]):
            check_length(f"character {key} feature", "feature_text", text)
            out.append(insert("lw_character_features",
                              ["character_id", "sort_order", "feature_text"],
                              [char_ref, index + 1, text]))

    combat = seed["combat"]
    for token in combat["tokens"]:
        check_length(f"token {token['token_key']}", "faction", token["faction"])
        out.append(insert("lw_combat_tokens",
                          ["campaign_id", "token_key", "name", "role_label", "faction", "initiative",
                           "current_hp", "max_hp", "armor_class", "pos_x", "pos_z", "color_hex",
                           "movement_feet", "speed_feet"],
                          [cid, token["token_key"], token["name"], token["role_label"],
                           token["faction"], token["initiative"], token["current_hp"],
                           token["max_hp"], token["armor_class"], token["pos_x"], token["pos_z"],
                           token["color_hex"], token["movement_feet"], token["speed_feet"]]))
    state = combat["state"]
    out.append(insert("lw_combat_state",
                      ["campaign_id", "round_number", "active_token_key"],
                      [cid, state["round_number"], state.get("active_token_key")]))

    for enc in seed["saved_encounters"]:
        payload = {"name": enc["name"], **enc["payload"]}
        out.append(insert("lw_saved_encounters",
                          ["campaign_id", "encounter_id", "payload"],
                          [cid, enc["encounter_id"], payload]))

    for entity in seed["entities"]:
        check_enum(f"entity {entity['entity_key']}", "canon_status", entity["canon_status"])
        check_enum(f"entity {entity['entity_key']}", "visibility", entity["visibility"])
        out.append(insert("lw_entities",
                          ["campaign_id", "entity_type", "entity_key", "name", "subtitle", "summary",
                           "visibility", "canon_status", "route_link"],
                          [cid, entity["entity_type"], entity["entity_key"], entity["name"],
                           entity["subtitle"], entity["summary"], entity["visibility"],
                           entity["canon_status"], entity["route_link"]]))

    for rel in seed["relationships"]:
        check_enum(f"relationship {rel['from']}", "visibility", rel["visibility"])
        out.append(insert("lw_entity_relationships",
                          ["campaign_id", "from_composite_key", "relationship_type",
                           "to_composite_key", "why_included_label", "visibility"],
                          [cid, rel["from"], rel["type"], rel["to"], rel["label"],
                           rel["visibility"]]))

    for claim in seed["claims"]:
        where = f"claim {claim['id']}"
        check_prefix(where, claim["id"])
        check_enum(where, "truth_assessment", claim["truth_assessment"])
        check_enum(where, "visibility", claim["visibility"])
        out.append(insert("lw_claims",
                          ["id", "campaign_id", "composite_key", "title", "statement",
                           "truth_assessment", "gm_canonical_truth", "implicated_entity_key",
                           "visibility"],
                          [claim["id"], cid, claim["composite_key"], claim["title"],
                           claim["statement"], claim["truth_assessment"],
                           claim["gm_canonical_truth"], claim.get("implicated_entity_key"),
                           claim["visibility"]]))

    for lore in seed["lore"]:
        lore_id = "sotm-seed-lore-" + lore["composite_key"].split(":")[-1]
        check_length(f"lore {lore_id}", "excerpt", lore["excerpt"])
        check_enum(f"lore {lore_id}", "visibility", lore["visibility"])
        out.append(insert("lw_lore_entries",
                          ["id", "campaign_id", "composite_key", "title", "subtitle", "category",
                           "excerpt", "content", "artwork_url", "visibility", "archived"],
                          [lore_id, cid, lore["composite_key"], lore["title"], lore["subtitle"],
                           lore["category"], lore["excerpt"], lore["content"], "",
                           lore["visibility"], 0]))

    for event in seed["history_events"]:
        check_prefix(f"history {event['id']}", event["id"])
        check_enum(f"history {event['id']}", "visibility", event["visibility"])
        if event.get("location_key") and event["location_key"] not in location_keys:
            raise ValueError(f"history {event['id']}: location '{event['location_key']}' not in seed")
        out.append(insert("lw_world_history_events",
                          ["id", "campaign_id", "title", "era_name", "world_date_label",
                           "sort_order", "session_number", "category", "summary", "location_key",
                           "visibility"],
                          [event["id"], cid, event["title"], event["era_name"],
                           event["world_date_label"], event["sort_order"],
                           event.get("session_number"), event["category"], event["summary"],
                           event.get("location_key"), event["visibility"]]))

    out.append("COMMIT;")
    return "\n".join(out) + "\n"


def main(argv: list[str]) -> int:
    if len(argv) not in (2, 3):
        print(__doc__)
        return 2
    seed = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    sql = build(seed)
    if len(argv) == 3:
        Path(argv[2]).write_text(sql, encoding="utf-8")
        print(f"wrote {argv[2]}: {sql.count(chr(10))} lines, {sql.count('INSERT INTO')} inserts")
    else:
        sys.stdout.write(sql)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
