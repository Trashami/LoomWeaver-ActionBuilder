# LoomWeaver — VS Code Agent Task: Seed *Shadow of the Mountain*

> **Use this file as the task brief for the coding assistant running inside the LoomWeaver repository.**
> Goal: inspect the existing application's schema and services, construct a realistic versioned seed for the *Shadow of the Mountain* test campaign, validate it, and, **only after a successful dry run and explicit operator confirmation**, apply it to the intended MySQL database and project it to Neo4j.
>
> **This is an implementation task, not an instruction to fabricate a completed import.** Report exactly what was created, validated, and executed. Never claim a database was populated unless an actual write and read-back succeeded.

## 1. Intended outcome

Build a reproducible and idempotent importer and richly connected test campaign that exercises the Arcane Screen, adventure guide, session planning and history, scenes, world/lore, party knowledge, claims, entity graph, and GM/player visibility. Seed *actual known data* first; mark missing story details as unknown or optional draft fixtures. Never infer that a planned adventure encounter really occurred.

Deliver:

1. Versioned seed document `seed/shadow-of-the-mountain.v1.json` with one canonical `campaign_id` integer and `seed_version`.
2. Optional JSON files by table group as generated views of that canonical document (campaign/members; adventure/version/nodes/links/dependencies/blocks; sessions/content/play events; scenes/maps/locations/regions; entities/relationships; claims/lore/grants; effects/assignments; characters/encounters), where the actual schema supports them.
3. An offline validation tool and **dry-run** command that checks schema, enums, required fields, IDs, FKs, parent graph cycles, session chronology, visibility, and JSON payload schemas; emit a human-readable report.
4. A transactional MySQL importer with an explicit `--apply` switch and narrow `--campaign-id 1` scope; no writes by default. Repeated runs must not duplicate records.
5. A separate, retryable Neo4j projection/synchronization command that uses the application's existing service. Do not write directly to the graph in a way that bypasses application authorization or transformation logic.
6. A read-back verification report: counts by table, dangling FK check, sample session 14/15, node/block examples, and authorized GM vs player queries if the current application supports them.
7. Clear instructions for using the commands, database connection via existing application environment configuration (no credentials in files), and rollback/recovery behavior.

## 2. Authoritative sources and discovery

Search the repository for and read:

- `files/prod_ddl_loomweaver.sql` (schema-only; read **only the relevant CREATE TABLE statements**, and do not surface user PII columns in logs or prompts).
- `files/schema_dump.tsv` where available.
- `backend/src/LoomWeaver.Infrastructure/Neo4j/LoomWeaverNeo4jService.cs` and all callers that create/update graph nodes and edges.
- The Angular/TypeScript Arcane Screen, scene/map renderer, service DTOs, and interfaces defining `scene_config_json`, as well as block `payload_json` expectations.
- The adventure import, campaign/session, claim, lore, effects, world-map and knowledge-grant services, models, existing migrations, and tests.
- Existing working rows or fixtures for adventure nodes/blocks, scene configs, and session content; use **read-only**, scoped queries for discovery.
- The nine chapters of *The Shadow of the Mountain* if present in the repository or the user's accessible project files. If absent, **do not invent chapters, dialogue, character statistics, chronology, or player actions**. Use the verified facts below and clearly labeled draft fixtures for testing.

If a table or type cannot be verified, flag it as a blocker, skip that table for writes, and continue producing the validated subset. Do not guess columns, enum values, or foreign-key requirements. Do not copy whole prod DDL into the result if it contains sensitive fields.

## 3. IDs and known production facts (from user-provided seed brief v3)

