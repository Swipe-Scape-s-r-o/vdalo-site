# Homepage visual corrections, 24 October 2026

Owner request: execute the saved visual QA prompt and fix the four supplied desktop screenshots plus the two phone screenshots. Publish to staging for owner review. Production promotion is not authorized in this task.

## Scope

- Keep approved room-photo hero, section sequence, brand, source-backed product claims, SEO guide and existing lead delivery.
- Correct founder image masking, guest-journey image proportions, module CTA placement and oversized pain cards.
- Remove the persistent mobile demo action from markup, styles and script.
- Make the shared privacy notice compact and explain the choice in plain Ukrainian. Preserve independent analytics/replay controls and rejection.
- Offer 14 days of testing after 50 seconds of visible homepage time, once per tab session. Defer while privacy choices, menus, forms or another dialog are open; suppress when contact has already been requested. Close, Escape, backdrop and continue-reading controls must work. CTA uses the existing short audit request form with an explicit 14-day trial context. It requests contact with the team, without requiring registration fields.
- No valid lead submission during this QA. No CRM/server/deploy configuration changes.

## Spatial thesis

Keep the reading path and approved identity. Photographs support the workflow text at a natural aspect ratio. A selected module and its tariff action form one spaced group. Five pain cards retain their subjects while their image height and type become compact. Founder identity uses a rectangular photograph and a grouped pair of actions. On phones, controls remain usable while transient UI occupies less space.

## Source diagnosis

| Before | After | Why |
| --- | --- | --- |
| Journey image column inherited as 110 px with 380 px height at 1440 | One full-width image row and a separate caption row | Prevent the photograph becoming a narrow strip |
| Founder image inherits border-radius:50% inside a rounded rectangle | Rectangular source photograph, image radius 0, container radius 16 px | Remove conflicting masks and retain a natural portrait |
| Tariff CTA touches/overlaps the module browser edge | Dedicated action row with 24 px gap | Make its relationship to the module content clear |
| Wider final pain cards enlarge the image and retain a narrow heading measure | Capped desktop image height and natural heading width | Reduce card weight and avoid unnecessary title wrapping |
| Active journey icon inherits pink on a pink background | Explicit plum icon in selected state | Preserve contrast |
| Persistent mobile demo bar overlays content | Remove the bar; retain in-page CTAs and a dismissible timed invitation | Follow the owner's requested reading experience |

## Review instructions

Inspect the entire rendered homepage at 320, 390, 768, 1024, 1440 and 1920 CSS px, including intermediate breakpoint checks. Save viewport captures of the four problem areas and the privacy/invitation states. Check all nine module tabs and all five journey states, keyboard operation, image loading, contained table scrolling, no global overflow, forms without valid submission, console errors and reduced-motion styling. Repeat representative checks on the actual updated staging release.

Emil Design Engineering, Impeccable and Taste Skill were read. This is refinement of the pinned design, so the approved composition, plum palette, icons and section sequence take precedence over direction redraws. Impeccable context launcher was unavailable; PRODUCT.md, DESIGN.md and relevant skill references were read directly. Browser verification uses the provided CUA interface rather than a separate browser driver.
