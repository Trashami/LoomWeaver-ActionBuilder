# Native Babylon EffectBuilder

EffectBuilder now draws through Babylon.js 9.32.0. Its package and source contain no Pixi renderer dependency. The 3D VTT's saved-definition player imports the same runtime; it no longer guesses a spell from its name or substitutes a whole Fireball for an arbitrary fire layer.

## Shared runtime

`src/app/effects/babylon/native-frame.ts` evaluates deterministic geometry and emission samples for all 13 families / 65 variants, specialized Fireball layers, Mage Hand, and independently allocated Magic Missile bolts. The existing 25 spell templates and 40 casting/target presets use this evaluator.

`native-runtime.ts` binds those frames to a host Babylon Scene. It owns native meshes, shader materials, camera-facing batched particle geometry, tapered ribbons, grounded sigils, vertical barriers, a three-dimensional spectral hand, and up to four moving point lights. Graphics and materials run on WebGL; path evaluation and mesh-buffer updates run on the CPU. The runtime does not create another canvas, overlay a Pixi texture, or start its own render loop.

```ts
import { normalizeNativeDefinition, playNativeEffect } from './native-runtime';

const definition = normalizeNativeDefinition(savedJson);
const playback = playNativeEffect(
  scene,
  definition,
  () => caster.root.getAbsolutePosition(),
  () => selectedTargets.map(t => t.root.getAbsolutePosition()),
  { pixelsPerUnit: 66, lightGain: 2.4, elevationAt: terrainHeight },
);
// Also disposed automatically on completion or scene destruction.
playback.dispose();
```

One world unit is a five-foot square. The legacy design coordinate system uses 66 pixels per square. XY design paths become XZ world paths, with Y elevation. The editor uses a right-handed overhead camera to preserve its established left-to-right canvas coordinates. Host VTT scenes retain their own handedness, camera, depth buffer, shadows, tone mapping, bloom, and light budget.

The host supplies actual selected target positions; `missile.targets` allocates the three bolts to those slots, including repeated slots. If the host supplies one selected target, all bolts resolve to it. `elevationAt` supports terrain and multi-level travel; without it, elevation interpolates between the primary caster and target.

## Compatibility and editor controls

Schema version 1 is unchanged. Timeline trims, reorder, easing, opacity keys, motion, colors, light settings, hand paths, whip timing, summon descriptors, spell assignments and publication payloads remain editable. Existing JSON requires no resave. The VTT boundary also normalizes its older `type`, `primaryColor`, `startTimeMs` and `durationMs` shape.

The editor has overhead and 3D inspection views. Dragging tokens and hand waypoints converts screen coordinates through the camera to the ground plane. Its sample floor uses real Babylon normal-mapped lighting and bounded point-light shadows.

All ten blend choices are retained. Artistic modes capture the world plus preceding effect layers into native render targets and apply the blend formula in the material shader. Captures are capped at 1024 pixels on the longest edge; stacking many artistic modes costs additional scene passes. Depth testing remains active. Normal blending does not allocate a capture target.

The existing **2D** battlefield still uses Pixi. Its frozen compatibility renderer is now isolated under `Mythweaver.client/src/app/shared/legacy-effects`, so upgrading the standalone editor does not break the older host. The 3D VTT and EffectBuilder use the native runtime. The Maps editor is not replaced or deployed by this migration.

The rendering runtime is presentation-only. Combat resolution, NPC spawning, permissions and approved gameplay riders remain host/server responsibilities. A summon descriptor is preserved and previewed; rendering a JSON definition must not itself spawn an NPC or apply damage twice.

## Shared Angular dependencies

Install dependencies in `Mythweaver.client` before installing/building the standalone editor. The prebuild/prestart check aligns the six Angular runtime packages with that shared UI installation, validates exact installed versions, and never modifies the shared installation. This prevents duplicate Angular 22 DI contexts through package-export subpaths. Babylon remains an EffectBuilder dependency.

## Validation

- `npm test`: all native styles, complete catalog, legacy JSON, keyframes, timeline edits, missile allocation, whip continuity, path lighting, actual Babylon mesh buffers and repeated resource cleanup.
- `node scripts/preview-native.mjs`: isolated WebGL preview with a GPU catalog sweep, blend selector, seek and 3D view. Contains no account or campaign mutations.
- `npm run build`: standalone editor.
- VTT production build and main-app compatibility build.
- EffectBuilder API .NET build/publish.

Materials use layered organic noise, animated flame/smoke detail and emissive ribbons rather than flat circles alone. This migration is the common rendering foundation; bespoke texture/model art can continue to improve without maintaining separate Pixi and Babylon versions of each effect.


## Relief and ambient effects upgrade

The editor sample floor now uses a 180-subdivision, updatable ground mesh. A 256px
sample of its existing albedo supplies a derived luminance height field; this is
art-directed preview relief, not a physically measured displacement texture.
Height (0–0.45 world units) and normal strength (0–5) are independent controls.
Grid lines, token bases and native effect elevations follow that same surface.
The mesh is rebuilt only when the canvas dimensions, height setting or source
image changes. Normal shading remains GPU rendered.

3D inspection offers orbit, elevation, zoom and reset buttons while preserving
left-drag token/path editing. These preview controls do not change exported spell
JSON. Aura halo/orbit/vortex styles now include elevated helical ribbons and
spark satellites; sigils include counter-rotating broken rings and rising motes.
Flame mantles include textured smoke and hot embers. These shared improvements
apply to existing saved layers without a schema migration, including ambient
caster/target presets. Frame evaluation remains deterministic and CPU-side;
Babylon renders the meshes and shader materials on the GPU.


## Native utility spell rebuild

Thorn vine now uses an updatable, tapered 3D tube with procedural bark shading
and reusable conical thorn meshes. The original delayed whip choreography is
preserved; the tip tapers away from the caster and contact emits a brief seeded
botanical spark burst. Other lash variants retain their native ribbons.
Mage Hand uses the native finger/palm mesh with animated spectral veins, a
smaller readable default scale, smooth waypoint interpolation and colored trails.
All existing colors, size, choreography and path controls remain editable.

Misty Step stores optional `previewScene.teleport` choreography: enabled,
vanishMs, hiddenMs, appearMs and a normalized destination. The template starts
with caster and target close together and exposes a separate draggable destination.
Only the editor preview fades and relocates the caster; the target remains put.
Hold hidden freezes the visual timeline while hidden; Reappear now resumes at
the configured arrival. Timeline seeking remains deterministic. This metadata
is validated and exported, but does not execute teleportation in combat or move
host VTT actors. API validation and schema-v1 parsing accept older definitions
without this optional preview property.