- `lw_users.id=1`: GM, display name `Jason (Archweaver GM)`, role `gm`.
- `lw_users.id=2`: player `Dal (Party View)`, role `player`.
- `lw_users.id=3`: system/creator `LoomWeaver`, role `creator` (use as author of **new platform-created content** when appropriate; existing adventure has `author_user_id=1`).
- Existing campaign `id=1`, slug `shadow-of-the-mountain`; `id=2` `echoes-of-starstone`; `id=3` `court-of-velvet-ash`. **Do not delete campaigns 2 or 3** under this task even if an earlier reset plan mentions them.
- Existing membership in campaign 1: user 1 is `gm`; user 2 is `player` with `assigned_character_key=pc-dal`.
- Campaign 1: `system_code=dnd5e`, `world_name=Icrandor`, `current_act="Act II: The Road to Cinth"`, `current_session_number=14`, `current_location_name="Cinth — Artificers Quarter"`, `weave_enabled=1`.
- Adventure `adv-shadow-mountain`; version `adv-ver-sotm-1-0`; format `full-campaign`, duration 1440 minutes, recommended levels 5–9, existing `author_user_id=1`.
- `lw_adventure_versions` **exists**. Inspect its real PK/FKs before inserting.
- Adventure nodes: `node-chap-whispering` (chapter, players); `node-room-c1-nave` (room, parent `node-loc-ruined-chapel`, area `C1`, players, completed, scene `scene-plains-red`); `node-clue-chokrah-seal` (clue, GM visibility, unresolved).
- Session `session-14`: completed; primary location `node-loc-cinth-gala`; assigned scene `scene-cinth-gala`.
- Session `session-15`: live; primary location `node-loc-ruined-chapel`; assigned scene `scene-plains-red`; contains 16 associated `lw_session_content` rows of types including location, room, scene, NPC, encounter, clue, hazard, treasure, rule; NPC `npc-emrys` is optional. Preserve real session-content associations from DB instead of fabricating their IDs.
- `lw_sessions.objectives_json` and `stopping_points_json` are **arrays of strings**.
- Typical `lw_scenes.mode_support="2D + 3D Linked"`. `scene_config_json` observed examples contain summary counts like `lights`, `stamps`, `waterSplines`, `elevationChunks`; **that example is not a complete renderer schema**. Inspect front-end types before creating a scene configuration.
- Adventure block kinds: `prose`, `readAloud`, `gmNote`, `table`, `image`, `check`, `reference`, `tactics`, `reward`, `condition` (verify actual enum in DDL). `readAloud`: `audience=players`, `shareable=1`, `payload_json={"roomKey":"C1"}` when relevant. `check`: `audience=gm`, `shareable=0`, `payload_json` keys `dc`, `skill`, `failOutcome`, `passOutcome` (only use difficulty/outcomes from manuscript or mark explicitly drafted).
- Adventure node kinds: `adventure`, `chapter`, `location`, `scene`, `encounter`, `npc`, `character`, `clue`, `hazard`, `treasure`, `secret`, `rule`, `handout`, `map_region` (verify against DDL).
- `lw_adventures` is shared content and does **not** have `campaign_id`. Never delete shared adventures/versions simply because a campaign is reset. Check cross-campaign references.

## 4. Narrative evidence and provenance rules

**Established information from the user's conversation** (may reflect a later *Grand Illusion* campaign and must **not** be automatically inserted as historical events of *Shadow of the Mountain* without verifying campaign/session association):

- *Shadow of the Mountain* ended with the defeat of a dragon; *The Grand Illusion* began afterward.
- In *The Grand Illusion*, the Edhellain king tasked the party with protecting a sacred grove.
- Dal Riata took a lineage book from a museum because it "called to him"; the book may reveal the Riata family as the true royal lineage.
- The party was discovered, fought non-elven opponents, and escaped; an airship awaited in the forest.
- Dhreg Riata was unaware of the book's significance.
- The grove mission being an ambush is **a suspicion, not confirmed fact**.

These facts must be separated by **campaign, chronology, provenance, and visibility**. Do not silently merge the *Grand Illusion* events into campaign 1. The known production session 14 and 15 facts take precedence over speculative narrative grouping. Any missing nine-chapter details should be represented as `draft` or an external seed-provenance manifest rather than false canon. For established facts with unknown session number, do not create `lw_play_events` until matched to a real session.

