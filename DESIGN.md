---
name: VDALO restored full homepage
description: Implemented conventions for the full homepage restored on 24 October 2026
colors:
  plum: "#39233e"
  spark-pink: "#ff92bd"
  paper: "#fcf9f8"
  blush: "#fff5f7"
  soft-surface: "#f0e7ec"
  workflow-surface: "#efe5ed"
  tab-surface: "#e4d5e0"
  tab-hover: "#d9c4d4"
  plum-lifted: "#533859"
  pink-hover: "#ffb3d1"
  focus: "#aa3e74"
  direct-booking: "#ffd3e5"
  online-booking: "#d9c9de"
typography:
  display:
    fontFamily: "'Inter Tight', Inter, sans-serif"
    fontSize: "clamp(40px, 3.9vw, 56px)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "'Inter Tight', Inter, sans-serif"
    fontSize: "clamp(32px, 3.5vw, 52px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "'Inter Tight', Inter, sans-serif"
    fontSize: "clamp(25px, 2.4vw, 34px)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "17px"
    lineHeight: 1.6
  label:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
  price:
    fontFamily: "'Inter Tight', Inter, sans-serif"
    fontSize: "72px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.04em"
rounded:
  surface: "16px"
  control: "12px"
  pill: "99px"
spacing:
  small: "8px"
  medium: "16px"
  control-gap: "24px"
  section: "88px"
  section-mobile: "56px"
components:
  button-primary:
    backgroundColor: "{colors.spark-pink}"
    textColor: "{colors.plum}"
    rounded: "{rounded.pill}"
    padding: "18px 28px"
    height: "58px"
  button-primary-hover:
    backgroundColor: "{colors.pink-hover}"
  button-dark:
    backgroundColor: "{colors.plum}"
    textColor: "{colors.blush}"
    rounded: "{rounded.pill}"
    padding: "18px 28px"
  price-card:
    backgroundColor: "{colors.spark-pink}"
    textColor: "{colors.plum}"
    rounded: "{rounded.surface}"
    padding: "30px 36px"
  disclosure:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.plum}"
    rounded: "{rounded.control}"
    padding: "0 24px"
---

# Design System: VDALO restored full homepage

## Overview

**Creative North Star: "A confirmed reservation"**

This document records the full homepage restored on 24 October 2026 after the owner rejected the shortened structure. Its filled surfaces, hotel photography and reservation rectangles express the existing plum and pink identity through practical hotel work. The restored night simulation, five distinct pain cards and complete module browser belong to this homepage; they do not prescribe the composition of other pages.

The token layer and component conventions below apply to the content inside `.homepage-2026`, plus the documented `body.homepage-shell` background and mobile-action spacing. The retained brand guide and editorial standards remain authoritative for the shared header, footer, forms, calculator and other routes. This is a local extension of the pinned VDALO world. `RESTORATION_METAPROMPT.md` supersedes the shortened STORY in the original brief while preserving its palette, type and material commitments.

Source evidence is `versions/v1/homepage.mjs`, `experience.mjs`, `render.mjs`, `homepage-guide.mjs`, the homepage stylesheet/script, shared styles and `app.js`, and the existing living-hotel files. `RESTORATION_QA.md` records the supplied browser evidence and its limits. This documentation pass read source and review records without running a browser, renderer, tests, launcher or deployment. The finish verdict and owner approval are separate decisions.

**Key Characteristics:**

- Plum fields, pink actions and warm paper with tonal surface changes.
- Inter Tight headings and Inter body and interface text.
- Filled reservation geometry, softly rounded media and pill actions.
- Nine module panels, three roles, five guest stages and the existing night simulation.
- Visible reading content, contained tab/calendar scrolling and short optional motion.

## Colors

Plum anchors the system, pink identifies action and price, and pale warm surfaces group the work.

### Primary

- **Plum:** Text on light surfaces; hero, journey, night and pricing fields; selected controls and final action.
- **Spark Pink:** Main demo buttons, the price figure and the final contact section.

### Neutral

