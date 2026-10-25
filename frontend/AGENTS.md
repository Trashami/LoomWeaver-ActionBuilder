# Frontend-specific instructions

Follow the root `../AGENTS.md`, `../docs/standards/angular.md`, `../docs/standards/reusable-angular-components.md` and `../docs/architecture/component-system.md`.

- Build reusable standalone Angular components for cards, panels, editors, dialogs, controls and inspectors. Every instantiation is configured via typed input/model properties and output events; do not fork markup, alter child DOM, or customize child internals with page-specific CSS.
- Keep Angular components and templates presentation-focused, and domain logic in typed services/stores.
- Components own their `.scss`/`.css`, responsive behavior and variants; route pages own only placement/layout. Use shared LoomWeaver design tokens.
- Export Angular components as browser Custom Elements only when non-Angular hosts explicitly need them. Follow `docs/architecture/angular-elements-interop.md`.
- Keep Babylon editor/rendering logic in `features/maps/engine/`, independent of Angular component lifecycles where practical.
- Render only authorized DTOs from .NET; never infer secret authorization from client-side flags.
- The Loom launcher must be available from the global shell on every route, even if The Weave feature toggle is off.
- Every editor action should be undoable/replayable where feasible, using stable IDs and versioned commands.
- Build responsive, keyboard-accessible controls consistent with the shared dark emerald/gold design language.
- Separate `.ts`, `.html` and style files; don't create giant inline templates.
