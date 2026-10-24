# Site trial invitation, 24 October 2026

## Request and release boundary

Enable the existing 50-second invitation on ordinary VDALO pages. Keep advertising landing pages excluded. Publish to staging for owner review; leave production at its approved release.

Starting refs:

- staging: c8edc7a78b532827182827306ce4d7727c6e141c
- main: 86ff62ff8505bbfa973e84fc57583c43b24525cf

## Implementation

- Shared server-side decoration after content and schema preparation, enabled only for the ordinary route registry (including standalone QR Studio and versioned homepage/privacy aliases).
- No invitation markup, script or CSS on any advertising funnel. This includes all 13 short q routes, the old quiz, k1-k5, SMS, numeric video landings, microlandings and tourist-tax/start. Their redirects and UTM parameters retain existing behavior.
- Controller and styles extracted from the homepage. No content, imagery, pricing or page layout redesign in this change.
- 50 seconds of visible-tab time, accumulated between ordinary pages in the same tab session. Hidden tabs and marketing routes contribute no time. Close/dismiss/contact suppression persists for the session, including browser back/forward cache restoration.
- Privacy notice, menus, another dialog and active field editing defer the invitation. Opening or starting a lead request suppresses it.
- CTA closes the invitation before opening the existing short audit form, with explicit 14-day trial context. Standalone pages reuse the same renderer, validation, controller and /api/leads/audit endpoint. Existing forms are not replaced and no duplicate audit IDs or app.js instances are added.
- A missing-header guard lets the existing frontend form controller run on tax and QR pages. CRM transport, server configuration and deployment files are unchanged.

## Automated verification

- New/updated invitation tests: 19 passed. Cover delay, hidden-tab time, blockers, editing, dismissal, manual lead suppression, cumulative time, exclusion time, back/forward cache, blocked storage, all ordinary routes, campaign families, redirect UTM, assets, duplicate controller/form prevention and original audit contract.
- Built the unchanged QR Studio locally using the already installed workspace dependencies, so the real standalone HTML participates in route and form checks.
- Complete suite: 243 tests, 242 passed, one known existing failure. No skipped tests.
- Existing failure: content-package test `all local four-person-day examples have exact products and independent half-up rounding` searches for the old section heading and finds 0 examples instead of 55. The same failure was reproduced on unchanged baseline 21fdce3 in the isolated baseline worktree. Neither tax content nor the failing assertion is changed here.
- All 70 original form contracts, content metadata, internal links and protected product/funnel content checks pass. Shared invitation markup is explicitly excluded from the historical content fingerprint; every original field and form action remains compared.
- git diff --check passed.

## Browser verification

Local Chrome, 390 x 844:

- Tax directory: one invitation, one audit dialog, one app.js. No horizontal overflow or console warnings/errors.
- Invitation appeared after real visible browsing time. CTA left exactly one open dialog and opened the working audit request with 14-day trial context.
- Empty submit showed Ukrainian name, contact and consent errors. No valid request sent. Form close worked.
- Evidence: local-tax-mobile-form.png.

Local Chrome, 1440 x 960:

- Started on the restaurant QR article; at 28.4 seconds the invitation was still closed. Navigated to QR Studio in the same tab to check active-time carry-over.

Staging deployment and final browser evidence will be appended after publication.

## Limits

No valid lead or Telegram message is sent for this UI change. The established delivery endpoint and CRM transport remain unchanged. Analytics receipt in GA4/Clarity is not claimed from source tags or UI behavior.
