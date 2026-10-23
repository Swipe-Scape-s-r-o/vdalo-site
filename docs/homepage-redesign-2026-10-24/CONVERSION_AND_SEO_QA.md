# Conversion and SEO extension: QA

Date: 24 October 2026. Scope: the homepage extension described in CONVERSION_AND_SEO_BRIEF.md.

## Copy and structure

| Before | After | Why |
| --- | --- | --- |
| General product summary and a team follow-up note | Concrete booking/guest/room-readiness summary, plus a 14-day trial without a bank card | Clarifies the offer and the request step on arrival |
| A generic resource index beside the founder | A specific published glamping example, with a descriptive case link | Gives a checkable implementation example without inventing numerical results |
| Demo scope left to the follow-up | A four-part agenda covering bookings, readiness, integrations and cost | Explains what the visitor will get from the conversation |
| The page ended after the main request action | A visible long-form guide, contents navigation, contextual internal links and a closing request action | Serves readers who need detail and connects relevant existing resources |

## Checks already performed

- `node --check` for homepage.mjs, homepage-guide.mjs and homepage.js passed.
- `git diff --check` passed.
- Taste source lint: 0 FAIL, 5 WARN. Warnings refer to the pinned Inter / Inter Tight families. No second browser automation tool was used.
- Server HTML: HTTP 200; one H1; no duplicate IDs or broken fragment targets; guide text exists in the initial HTML; canonical remains https://www.vdalo.tech/; JSON-LD parses; no U+2014.
- Guide reading column contains about 1,250 whitespace-delimited words, excluding the separate contents rail. The request was for 1,000 or more; no ranking benefit is inferred from length alone.
- 17 of 18 distinct guide destination routes returned 200 locally. The QR application returns 404 in the unbuilt local preview because qr-lab/dist is absent; its real staging route was opened successfully in Chrome with the expected QR Studio title and generator UI. This is recorded as an environment difference, not a passed local QR build.
- All 18 distinct guide destination URLs were then opened through authenticated Chrome on staging. Each displayed its expected title, H1 and main content, including QR Studio, the restaurant QR article, both other tools and the glamping case. Evidence: conversion-review/staging-destinations.json. This is a page-availability check, not a functional retest of every external tool.
- New demo action opens the existing audit dialog with the selected demo context. Empty submission shows Ukrainian name, contact and consent errors. No valid request or payment was submitted.
- Calendar direct-channel filter and reset work. Existing prices, consent and delivery code are unchanged.
- Computed palette contrast for plum body text: paper 13.51:1, workflow surface 11.52:1, trial surface 10.04:1, pink 6.81:1. This is a targeted palette check, not a complete WCAG certification.

## Evidence handling

Use conversion-review/ for the current render evidence. Early captures at the 127.0.0.1 origin suffered from browser zoom/capture artifacts and were discarded. The final local evidence uses localhost at 100% zoom. Full-page captures of the long page exceeded the browser screenshot command's limits, so the evidence uses ordinary viewport captures of the changed hero, demo, guide and QR-reading regions. No failed full-page image is retained as evidence. Captures must state actual DOM width, loaded images and scroll position. Crops are review evidence only.

## Responsive and interaction review

`conversion-review/measurements.json` records 1440, 768, 390 and 320 CSS-pixel widths. At each size document scroll width equals its client width. All visible homepage H1/H2/H3 headings fit in at most two lines; headings inside closed calculator details are excluded from this visual count. The short closing headline was refined to fit the 320px case.

- Guide contents links navigate to their actual section IDs. Desktop contents stays at 110px while reading the QR section; on phone it becomes normal two-column contents above the copy.
- The new demo agenda is two columns at desktop/tablet, one column on phone; no card grid or new motion was added.
- The mobile action is hidden alongside the demo request block, the main close, the guide-end request and the footer. It is visible in the middle of the long guide, and hidden while a dialog is open.
- The guide-end request opens the established audit dialog on a 320px viewport with the same demo context. The close control is 44×44px and stays inside the viewport. No request was sent.

Finish-review disposition and actual staging deployment verification are recorded separately after those checks complete.

## Limits

No ranking, real conversion uplift, CRM delivery, payment acceptance, GA4 DebugView ingestion or Clarity recording receipt is established by this pass. Reduced-motion behavior and the visible no-JavaScript baseline are retained and source-reviewed; the available browser capability does not emulate those modes. This extension adds no new motion or analytics dependency. Main publication requires owner review of staging.
