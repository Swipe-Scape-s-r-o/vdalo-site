# VDALO robot-funnel QA and UX audit

Date: 2026-10-22  
Scope: source and automated regression audit of the 13 SMS landing routes (`/q1`–`/q9`, `/qa`–`/qd`).  
Environment: local branch `codex/robot-funnel-qa-ux`; no production changes.

## Audit outcome

The automated repository checks pass after the fixes below. This is not a claim that the live staging pages passed a visual or browser audit: the browser access policy rejected observation of `https://staging.vdalo.tech`, so no interaction with the live origin was attempted through another channel. The form was not submitted and no lead was sent. A staging visual pass and analytics verification remain release checks.

### Findings and fixes

| Priority | Finding | Reproduction / evidence | Change | Launch impact |
|---|---|---|---|---|
| P1 | Default contact choice could be sent to the wrong channel. The form rendered “Дзвінок” selected, but the submit fallback used `viber` if the visitor did not click a channel. | Open any funnel form, leave “Дзвінок” selected, submit valid details; inspect `contact_method` in the request. | Default payload now uses `phone`, matching the selected button. | Fixed in local branch; confirm on staging before promotion. |
| P1 | Callo query token `t` could appear in the URL when GTM starts and be collected as part of the standard page URL. | Open a route with `?t=...&utm_source=...`; before fix, GTM initialized while `t` remained in the address bar. | An inline pre-GTM step stores `t` in tab memory for the CRM submission and removes only `t` from the URL, preserving UTM parameters and hash. Added a runtime test for the sanitized URL. | Fixed in local branch; verify in Tag Assistant/GA4 DebugView on staging. |
| P2 | Field errors were plain text without `aria-invalid` or an error relationship, and the email typo hint bypassed the shared error behavior. | Keyboard or screen-reader user submits invalid fields. | Errors now set `aria-invalid`, `aria-describedby`, and a polite live announcement; email hints use the same path. | Fixed in local branch; manual screen-reader check remains. |
| P2 | Form focus flow was inconsistent: opening landed on the close control, and “Назад” did not return focus to the hotel field. | Open form; move to step 2; activate “Назад”. | Focus goes to the first field on open and back navigation; reopening after success focuses the success message. | Fixed in local branch; confirm keyboard behavior in browser. |
| P2 | Several small controls were below the preferred 44×44 CSS-pixel touch target. | Inspect form close button and question/contact chips on a phone. | Close button and chips now have 44px minimum dimensions. | Fixed in local branch; confirm actual rendered size at narrow viewport. |
| P2 | Calculator inputs relied partly on browser constraints that a standalone button click does not enforce. The tourist-tax calculator also used a UTC date, which can select the prior local date around midnight. | Enter values outside min/max, decimals, or empty values; test around a local date boundary. | Commission and tax calculators now check native validity before calculating. Tourist-tax date uses the visitor’s local calendar date. Commission illustration now explicitly says it is illustrative, based on 20%, and not a revenue forecast. | Fixed in local branch; use known input/output examples on staging. |

## What code-level checks confirm

- All 13 short SMS routes map to known funnel definitions; the legacy compact links preserve UTM query strings in redirects.
- Independently rendered all 13 pages: each has a title, description, H1 and exactly one `noindex,nofollow`. This is appropriate for private SMS funnels; do not submit these routes to search indexing unless their purpose changes.
- Existing automated checks cover referenced video manifest files, poster/video references, video controls, reduced-motion handling, CTA/form markup, lead validation/acknowledgement, analytics event privacy, and route compatibility.
- Event payloads do not include visitor-entered answers. `lead_success` is emitted only after the server confirms receipt.
- `t` remains available to the CRM form request while being removed from the URL before GTM is initialized. UTM query values and hash are retained.
- Repository-wide automated tests: 165 passed, 0 failed. `npm run validate:schema`: 90 routes validated, 0 errors.

## Items to confirm with the business owner

1. Confirm the public offer text “14 днів безкоштовно, без картки” and “Після тесту - від 390 грн/міс.” are still approved and accurate. They do not promise free setup, which the owner asked us not to advertise, but the offer and price still need current business confirmation.
2. Confirm each product capability claim in the 13 page descriptions/FAQs still matches the released product and the user's earlier confirmations. In particular, channel synchronization, guest-data forms, tourist-tax handling, night chatbot, housekeeping statuses and direct-booking fees.
3. Confirm where each lead goes and who owns follow-up before a live submission test. No lead was sent during this audit.

## Staging QA plan: run in this order

### 1. Route, content and SEO smoke

Open all routes on staging: `/q1`, `/q2`, `/q3`, `/q4`, `/q5`, `/q6`, `/q7`, `/q8`, `/q9`, `/qa`, `/qb`, `/qc`, `/qd`.