- **Paper:** Base page, module reading surface, FAQ answers and expanded calculator surface.
- **Blush:** Text on plum and light component surfaces.
- **Soft Surface:** Pain cards, calendar, case and FAQ grouping.
- **Workflow Surface:** Channels, modules, approach and demo grouping.
- **Tab Surface / Tab Hover:** Pale control grouping and an inherited palette shade retained in the stylesheet. These colors do not define all restored shared tab variants.
- **Plum Lifted / Pink Hover:** The darker and lighter pointer states for active controls.
- **Focus:** Keyboard outline and small onboarding markers.
- **Direct Booking / Online Booking:** Filled calendar reservations; channel meaning also remains in labels.

**The Existing Identity Rule.** Preserve the pinned plum and pink palette, the Inter family and the canonical raster wordmark.

The sidecar's tonal ramps are generated preview aids. They are not additional production color tokens.

## Typography

**Display Font:** Inter Tight, then Inter and sans-serif.  
**Body Font:** Inter, then Arial and sans-serif.

The heavy headings are grounded by readable body copy and plain interface labels. Headings use balanced wrapping; paragraphs use pretty wrapping. The base heading weight comes from the shared stylesheet. The frontmatter display size now records the implemented hero, replacing the rejected larger compact value.

### Hierarchy

- **Display:** Hero statement, with an authored break and no narrow maximum measure. Between 701px and 1000px, the existing tablet rule overrides its desktop size with `clamp(34px, 4.8vw, 56px)`. At up to 700px, the final source override is `clamp(26px, calc(8.8vw - 2px), 56px)`, with line height (1). The older mobile clamp and (12ch) measure are superseded. Supplied QA records two lines at 320/390/1440px and three at 768px.
- **Headline:** Base section heading hierarchy. Restored section headings allow up to (21ch), with local exceptions; mobile headings use (34px).
- **Title:** Base local heading hierarchy. Restored component titles deliberately vary: pain cards (25px), module panels (31px), roles (29px) and journey panels (34px). Their mobile counterparts are (24px), (27px), (27px) and (28px).
- **Body:** Main paragraphs, becoming (16px) at up to 700px. The hero lead uses (20px / 1.5), then (18px / 1.5) on mobile. Restored large copy uses (18px / 1.65), then (17px). The guide uses (17px / 1.75), then (16px / 1.75), within (72ch).
- **Label:** Base homepage summaries and interface copy. Current module labels use (15px / 1.4); mobile role labels use (14px), and FAQ summaries use (16px). The three restored shared tab systems retain their own local hierarchy.
- **Price:** The plan figure. Mobile size is (64px); its currency suffix uses Inter (19px, weight 500).

Inter Tight differs from the older Playfair Display recommendation in the retained brand guide. This is the implemented, task-specific homepage choice, not a change to every route.

## Layout

The content width is capped at (1240px), with desktop gutters (40px each), tablet gutters (24px each) below 1000px and mobile gutters (20px each) below 700px. The route uses CSS grid and flex layouts; it does not implement the older guide's literal 12/8/4 column system.

The hero is a two-column composition (1fr / 1.13fr), with copy first in the DOM and the existing hotel-room photograph with its original diagonal crop. The full restored sequence follows the table below. This is a record of this route, not a global page template.

| Order | Homepage surface | Actual destination |
| --- | --- | --- |
| 1 | Benefit, PMS explanation, demo action and quick links | `#home-title`, `#main` |
| 2 | Original interactive night demonstration | `#living-hotel` / `#living-hotel-m` |
| 3 | Five separate photographic pain cards | `#solutions` |
| 4 | Sales channels and Channel Manager | `#integrations` |
| 5 | Direct bookings | `#direct-booking` |
| 6 | Interactive reservation calendar | `#pms` |
| 7 | All nine modules | `#features` |
| 8 | Owner, reception and team roles; property formats | `#roles`, `#audience` |
| 9 | Five stages of the guest journey | `#journey` |
| 10 | Late-arrival case | `#case-proof-title` (heading destination) |
| 11 | Source-backed tariff and full calculator disclosure | `#pricing`, `#home-pricing-detail` |
| 12 | Founder and team context | `#author` |
| 13 | Implementation approach | `#unique` |
| 14 | Launch with the team | `#onboarding` |
| 15 | Demonstration and next step | `#demo`; `#next-step` immediately precedes it |
| 16 | FAQ | `#faq` |
| 17 | Final request | `#audit` |
| 18 | Visible SEO guide and internal resource links | `#guide`, topic IDs beginning `#home-guide-` |