Each synthesized object should carry source metadata in the import manifest (`established_production`, `established_user_report`, `manuscript`, `generated_draft`, `unknown`) and a source reference. Where the table has `canon_status`, use `approved` only for verified canon; otherwise `draft`. Where a claim's truth is uncertain, use `truth_assessment=unverified`. For tables without these fields, retain provenance **in the import manifest**, not in invented table columns.

### Information boundaries

- Player-visible prose/read-aloud: `audience=players` and shareable where appropriate.
- GM-only notes, secret evidence, tactics, hidden motives, and unresolved truth: `audience=gm`, `visibility=gm`, or the actual application's equivalent.
- `lw_knowledge_grants` should exist only where a player or party actually learned something. No grant merely because GM canon contains a secret.
- Do not invent player knowledge, secret revelations, combat outcomes, dice rolls, or level-ups.

## 5. Schema and relationship requirements

Review the DDL for, at minimum:

- `lw_campaigns`, `lw_campaign_members`, `lw_campaign_effects`, `lw_campaign_effect_assignments`;
- `lw_adventures`, `lw_adventure_versions`, `lw_adventure_nodes`, `lw_adventure_blocks`, `lw_adventure_links`, `lw_adventure_dependencies`, `lw_adventure_assets`, `lw_adventure_progress`;
- `lw_sessions`, `lw_session_content`, `lw_play_events`;
- `lw_scenes`, `lw_combat_state`, `lw_combat_tokens`, `lw_saved_encounters`, `lw_dm_campaigns`;
- and, for the requested full campaign, **also inspect** `lw_world_maps`, `lw_world_locations`, `lw_world_regions`, `lw_entities`, `lw_entity_relationships`, `lw_claims`, `lw_lore_entries`, `lw_knowledge_grants`, `lw_characters`, and any missing reference/lookup tables.

Follow the actual FK graph, not an assumed textual order. If sessions reference scenes, insert scenes before sessions; if session content references nodes, insert nodes first. Handle parent nodes before children and world-map parentage similarly. Run a topological sort and detect cycles.

Stable keys: keep campaign ID 1 as a JSON integer; slug-form string keys for `session_id`, `scene_key`, `location_key`, `map_id`, and adventure node IDs. Use real IDs for users. For auto-increment PKs, prefer lookup by stable natural key or a deterministic seed mapping, never rely on guessed IDs. Ensure all statements are parameterized.

**Integer mismatch:** `lw_campaigns.id` is `BIGINT UNSIGNED`; `campaign_id` is signed `INT` in combat/effects/encounter/monster tables, and `GetAuthorizedSubgraphAsync` takes `int`. Validate `0 < campaign_id <= 2147483647`, do not change schema automatically, and do not use mixed-type insert hacks.

## 6. Neo4j projection contract

Inspect `LoomWeaverNeo4jService.cs` for the real implementation. Current brief reports:

- Nodes have label `Entity` plus an appropriate type label, e.g. `AdventureNode`, `Location`, `NPC`.
- Node match key: `{namespace, campaignId, compositeKey}`, namespace default `loomweaver`.
- Composite key convention: `<campaignId>:<Type>:<slug>`; e.g., `1:Location:loc-ruined-chapel`.
- Relationship type is transformed by `ProjectEntityRelationshipAsync`: uppercase, retain letters/digits/underscore, fallback `CONNECTED_TO`. Examples: `CONTAINS`, `OCCURS_AT`, `PLANS`, `PLAYED`, `FEATURES`, `USES`, `HAS_CLUE`, `HAS_HAZARD`, `HAS_TREASURE`, `REVEALS`, `LEADS_TO`, `DEPICTS`, `REFERENCES`, `ASSIGNED_MAP`, `CURRENTLY_IN`.

