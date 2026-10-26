# Feature: Stage 6 — Real-Time SignalR Table Sync, JWT Auth & Stripe 85/15 Checkout, and Deepened Studio Engines

- **Slug:** `stage-6-realtime-auth-checkout-and-deep-studios`
- **Status:** Verified
- **Module owner:** `core/services`, `features/characters`, `features/maps`, `features/effects`, `features/marketplace` / `LoomWeaver.Modules.Realtime`, `LoomWeaver.Modules.Auth`, `LoomWeaver.Modules.Characters`
- **System support:** D&D 5e (`dnd5e`), Pathfinder 2e (`pf2e`), Vampire V5 (`vampire_v5`)
- **First written / Last updated:** 2026-10-25
- **Authoritative code paths:**
  - `backend/src/LoomWeaver.Domain/Stage6Contracts.cs`
  - `backend/src/LoomWeaver.Modules/Realtime/TableRealtimeHub.cs`
  - `backend/src/LoomWeaver.Modules/Realtime/TableRealtimeEndpoints.cs`
  - `backend/src/LoomWeaver.Modules/Auth/AuthAndCheckoutEndpoints.cs`
  - `backend/src/LoomWeaver.Modules/Characters/CompendiumAndStudioEndpoints.cs`
  - `frontend/src/app/core/services/table-realtime-sync.service.ts`
  - `frontend/src/app/core/services/auth-session.service.ts`
  - `frontend/src/app/shared/ui/live-table-presence/`
  - `frontend/src/app/shared/ui/compendium-importer/`

## User story

As a GM, Player, or Creator, I want:
1. **Real-Time SignalR & Multi-Tab Table Sync**: Live WebSocket (`TableRealtimeHub` at `/hubs/table`), HTTP event stream, and browser `BroadcastChannel` synchronization so VTT token movements, authoritative dice rolls, and audio crossfades broadcast across connected player seats in real time.
2. **JWT Authentication, Persistent User Accounts & Stripe 85/15 Checkout**: Sign in or switch between persistent GM/Creator and free Player accounts (`Trashami`, `Dal`, `Fivi`, `Kildrid`, `Kycius`, `Munk`) with HMAC-SHA256 JWT tokens, role/witness auto-scoping, and Stripe Connect 85/15 split checkout receipts.
3. **Deepened Studio Capabilities**:
   - **5e SRD & Canon Compendium Importer** (`lw-compendium-importer`) in Character Studio.
   - **Advanced Terrain Heightmap & Biome Brush Sculptor** in LoomMaps (`/maps`).
   - **Custom Particle Emitter Curve Controls** (emission rate, gravity, cone angle, scale curve) in EffectBuilder (`/effects`).

## Acceptance criteria

- [x] `TableRealtimeHub` (`/hubs/table`) and `/api/v2/campaigns/{campaignId}/realtime/*` endpoints broadcast and persist live table events and seat presence.
- [x] `AuthAndCheckoutEndpoints` issue HMAC-SHA256 signed JWT tokens, manage persistent user accounts, and execute Stripe 85/15 split checkout settlements.
- [x] `CompendiumAndStudioEndpoints` provide 5e SRD + Icrandor canon search/import, heightmap biome sculpting, and custom particle emitter curve presets.
- [x] All files remain under 500 lines (`check_source_limits.py`) and both `dotnet build` and `npm run build` succeed with zero errors.
