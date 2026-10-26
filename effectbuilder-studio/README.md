# Effect Builder Studio

Independent Angular app for https://effectbuilder.loom-weaver.com.

## Development

```
npm ci
npm start
npm test
npm run build
```

The local editor runs on port 4310. Preview and JSON export work without a server.
Cloud saves, campaign assignment, community packs, and sign-in require the API.
Core buttons, icons, modals, and account services are reused from Mythweaver.client
at build time; the resulting deployment is self-contained and has its own web root.

## Composition

Each of seven layer types has five styles. Sparks include Twirl, Fire spray,
Drifting embers, Pushback blast, and Spark fountain. All 35 styles are procedural.
Motion includes direction relative to the caster-target path, cone, velocity,
twirl, turbulence, gravity, drag, lifetime, trail, and a deterministic seed.
Some controls are meaningful primarily for particle emitters (for example gravity)
or specific styles (for example cone for directed blasts).

Timeline eye buttons toggle layers without changing the selection. Hidden layers
retain their timing and do not shorten the composition. Drag a clip body to move
it; drag either edge to trim. Arrow keys nudge by 50ms, Shift by 250ms, and Alt
bypasses snapping during pointer drags. Start and duration fields are in the
timeline. Pointer and keyboard edits both support undo and redo.

Existing version-1 effects remain readable. Missing style and motion fields receive
defaults. New JSON includes `variant` and `motion` per layer. Preview frames are
deterministic functions of elapsed time, including during scrubbing.

## Independent production deployment

The companion API is `../EffectBuilder.server`. It validates the same JWTs as
LoomWeaver using the existing shared production settings, and reads the same
effect-library, assignment, and marketplace tables. It runs as `effectbuilder.service`
on loopback port 5002. The main API continues to serve account/campaign endpoints.

Only the effect-builder virtual host is changed. Releases are deployed to
`/var/www/effectbuilder/releases/<commit>` with a `current` symlink; neither
`/var/www/loom-weaver/client` nor the main backend assembly is overwritten.

From the repository root, after running both client and server checks:

```
dotnet build MythWeaver/EffectBuilder.server/EffectBuilder.server.csproj
dotnet run --project MythWeaver/EffectBuilder.server/tests/EffectValidation.Check.csproj
dotnet publish MythWeaver/EffectBuilder.server/EffectBuilder.server.csproj -c Release -p:UseAppHost=false -o MythWeaver/EffectBuilder.server/publish
git push -u origin <branch>
python scripts/deploy_effectbuilder.py deploy
python scripts/deploy_effectbuilder.py verify
```

The deployment script refuses to deploy a commit that is not already pushed to
the current branch. It preserves the prior Nginx config and previous release path.
This standalone release does not change the main VTT's bundled renderer. The
updated renderer in `src/app/effects/effect-renderer.ts` is the integration source
for a subsequent main-VTT build; old VTT builds use their existing base visuals
for newly styled assignments. Assignment JSON retains every style setting.


## Spell families and compositing
The studio has 12 families with five geometric variants each: beam, lightning, projectile, burst, aura, sparks, ring, cone, wall, cloud, sigil, and tether. These are visual building blocks; they do not change combat rules.
Each layer supports Normal, Add, Screen, Multiply, Overlay, Soft Light, Hard Light, Darken, Lighten, and Difference, plus independent opacity. Layers render in list order (later rows paint over earlier rows). Reordering changes the composite. Pixi advanced blend modes are registered by the shared renderer; preview and playBuiltEffect use separate Graphics objects per layer. Older JSON defaults to Normal at full opacity. Account saves, assignments, packs, and exports preserve these fields. The main VTT still needs to adopt this standalone renderer to display the expanded styles and blends.


## Whip choreography
Add a Whip layer or open the Verdant Thorn Whip starter. Thorn Vine defaults to green with pale thorns. Chain, Flame, Lightning, and Ribbon use the same core animation. The base stays at the caster; wind-up swings behind and overhead, strike extends to the target, impact flashes, then the rope retracts. Reach 1 contacts the target; other values intentionally shorten or overshoot. Backswing, overhead height, curl, thorn count/size and four relative timing weights are stored under layer.whip. Timing weights divide the timeline duration; each stage has a positive lower bound. Defaults preserve older JSON. Motion direction rotates the whole whip path. Size changes lash thickness; seed/turbulence customize Lightning. Thorn controls apply to Vine. Visual contact does not roll attacks or move combat tokens. Main VTT renderer adoption remains separate.


