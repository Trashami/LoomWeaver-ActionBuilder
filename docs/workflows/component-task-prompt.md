# Copy/Paste Prompt: Build a Reusable LoomWeaver Component

You are building **one reusable Angular component** within LoomWeaver.

**Read first:** root `AGENTS.md`, `frontend/AGENTS.md`, `docs/architecture/component-system.md`, `docs/standards/reusable-angular-components.md`, and current relevant feature brief.

**Component or UI behavior requested:** `[INSERT]`

**Screens that will instantiate it:** `[INSERT ACTUAL CONSUMERS]`

**Task requirements:**

1. Inspect the existing components and use the best existing abstraction; do not fork page-specific lookalikes.
2. If needed, create one standalone Angular component with separate TS/HTML/SCSS, a typed config/view-model file and tests. Keep files focused and under repo limits.
3. Define `input()`/`input.required()` typed props, `output()` semantic events, optional `model()` for true two-way state. Verify Angular version support.
4. Make variants, presentation, styling, responsive behavior, loading and empty states owned by that component. Use LoomWeaver design tokens and CSS variables.
5. Page instances may supply data/config and handle events, but MUST NOT override nested component styles, copy the template, or manipulate internal DOM.
6. Verify two or more instances on different screens work independently using different props.
7. The server owns sensitive data filtering, role permissions and entitlements. Components never authorize access via `isGM`/CSS toggles.
8. Use Angular Elements (`@angular/elements`) only if cross-framework embedding is an explicit deliverable; when used, document attributes, DOM properties, `CustomEvent.detail` and independent styling.
9. Add tests for variants, changes to inputs, outputs, accessibility, instance isolation, unauthorized data absence, and responsive behavior.
10. Update the component spec and feature notes; report touched files and actual test outputs.

**Output before coding:** component API table, file list, planned instantiations and any necessary backend contract change. Then implement this single slice.
