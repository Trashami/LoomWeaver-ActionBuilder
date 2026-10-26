# LoomWeaver V2 Logical Module Roadmap

> Canonical architectural rule: All eleven LoomWeaver capabilities live as **logical modules inside one Angular workspace (`frontend/`) and one modular .NET solution (`backend/LoomWeaver.sln`)**—never twelve separate websites or twelve fragmented microservices.

## Master Module Matrix

| # | Logical Module | Core Capabilities | Primary Technical Stack | Frontend Path | Backend Path |
| --- | --- | --- | --- | --- | --- |
| 1 | **Character Studio** | Character creation, stats, equipment, progression, level-up | Server-side character/rules engine | `features/characters/` | `LoomWeaver.GameSystems` + `Modules/Characters/` |
| 2 | **LoomMaps** | 2D/3D maps, terrain, water splines, stamping, scatter, lighting | Babylon.js + serializable scene commands | `features/maps/` (`engine/terrain`, `water`, `scatter`, `lighting`, `rendering`) | `Modules/Maps/` |
| 3 | **Arcane Screen** | Live encounters, initiative, action economy, combat, VTT | .NET combat engine + Babylon renderer | `features/arcane-screen/` + `features/encounters/` | `Modules/Encounters/` |
| 4 | **ActionBuilder** | Abilities, attacks, rules-based actions, When/If/Then homebrew | .NET action/rules engine | `features/effects/` (Action rules tab) | `Modules/Actions/` |
| 5 | **EffectBuilder** | Particles, spell effects, trajectories, animations, timelines | Babylon.js effects engine | `features/effects/` (`engine/particles`, `timelines`) | `Modules/Effects/` |
| 6 | **Dice Forge** | Custom 3D dice, authoritative rolls, Nat 20 / Nat 1 shader effects | Babylon.js + .NET cryptographic dice engine | `features/dice/` | `Modules/Dice/` |
| 7 | **Music & Ambience** | Playlists, location music, battle audio stems, crossfade transitions | Browser Web Audio API + .NET events | `features/assets/` (Audio controller) | `Modules/Audio/` |
| 8 | **The Loom** | Campaign-aware, permission-safe zero-generation AI memory | .NET + Neo4j GraphRAG | `shared/ui/loom-launcher/` + `features/loom/` | `Modules/Knowledge/` |
| 9 | **The Weave** | Optional relationship & world graph visualization + draft review | Angular SVG/Canvas graph renderer | `features/weave/` | `Modules/Knowledge/` |
| 10 | **Marketplace** | Purchases, creator content (85/15 split), subscriptions, entitlements | .NET entitlement/content engine | `features/marketplace/` + `features/assets/` | `Modules/Marketplace/` |
| 11 | **Campaign Analytics** | Combat telemetry, damage by type, play styles, achievements | .NET reporting engine + `lw-stat-radar` | `features/statistics/` | `Modules/Statistics/` |

## Stage Progression

- **Stage 1 (Verified):** Site architecture, global shell with `/LoomWeaver.png`, 13 working routes, core reusable UI primitives (`lw-icon`, `lw-button`, `lw-badge`, `lw-panel`, `lw-asset-card`, `lw-entity-card`, `lw-stat-radar`, `lw-inspector-drawer`, `lw-loom-launcher`), and `loomweaver` MySQL + Neo4j provisioning.
- **Stage 2 (Verified):**
  - **Character Studio**: Pluggable server-side character/rules engine (`Dnd5e`, `Pathfinder2e`, `VampireV5`), interactive character creation wizard, ability score & modifier calculator, equipment loadout manager, and XP level-up execution.
  - **LoomMaps Engine**: Real Babylon.js 2D/3D viewport (`engine/terrain`, `engine/water`, `engine/scatter`, `engine/lighting`, `engine/rendering`), interactive canvas click-to-stamp/scatter/sculpt/water-spline tools, quality profile switching, and server-backed scene command persistence.
  - **Shared Catalog Expansion**: `lw-rules-option-selector`, `lw-map-tool-panel`, and `lw-asset-picker`.
- **Stage 3 (Verified):**
  - **Arcane Screen VTT + Encounters**: Live Babylon.js 3D/2D tactical combat stage, token targeting & range tether, per-turn Action Economy (`Action`, `Bonus Action`, `Reaction`, `Movement`), server-evaluated AC/DC hit and save resolution, and automated XP awards on encounter completion.
  - **ActionBuilder + EffectBuilder**: Guided When / If / Then rules composer paired with Babylon.js 3D spell trajectories (`arc`, `cone`, `beam`, `sigil`), timeline keyframe preview, and reduced-motion accessibility fallback.
  - **Shared Catalog Expansion**: `lw-npc-card`, `lw-creature-card`, and `lw-encounter-card`.
- **Stage 4 (Verified):**
  - **Dice Forge 3D**: Babylon.js 3D polyhedral dice forge, live PBR skin customizer, Nat 20 / Nat 1 3D burst shaders, and .NET cryptographic dice engine (`RandomNumberGenerator.GetInt32` + SHA-256 verification digest) with Advantage/Disadvantage support.
  - **Music & Ambience Engine**: Browser Web Audio API 4-stem procedural soundscape synthesizer & crossfade mixer (`Ambient Drone`, `Exploration Harmony`, `Tension Pulse`, `Combat Percussion`) synchronized with .NET scene mood transitions.
  - **Campaign Analytics Ledgers**: .NET reporting engine aggregating party & per-character `lw-stat-radar` profiles, damage-by-type distributions, d20 entropy telemetry, character MVP ledgers, and automated campaign achievements.
  - **Shared Catalog Expansion**: `lw-dice-roller-tray`, `lw-audio-stem-mixer`, and `lw-achievement-card`.
- **Stage 5 (Next):** **The Loom GraphRAG + The Weave Authoring + Marketplace Entitlements & Module Packager**.
