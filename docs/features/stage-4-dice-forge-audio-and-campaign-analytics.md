# Feature: Stage 4 — Dice Forge 3D, Music & Ambience Web Audio Engine & Campaign Analytics Ledgers

- **Slug:** `stage-4-dice-forge-audio-and-campaign-analytics`
- **Status:** Verified
- **Module owner:** `features/dice`, `features/assets`, `features/statistics` / `LoomWeaver.Modules.Dice`, `LoomWeaver.Modules.Audio`, `LoomWeaver.Modules.Statistics`
- **System support:** D&D 5e (`dnd5e`), Pathfinder 2e (`pf2e`), Vampire V5 (`vampire_v5`)
- **First written / Last updated:** 2026-10-25
- **Authoritative code paths:**
  - `frontend/src/app/shared/ui/dice-roller-tray/`
  - `frontend/src/app/shared/ui/audio-stem-mixer/`
  - `frontend/src/app/shared/ui/achievement-card/`
  - `frontend/src/app/features/dice/`
  - `frontend/src/app/features/assets/`
  - `frontend/src/app/features/statistics/`
  - `backend/src/LoomWeaver.Domain/Stage4Contracts.cs`
  - `backend/src/LoomWeaver.Modules/Dice/DiceForgeEndpoints.cs`
  - `backend/src/LoomWeaver.Modules/Audio/AudioAmbienceEndpoints.cs`
  - `backend/src/LoomWeaver.Modules/Statistics/CampaignAnalyticsEndpoints.cs`
- **Architecture docs:** `../architecture/module-roadmap.md`

## User story

As a GM or Player, I want:
1. **Dice Forge 3D (Module 6)**: An interactive Babylon.js 3D polyhedral dice forge with customizable PBR skins (obsidian, astral glass, bloodstone, clockwork brass, fey emerald), server-authoritative cryptographic dice rolling (`d4` through `d100`, Advantage/Disadvantage, modifiers), and Natural 20 / Natural 1 3D shader bursts.
2. **Music & Ambience Engine (Module 7)**: A real browser Web Audio API multi-stem synthesizer and crossfade mixer (`Ambient Drone`, `Exploration Harmony`, `Tension Pulse`, `Combat Percussion`) synchronized with .NET campaign scene mood transitions (`Exploration`, `Intrigue`, `Sanctum`, `Combat`, `Boss`).
3. **Campaign Analytics & Ledgers (Module 11)**: A server-side .NET reporting engine and interactive analytics studio displaying party and per-character play-style radars (`lw-stat-radar`), damage by element/type distributions, d20 entropy telemetry, character performance ledgers, and automated campaign achievements.

## Reusable component audit (required for UI slices)

- **Existing components reused:** `lw-panel`, `lw-button`, `lw-badge`, `lw-icon`, `lw-asset-card`, `lw-stat-radar`.
- **New components created once and reused across routes:**
  - `lw-dice-roller-tray`: Polyhedral die selector (`d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`), die count, modifier stepper, Advantage/Normal/Disadvantage mode selector, and cryptographic roll trigger.
  - `lw-audio-stem-mixer`: 4-stem adaptive Web Audio mixer (`Ambient Drone`, `Exploration Harmony`, `Tension Pulse`, `Combat Percussion`) with scene mood crossfade presets and live level meters.
  - `lw-achievement-card`: Displays campaign and character achievements with rarity tier, unlock progress bar, and XP reward metadata.

## Security, role and visibility matrix

| Scenario | GM (`role = 'gm'`) | Authorized Player (`role = 'players'`) |
| --- | --- | --- |
| Roll authoritative cryptographic dice & customize 3D skin | Allowed | Allowed |
| Trigger global campaign audio scene transition | Allowed | Local preview only |
| View campaign telemetry, radars, and unlocked achievements | Allowed (full ledger) | Allowed (party-visible ledger) |

## Acceptance criteria

- [x] `lw-dice-roller-tray`, `lw-audio-stem-mixer`, and `lw-achievement-card` implemented with separate `.ts`, `.html`, `.scss` files and exported in `shared/ui/public-api.ts`.
- [x] Backend .NET 10 endpoints provide cryptographic dice rolls (`RandomNumberGenerator.GetInt32`) with SHA-256 verification digests, adaptive audio scene presets, and live campaign analytics aggregation.
- [x] Dice Forge (`/dice`) renders 3D polyhedral meshes in Babylon.js with live PBR skin customization, tumbling physics animation, and Nat 20 / Nat 1 3D burst shaders.
- [x] Assets & Audio Studio (`/assets`) integrates a real Web Audio API multi-stem procedural synth and crossfade mixer alongside the organized map/3D/dice/spell asset catalog.
- [x] Campaign Analytics (`/statistics`) renders interactive play-style radars, damage-type bar breakdowns, combat MVP ledgers, and achievement cards.
- [x] All files remain under 500 lines (`check_source_limits.py`) and both `dotnet build` and `npm run build` succeed with zero warnings and zero errors.
