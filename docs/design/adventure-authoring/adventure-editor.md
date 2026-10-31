# Connected adventure authoring editor

Status: proposed product and data contract, 2026-10-30. This document and its JSON companions specify a design; they do not implement a new editor, API, database migration, or production capability.

## Deliverables

- `adventure-editor.catalog.json`: machine-readable field catalog for 23 authoring selections, common record/block envelopes, reusable value shapes, conditional requirements, relationships, validation gates, guide projection and persistence responsibilities. It is a declarative specification, not a formal JSON Schema or executable form engine.
- `adventure-editor.example.json`: original, linked two-session dungeon example with 26 records and separate campaign runtime examples. Draft content illustrates the structure; it is not a balanced publication-ready adventure.
- This Markdown file: user workflow, detailed content breakdown, architecture, implementation gaps, and acceptance criteria.

## 1. Product decision: one editor, different content profiles

Build one shared `lw-content-editor` hosted either on a page or in a modal. Selecting a content type changes the sections and prompts. Do not ask a GM to enter JSON, SQL keys or graph vocabulary. Save typed records and blocks behind the writing interface.

The writer should be able to begin with two fields: **What are you creating?** and **Title**. Everything else can be incomplete in a draft. Readiness requirements apply when the author selects **Check readiness**, approves a revision, reveals content, or exports a playable package.

Use six sections on a single scrollable surface:

1. **Identity and scope:** type, subtype, title, containing place/chapter, selected adventure; show whether an existing record is being edited or a new one created.
2. **Write:** primary prose area with movable typed blocks. Keep the author's words intact.
3. **Run this:** type-specific fields such as exits, checks, participants, pacing, tactics and outcomes.
4. **Connections:** authorized record pickers with plain labels such as Happens at, Features, Supports, Leads to, Documented in.
5. **Sharing and evidence:** GM-only text, prepared player-safe passages, provenance, rights and disclosure controls.
6. **Preview and save:** draft saving, validation results, contextual GM guide, player-safe preview, approve revision.

Desktop: a wide page or near-full-width modal with an optional outline and resizable reference panel. Mobile: the same editor becomes full screen. A small fixed modal is unsuitable for writing a dungeon floor or running an encounter. Sections can collapse; the user never needs to leave this editor to finish the selected record.

Offer Write, Structured, Guide Preview and optional JSON modes over the same record. JSON mode is an inspect/export tool; server validation remains mandatory.

### Writing behavior

- Insert prose, read-aloud, private GM note, check, choice, table, image, reference, tactics, reward or condition from a small block menu.
- Keep block IDs stable during edits and reordering. Use portable text with structured references rather than database meaning inferred from raw HTML.
- Selecting an existing entity creates a stable reference, not a duplicate dossier. A mention can suggest ABOUT or REFERENCES; it cannot assert a secret, grant knowledge or confirm canon.
- Allow quick-create for a linked record in an inline drawer within the same host. Return to the exact cursor position afterward.
- Changing type previews incompatible fields and preserves the original draft until migration is confirmed.
- Autocomplete, source browser, related-item counts and previews receive only authorized data.
- Autosave drafts with revision conflict handling, explicit saved/saving/error status, undo and recoverable local edits. A draft autosave does not approve canon.
- Distinguish editorial readiness, canon assessment, publication version and disclosure. A confirmed fact can still be GM-only; a published module can contain secrets.

## 2. Keep four hierarchies separate

**Publication:** adventure -> chapters/acts -> referenced content.

**Geography:** world -> region -> city/site -> district/floor -> keyed room/area. A dungeon site can contain multiple levels without needing a city parent. Numeric keys such as C3 are display labels, not globally unique identities.

**Planned play:** session template -> scenes -> location + encounters + cast + clues + optional branches.

**Played history:** campaign session -> observed events -> decisions, discoveries, state changes and actual awards.

A chapter can cover several places. A place can appear in many chapters and sessions. The same room may have an arrival scene, a negotiation scene and a later return scene. Time order is not containment. Session 15 is a campaign occurrence; Session Template A is portable authored preparation.

## 3. What the user enters for each selection

The JSON catalog supplies exact field paths, value types, prompts and readiness gates. Below is the intended editorial structure.

