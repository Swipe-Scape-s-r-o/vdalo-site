# Homepage QA, 24 October 2026

## Scope and evidence

Local browser review at http://127.0.0.1:4199/ in Chrome through CUA. Main has not been changed. Evidence: review/measurements.json and final screenshots. The upstream Taste inspector and Impeccable binary did not run; no claim of their browser checks or detector approval.

## Before / after

| Measure | Before | After |
| --- | --- | --- |
| Desktop 1440 px, document height | 20,719 px | 6,039 px |
| Mobile 390 px, document height | 29,107 px | 8,445 px |
| Default visible story | 25 H2 headings plus repeated CTAs | 8 concise sections including FAQ and final CTA |
| Desktop/mobile change | Long repeated prose | About 71% less initial scroll |

The full existing calculator remains inside an optional disclosure. Its expanded height is intentionally excluded from this initial-scroll comparison. Different fonts/viewport settings can change pixel heights.

## Functional review

- Calendar booking selection, next week, and channel filters: exercised.
- Four role tabs and keyboard arrow selection: exercised.
- Pricing: 8 rooms = 390 UAH/month; 21 rooms = 1,540 UAH/month; yearly billing = 1,155 UAH monthly equivalent for 21 rooms. Source: existing pricing-core.js.
- Primary and mobile CTA: open the existing audit request form, with the selected demo context.
- Empty form: Ukrainian name/contact/consent errors shown. No valid request was submitted and no payment was made.
- Mobile navigation: opens/closes. Sticky CTA hides under menu and native dialog.
- FAQ: native disclosure opens/closes.
- All four CSS widths: no document overflow; main default headings at most two lines.
- Images: desktop and mobile hero assets return HTTP 200; responsive source corrected to the public /v1/assets/ path.
- Metadata: existing category title/description, canonical https://www.vdalo.tech/, and shared schema pipeline retained. Schema validator renderer now points at the real compact home.
- No living-hotel game scripts on the compact home.
- CSS/JS Taste lint: 0 FAIL, 4 WARN, all retained Inter brand font warnings. Template .mjs files require separate source/DOM review because this upstream lint does not scan them.
- JS syntax checks and git diff whitespace check completed.
- New console errors after pricing fix: none observed in the exercised flows.

## Bugs found and fixed during review

| Before | After | Why |
| --- | --- | --- |
| Responsive source used unprefixed /assets URL | Explicit /v1/assets responsive source | The server's HTML prefix does not rewrite srcset |
| Three-line hero at some widths | Shorter authored break and tablet size | Clear first-screen hierarchy |
| Removed pricing sticky DOM caused null dereference | Preserved expected DOM; home-only CSS hides duplicate CTA | Existing calculator contract remains intact |
| Booking labels shrank to 6 px height | Taller rows and non-shrinking labels | Supports minimum-font browser settings |
| Shared CSS overrode calendar styles | Home CSS loads after shared bundle | Route-specific styling wins predictably |

## Limits

Reduced motion and no-JS fallbacks reviewed in source; browser has no exposed media-emulation/no-JS switch, so those modes are not claimed as interactively exercised. Physical phone, screen reader, GA4 DebugView, Tag Assistant and Clarity ingestion are not verified in this round. Shared consent/analytics wiring is unchanged; CTA tracking remains in app.js. New scenario custom event is dispatched but has no new GTM consumer configured.

No conversion uplift is claimed. Compare the existing consented CTA/form-start/form-success funnel after release using a stable traffic period, with delivery acknowledgement counted as a lead.

## Skill sources

- Emil Kowalski: 2d228630ba1446365f614a108cb8252f1feda202
- Impeccable: e0d6f1baf969f5afd2472a8af8d6c1f7f589b111
- Taste: 6010f91a9935f1c167dfc500fb1a475681892e6b

## Assets

New authored hospitality image: home-hospitality-1536.jpg and home-hospitality-768.jpg. Generated with the built-in image tool; exact prompt in IMAGE_PROMPT.txt and embedded in each JPEG comment. This illustrates hospitality, not an actual customer or testimonial. All other images and channel marks already belonged to the project. Existing founder portrait stays factual. No stock imagery was sourced in this change.
