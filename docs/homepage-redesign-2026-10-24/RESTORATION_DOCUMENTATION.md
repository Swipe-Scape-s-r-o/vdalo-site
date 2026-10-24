# Documentation of the restored full homepage

Date: 24 October 2026. Scope: descriptive reconciliation after the full homepage restoration and the five material fixes in `RESTORATION_FINISH_REVIEW.md`.

The owner rejected the shortened structure. `RESTORATION_METAPROMPT.md` now supplies the homepage sequence; the five-block direction contract in `BRIEF.md` continues to supply the pinned VDALO world, with its former STORY superseded. This is a local extension from existing code, without a replacement identity or approved-comp claim.

## Records updated

- `DESIGN.md` now names the restored full homepage and records the real order: hero, original night simulation, five pains, channels, direct bookings, calendar, nine modules, three roles, five guest stages, late-arrival case, pricing, founder, approach, launch, demo, FAQ, final request and visible guide.
- The layout table records actual section/heading IDs. Restored sections own their anchors; `#next-step` is the explicit boundary immediately before `#demo`. The old homepage-script anchor remapping is absent.
- Typography records the current hero desktop clamp `clamp(40px, 3.9vw, 56px)`, the retained tablet override `clamp(34px, 4.8vw, 56px)`, and the final mobile override `clamp(26px, calc(8.8vw - 2px), 56px)` with line height 1. The superseded mobile size and narrow measure are identified as inactive.
- Motion records the actual onboarding, price, arrival and hero targets. Repeated heading fades are removed. Shared pointer panel feedback and the existing night scenario are described as inherited behavior, with their separate reduced-motion limits.
- The obsolete four-role compact tab component entries and sidecar preview were retired. The actual nine-module, three-role and five-stage tab sets retain shared `app.js` handlers and their local restored styles. No claim remains that all hidden panels become readable without JavaScript.
- `.impeccable/design.json` has the restored title, synchronized narrative, actual quick-link destinations, corrected motion descriptions and the module/night breakpoints. Palette metadata, its preview ramps, Inter families, radii and spacing remain intact. The only numeric typography-token correction is the implemented desktop hero size.

## Source reconciliation

The documentation pass read `PRODUCT.md`, the direction brief, restoration contract, QA and independent finish-review record. It sampled `versions/v1/homepage.mjs`, `homepage-guide.mjs`, `experience.mjs` and `render.mjs`; `public/homepage.css`, `homepage.js`, shared `app.js`/styles; and desktop/mobile living-hotel source.

Source includes the four implementation corrections requested after the persistence finding: local module navigation says “Бронювання на сайті” and “Повідомлення гостям”; the mobile night scene has a viewport cap below the header; redundant diagram labels are stripped from homepage output; and the communication timeline has a scoped removal of its inherited side stripe. Documentation does not independently assert the final visual verdict for these changes.

`pricing-core.js` remains the price and module-status authority. No prices, availability states, brand colors, type families, canonical logo rules or shared component implementations were changed by this pass. The older `data-homepage="compact-v1"` compatibility attribute remains source history; `restored-full-v3` describes the current revision.

## Evidence and limits

`RESTORATION_QA.md` and `restoration-review/` supply the prior 320/390/768/1440 measurements, viewport/region captures and functional results. Their responsive record reports no page-level horizontal overflow; the 768px hero occupies three lines, with two lines at the other supplied widths. Captures show moments of the night animation rather than every state. The reviewer documented the original mobile control clipping, and the source now carries the requested fit correction; fresh captures and the next verdict remain the parent's review responsibility.

This pass ran no browser, renderer, launcher, tests or deployment. Reduced motion is described from source because system-mode emulation was unavailable in the supplied QA environment. Actual lead delivery, analytics, conversion change, owner approval and production publication are not established here.

## Drift not canonized

The retained brand guide's older serif recommendation, grid and larger radii were not globally reconciled. Small inherited shared text and unused compact CSS remain existing drift, not new system prescriptions. The retired compact tab preview, redundant diagram labels and communication side stripe are not reusable house rules. The restored night illustration is an expressly requested existing interactive component, not a mandate to copy its dark internal palette or depth across the site.

Documentation is complete for the restored local artifact. A fresh finish verdict and staging publication/inspection follow in the parent workflow; main still requires the owner's staging review and confirmation.