| Selection | Minimum useful ready content | Additional depth |
|---|---|---|
| Adventure/module | Premise, hooks, ruleset version, party guidance, format/time, starting place/situation, endings | Chapters, essential beats, optional scenes, table advisories, campaign adaptation, credits and rights |
| Chapter/act | Purpose and exit outcomes | Entry conditions, places, essential/optional scenes, level guidance, pacing |
| Dungeon level | Area prefix, purpose/theme, general features, keyed rooms, level connections | Map, factions/territories, patrol tables, rest guidance, escalation clocks, revisit changes |
| Place/city/site/room | Type and physical description | Parent, map, environment, exits, occupants, services, rumors, lore, clues, hazards, treasure, revisit changes |
| Scene/place in a session | Location, present situation, purpose, possible outcomes | Read-aloud, present NPCs, encounter links, choices, entry conditions, scene-specific changes, time budget |
| Story/plot thread | Central question, stakes, linked beats, possible resolutions | Established background, character hooks, actors' motives, clocks and dependencies |
| Story beat | Intended opportunity/change and possible outcomes | Trigger, prerequisites, alternate scenes, choices, whether essential |
| World lore | Category and article | Era, subjects, specific claims, evidence, related articles, play uses, safe excerpts |
| Session plan | Opening, objectives, ordered scenes, pacing | Recap, starting place, carry-forward threads, preparation/resources, rewards, fallback scenes, stopping point |
| Played session | Number/date, participants, observed events | Decisions, revelations by audience, award-event links, approved recap and unresolved consequences |
| Encounter | Type, location, trigger, stakes, side objectives, participants, resolution options | Positions/map, terrain, tactics, checks, reinforcements, retreat, scaling, potential rewards and aftermath |
| NPC | World role and motive | Appearance, voice, sample dialogue, affiliations, knowledge, leverage, schedule, rules template |
| Faction | Purpose and goals | Leaders, territories, methods, resources, clocks, reactions |
| Quest/investigation | Hook, objectives, resolutions | Giver, prerequisites, locations, evidence routes, rewards, alternate leads |
| Clue | Observation, discovery rule, safe observation text | Location, supporting/contradicting claims, source, next leads, fallback sources |
| Secret | Canonical truth and subjects | Sources, discovery paths, separate partial/full safe passages, consequences |
| Fact/rumor/belief | Specific statement, assessment and subjects | Speaker, evidence, when it applies; confirmation is independent of approval |
| Source/citation | Origin and precise locator | Excerpt, rights, recorded timestamp |
| Trap/hazard/puzzle | Warning, trigger, effect, countermeasures, outcomes | Detection, checks, reset, persistent cost |
| Treasure/reward | Contents and acquisition condition | Limitations, ownership, curses, advancement rules, consequences |
| Handout | Text or asset | Accessible text, sources, share trigger and safe media |
| Roll table | Dice expression, covered ranges/results, use | Repeated-result policy and linked results |
| Read-aloud | Exact passage and attached context | Trigger, condition-specific variants, private delivery notes |

### World lore: connect an article to playable material

Do not require every encyclopedia article to look like a room. Use Article, Truth and Sources, Connections, and Use in Play sections.

1. Write the historical/cultural article.
2. Link the subjects with entity pickers.
3. Extract important claims only when the author chooses to. Each claim has its own assessment and evidence.
4. Link places, clues and scenes where the information can matter.
5. Prepare safe passages where the full article contains spoilers.

For example: a history of the chapel links to the chapel site; an archive clue supports a specific delivery claim; the arrival scene references that article. The location guide retrieves the article as relevant history. A character who finds the clue receives its observation, not unrestricted access to every secret in the article.

Create multiple articles for genuinely separate topics. Do not split every paragraph into a graph node. Index source chunks with revision/block pointers for citations; project the semantic connections that support actual queries.

### Multilevel dungeon structure

Use the organizing pattern of a keyed megadungeon without copying a published adventure's text:

```text
Adventure
  Chapter or regional overview
    Dungeon site
      Level 1: theme, factions, general features, keyed map
        C1: room description, exits, occupants, discoveries
        C2: room description, exits, hazard, encounter link
      Level 2: theme, changes, keyed map
        B1: room description, clue, treasure
  Session Template A -> selected scenes on Level 1
  Session Template B -> scenes on Level 2 and revisit to C1
```

Store stairs, portals, gates and travel as typed exits with destinations, barriers, direction, conditions, travel cost and audience. Include cross-level destinations and one-way paths. Do not use the chapter order to determine adjacency.

Level-wide environmental defaults save repeated entry; room overrides are explicit. Darkness, patrol routes, rests, faction reactions and changes on return make a level runnable beyond its first visit. A room's visibility, clue visibility and exit destination visibility can differ.

### Session: preparation versus occurrence

The author selects existing scenes and sees derived lists of NPCs, places, encounters, clues and lore. They can pin an additional directly relevant resource with a reason. They do not need to re-enter the same cast in five tabs.

