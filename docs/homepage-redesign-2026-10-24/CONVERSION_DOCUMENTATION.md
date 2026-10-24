# Conversion extension: design documentation

Date: 24 October 2026. Scope: the ordinary homepage extension in CONVERSION_AND_SEO_BRIEF.md. This records the implemented source after CONVERSION_FINISH_REVIEW.md returned `disposition: ship` within that extension's review boundary.

## Authority and documentation decision

The existing visual world remains "A confirmed reservation". PRODUCT.md, DESIGN.md, the retained brand guide, the editorial standards and the five-block contract in BRIEF.md retain their existing authority. The demo agenda, trial band, case excerpt and bottom guide extend this homepage; they establish no global restyle.

DESIGN.md receives two descriptive corrections: the tonal reading panel now holds the published case excerpt, and the mobile action also yields to the demo and guide-end request zones. Its frontmatter, canonical section order, named rules and design tokens are preserved. `.impeccable/design.json` is preserved because this pass neither regenerates the world nor changes its primitives, narrative rules or preview components. PRODUCT.md is preserved; this pass establishes no additional product fact independently of the implementation and its supplied brief.

## Implemented extension

| Pattern | Source evidence | Relationship to the incumbent system |
| --- | --- | --- |
| Hero offer and request | `versions/v1/homepage.mjs:62` | Keeps the authored headline, photograph, labelled arrival example and pink pill. Category copy and the trial note clarify the existing request path. |
| Published case excerpt | `versions/v1/homepage.mjs:54`; `versions/v1/public/homepage.css:145` | Reuses the founder-adjacent tonal panel, its surface radius and underlined route link. The excerpt names an existing glamping case and carries no numerical outcome claim. |
| Demonstration agenda | `versions/v1/homepage.mjs:58`; `versions/v1/public/homepage.css:148` | Uses the existing workflow surface, Inter Tight/Inter hierarchy, flat layout and drawn SVG icons. The four checks cover booking, readiness, connections and launch cost. |
| Trial band | `versions/v1/public/homepage.css:159` | Reuses the tab-surface color and surface radius. Its local title and supporting text are a page-specific composition, not new type or color tokens. |
| Visible reading guide | `versions/v1/homepage-guide.mjs:3` and `:38`; `versions/v1/public/homepage.css:162` | Eight server-rendered topics with descriptive HTML links use the existing paper, plum text, underlines and standard request action. The guide follows the complete conversion close. |
| Local action visibility | `versions/v1/public/homepage.js:26` | Extends the existing observer's action zones to include the demo copy and guide end. The request helper remains the established `data-open="audit"` action with demo context (`homepage.mjs:8`). |

The demo uses two equal columns with a gap of (88px), tightening to (32px) at the existing (1000px) breakpoint. The trial band spans both columns and uses (26px) padding. At the existing (700px) breakpoint, both become single-column content and the demo action fills its container.

The guide has a desktop contents rail (260px), a reading column capped by a grid track (760px) and a reading measure (72ch), with a gap of (64px). The rail sticks below the header at (110px). At up to (1000px), the rail becomes (200px) with a gap of (36px). At up to (700px), it becomes ordinary contents above the copy, with two columns of links. Guide body text uses (17px / 1.75), then (16px / 1.75) on mobile. These values describe this Read region; they do not replace the incumbent body token.

The guide-end request uses the existing soft surface, surface radius and pink pill. New regions add no runtime dependency or motion vocabulary. Their section headings participate in the already recorded section-heading enhancement; visible HTML remains the baseline. Shared forms, consent, delivery handlers, pricing routes and CRM remain outside this documentation pass.

## Comparison with the supplied evidence

This pass read the implementation, PRODUCT.md, DESIGN.md, the sidecar, BRIEF.md, CONVERSION_AND_SEO_BRIEF.md, QA.md, CONVERSION_AND_SEO_QA.md, CONVERSION_FINISH_REVIEW.md and `conversion-review/measurements.json`. It did not open a browser, inspect screenshots independently, run tests or alter release state.

The finish reviewer reports that all 13 required captures were read. Those are viewport-region evidence at nominal widths of (1440px), (768px), (390px) and (320px), not full-page captures or an approved comp. The reviewer found the retained typography, material, colors, first viewport and native devices consistent with the direction contract. The extended story and form remain disclosed code-led adaptations. The case panel and guide-end panel received source review only; the opened guide-end form is captured.

The supplied measurements report 1,254 words in the guide reading column, no recorded heading issues and equal scroll/client widths at each measured size. Their actual client widths are (1425px), (753px), (390px) and (305px), respectively. QA records the desktop contents position, mobile contents layout, form opening and empty validation, and checks of the 18 guide destination URLs on authenticated staging. Those destination checks do not establish deployment of this homepage revision or end-to-end function of the linked tools.

The guide and trial copy preserve registration after request confirmation, a 14-day period beginning with account creation, and paid continuation. Setup and migration terms remain agreed separately. The source keeps integration checks, development-status references and the calculator's financial limits. QA reports no U+2014 in rendered HTML and no altered consent or delivery code. This documentation adds no public copy or claims.

## Drift and limits not canonized

The older brand guide's serif recommendation, literal grid and larger card radii remain documented incumbent differences. The compact homepage's existing Inter Tight exception is retained. The local guide sizes and trial title tracking are observed surface decisions; they are not promoted to global type tokens. Inherited shared form styling and small shared text retain their original authority. The finish review records no material fix within this extension; it does not attest a separate world-card ceiling, unavailable Impeccable launcher/detector results or approved-comp fidelity.

No browser checks were repeated by this documenter. The existing QA limits remain: no successful lead delivery, payment acceptance, analytics ingestion, screen-reader certification or interactively emulated reduced-motion/no-JavaScript mode is established. No staging deployment of the changed homepage, owner approval, production publication, ranking uplift or conversion uplift is asserted. Release verification remains separate.
