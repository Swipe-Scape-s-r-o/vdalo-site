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

Final deployed-page checks and evidence will be appended after publication.

## Limits

Valid delivery paths are tested with mocked responses and the existing receiver contract. No live Telegram/CRM submission is sent from staging. Actual lead receipt and GA4/Clarity dashboards are not claimed as verified by these checks. Production remains unchanged.