Suggested sections: Recap/Opening; Goals; Ordered Scenes; Needed Resources; Pacing/Optional Cuts; Potential Rewards; Fallbacks/Stopping Points.

Scheduling a plan creates a campaign session occurrence. During play, record which scenes happened, actual decisions, witnesses, discoveries and consequences. The recap is derived from or linked to those approved events, not treated as permission to invent events from planned outcomes.

### Encounter: select the subtype first

- Combat: combatant templates/counts/sides, starting positions, goals, light/cover/terrain, opening tactics, adaptation, reinforcements, morale/retreat/surrender, alternate resolutions and persistent injuries/costs.
- Social: actors, agendas, leverage, boundaries, opening attitude, approaches/checks when needed, concessions, refusal and escalation outcomes.
- Exploration: obstacle, observable signs, available approaches, progress/resolution rule, resource cost, success/failure consequence and fallback.
- Mixed: explicitly select the applicable sections; do not show irrelevant combat inputs by default.

The encounter definition stores intended setup. Launching it allocates actual actor instances with their own HP, resources, statuses and positions. Never edit a shared creature template to record damage taken in one campaign encounter. System-specific checks and difficulty need the installed ruleset/version; prose remains system-independent where possible.

### Place in a session: use a scene record

Choose an existing place, then add current activity, present NPCs, immediate goals, applicable encounter, arrival read-aloud, changes from its usual state, choices and consequences. Store these as scene context/overrides. Keep permanent architecture, default exits and enduring history on the place.

This prevents a new session from overwriting the room's baseline. An actual burned door becomes a campaign state-change event; an authored possibility that the door burns remains an outcome until played.

### Read-aloud and secrets

Read-aloud is normally a typed block, with a stable ID and a parent scene/room/encounter. The read-aloud selection is a shortcut to creating that block. It should not create duplicate text records.

Read to the table, mark as read, and share in the player app are three distinct actions. Keep private delivery guidance separate from the player passage. Prepared variants cover observable state changes; evaluate them on the server before disclosure.

Secret truth, safe observation and eventual revelation have separate text and grants. Sharing one block does not grant all siblings or the containing article. A safe representation can retain GM classification until explicitly revealed. Existing player grants target that representation, with authorizer, audience and source event recorded.

## 4. Draft-to-JSON pipeline

The rich editor serializes a common envelope plus `details` selected by type. Blocks retain their exact text, order, source pointers and typed payload. Rich-text mentions store stable IDs and display labels; a rename never breaks a link.

Two modes of input are useful:

- **Structured composition:** field and block edits produce typed JSON directly. No AI is needed.
- **Paste/import:** preserve the original source; a deterministic heading parser can identify known headings. Unknown headings remain prose. Optional extraction by The Weave proposes links/claims/records with evidence pointers and a review diff. It cannot directly approve canon, reveal text or overwrite existing records.

Never auto-classify quoted document instructions as commands. Treat imported prose, JSON and attachments as data. Do not infer NPC identity from matching names alone; resolve ambiguity with a picker. Do not require The Weave to make the editor work, and do not turn The Loom into a fiction generator.

## 5. JSON contract conventions

The catalog is a UI/domain specification. `type` values such as `exit[]`, `ref` and `richText` refer to the reusable shapes in `types`; primitive `text`, `integer`, `boolean`, `dateTime` and inline `enum:` types are self-describing. `requiredAt` distinguishes draft, ready and package requirements. Conditional requirements supplement profile fields.

- `ref`: `{ "ref": "stable-content-id" }`. A reference must resolve inside the document/package or a declared dependency.
- `blockRef`: stable block ID; validate its parent and permissions.
- `assetRef` / `dependencyRef`: IDs in the asset/dependency manifest, not arbitrary machine paths.
- `runtimeRef`: campaign occurrence, character, event or ledger reference. Exclude from reusable templates.
- `details` is the interchange representation. It is not a recommendation to store all operational data as an unvalidated JSON blob.

The example uses `moduleDefinition` and `campaignRuntimeExample` as separate top-level objects to demonstrate the boundary. A reusable module exporter emits only the module definition. Draft statuses in the example are deliberate. Placeholder identities and rule versions must be resolved before publication.

Outcomes have IDs scoped to their record. Block and content IDs are document-wide. Prefix local outcome references with their owning record when normalizing them into relational/graph identities. Conditions are allowlisted data trees, never executable JavaScript, SQL, Cypher or free-form expressions.

