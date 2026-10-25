# Reusable Component Specification: <Component Name>

- **Selector:** `lw-<name>`
- **Classification:** Primitive / Domain view / Feature composite / Renderer adapter / External Angular Element
- **Shared consumers:** (list actual screens)
- **Owned module:** (location)
- **Status:** Proposed / Built / Verified
- **Existing reusable alternatives inspected:** ...

## Responsibility

What does this component render and own? What must it *not* own?

## Public API

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `data` | ... | Yes | — | Authorized view model |
| `config` | ... | No | ... | Supported display customization |

| Output | Payload | When emitted |
|---|---|---|
| `selected` | ... | ... |

- **Variants/sizes/tones:**
- **Supported CSS custom properties:**
- **Content projection slots (if any):**
- **Keyboard / ARIA semantics:**
- **Default, loading, empty, error states:**
- **Independent instance state vs shared feature state:**
- **Authorized DTO source and server-side revalidation:**

## Files to create/update

| File | Responsibility | Estimated lines |
|---|---|---:|
| `<name>.component.ts` | inputs/outputs and UI glue | ... |
| `<name>.component.html` | internal markup | ... |
| `<name>.component.scss` | encapsulated component styles | ... |
| `<name>.config.ts` | type definitions | ... |
| `<name>.component.spec.ts` | unit/interaction tests | ... |

## Instantiation example

```html
<lw-example [data]="authorizedData" [config]="displayConfig" (selected)="handleSelection($event)" />
```

## Acceptance tests

- [ ] Two simultaneous instances with different inputs and variants work independently.
- [ ] Parent page contains *no* selectors reaching into component internals.
- [ ] Different data updates do not leak cross-instance state.
- [ ] Inputs are typed, outputs are semantic and documented.
- [ ] Accessible with keyboard, screen reader and reduced-motion preferences.
- [ ] Sensitive inputs authorized server-side; no GM secret/data leak.
- [ ] Component is responsive and theme-compatible.
- [ ] Separate `.ts`, `.html`, `.scss` files and source-length check.
- [ ] If browser Custom Element export is needed: plain HTML consumer verified.
