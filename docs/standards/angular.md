# Angular / TypeScript Standards

## Structure

- Organize by **feature and concern**, not one root-level directory of all components/services.
- **Component-first rule:** implement repeatable UI once as a standalone Angular component. Configure every instance with typed `input` properties, `model` only when bidirectional editing is needed, and semantic `output` events. Keep default behavior and variants in the component. See `docs/standards/reusable-angular-components.md`.
- A page may arrange component hosts, but must never duplicate child template markup, reach into its internals using CSS selectors, or mutate its DOM to create a different variant.
- An Angular component is not automatically a browser Custom Element. Use Angular Elements only for intentional external embedding; see `docs/architecture/angular-elements-interop.md`.
- Angular standalone presentation components use separate TypeScript, HTML and SCSS/CSS files; follow actual repository naming convention consistently (`*.component.ts` if already used; modern Angular examples may use `*.ts`).
- Co-locate component tests. Prefer `inject(...)`, signals/computed for local reactive state, and RxJS for asynchronous streams when appropriate.
- A component owns its view and user interaction. Extract pure transformations, rules, asset loading, Babylon rendering and API calls.
- Do not import `@babylonjs/*` broadly into character, campaign or marketplace UI components; renderer internals belong to map/dice/effects engines.

## Layer examples

```text
map-editor.component.ts / .html / .scss
  -> MapEditorStore
  -> SceneCommandBus
     -> TerrainSculptService / ScatterBrushService
     -> BabylonSceneRenderer
  -> MapsApiClient -> .NET API
```

- Use typed DTOs generated from versioned OpenAPI/JSON Schema where available.
- Keep UI stores separate from persistence and visual renderers.
- Prefer standalone focused editor dialogs/panels, keyboard interactions and accessible labeling.
- Defer heavy map libraries via route splitting; dispose scenes, listeners, workers and GPU resources when no longer used.
- CPU-heavy procedural mesh/scatter work can use Web Workers; UI and Babylon scene updates need appropriate coordination.

## Performance and quality

- Avoid unnecessary change detection from high-frequency Babylon render loops; isolate rendering from Angular zone where appropriate.
- Do not store whole GLB, texture buffers or enormous scene graphs in Angular reactive state.
- Use cancellation and sensible caching for asset/API loading.
- Use command objects for undo/redo; make random scatter deterministic via seeds.
- Implement screen-size and 2D fallback accessibility; preserve complete core functionality on low-end devices.

## Tests

- Component interaction tests for toolbar/form states.
- Pure algorithm tests for snapping, transforms, seed determinism and error handling.
- API client tests for authorization failures, conflict handling and validation errors.
- E2E for cross-screen Loom access, quality-profile switching, player-safe views and editor save/reload.

## Reference

Official Angular style guide: https://angular.dev/style-guide