Restored content sections use the recorded section rhythm, with component-specific spacing. The five pain cards form three cards above two wider cards on desktop, two columns plus a full-width final card below 1000px, and one column below 700px. Modules use a (270px) side navigation and one reading panel on desktop; the side navigation narrows to (220px) below 1000px and becomes a horizontally scrolling row below 900px. Role and guest-stage layouts retain their own proportions.

At up to 1000px the hero becomes equal columns and gaps tighten. At up to 700px the hero, calendar introduction, channels, direct-booking diagram, roles, journey, price summary, founder, demo and FAQ stack. Onboarding copy precedes its image. Quick links become a two-column grid, the FAQ photograph is hidden and the guide navigation loses its sticky position. The hero uses the same existing `hero-hotel.webp` photograph at every width. Its crop has a 14% diagonal left edge on desktop and 12% on mobile, matching the previous design. The image is 480px high on desktop, 430px below 1000px, and 320px below 700px. Module and journey tabs and the calendar scroll inside their own regions.

The night simulation uses its phone layout at up to 860px. Its homepage-specific height is capped at `calc(100svh - 104px)` with a matching minimum cap so the control row can fit below the sticky header. The scene remains the existing interactive SVG example, with its own internal layout and states.

At widths of at least 1100px hero actions stack vertically. The mobile action appears below 700px when the hero, either visible night scene, demo request, final action, guide-end request and footer are out of view; it also hides while the menu or a dialog is open. It reserves bottom space and includes the device safe-area inset.

**The Home Scope Rule.** Apply the restored homepage conventions only within the documented homepage boundary. Keep shared components and other routes under their existing authority.

## Elevation & Depth

The homepage uses tonal layering for its new and locally restyled surfaces. The calendar, pain cards, diagrams, module browser, case and founder container remove inherited shadows. Filled surfaces separate a reservation, selected control, price and disclosure. The hero photograph retains its diagonal silhouette without a surrounding card or shadow. Existing shared navigation, dialogs, calculator and the restored night simulation keep their own depth treatments; those inherited effects are not a new homepage shadow vocabulary.

## Shapes

Media, pain cards, calendar, diagrams, module browser, journey state, case and price figure use the surface radius. Current tabs, FAQ and calculator disclosure use the control radius. Primary actions use the pill radius. The reservation motif is a filled rounded rectangle grounded by the working calendar. The existing night scene retains its illustrated hotel geometry and internal control shapes.

## Components

### Buttons

Confident filled pills. The primary action has plum text on pink, a minimum height (58px), a gap (24px) and Inter (17px, weight 700). The final contact section reverses this to blush text on plum. Pointer hover lifts the button (2px) and changes its fill; press scales it to (.97). Transform and color transitions take (160ms). Mobile main actions fill their container.

Underlined text links are the secondary action, using Inter (16px, weight 600) with a generous vertical hit area. Hover increases underline thickness.

Focus within the homepage uses an outline (3px) and offset (5px), with the focus color token.

### Chips

The restored homepage has nine module controls, three role controls and five guest-stage controls. Shared `app.js` maintains the ARIA tabs/panels, selected state and roving tabindex. All three accept Left/Right/Home/End; the vertical module set also accepts Up/Down. Selection updates panel visibility immediately. Module selection uses plum and blush, while the journey selection uses pink on plum. Role controls have a minimum height (48px), module controls (58px, then 56px on mobile), and journey controls (64px).

The former four-tab `.home-tabs` component and its homepage-script keyboard handler are no longer rendered. Its frontmatter component entries and sidecar preview have been retired rather than carried forward as active metadata. Source does not establish the former claim that all panels appear without JavaScript: the initial selected panel is rendered and the others carry `hidden`.

### Cards / Containers

The five pain cards each retain a photograph, distinct existing SVG icon, title, explanatory copy and relevant action. The price figure is a filled pink surface with room-count context. The hero restores the existing hotel-room photograph `hero-hotel.webp`, identified and confirmed by the owner, with the previous diagonal crop. No text or example card overlays the image; its caption stays below it. Channels and direct bookings use filled diagrams with compatibility and connection conditions. The case keeps its descriptive route link. The two redundant uppercase diagram labels and the inherited communication timeline stripe have been removed in this homepage adaptation.

### Inputs / Fields

