# Replaceable landing images

All paths below are relative to `frontend/public/landing-assets/`. Replace a file with another image of the same format and filename, then rebuild. No template changes are needed. Keep licensed/private creator assets out of this public folder.

| Folder/file | Placement | Suggested size |
| --- | --- | --- |
| `brand/logo-wordmark.png` | Shared public and studio header wordmark | Transparent PNG, 600 × 180 |
| `brand/raven-emblem.png` | Raven overlay and footer | Transparent PNG, 1024 × 1024 |
| `hero/hero-wallpaper.png` | Hero background | 1920 × 1080 |
| `hero/scene.png` | Hero illustration | Landscape PNG, approximately 16:9 |
| `sections/why/image.jpg` | Why LoomWeaver | 1600 × 500 |
| `sections/features/image.jpg` | Core features | 1600 × 500 |
| `sections/experience/image.jpg` | Interactive experience preview | 1280 × 720 |
| `sections/pricing/image.jpg` | Plans | 1600 × 500 |
| `sections/marketplace/image.jpg` | Creator marketplace | 1600 × 500 |
| `sections/faq/image.jpg` | FAQ | 1600 × 500 |
| `products/<page>/preview.jpg` | Route-specific spotlight and static hero | 1280 × 720 |
| `engines/engine-1-vtt-combat.jpg` | VTT engine card | 1280 × 720 |
| `engines/engine-2-loom-weave-graph.jpg` | Campaign memory engine card | 1280 × 720 |
| `engines/engine-3-loommaps-atlas.jpg` | Maps engine card | 1280 × 720 |
| `engines/engine-4-dice-shader-fx.jpg` | Dice/effects engine card and social preview | 1280 × 720 |

Product folders: `home`, `vtt`, `campaign-manager`, `battlemap-builder`, `effect-builder`, `encounter-builder`, `3d-assets`, `ai-campaign-assistant`, `features`, `about`, `login`, `register`.

The section and product folders are seeded with existing project artwork, not newly captured screenshots. Replace them independently. Keep key subjects near the center because images crop responsively. Use descriptive alt text when replacing an illustration with a real screenshot.

Image paths are configured in `src/app/features/landing/landing-assets.json` and `landing-seo-pages.json`. Those files are shared with the static HTML generator. If you change a filename or format, update the corresponding path there. The shared `lw-section-image` component owns sizing, loading and borders.

Every frontend `npm run build` now regenerates public HTML before compilation and creates route HTML and the sitemap afterwards. Copying new files to this source folder alone does not change a deployed website.