## Motion easing and opacity keys
Select a layer and set Motion in the timeline to Linear, Ease In, Ease Out or Ease In/Out. Cubic easing remaps the layer's motion clock without changing clip duration. Existing JSON defaults to Linear.
The opacity graph below the timeline supports up to 32 diamond keyframes per layer. Add at the playhead, double-click the graph, or use Fade in / out. Drag horizontally for time and vertically for value; arrow keys adjust time by 50ms (Shift:250ms) or value by 5%; Delete removes the point. Numeric controls and per-segment easing are available after selecting a point. Snap uses 50ms; Alt bypasses snapping. Keyframes use normalized clip time, so moving a layer preserves the envelope and resizing stretches it. Opacity is evaluated on real clip time, independently of motion easing, and multiplies the layer opacity. Keyed layers replace the automatic overall fade; Reset restores it. Settings persist in JSON, cloud saves, campaign assignment copies and packs. Main VTT renderer adoption remains separate.


Whip motion revision: a single backswing drives a delayed traveling curl into a forward crack. The tip accelerates as the curl reaches it and immediately retracts on contact. Legacy hold values are accepted for import compatibility but ignored and normalized to zero; the hold slider is removed. Backswing, forward-cast, and retraction timing weights remain customizable.


## Caster and target collections
The starter library includes 20 caster buildup and 20 target aftermath compositions, in addition to the seven spell starters. Filter All, Spells, Caster, or Target, or search names, spell names and descriptions. Click a preset to open a copy; use its plus button to append the editable layers to the current spell (16-layer limit). Caster layers start at 0ms for 2400ms; target layers start at 850ms for 3200ms unless an individual impact layer has a shorter duration. Move/trim clips to align with the spell's release and hit. Every layer has an editable opacity envelope. Forward/side emitter offsets position twin hand effects and floor marks relative to the cast axis. Older JSON defaults offsets to zero. The collections include embers, smoke, wind, frost, lightning, poison, healing, radiant, necrotic and faerie effects, plus geometric hexes and a pentagram. These are visual presets, with no automatic rules or status changes. Main VTT renderer adoption remains separate.


## Magic Missile and draggable design scene
Open Arcane Magic Missile under Spells. Three magical wisps form above the caster, rise and curve along separate paths. Each bolt selects one of three preview target slots; repeated slots support 2+1 and 3-on-1 assignments. Select a bolt and click a target token, or use its dropdown. Drag any token, or nudge it with arrow keys (Shift for larger steps). Scene changes are undoable and saved as normalized previewScene positions. These are design targets, not actual campaign combatant IDs.
Magic Missile settings on the projectile layer control separate smoke color, persistence, opacity/spread, rise, curvature, launch spacing and small impact size. Main/Core colors tint the wisps. The renderer accepts ctx.targets for runtime endpoint mapping; the main VTT still needs to adopt the updated renderer and supply combat targets. No combat damage or target permissions are changed here. Short timeline clips scale launch spacing so all bolts complete. Smoke is sampled at deterministic emission times, so seeking and replay produce the same scene. There are now eight spell starters and 40 caster/target presets.

## Renderer and spell catalog
All effect families and layer compositing use the same WebGL-only Pixi renderer. It requests high-performance power preference and rejects major-performance-caveat WebGL contexts rather than silently using Canvas/software fallback. Renderer status and a recoverable initialization error are visible in the preview. Browser/driver settings ultimately control physical hardware; path/particle calculations still run in JavaScript on the CPU. The static grid rebuilds only on resize or visibility changes. WebGL is intentional for advanced blend-mode compatibility; WebGPU/compute particles remain future work.
The reusable core mw-spell-picker searches /api/spells with server-side search and pagination, so no initial-page cap or character-known-spell filter restricts selection. In Effect controls, Browse spell catalog sets design metadata. Assign to a spell independently chooses any catalog spell, then stores the existing campaign/character-scoped effect copy under the canonical catalog name. Reuse the same effect for multiple spell assignments. Existing assignment permissions and name-based VTT lookup remain unchanged.

