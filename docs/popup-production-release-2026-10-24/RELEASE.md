# Approved popup production release, 24 October 2026

## Authorization and source

The owner reviewed staging and explicitly approved promotion to the main domain and post-deploy popup checks. Advertising funnels must remain excluded.

- Previous production: 86ff62ff8505bbfa973e84fc57583c43b24525cf.
- Reviewed staging: d6cf13c30d04cb1f3b5d59778f5bcf9854ed201c.
- Promotion merge: 63420dac5a849067062d61bbd4764bc4b723cae1.
- Merge first parent is previous production; second parent is reviewed staging.
- Reviewed staging and promotion have identical Git tree d194c9e315b40c381e83192fd1fbf1d347e180a1. No implementation changes were introduced while merging.
- main and staging advanced together with an atomic, non-forced push. Hetzner's existing deployment process performs the release.

## Pre-deploy checklist

- Owner approval received for this exact staged version.
- Working tree clean before promotion; branch divergence reviewed. Previous production's tree equals the common reviewed base.
- 47 focused tests passed: popup timing, ordinary/ad routes, inline request validation/submission, legacy contact forms, consent, analytics contract and room-count copy.
- The complete staging suite's known unrelated tax-content assertion remains documented in the staging QA report. No new critical failure was found in the release checks.
- Original forms, CRM transport, environment secrets, deploy files and server configuration are not modified by promotion. No database migration.
- Rollback candidate is previous production 86ff62f. If the new release causes 5xx responses, missing assets, unusable contact submission or an invitation on advertising routes, stop promotion work and restore through the established release process. The promotion merge has production as first parent, so a reviewed revert of that merge with parent 1 restores its previous content without rewriting public history.

## Post-deploy checks

- Plain https://www.vdalo.tech/ serves homepage revision visual-polish-v6 and the actual inline timed-trial form. No preview flag is needed. Popup/controller hashes match the approved release.
- Read-only HTTP inventory: all 93 ordinary pages returned 200 with the inline popup; all 154 advertising pages returned 200 without its markup, form or assets. All five checked script/stylesheet bodies matched the committed SHA-256 hashes. Details: HTTP-RESULTS.json.
- All four legacy q redirects returned 308 and preserved UTM and t; the apex domain redirects to www while preserving the query. Details: REDIRECTS.json.
- Chrome, 390 x 844: popup appeared during real active browsing; one dialog, centered title, 20 px clearance below close control and no horizontal overflow. Evidence: production-mobile390.png.
- Chrome, 1440 x 960: heading on one 34.5 px line; dialog 560 x 594 px. Evidence: production-desktop1440.png.
- Empty submit stayed in the same dialog with Ukrainian name, phone and consent errors and focused the name field.
- Chrome, 320 x 568: dialog 296 x 544 px, content scrollTop 257 px, close control remained at y=24 and document width was 320 px. Evidence: production-mobile320-scroll-close.png.
- Submitted exactly one clearly labeled test request using the contact previously authorized by the owner. The actual production UI showed Заявку отримано, hid the form and retained one dialog after the existing receiver acknowledged success. Evidence: production-request-success.png contains no contact fields. No contact number is stored in this report.
- Requested recipient confirmation in chat for the test label ТЕСТ попапу 24.10. Telegram receipt is pending confirmation at the time of this report; UI acknowledgement is not treated as proof of delivery to Telegram.
- The return button closed the dialog. A later visit to /tourist-tax/ respected session suppression and showed contained 288 px directory rows at a 320 px viewport.
- No browser warnings/errors were observed during the production popup/form checks.
- Browser checked all 13 short q landings plus /q, /k1, /go, /go/trial and /tourist-tax/start at both 390 and 1440 px: 36 visits with no popup markup, inline popup form, popup assets or global overflow. Details: PRODUCTION-ADVERTISING-UI.json.

The deployment and observed popup behavior passed the production checks. Actual Telegram receipt remains a separately recorded confirmation item.

## Verification limits

Public HTTP responses, browser UI, asset hashes and console output are observable here. Backend infrastructure metrics and GA4/Clarity receipt are not established by tag presence. Telegram receipt requires the recipient's confirmation.
