# Independent finish review, 24 October 2026

## 1. Capture validity

The replacement captures are valid for a static visual finish review. I inspected desktop crops at 0, 1200, 2400, 3600 and 4800 px; mobile crops at 0, 1400, 2800, 4200, 5600 and 7000 px; and the tablet and small-mobile first crops. All visible photographs are loaded. There are no placeholder image gaps or blank reveal bands within the page story. The header appears in its expected top position in the replacement set. The earlier scrolled-capture header artifact is not accepted as evidence of the design.

`review/measurements.json` records `y: 0` at 1440, 768, 390 and 321 CSS px. At those widths, reported `scrollWidth` equals `client`, and measured default main headings occupy at most two lines. These are supplied browser measurements, not measurements I independently reran. The intentionally wide phone calendar has a visible horizontal-scroll instruction and a visibly cropped continuation; it is not accidental document overflow.

The full-page captures are evaluated through readable crops, not their heavily downsampled overview. Static captures cannot establish animation quality, scrolling sticky behavior, keyboard behavior or form delivery.

## 2. Brief and contract fit

The result meets the requested compact homepage direction within the established VDALO identity. The first screen clearly identifies hotel management software, supplies a real `Замовити демо` button, and offers the calendar as the secondary path. The plum/pink palette, canonical logo, Inter family and existing navigation remain coherent. The authored hospitality image, scenario photography, SVG icons, channel marks and real founder portrait add relevant visual information.

The booking device is visible as the illustrative arrival state, the working calendar and filled surfaces through the page. The order is understandable: category and request, calendar, role workflows, channels, onboarding, price, people, FAQ, final request. The phone has a stacked composition and its own image source rather than a reduced desktop grid. Desktop has five photographic images, with four in the default phone story.

The reported default height falls from 20,719 to 6,039 px on desktop and from 29,107 to 8,445 px at 390 px, roughly 71% less initial scroll. The optional calculator is excluded from that comparison, as QA explicitly states. The compact pricing summary obtains the Start monthly amount from `VDALO_PRICING`; it states the room limit and separately priced Start channels. Manual team onboarding, the trial process and development status of PRRO/AI remain explicit in the source. The demo buttons retain the existing audit-form trigger. The reviewed new homepage sources contain no U+2014 or encoded substitute. No deployment or branch change was performed by this reviewer.

## 3. Material findings, prioritized

No open material finding remains in the inspected final state.

1. **Resolved: illustrative arrival needed a visible label.** The earlier state relied on an ARIA label while presenting `Заїзд підготовлено` as visible status text. Final `versions/v1/homepage.mjs:58` now visibly says `Приклад заїзду`. This is readable in `review/crops/desktop-0.png`, `mobile-0.png`, `tablet-0.png` and `small-mobile-0.png`, satisfying the explicit illustrative-state contract.
2. **Resolved: generic whole-block entrances obscured the motion hierarchy.** Final `versions/v1/public/homepage.js:37` targets headings, ordered onboarding steps and the price figure; lines 40–44 distinguish their motion. The repeated work-copy, founder, reading-panel and FAQ-tile entrances have been removed. The arrival and single 12-second photograph settle remain at lines 47–50. Visible HTML remains the baseline, and reduced-motion cancellation is present. This resolution is source-reviewed; I did not observe a browser motion playback.

There is no evidence in the reviewed captures requiring a new visual direction or a rebuild. The repeated split compositions and general rounded reservation shape limit distinctiveness, but they do not materially obstruct this brief's shortened conversion path.

## 4. Score and limitations

ROUND 1, final revised state

- Seen in one second: the large plum/pink hospitality scene and hotel-management promise.
- Idea: a confirmed reservation connects the guest welcome to an understandable hotel workflow.
- Live thing: the booking calendar, with selectable reservations, week controls and channel filters; role tabs and the calculator add useful interaction.
- Layout words: hero=split / calendar=full-width control / roles=tabs and split / channels=compact band / onboarding=reverse split / pricing=split and disclosure / people=portrait and index / FAQ=split accordion / close=statement band.
- Scores: design **7.5** · usability **8.0** · creativity **7.0** · content **8.0** → weighted overall **7.6/10**.
- Caps applied: creativity is held at **7.0** because the reservation motif and functional hotel calendar could also suit the nearest PMS competitor. No other visible cap is triggered in the reviewed captures. The generic brand-font warnings are accepted pinned exceptions.

The score is a visual and source review, not detector approval or an accessibility certification. I read AGENTS.md, BRIEF.md, QA.md, the measurements, homepage template/CSS/JS and integration diff, plus the supplied Impeccable craft floor and Taste critique rubric. I did not run tests, a browser, the unavailable Impeccable detector, Taste's external inspector, a contrast meter, a screen reader or a valid lead submission. Functional results in QA are the implementer's reported evidence. Reduced motion and no-JS behavior are source-reviewed only. No conversion improvement is claimed.

## 5. Disposition

**SHIP to staging for the owner's review.** The local visual finish is ready, and no material fix or further recapture is required for the inspected final state. This is not approval to merge into `main`: repository instructions require the owner's review and confirmation after the staging update. Production form delivery and post-release funnel performance remain outside this finish review.
