# Homepage visual QA, 24 October 2026

## Release boundary

- Staging code commit: 7ec2fc1, revision `visual-polish-v6`.
- Previous staging: 21fdce3, revision `room-photo-v5`.
- Main was not changed. Production GET after the staging push returned `room-photo-v5` and HTTP 200.
- No real lead submitted, no CRM/server credentials or deployment configuration changed.

## Implemented corrections

| Before | After | Why |
| --- | --- | --- |
| 110 px strip for the guest-stage photo on desktop | Full-width 4:3 image above its caption | Restore the visual subject and remove the inherited narrow column |
| One generic crop cuts off people in portrait source photos | Separate positions for prearrival, check-in and checkout | Keep the faces and relevant actions visible |
| Founder has an oval image inside a purple rectangle | Existing image fills a rectangular rounded frame | Remove the conflicting image mask |
| Last two pain cards expand into oversized wide cards | Five equal-width cards, last row centered | Reduce visual weight and keep the desktop titles on one line at 1440 px |
| Tariff action touches the module browser | Separate right-aligned action row, 24 px spacing | Make its position intentional; mobile action fills the content width |
| Pink icon disappears on selected pink guest-stage tab | Plum selected icon | Restore contrast |
| Legacy whole-panel entrance changes geometry and hides content before intersection | Homepage panels have a visible, stable baseline | Prevent inherited reveal behavior affecting the CTA gap |
| Night summary always takes keyboard focus | Focus moves only when the scene is visible and already contains focus | Protect a visitor reading another section |
| Persistent mobile demo bar | Removed from markup, CSS and observer code | Stop covering the reading surface |
| Tall privacy notice with jargon in its title | Plain Ukrainian title and compact three-button row, about 110 px at 390 px | Reduce coverage while retaining 44 px touch targets and rejection |

## Automated checks

- Targeted checks: **33 passed, 0 failed** (offer timing/visibility/blockers/dismissal/storage; privacy consent; header/hero loading; navigation; responsive rules; editorial dash rule).
- JavaScript syntax checks passed for homepage, privacy, server and both night scripts.
- Full suite: **232 tests, 228 passed, 4 failed**. All four failures also reproduce in an isolated unchanged checkout of staging 21fdce3:
  - Three content-package checks depend on the absent local `qr-lab/dist` build (route /tools/qr-studio/, its form contract and incoming links). Production QR Studio was checked independently and returned HTTP 200.
  - The content-package tax-example test finds 0 rows under its historical section-title selector while expecting 55. This task does not alter the underlying tax content or calculators.
- A fifth initial full-suite failure came from the change from fixed consent asset version 3 to content hashes. The fixture comparison now normalizes only those two cache tokens; strict comparison of all other excluded-route markup passes. Baseline content hashes were not regenerated.
- The complete suite is therefore **not all green**. No new failing test remains relative to the unchanged staging baseline.

## Browser checks completed locally

- Chrome desktop and phone: all nine product module controls select their panel; five guest-stage controls select the corresponding full-width photo.
- All five guest-stage photos were opened, loaded at 1024 px source width and visually inspected on a 390 px viewport; the final image ratio was 334.67 x 251 px.
- Founder frame, grouped actions, compact card grid and separated tariff action inspected on desktop.
- Hero demo opens the existing short audit form. Invitation CTA uses that same form with explicit 14-day testing context.
- Timed invitation was absent at 16 seconds and visible at the next observation after 50 seconds. Its first browser CTA check used the longer trial form; it was then deliberately changed to the existing short audit form to reduce friction. The final route must be rechecked on staging.
- Privacy notice measured 110.19 px at 390 px. Settings opened with both optional purposes off; rejection hid the notice. No analytics vendor was enabled for that check.
- The large source portrait of Oleg was opened directly: its black corner wand control is not present in the image file. No image pixels or personal identity were edited.

## Verification limits

- Responsive widths are CSS viewports in Chrome, not physical iOS Safari device tests.
- Reduced-motion gating was inspected in CSS and exercised in the offer unit harness; OS-level browser emulation was not used.
- No valid lead delivery, GA4 DebugView or Clarity recording receipt was tested in this visual release.
- Staging evidence and final browser measurements are recorded below after deployment verification.

## Actual staging verification

- Root serves `visual-polish-v6`. The approved room photo and section sequence remain.
- Actual Chrome widths 320, 390, 768, 1024, 1440 and 1920 px all have **0 page horizontal overflow**, no persistent mobile demo bar, a loaded hero image and a **24 px** gap above the module tariff CTA. See `responsive-staging.json`.
- Boundary widths 700/701, 900/901 and 1000/1001 px also have 0 page overflow. Product tab orientation changes from horizontal to vertical at 900/901 px as intended.
- All five pain titles fit one line at 1440 and 1920 px. On phones, natural one- or two-line wrapping remains. The final two cards retain the same width as the first three and are centered.
- All nine mobile module tabs switch correctly, and Home keyboard navigation selects the first tab.
- All five stage photographs loaded at 1024 px source width on staging. Their phone display is 334.67 x 251 px, with no page overflow.
- All three role panels switch correctly. Reservation selection, next demo week and direct-channel filtering work.
- Calculator result: 21 rooms, no addons, 1540 UAH/month. A supplementary copy correction fixes Ukrainian room-count inflection (21 номер, 22 номери, 25 номерів); tariff arithmetic is unchanged.
- Mobile menu opens and closes; all six FAQ items open and close. The final demo request restores demo context after an earlier trial invitation.
- Mobile timed offer appeared in a real staging session after the 50-second threshold. Its CTA closed the invitation and opened only `audit-dialog`, with the 14-day context and two main contact fields. Empty submission displayed Ukrainian name/contact/consent validation errors; no valid request was sent.
- Desktop offer was absent at 40.27 seconds, present at the later 80.80-second observation, closed through Escape and remained closed immediately after reload. Exact 49,999/50,000 ms and reload/session behavior are covered separately by deterministic tests.
- Shared privacy settings open from the footer under the Ukrainian name with both optional purposes off for the tested visitor.
- Staging /q1, /blog/qr-wifi-dlya-gotelyu and /tools/qr-studio/ render successfully at 390 px, have no page overflow, show the renamed privacy settings and do not contain the homepage-only invitation. QR Studio is available on the real staging server despite the missing local dist build in the isolated test harness.
- Captured browser errors and warnings for these staging checks: none.
- Saved actual staging screenshots include desktop/mobile hero, founder, module, guest-stage, onboarding, guide and timed-offer views. `mobile-privacy.png` records the clean local first-visit banner; the staging visitor's previous privacy choice was preserved.

## Review disposition

Ready for owner review on staging within this visual-change scope. Production has not been promoted. The four pre-existing local content-package test failures remain explicitly open; this report does not claim an entirely green repository suite or physical Safari testing.