The example's explicit `links` are the normalized connection output. Reference fields in `details` drive form controls; a single server normalizer reconciles them into those links. Reject conflicting duplicates rather than maintaining two independent relationship truths.

## 6. SQL and Neo4j mapping

```mermaid
flowchart LR
  Editor[One content editor] --> Validate[Authorize and validate command]
  Validate --> SQL[SQL content revision + typed links + pending outbox]
  SQL --> Projector[Idempotent projection worker]
  Projector --> Graph[Neo4j story and evidence graph]
  SQL --> Guide[Authorized contextual guide]
  Graph --> Guide
  Guide --> Preview[GM / player-safe preview]
```

| Editor data | Authoritative SQL responsibility | Derived graph responsibility |
|---|---|---|
| Shared identity | `lw_entities` and stable public ID | Entity node with campaign, installation and revision identity |
| Lore article | `lw_lore_entries`, versioned source blocks | Lore ABOUT subjects; citation/source links |
| Place | `lw_world_locations`, typed parent/exit/map relations | CONTAINS, place connections, authored placement |
| Adventure/version | `lw_adventures`, `lw_adventure_versions`, content membership | Version/chapter/story context |
| Typed content | `lw_adventure_nodes`, `lw_adventure_blocks` with reviewed extensions | Selected scene/claim/clue/secret nodes |
| Relationships | `lw_adventure_links` and canonical campaign-wide links | Typed edges using SQL relationship identity |
| Planned sessions | `lw_sessions`, `lw_session_content`, distinguish template from occurrence | PLANS; never PLAYED before an event |
| Actual play | `lw_play_events` plus typed history/decision details | Significant events and their participants/consequences |
| Knowledge | `lw_knowledge_grants` plus prepared safe representation, audience and policy revision | Sanitized revelation/knowledge projection |
| Import | `lw_module_installations`, `lw_module_id_maps` | Fresh campaign/installation-scoped graph identity |

Extend the reviewed existing schema rather than creating a parallel generic system that duplicates its records. Ownership, memberships, reference integrity, grants, awards and mutable play state belong in typed SQL records. Optional presentation configuration and rich block payloads can be JSON. Graph records never authorize access on their own.

Transactions save SQL changes and a pending outbox item. Projection must be retryable, idempotent and revision-aware. Guide reads can use SQL for direct context and Neo4j for bounded semantic expansion. Return explicit projection lag/errors; do not pretend a fallback answer is a live graph result.

Canonical `ABOUT`, `DOCUMENTED_IN`, `SUPPORTS`, `CONTRADICTS` and `REVEALS` have distinct meanings. Clue -> REVEALS -> secret describes a potential path; it is not a runtime grant. Optional story graph visualization is independent of graph storage and The Loom retrieval.

## 7. How the guide chooses relevant content

Session plan -> selected scenes -> locations -> cast/encounters/discoveries -> directly linked lore and sources. Add level-wide general features, applicable clocks and pinned resources. Bound expansion by relationship type and depth; do not return the entire graph neighborhood.

Room scope resolves its baseline, parent level features, applicable scene, exits and discoveries even without a selected session. Session scope can show several rooms. Encounter scope resolves objectives, setup and relevant evidence without unrelated city history.

Guide groups: Summary, At the Table, Read-aloud, Beats, NPCs, Places, Encounters, Clues/Hazards, Treasure/Rewards, Lore, Handouts/Tables, Notes and Recent Events. Each result includes an authorized reason, such as Present in C2 or Historical context for this place.

Deduplicate by canonical identity, not name. Derive guide lists instead of maintaining independent NPC/place/lore arrays. Keep authored optionality, completion, discovery, editorial status and visibility as separate dimensions. An optional scene can also be discovered and completed.

Player filtering happens before graph expansion explanations, counts, suggestions, citations, asset URLs, export and SignalR delivery. A hidden exit destination must not leak through its label, prerequisite message or breadcrumb. Cache keys include audience and policy revision. A GM preview uses the selected real audience's grants, not a generic `players` flag.

## 8. Current foundations and material gaps

Reviewed on 2026-10-30: root/V2 agent rules; V2 world-lore feature, component system, repository layout, engine ownership and UI rules; current guide contracts/endpoints, note composer, SQL declarations, Loom endpoint; legacy session guide interfaces. Also reviewed the Obsidian vault Start Here, Product Vision, Product Goals and Release Gates, MySQL design, Neo4j knowledge graph, Authorization and Secrets, typed catalogs, and Arcane Screen/Encounters.

