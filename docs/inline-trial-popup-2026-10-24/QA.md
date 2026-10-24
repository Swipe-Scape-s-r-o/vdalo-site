# Inline trial popup QA, 24 October 2026

## Release boundary

Start: staging abf50b79d7f533965a4cc065f6d71f3a2c54326a; production 86ff62ff8505bbfa973e84fc57583c43b24525cf. This change is for staging review only.

## Automated checks

- Full suite: 253 tests, 252 passed, one existing failure, no skipped tests.
- Existing failure is unchanged: `all local four-person-day examples have exact products and independent half-up rounding` still searches for an old content section title and counts 0 instead of 55. It was reproduced on the prior unchanged baseline; this work does not edit that content or assertion.
- Invitation tests cover exact 50-second timing, visibility, session persistence, ordinary routes including noindex tax pages, all advertising families, UTM redirects and no duplicate controller/IDs.
- New frontend submission harness executes the real app.js validation and submit code with a mocked receiver. Covers name/phone/consent errors, rejecting email in the phone field, /api/leads/audit with form_kind=contact, trial context, UTM, loading, double-click prevention, server field errors, HTTP failure, unacknowledged response, offline/timeout, preserved inputs, stable retry ID and acknowledged inline success.
- Full content checks preserve all original form contracts, original product/funnel content, metadata and links outside the explicitly added popup form.
- Existing contact forms now preserve form_kind=contact through the frontend submit alias; this lets the established server apply its already existing phone-only validation. No server receiver, webhook or CRM transport logic is changed.
- Replay masking is explicit on the new form and both contact inputs. Analytics events carry form_variant=timed-trial without name, phone or free text. No analytics receipt claim is made from these source checks.
- git diff --check passed.

## Local browser

Chrome, 390 x 844 on /tourist-tax/:

- Real timed appearance; one open dialog, with both name and phone inputs directly inside it.
- Dialog width 366 px, height 644 px; centered title with 20 px below the close control. No internal scrolling required at this size.
- Empty submit showed Ukrainian name, phone and consent errors, focused name, and kept the same dialog open. Email entered into the phone field was rejected inline and focused phone.
- No console warnings/errors. No valid lead sent.
- Evidence: local-mobile390.png.

Chrome, 1440 x 960 on the homepage:

- Title uses a single 34.5 px line and is centered. Dialog width 560 px, height 594 px, no internal scrolling.
- Keyboard order: close, name, phone, consent, privacy link, submit, continue reading. Native dialog behavior contains page interactions; Escape closes it.
- On 320 x 568, popup width 296 px and maximum height 544 px with internal scrolling; the homepage has no horizontal overflow.
- The final scroll wrapper reserves the top area for the close control. On a 320 px tax page, scrolling content to 140 px left the close control at y=24..68, with document width 320 px. Closing from that position worked. Evidence: local-mobile320-scroll-close.png.

Browser submission states against a local fixture:

- Temporary server bound only to loopback; all lead POSTs intercepted before the real receiver. It used the actual existing validator, returned a simulated 503 on the first valid request, then a simulated acknowledged success. No webhook/CRM call or persistent lead data.
- Real form clicks showed `Надсилаємо…`, a disabled submit and aria-busy. The 503 stayed in the same dialog and preserved inputs.
- Retry used the same submission ID, form_kind=contact and the 14-day context, confirmed by the local fixture logs. On acknowledgement, the form hid, the heading became `Заявку отримано`, the success block received focus and the return button closed the same dialog.
- Evidence: local-mocked-delivery-error.png, local-mocked-delivery-success.png. These screenshots demonstrate mocked delivery states, not an actual Telegram receipt. The temporary server was stopped afterwards.

Narrow tax directory fix:

- With the popup closed at 320 px, pre-existing directory rows extended to about 364 px because a later stylesheet forced links onto one line inside a grid with an automatic minimum track.
- Corrected the mobile track to minmax(0,1fr), allowed item shrinking and wrapped links. After reload, directory/list rows were 288 px inside a 320 px page and document width was 320 px.
- Added a content-hashed interaction stylesheet URL to prevent stale cached rules.
- Evidence: local-mobile320-errors.png captures the original background overflow; local-tax320-directory-fix.png records the corrected page.

## Accessibility details

| Check | Result |
| --- | --- |
| Main text contrast | #39233e on #fcf9f8: 13.51:1 |
| Button contrast | #24132b on #ff8fc2: 8.28:1 |
| Error contrast | #a31e39 on #fcf9f8: 7.15:1 |
| Input border contrast | #927d94 on #fcf9f8: 3.59:1 |
| Touch controls | Close 44 x 44 px, inputs 48 px, submit at least 52 px, consent label at least 44 px |
| Field names/errors | Visible labels, required state, individual aria-describedby and invalid-field focus |
| Status/success | Live error status; server-confirmed success updates the same dialog heading and focuses its confirmation |
| Motion | Respects prefers-reduced-motion |

No full assistive-technology certification is claimed; these are code, contrast, keyboard and responsive browser checks.

## Staging

Functional release: 9ef3f19.

- Actual homepage HTML contains the inline timed-trial form and the new scroll region. Served script hashes match committed source: app.js=fc06a168e7dd, trial-offer.js=aab0557eac17.
- At 45.2 seconds the invitation was still closed; at 69.0 seconds it was visible. Exact 49,999/50,000 ms boundary is covered by the controller tests. Privacy choices were already saved, and the popup did not overlap another dialog.
- At 390 x 844: one open dialog, both required contact fields inside it, 20 px title-to-close clearance and document width 390 px. Evidence: staging-mobile390.png.
- At 1440 x 960: centered title on one 34.5 px line; dialog 560 x 594 px with no internal scrolling. Evidence: staging-desktop1440.png.
- Empty submit on staging showed Ukrainian name, phone and consent errors in the same dialog, focused name and kept success hidden. No actual lead was submitted.
- At 320 x 568 with errors: dialog 296 x 544 px, internal scrollTop 257 px, close control still at y=24 and document width 320 px. Close worked. Evidence: staging-mobile320-scroll-close.png.
- A subsequent visit to /tourist-tax/ respected session suppression. Directory rows were 288 px with no global overflow, and the server served tourist-tax-interactions.css?v=4afb476d1242.
- No browser console warnings/errors during the staging form checks.
- All 13 /q1-/q9 and /qa-/qd plus /q, /k1, /go, /go/trial and /tourist-tax/start were checked at 390 and 1440 px: 36 visits, no popup markup, inline form or popup assets on any page, and no global overflow. Evidence: staging-advertising-exclusions.json.
- The real render inventory contains 93 ordinary routes with the inline popup and 154 advertising routes without it, with zero mismatches. Evidence: route-inventory.json.
- Production homepage remained HTTP 200 at revision room-photo-v5, without the inline form. main remained 86ff62ff8505bbfa973e84fc57583c43b24525cf.

Staging is ready for the owner's visual review. No production promotion is performed in this task.

## Limits

Valid delivery paths are tested with mocked responses and the existing receiver contract. No live Telegram/CRM submission is sent from staging. Actual lead receipt and GA4/Clarity dashboards are not claimed as verified by these checks. Production remains unchanged.
