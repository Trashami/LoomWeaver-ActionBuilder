# Public discovery, SEO, and landing images

Status: locally implemented; build and generated-output verification recorded below. No production deployment or Google account changes are part of this revision.

Requirements consulted: root and frontend AGENTS, reusable component standards, component system/catalog, site architecture brief, Obsidian Product Vision and Product Goals and Release Gates. Preserve emerald/raven/gold branding, free player participation, server authorization, and truthful V2 release status.

## Implementation

- Shared app header has a public variant with the same brand tile and visual language; campaign/search/private user controls remain in the studio variant.
- Every marketing section has replaceable project artwork. Product previews and section banners have independent folders; see the public landing-assets README.
- Shared JSON supplies route titles, descriptions, canonical URLs, feature status, FAQs, image references, and structured data to Angular and build-time HTML generation.
- Public studio subdomain pages do not force a login dialog or use crawler user-agent exceptions. Explicit login/register and guarded tools still require authentication.
- Login/register metadata agrees before and after Angular startup and uses noindex. They are excluded from the sitemap. Public About page identifies this project's official domain without claiming resolution of a trademark dispute.
- Frontend prebuild and postbuild hooks enforce static generation. The script fails if expected build output is missing.
- Static pages link to product pages and About; app studio pages remain CSR. This is static rendering plus CSR, not Angular runtime SSR/hydration.

## Google account actions remaining

These cannot be performed by local code. No account submission or external publication was made.

1. In the DNS-verified Domain property for loom-weaver.com, confirm sitemap success after deployment.
2. Inspect each sitemap URL separately; test the live URL and compare declared and Google-selected canonicals.
3. Request indexing after production validation, then monitor the Pages and Performance reports.
4. Add verified social profile links to the organization sameAs list and those profiles' website fields. No Facebook URL was supplied, so none was invented.
5. Publish genuine demonstrations and project updates to authorized profiles when ready; image folders currently contain illustrative project artwork.
6. Submit feedback on the actual incorrect Google AI Overview: "This answer appears to combine two different LoomWeaver projects. The LoomWeaver project described by my original post uses https://loom-weaver.com/. The linked loomweaver.app site is a different project. Please review the source attribution and destination link." Include the original post URL and affected Google result. This is an attribution correction, not a legal determination.

## Production follow-up

Verify HTTPS status/redirects, initial HTML, selected canonical, robots headers, sitemap, auth entry and unknown URL 404 behavior on the actual server. The local deployment template now adds noindex headers to known studio routes and returns 404 for unknown routes. It has not been executed or validated by production nginx. Subdomain configuration still requires live verification. Root feature canonicals intentionally consolidate subdomain introductions onto the main domain; independent subdomain ranking is not guaranteed.

## Verification

Run `npm run build` in frontend, `dotnet build backend/src/LoomWeaver.Api/LoomWeaver.Api.csproj --no-restore` at V2 root, `python scripts/verify_public_routes.py`, and `python scripts/check_source_limits.py`. No ranking, indexing, or AI attribution outcome can be guaranteed by these checks.

### Local results

- Frontend production build passed; existing optional-chain/unused-import warnings remain in world-atlas and campaigns.
- Backend build passed with `--no-restore` (zero errors/warnings); normal restore was unavailable in the restricted environment.
- Generated HTML validation passed for 12 canonical pages and 7 aliases, including schema, image files, navigation, and sitemap policy.
- Browser checks at desktop and 390px mobile widths: no horizontal overflow; all eight Angular landing sections contain images; mobile menu opens; explicit Sign In opens authentication; VTT navigation changes title/canonical correctly.
- Source-size check is blocked by pre-existing `effectbuilder-studio/src/app/effects/babylon/native-frame.ts` (686 lines) and `native-runtime.ts` (708 lines). Modified source files remain below 500 lines.
- Google font inlining is disabled for reproducible builds without network access; browser font links and fallback fonts remain.
