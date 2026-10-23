disposition: fix

## persistence

Fail. `PRODUCT.md` exists and matches the product constraints. `RESTORATION_METAPROMPT.md` and `RESTORATION_QA.md` explicitly supersede the rejected shortening brief and define this as a code-led extension of the pinned world, so no approved comp, comp-diff or comp-build state is required. The inherited five-block direction and unavailable-seed fallback are recorded in `BRIEF.md`; no raw seed key is committed. `DESIGN.md` still names and documents the rejected compact homepage, including obsolete structure, anchors, motion targets and hero sizes. Reconcile it with the final restored implementation before handoff.

The required viewport and region captures are present. Corrected `desktop-problems.png` and `desktop-problems-lower.png` now cover all five pain cards. The parent-supplied `mobile-night-settled.png` supersedes the transient composition in `mobile-night.png`. The 320/390/768/1440 measurements record zero external overflow. Functional results, four targeted passing tests and zero console errors are supplied QA evidence; this reviewer inspected files and images and did not run a browser, server, renderer or detector. Reduced motion was reviewed in source, without system-mode emulation.

## fidelity

| Element or promise | State | Evidence |
| --- | --- | --- |
| TYPE / OWN-WORLD | match | Inter Tight headings and Inter interface/body text preserve the pinned compact, heavy lettering; hierarchy stays legible in desktop, 390, 320 and 768 captures. |
| MATERIAL | match | Hospitality photography, the canonical raster wordmark, real founder portrait and practical UI examples are visible. The existing animated SVG night scene is explicitly restored by the user's request; it creates no new raster obligation. |
| GROUND | match | Plum `#39233e`, pink `#ff92bd` and pale paper/tonal fields match the named world and `homepage.css`; no new ground temperature is introduced. |
| THESIS | match | Filled booking geometry connects the arrival overlay, calendar examples, selected states and primary action. |
| STORY / restoration order | match | `renderHomepage()` restores night, five pains, channels, direct bookings, calendar and all nine modules, followed by roles, journey, case, pricing, founder, approach, onboarding, demo, FAQ, final request and visible guide. This order follows the new restoration request rather than the superseded STORY sequence. |
| FIRST VIEWPORT | adaptation | Two authored lines and the photo/arrival example are retained; copy and action precede the photo on phones. The 768 capture uses three lines to fit real copy, an acceptable responsive adaptation under `RESTORATION_QA.md`. The benefit and demonstration action survive the memory test. |
| FORM | adaptation | Existing identity, code-led local work and the documented unavailable-launcher fallback remain applicable. No new concept or comp round was requested. |
| Five pain photo cards | match | All five requested subjects, distinct icons, photographs and action links are present. The requested five-card structure is intentional. |
| Nine modules, three roles, five journey stages | match | Counts, IDs and panels are retained; supplied QA records switching and module keyboard behavior. Horizontal tab scrolling is contained within the control, as the restoration contract requires. |
| Module navigation truth | contradicted | The visible tab “Бронювання на сайті та оплата” advertises payment while the panel correctly says guest online payment is unavailable. “Повідомлення та чат-помічник” similarly puts the future assistant in the current navigation label. |
| Mobile night composition | contradicted | `mobile-night-settled.png` shows the action row clipped by the viewport bottom. Supplied 390 × 844 geometry places `.lhm-bar` at 816–864 px. The large blank tail in the earlier transient capture is not a persistent finding. |
| Diagram lettering / craft floor | contradicted | `desktop-channels.png` retains “ОДНЕ РОБОЧЕ МІСЦЕ” above “Готель у VDALO”. The direct-booking source has the equivalent “МОДУЛЬ ПРЯМОГО БРОНЮВАННЯ” above its title. These are redundant kickers. |
| Product truth and contact | match | Demonstration data is labeled; setup is agreed separately; trial start/payment conditions are stated; compatibility remains conditional; development/beta details remain in module copy and source-backed pricing. The form capture shows Ukrainian validation and a demo context. No valid lead was submitted. |

## ceiling

The restored architecture, photographic pain sequence, dark night scene and restrained plum/pink controls reach the stated restoration quality bar in the supplied views. The remaining native device is screen-aware framing of the phone simulation: its switch must fit with the scene. Additional ornament or a new visual world is not required. The communication sample also inherits a prohibited 2px side stripe from `.message-timeline li`, which needs a homepage-scoped correction.

## material_fixes

1. **Persistence:** Have the documenter rewrite `DESIGN.md` around the final full homepage, replacing the compact name, rejected structure, obsolete anchor/motion descriptions and superseded hero sizes; preserve the existing brand scope and stated QA limits.
2. **Truth:** In the homepage adaptation, rename the engine tab to “Бронювання на сайті” and the communication tab to “Повідомлення гостям”; retain payment and AI as clearly marked development capabilities inside their existing panels and retain all nine modules.
3. **Responsive composition:** Fit `.lhm` to the viewport space below the header and section top so `.lhm-bar` is fully visible at 390 × 844 and 320 × 780; a local height near `calc(100svh - 104px)` is appropriate if its minimum height does not override that fit. Keep the stage flexible and retain the original game. Replace `mobile-night.png` with a settled capture showing the complete action row.
4. **Craft-floor kicker ban:** Remove `.integration-hub-label` and the direct-booking engine's uppercase span in the homepage output, allowing their existing titles to carry the diagrams. Preserve the channel marks and compatibility caption.
5. **Craft-floor side-stripe ban:** Override `.message-timeline li` within `.homepage-2026` to remove its inherited 2px left border; retain the ordered communication content with spacing or small consistent SVG markers.

## keep

Keep every restored block and its order, all five photo pains, the existing night game, all nine modules, three roles, five journey panels, the visible guide, canonical plum/pink/Inter identity, factual availability labels and working request/calendar/pricing handlers.

---

## verdict

1. **Resolved, persistence:** `DESIGN.md` now documents the restored full order, actual anchors, current hero sizes, nine modules/three roles/five stages and actual motion. The sidecar and documentation record agree, retain the pinned brand and state the reduced-motion evidence limits.
2. **Resolved, navigation truth:** The recaptures show “Бронювання на сайті” and “Повідомлення гостям”; their panels retain the explicit unavailable-payment and AI-development copy. All nine modules remain in the source.
3. **Resolved, mobile night fit:** Settled `mobile-night.png` and `user-320-night.png` show the heading/HUD, scene and complete action row together. Supplied geometry places the row bottom at 828.17px in the 844px viewport and 763.90px in the 780px viewport. The scoped height and minimum caps preserve the game and contained layout.
4. **Resolved, diagram kickers:** `desktop-channels.png` and `desktop-direct.png` show the existing diagram titles without the redundant uppercase lines; channel marks and the compatibility/connection captions remain.
5. **Resolved, communication stripe:** The final `user-768-messages.png` shows all three communication timeline rows without a left stripe. The homepage-scoped source override and supplied computed `borderLeftWidth: 0px` agree with the image.

## remaining

Clear for the five scored fixes. No regressions introduced by this fix batch are visible in the supplied recaptures. This ship covers the scored fixes, not the whole surface. Staging publication and inspection remain in the parent workflow; main still requires the owner's approval.

disposition: ship