MySQL is the source of truth; Neo4j is a derived projection. First commit MySQL, then request graph sync through the existing services. A graph error must be recorded as pending and retried without replaying or corrupting MySQL. Reconciliation should detect missing nodes and edges and report counts.

## 7. Execution flow and hard safety constraints

1. **Discovery only**: identify environment, schema, existing campaign 1 rows, complete FK dependency graph, and available manuscript/scene interfaces. Validate that the selected database is the intended target; print host/environment/database name with secrets redacted. Do not use a production connection for trial writes.
2. **Generate**: write versioned JSON, source manifest, and import code. Ensure all produced data is distinguishable from existing content. Preserve known session 14 completed/session 15 live states and avoid overwriting established data with empty/generated fields.
3. **Offline validation**: fail on missing users, unsupported enums, bad JSON shape, unresolved required FK, unexpected existing-row collisions, duplicate keys, or draft content promoted to historical facts.
4. **DB dry run**: on a **staging/local clone first**, perform a transaction and roll back; report would-insert/would-update/would-skip/would-delete counts. Never count dry-run data as committed.
5. **Preview exact change set**: identify any destructive operation, affected table, campaign scope, and row count. **Do not delete campaign 1 or reset live data automatically.** Reset is an independent `--reset-campaign 1` operation requiring a backup and affirmative operator authorization after reviewing this preview. There is **no authorization to touch campaigns 2 or 3 or `lw_users`**.
6. **Apply only after explicit confirmation**: use parameterized upserts in one MySQL transaction; commit only after all validation succeeds. If the existing campaign uses the desired IDs, update in place without clobbering known data. Avoid hard-coded destructive `TRUNCATE` and global `DELETE` statements.
7. **Post-commit projection**: queue/execute Neo4j sync; log a retryable sync state. Verify content in MySQL and Neo4j separately.
8. **Read-back and report**: print seeded/updated/skipped counts, outstanding content gaps, graph projection state, and example Arcane Screen retrieval for GM and player. If any write or sync was not performed, state why.

**Security:** Never print/export emails, hashes, tokens, secrets, connection strings, or raw credentials. Never modify `lw_users` or subscription/auth tables. Do not disable FK checks or bypass access control in order to force the import. Prefer a backup or database snapshot before any live mutation. Never claim that a production reset was performed unless confirmed by read-back.

## 8. Acceptance criteria

- Running validation twice produces the same results; applying twice does not duplicate records.
- Campaign 1 remains `dnd5e` / `Icrandor` with GM 1 and player 2 assigned `pc-dal`.
- `adv-shadow-mountain`, `adv-ver-sotm-1-0`, known nodes, session 14, and session 15 are found and consistently linked.
- Session 14 remains completed; session 15 remains live, with only verified content/history.
- GM-only clue `node-clue-chokrah-seal` cannot be accessed by a player through the actual API; visibility tested **server-side**, not only by hiding a UI element.
- Read-aloud and GM notes have correct visibility/audience/shareability, and check JSON validates.
- Scene configs conform to the frontend renderer's real type/schema or are explicitly omitted, not guessed.
- No changes to users or unrelated campaigns; shared adventures/versions are preserved.
- All inserted references exist; no duplicate natural keys, orphan records, invalid hierarchy cycles, or unexpected canonical truth promotion.
- Neo4j graph edges can be rebuilt from MySQL; a failed sync remains retryable.
- Final summary lists all generated files, exact commands to rerun, table counts, issues, and whether real DB writes were performed.

## 9. First response requested from the VS Code agent

Inspect repository contents and environment configuration **without making writes**. Then report: (a) files found, (b) relevant actual DDL/DTO differences from this brief, (c) whether the manuscript is available, (d) whether full scene configs can be generated, and (e) the proposed dry-run command. Proceed to implement seed and validation files. **Ask for confirmation only before destructive reset or writing to production**; do not stall on unanswered story questions when an explicitly marked draft fixture is sufficient.