Relevant goals: first completed durable session; typed evidence/revelations; SQL-authoritative state; idempotent graph projection; source-attributed player-safe Loom answers; portable/versioned modules; reused accessible components; permanent Loom with optional creative tooling.

Observed foundations:

- Shared `note-composer-modal` already offers writing, category selection and mentions, but its contract is tied to character rich notes. Extract reusable writing/mention behavior; do not stretch note category into a full encounter model.
- `AdventureGuideContracts.cs` already has room exits, read-aloud, checks, NPCs, encounters, beats and guide group DTOs. Preserve useful concepts when defining the editor command model.
- Provisioning SQL includes adventure nodes/blocks/links, module IDs, session content and knowledge/progress structures. Current declarations include canonical `entity_id` links for adventure/lore. Their presence is not evidence of applied production migrations.
- Current endpoints use `CampaignAccessResolver` in inspected guide/knowledge reads, and Loom query notes now include campaign filtering. Earlier chat findings about those exact paths are historical; do not repeat them as unchanged defects.
- Legacy guide interfaces include checks, player choices, clue passages and rewards. Reuse domain concepts, not session-bound duplicated JSON arrays or generation defaults.

Gaps to resolve before implementation:

1. The proposed editor has richer kinds than the current adventure-node enumeration: lore, story arc, beat, claim, source, faction, quest, roll table and session-template distinctions need explicit mappings/migrations. Do not force them into `rule` or hide them all in arbitrary metadata.
2. Content templates and campaign occurrences need separate ownership and identities. Current campaign-bound node/version tables alone are not an immutable reusable authoring library.
3. Separate optionality, discovery and completion instead of the existing combined state enumeration. Separate audience safety from canon assessment and authoring approval.
4. Reconcile generic campaign relationships with adventure links so lore/NPC/history outside a module connect without duplicate entities or incompatible relationship names.
5. Add durable content revisions, source/block citations, type-aware validation, conflict-safe saves and safe-representation grants. Review current persistence on each path; static collections are not durable storage.
6. An existing feature document labels Stage 5 Verified and lists security/portability acceptance checks, while inspected notes/drafts still use static collections. Treat the document as intent where implementation evidence disagrees; require fresh end-to-end tests before release claims.

No application code, live database, grants or campaign data were changed for this specification.

## 9. Suggested implementation slices

1. Shared authoring contract and reusable editor shell. Draft lore, location, scene and read-aloud first; typed links and persistent revisions; SQL save/reopen; no automatic AI dependency.
2. Room/level profiles, exits, general features, map anchors and scene overrides. Render the same saved records in the guide.
3. Session plan and encounter profiles; run one short session with real events, discoveries and persistent consequences.
4. Evidence/claim/revelation path; outbox projection; GM and two-player Loom queries with different permitted evidence.
5. Versioned export/import, licensed assets and fresh-ID remapping; then richer city, faction, quest, story and table authoring.

Reuse existing modal, panel, inputs, buttons, pickers and guide cards. Extract useful editor blocks into shared UI rather than duplicating them across routes. Use modern Angular signals and ng-primitives, typed services/stores, component-owned styles, no decorative icons or emoji. Keep individual implementation files below project limits.

## 10. Release checks

- A GM writes one room, links existing lore/NPC, adds read-aloud and encounter; save/reopen preserves all content and stable IDs.
- Session and room guide views return that same content with correct inclusion reasons and no duplicated dossier.
- One reusable room can appear in two sessions with different authored scene context; history remains accurate.
- Unknown pasted headings survive as prose; text extraction cannot silently approve claims or create grants.
- A player who finds one clue sees only the granted observation; another player receives neither content nor hidden counts. Indirect queries and direct-ID requests behave consistently.
- Ready validation catches duplicate area keys within a level, dangling exits, containment cycles, invalid relationship endpoints, invalid dice ranges and missing essential dependencies.
- Imported room polygons preserve source dimensions, scale and correct area targets. Player map assets contain no baked-in GM annotations.
- SQL remains authoritative when Neo4j is offline; pending projections replay safely after recovery with no duplicate edges or stale overwrite.
- Export from account A and import into account B creates fresh campaign/runtime identities, retains approved relationships/assets/sources and excludes A's grants, private notes and progress.
- Review/import never grants source-campaign membership or licensed files the destination user cannot access.
- Concurrent authors receive a conflict preview; stale saves never overwrite an approved revision silently.
- Keyboard/mobile use, error recovery, undo and multi-instance isolation are verified.
- Implementation builds/tests and relevant product release gates pass before commit/deployment. Documentation deliverables alone do not require application builds.