## Viewport workspace and shader fire hit
The editor uses the viewport height with independent library, inspector, and timeline scrolling. Desktop shows three columns; screens below 1100px switch between Preview, Library, Layers, and Controls. Phone chrome keeps Add layer and Save visible and groups secondary commands in Actions. Add layer is also in the timeline heading and opens the existing shared modal with labeled choices. Opacity animation is an expandable timeline section. The preview scales FX to both available width and height. Ground on/off supplies a GPU-drawn neutral floor for inspecting light and shadow.
Target collection > Inferno Impact is a new editable fire-hit preset (49 presets total, 21 target presets). Add layer > Fire hit appends its burst layer to an existing composition. FireHitMesh uses a single reusable quad and GLSL fragment program for procedural flame/noise, density-derived smoke shading, embers, impact flash, shock ring, local ground illumination, contact shadow and fading soot. Main, Core and Smoke colors, smoke density, light intensity, shadows, turbulence, ember brightness, size, duration, seed, opacity keyframes and blending are editable. The program is built into the client; JSON contains bounded settings, never executable shader code. CPU work supplies uniform values; procedural pixels are evaluated on the GPU. Geometry and shader resources are released on removal or renderer changes. Existing 65 styles remain compatible.
Lighting/shadows are an analytic local preview treatment, not map geometry, ray tracing or VTT wall occlusion. Main VTT adoption of the standalone renderer remains separate. WebGL is required; this shader has no Canvas fallback. Visual verification includes actual browser shader compilation, orange/blue palettes, mobile panel navigation, layer creation, and viewport bounds at phone/desktop sizes. Automated checks cover JSON roundtrip, settings bounds, family restrictions, mesh reuse/replacement and strict server validation.

## Fireball material foundation
Fireball / Pyroclasm (and the updated Cinderheart starter) contains a caster layer at 0–1050ms, a projectile at 650–2650ms, and impact at 1850–5250ms. Contact is at 60% of the projectile clip; its remaining time lets smoke and embers dissipate. Manually changing clip lengths requires aligning the impact start with the new contact time. Furnace Invocation and Pyroclasm Impact are separate caster/target presets. Add layer supports the complete sequence or individual fire material phases. Existing saved user designs and other effect families retain their original compatible rendering.
The shared TexturedParticleBatch uses fixed pools and Pixi ParticleContainer for position/color/scale buffers. A reference-counted 256×64 premultiplied RGBA atlas supplies organic smoke, soft glow, streak and debris textures; texture baking happens once on the CPU, not every frame. Texture sampling, batching, flame/ribbon shading, bloom and background refraction run on the GPU. Particle positions and uniform timing are CPU calculations, not GPU compute simulation. Each material allocates at most 80 smoke, 96 spark and 24 debris particles; Particle budget selects active smoke/sparks. Materials share the atlas and release it when the last user is destroyed. Meshes, uniforms and texture objects are reused across frames.
FireTrail builds a tapered strip with animated breakup and twisting shader filaments. FireHitMesh supplies role-specific shaded fire and smoke. FirePostFilter adds bounded highlight bloom and samples the actual back buffer for heat shimmer. It inherits renderer pixel density to avoid background scaling artifacts; refraction requires normal layer blending, while other blend modes retain the flame/bloom treatment. It is a local treatment around the head/impact, not a full-screen camera effect.
Moving target and Wall test are deterministic designer preview controls. Walls are finite normalized segments (maximum 8), saved with the scene. Curved-path collision uses a bounded 64-segment sweep and chooses first contact. The projectile ends there and the impact/ground marks occur there. Moving targets use an intercept at contact time and aftermath remains at that hit point. The optional EffectWorld context supplies pixel-space walls and time-indexed targetAt(timeMs) positions to EffectCompositor/playBuiltEffect; flight metadata links projectile arc/arrival to impact. With no time-indexed history, runtime impact anchors freeze on first activation. These hooks are not yet connected to the main live VTT scene. Wall-cast light/shadows and true scene-depth occlusion are still separate integration work; token overdraw, density shading, local contact shadows and temporary soot are implemented in the standalone renderer.
Visual checks exercise actual GL shader compilation, caster/flight/impact phases, phone layout, moving-target interception and a wall hit. Unit checks cover phase alignment, material JSON bounds, first collision, deterministic movement and atlas pixels, premultiplied edges, shared texture lifetime and renderer reuse. The material infrastructure is reusable for subsequent element families; this release upgrades Fireball, not every legacy style at once.

## Summoned actors

