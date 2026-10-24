# Inline trial request, 24 October 2026

## Scope

Replace the two-dialog invitation flow with one request window. Improve title spacing and centering. Keep all advertising funnel exclusions and the 50-second active-viewing timer. Publish to staging for owner review; keep production unchanged.

Skills applied: design:ux-copy and design:accessibility-review.

## UX decisions

| Element | Implemented copy/behavior | Reason |
| --- | --- | --- |
| Heading | Спробуйте VDALO 14 днів | Preserve the offer, center it and use readable natural wrapping on small phones |
| Close separation | 76 px top padding; 44 px close target at top 12 px | Leaves 20 px between the close box and the first heading line |
| Fields | Ім’я, Телефон | Only the contacts the team needs for manual follow-up |
| Consent | Unchecked, required, linked privacy policy | A clear choice before contact processing |
| Submit | Залишити заявку на тест | Describes the actual outcome: a request to the team |
| Supporting note | Без банківської картки. Команда погодить початок тесту. | Explain the manual next step without promising free setup |
| Loading | Надсилаємо…; disabled button and aria-busy | Prevent duplicate clicks and show progress |
| Success | Заявку отримано; explanation in this dialog | Show only after the existing receiver acknowledges success |
| Failure | Inline Ukrainian error, preserve fields and retry ID | Allow recovery without another window or duplicate lead identity |

## Implementation boundary

Use the existing frontend form controller, phone validation and /api/leads/audit route. No new CRM connection, deployment configuration, server secret or automatic account activation. Preserve original page forms and all marketing content.

The popup form and both contact inputs are explicitly masked for session replay. Provider-neutral analytics use form_variant=timed-trial; contact values never enter events.

## Verification

Cover desktop and phones at 320/390 px, title spacing, keyboard/focus order, closing, inline validation and consent, loading and double clicks, delivery failure/timeout, retry identity, server-confirmed success, active-time carry-over and advertising exclusions. Use mocked delivery for valid submissions; do not send a real Telegram/CRM lead from staging.

During the 320 px check, an existing tourist-tax directory row overflow was isolated with the popup closed. Wrap those links and constrain the grid to avoid scaling the viewport behind the dialog. Version the changed interaction stylesheet so the correction is received immediately.