For each route record: HTTP status, final URL, correct funnel message/H1, CTA label, title and description, one H1, exactly one `noindex,nofollow`, valid old-link redirect, and preservation of `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` and any hash. Check that the old funnel links still resolve independently of the new funnel routes.

### 2. UX and conversion review

For each page, test first-screen clarity, whether the main CTA is visible and specific, whether the video or interactive element explains the promised problem, whether proof and “what happens after the form” are clear, and whether the form asks only for data needed at this stage. Open both hero and bottom CTA. Check close/back/success/error states. Do not send a live lead without a test receiver and approved test data.

### 3. Responsive UI and accessibility

Check widths 320, 360, 390, 768, 1024 and 1440 CSS px. Confirm no horizontal scroll, clipped text, media overflow, sticky CTA covering controls, or dialog escaping the viewport. Test keyboard-only navigation, visible focus, Escape/backdrop closing, focus return after close, screen-reader names and error announcements, 200% zoom, contrast, reduced motion, and 44×44 touch targets. Verify the selected contact channel matches the actual form payload.

### 4. Functional test matrix

- Question flows `/q6` and `/q9`: select each option, change it, observe the live result, and confirm no answer text enters analytics.
- Commission calculator `/q7`: defaults should calculate `20 × 3,000 × 15% × 12 = 108,000 грн`; the 20% illustration is `21,600 грн`. Test zero, empty, 100%, over 100%, 0 and 13 months, decimal/invalid and very large values.
- Tourist-tax calculator `/q3`: check a known community/category/rule with an independently verified result, domestic and inbound category, exemption, missing place, zero/negative/out-of-range/decimal values, API error and unsupported community. Verify the date around local midnight and rate effective-date boundaries.
- Video routes: play, pause, seek, verify poster and both media formats, network failures, `video_start` and progress/complete events, and reduced-motion behavior. Confirm the poster remains useful if media fails.
- Form: first-step empty/one-character/valid object name; back/next; empty and malformed email/phone; email typo hint; missing consent; every contact channel; loading, API rejection, server acknowledgement, retry and duplicate-click behavior. Use an approved test recipient only.

### 5. Analytics and privacy verification

Use GTM Preview/Tag Assistant, GA4 DebugView and Clarity. Confirm exactly one page view per page, one funnel view event, no duplicate conversions, correct route/code/format and needed UTM attribution. Open a route with `t` and verify the first analytics page URL and browser address omit `t`, while an approved test CRM request still contains it. Confirm no contact data or answer values in GTM/GA4/Clarity. Check Clarity before consent, after consent, and after refusal; verify input masking and that recordings begin only after the configured consent.

### 6. Visual design, media and final regression

Compare all 13 pages as a set for consistent logo sizing, typography, spacing, dark-plum/pink colors, CTA hierarchy, modal design and error styles. Review all image/video posters at phone and desktop sizes. Check text accuracy, punctuation, currency, units, UI labels and image legibility. Record each finding with priority, route, reproduction steps, actual/expected behavior, screenshot, and whether it blocks release. Rerun the full automated test suite after changes.

## Reusable QA meta-prompt

> Проведи незалежний поетапний QA/UX/UI-аудит усіх 13 staging-лендосів VDALO: `/q1`–`/q9`, `/qa`–`/qd`. Production не змінюй. Для кожного маршруту перевір статус і редирект, H1/CTA/title/description, `noindex`, зображення/відео, збереження всіх UTM і видалення Callo `t` до завантаження аналітики. Перевір усі кнопки, відкриття/закриття форми, кроки, валідацію, згоду, канали зв’язку та стани успіху/помилки. Не надсилай заявку без підтвердженого тестового одержувача. Перевір інтерактиви, q3 і q7 калькулятори на контрольних, граничних і некоректних значеннях. Перевір desktop/tablet/mobile, клавіатуру, видимий фокус, доступність повідомлень про помилки, 200% zoom, контраст, touch targets, reduced motion і overflow. Окремо звір GTM/GA4/Clarity у Tag Assistant, DebugView і Clarity; наявність тегу не вважай доказом отримання події. Для кожної знахідки вкажи P0–P3, точні кроки, факт, очікування, доказ, виправлення/рекомендацію і блокування запуску. Спершу виправ локально підтверджені дефекти, запусти регресійні тести, після цього повтори перевірку. Чітко відділяй перевірені факти від того, що не вдалося спостерігати; не заявляй, що staging пройшов повний візуальний QA, без фактичного browser pass.

## Readiness

**Local code checks: green. Live staging visual/interaction QA: pending. Production: untouched.** Review this branch, then deploy to staging and complete the manual checks above before considering the pages ready for production.