In Effect controls, open **Summoned token**. Choose a campaign and an NPC stat sheet, browse token artwork or upload a private PNG/JPEG/WebP (2 MB maximum), then set appearance time and size. Add the summon and assign the effect to a catalog spell in the same campaign. At cast time, choose an empty battlefield space. The animation plays for the scene and the server creates one NPC-linked, caster-controlled token at the configured time.

Preview, scrubbing, JSON export, and replay do not create battlefield tokens. NPC stats are resolved on the server. Players can configure their own campaign NPCs; campaign GMs can configure campaign NPCs. Campaign-default assignments can therefore supply GM-approved creatures to players. Private uploaded artwork is served only to its owner and members of a scene where that artwork is used. Campaign NPC links must be removed before publishing a visual effect pack.

Initial scope: one token per cast; dismissal, concentration-based removal, and independent cloned sheets are not automated. Summoned tokens use the existing linked-sheet vitals behavior. Accepted cast IDs are persisted to prevent duplicate creation on retries; a server crash during a pending cast requires a new cast rather than replaying that ID.

## Cinematic materials

All 65 styles now use persistent GPU material layers: a noise-shaded volume where appropriate, an animated surface/bloom pass on the authored silhouette, and fixed textured mist/mote batches. Fireball retains its dedicated flame, heat-refraction, debris, and ribbon pipeline. Caster and target presets inherit the upgrades automatically. Existing colors, blend modes, opacity keys, seeds, clip timing, directions, and authored paths remain usable. CPU code computes deterministic trajectories and particle transforms; WebGL performs rasterization, shader shading, compositing, and particle drawing. These materials do not add wall collision, token occlusion, or scene lighting to families that did not already support them.

## Workspace layout

On desktop, drag the vertical grips to resize either sidebar and the horizontal grip to divide the preview and composition. Arrow keys adjust a focused grip; Shift uses a larger step, Home/End use its limits, and double-click restores its default. Each pane has a collapse/expand button. Reset layout restores all defaults. Layout is remembered in this browser independently of spell definitions and account saves. Compact screens retain the full-panel tabs, so desktop collapse preferences cannot hide mobile controls. The preview canvas observes its container and resizes with the layout.

## Surface lighting

Every visual layer supports an optional `lighting` object. Legacy layers receive enabled defaults when imported. Brightness, radius in feet, height in feet, softness, flicker, and an independent or effect-matched color survive save/export and marketplace validation. Lighting follows the production motion samplers and keyed opacity; hidden layers emit no light.

The preview defaults to curated dungeon pavers with their matching authored normal texture (`public/lighting`). Ambient and bump strength are preview controls. A 512-world-pixel texture period keeps albedo and normals registered when resizing. The shared GPU lighting engine shades diffuse, specular and crevice response; these are surface-detail shadows, not geometry ray-traced shadows.

Battlefield uses the same bounded scene light pool for Effect Builder playback, preserving existing fog and vision layers. Current Battlefield map records contain only albedo, so their surface gradients are derived on the GPU. The base map remains unchanged when no spell lights are active. Concurrent casts share a maximum of 16 lights, selected by strength, and release contributions on completion or scene teardown.

`npm test` checks light migration, bounds, paths, repeated missile targets, hidden/keyed opacity, scaling and pool cleanup. `node scripts/preview-spells.mjs` builds an isolated WebGL test page in `dist/spell-preview`; it never accesses account data or drafts. Serve that directory locally to compare lighting and bump shading across all 25 templates.

## Complete layer catalog

The Add a layer dialog uses the shared OptionGrid component with searchable green cards and category filters. It exposes all 65 core styles, 10 special effects (including Magic Missile), 25 spell templates, and 40 caster/target presets. Composition options show disabled states when their actual layer count exceeds the remaining slots. The 16-layer composition limit is unchanged.

All entries use the existing production WebGL compositor: arcane textured batches/shaders for core styles, dedicated materials for fire, spectral hands and cinematic effects. CPU code still computes deterministic trajectories; GPU rendering does not mean every animation calculation runs on the GPU. No Canvas effect fallback was introduced.

Run `npm test` for catalog coverage and serialization. Run `node scripts/preview-spells.mjs --catalog`, serve `dist/layer-preview`, and use Validate all 140 to exercise all catalog definitions at four timeline positions with real production WebGL materials, without reading account data or drafts.