The homepage creates no new form-field system. Demo buttons open the existing audit request form with demo context. Shared fields retain their labels, text errors, consent handling and delivery flow. The sidecar's input preview is an extraction of that inherited field style: thin plum stroke, pale fill, (10px) corners, input text (16px), and an error background plus a text message. Calculator controls retain their established selectors and handlers; `pricing-core.js` remains authoritative for price and module status.

### Navigation

The shared sticky header and footer use the canonical raster logo. The homepage quick links lead to the actual calendar (`#pms`), all modules (`#features`), channels (`#integrations`) and tariff (`#pricing`). On mobile they form a two-column grid. Restored sections own their destinations as listed in Layout. The homepage script no longer remaps legacy anchors to unrelated retained sections. The visible guide supplies its own topic links.

### Working calendar

The existing calendar is retained as a labeled demonstration. It supports selecting a reservation, changing the week and filtering channels through shared `app.js`. The homepage supplies plum and soft surfaces, taller reservation rows (72px), non-shrinking booking text (14px) and the direct/online fills. It is visible without an entrance animation.

### Night simulation

The original animated interactive demonstration is restored before the five pains. Separate desktop and mobile fragments keep their IDs and handlers. The dispatcher loads the script for the current breakpoint (860px). Its night runs for (46 seconds), with mode switching, incidents and a summary. Copy explicitly labels its events, sums and indicators as conditional examples. It is not a video player or customer evidence.

### Disclosures

FAQ uses native details and summary elements. The arrow changes orientation when open. The existing full pricing calculator sits in another native disclosure so its controls remain available without extending the default page. This is a homepage presentation decision, not a replacement of the pricing route.

### Motion

The homepage script uses the Web Animations API with one-time intersection triggers. Onboarding steps move horizontally (16px, 360ms) with a short stagger (60ms); the price figure settles from scale (.98, 420ms). The hotel-room photograph settles once over 720ms with the existing exponential ease-out, from scale 1.02 to 1 within a fixed diagonal crop. It is visible without JavaScript. The animation is skipped for reduced motion and paused while the document is hidden. Section-heading fades have been removed.

The homepage easing is cubic-bezier(.23, 1, .32, 1). Shared `app.js` also retains its existing component entrance feedback and pointer-triggered panel transition (240ms, 8px); keyboard tab selection and calendar changes stay immediate. This is inherited behavior rather than a new universal motion rule.

The night simulation advances while in view and the document is visible. Its existing reduced-motion branches place moving figures immediately and suppress selected effects, while the scenario state still progresses. Homepage CSS disables CSS animation and transitions in reduced motion; the homepage script skips decorative entrances and cancels its active animations if that preference changes. Do not infer that every timer or inherited animation is canceled dynamically.

**The Visible Baseline Rule.** Reading content is visible before decorative animation. Reduced motion suppresses decorative movement while interactions keep their meaning.

These are source-grounded descriptions. `RESTORATION_QA.md` states that reduced motion was reviewed in code because system-mode emulation was unavailable. This pass does not claim an interactive no-JavaScript review or full night-state coverage from still captures.

## Do's and Don'ts

### Do:

- Do keep the restored homepage styles scoped to the homepage boundary.
- Do preserve the canonical raster wordmark and its proportions.
- Do use the recorded Inter Tight and Inter hierarchy for this homepage.
- Do show illustrative UI and generated hospitality imagery with the factual labels present in the implementation.
- Do preserve visible focus, keyboard tab selection and native disclosure behavior.
- Do preserve source-based reduced-motion behavior and visible reading content.

### Don't:

- Don't apply the homepage's local typography, spacing or radii across other routes without a separate task.
- Don't replace the canonical wordmark with text or an older vector adaptation.
- Don't promote demo data, generated imagery or in-development modules into product proof.
- Don't introduce Unicode U+2014 or encoded equivalents into public content.
- Don't treat this document, its preview snippets or QA notes as release approval.

The older guide's serif recommendation, grid and larger card radii have not been reconciled globally. Small inherited shared text, unused compact CSS and any remaining craft-floor findings are recorded as drift rather than reusable house rules. This pass does not repair them. The source retains the older `data-homepage="compact-v1"` compatibility marker alongside the actual `restored-full-v3` revision; the former does not name the current structure. No conversion uplift, owner approval or deployment is asserted.

