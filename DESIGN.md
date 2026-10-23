---
name: VDALO compact homepage
description: Implemented homepage conventions scoped to the October 2026 compact surface
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
    fontSize: "clamp(50px, 4.4vw, 66px)"
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
  tab:
    backgroundColor: "{colors.tab-surface}"
    textColor: "{colors.plum}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
  tab-selected:
    backgroundColor: "{colors.plum}"
    textColor: "{colors.blush}"
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

# Design System: VDALO compact homepage

## Overview

**Creative North Star: "A confirmed reservation"**

This document records the compact homepage implementation dated 24 October 2026. Its filled surfaces, hotel photography and reservation rectangles express the existing plum and pink identity through practical hotel work. The reservation is a motif observed in this surface; it is not a new global composition rule.

The token layer and component conventions below apply to the content inside `.homepage-2026`, plus the documented `body.homepage-shell` background and mobile-action spacing. They do not replace the visual systems of the other approximately 70 routes, the shared header and footer, the shared forms or the existing calculator. The retained brand guide and editorial standards remain authoritative; this file describes the implemented homepage where the route deliberately differs.

Source evidence is `versions/v1/homepage.mjs`, `versions/v1/public/homepage.css` and `versions/v1/public/homepage.js`, with inherited styles sampled from the shared bundle. No browser, launcher or deployment was run for this documentation pass. The separate finish review and owner review remain separate decisions.

**Key Characteristics:**

- Plum fields, pink actions and warm paper with tonal surface changes.
- Inter Tight headings and Inter body and interface text.
- Filled reservation geometry, softly rounded media and pill actions.
- Immediate controls, visible HTML and short optional motion.

## Colors

Plum anchors the system, pink identifies action and price, and pale warm surfaces group the work.

### Primary

- **Plum:** Text on light surfaces; hero and pricing fields; selected role and final action.
- **Spark Pink:** Main demo buttons, the price figure and the final contact section.

### Neutral

- **Paper:** Base page, FAQ answers and expanded calculator surface.
- **Blush:** Text on plum and the illustrative arrival state.
- **Soft Surface:** Calendar and FAQ grouping.
- **Workflow Surface:** Role workflow and reading panel.
- **Tab Surface / Tab Hover:** Unselected role controls and their pointer hover.
- **Plum Lifted / Pink Hover:** The darker and lighter pointer states for active controls.
- **Focus:** Keyboard outline and small onboarding markers.
- **Direct Booking / Online Booking:** Filled calendar reservations; channel meaning also remains in labels.

**The Existing Identity Rule.** Preserve the pinned plum and pink palette, the Inter family and the canonical raster wordmark.

The sidecar's tonal ramps are generated preview aids. They are not additional production color tokens.

## Typography

**Display Font:** Inter Tight, then Inter and sans-serif.  
**Body Font:** Inter, then Arial and sans-serif.

The compact, heavy headings are grounded by readable body copy and plain interface labels. Headings use balanced wrapping; paragraphs use pretty wrapping. The base heading weight comes from the shared stylesheet.

### Hierarchy

- **Display:** Hero statement. Its two lines include an authored break. At widths up to 1000px it uses a tablet clamp (34px, 4.8vw, 56px); up to 700px it uses a mobile clamp (32px, 10vw, 64px), line height (1) and a narrow measure (12ch).
- **Headline:** Section headings, usually no wider than (18ch). On mobile their size is (34px). Smaller local headings identify channels, founder context and expanded pricing.
- **Title:** Workflow headings. On mobile their size is (27px).
- **Body:** Main paragraphs. At up to 700px their size becomes (16px). The hero lead uses (20px / 1.5), then (18px / 1.5) on mobile. Typical supporting copy is constrained to (35–50ch).
- **Label:** Role buttons and FAQ summaries. Mobile role labels use (14px); FAQ summaries use (16px).
- **Price:** The plan figure. Mobile size is (64px); its currency suffix uses Inter (19px, weight 500).

Inter Tight differs from the older Playfair Display recommendation in the retained brand guide. This is the implemented, task-specific homepage choice, not a change to every route.

## Layout

The content width is capped at (1240px), with desktop gutters (40px each), tablet gutters (24px each) below 1000px and mobile gutters (20px each) below 700px. The route uses CSS grid and flex layouts; it does not implement the older guide's literal 12/8/4 column system.

The hero is a two-column composition (1fr / 1.13fr), with copy first in the DOM and a photo with an illustrative arrival overlay. The section rhythm comes from the frontmatter; channels and final contact use their own compact padding. Workflow, onboarding, pricing, founder and FAQ layouts each fit their content rather than sharing an identical card grid.

At up to 1000px the hero becomes equal columns, gaps tighten and founder/reading content becomes one outer column. At up to 700px the hero, calendar introduction, workflows, channels, price summary and FAQ stack. Onboarding copy precedes its image. Quick links become a two-column grid, and the decorative FAQ photograph is hidden. The hero changes to a dedicated image asset at up to 600px.

At widths of at least 1100px hero actions stack vertically. The mobile action appears only below 700px and only when the hero, final action and footer are out of view; it also hides while the menu or a dialog is open. It reserves bottom space and includes the device safe-area inset.

**The Home Scope Rule.** Apply the compact-home conventions only within the documented homepage boundary. Keep shared components and other routes under their existing authority.

## Elevation & Depth

The compact homepage uses tonal layering rather than new shadows. The calendar explicitly removes its inherited border and shadow. Filled surfaces separate a reservation, an arrival, a selected role, a price and a disclosure. Existing shared navigation, dialogs and calculator retain their own depth rules; their inherited shadows are not a new homepage token vocabulary.

## Shapes

Media, the calendar shell, price figure and reading panel use the surface radius. Tabs, arrival state, FAQ and calculator disclosure use the control radius. Primary actions use the pill radius. The reservation motif is a filled rounded rectangle, grounded by the working calendar rather than a separate decorative shape.

## Components

### Buttons

Confident filled pills. The primary action has plum text on pink, a minimum height (58px), a gap (24px) and Inter (17px, weight 700). The final contact section reverses this to blush text on plum. Pointer hover lifts the button (2px) and changes its fill; press scales it to (.97). Transform and color transitions take (160ms). Mobile main actions fill their container.

Underlined text links are the secondary action, using Inter (16px, weight 600) with a generous vertical hit area. Hover increases underline thickness.

Focus within the homepage uses an outline (3px) and offset (5px), with the focus color token.

### Chips

Role tabs are filled rectangular controls, not a general tag system. Unselected tabs use the tab surface; selection uses plum with blush text. The implementation has ARIA tabs and panels, roving tabindex and Left/Right/Home/End key handling. Selecting a role is immediate; press scales the control to (.98). Without JavaScript, the tab bar is hidden and all role panels are shown.

### Cards / Containers

The price figure is a filled pink surface with the price hierarchy and room-count context. The arrival overlay is blush on a photo and is explicitly labeled as an example. The reading panel is a tonal container for existing resource links. These containers add no homepage shadow.

### Inputs / Fields

The compact homepage creates no new form-field system. Demo buttons open the existing audit request form. Shared fields retain their labels, text errors, consent handling and delivery flow. The sidecar's input preview is an extraction of that inherited field style, not a new homepage primitive: thin plum stroke, pale fill, (10px) corners, input text (16px), and an error background plus a text message. Calculator controls retain their established selectors and handlers.

### Navigation

The shared sticky header and footer remain existing components, with the canonical raster logo. The compact homepage adds a simple quick-link row with icons, unadorned text and section anchors. On mobile it becomes a two-column grid. Old homepage anchor aliases are mapped to their nearest retained section by the homepage script.

### Working calendar

The existing calendar is retained as a labeled demonstration. It supports selecting a reservation, changing the week and filtering channels. The homepage supplies plum and soft surfaces, taller reservation rows (72px), non-shrinking booking text (14px) and the direct/online fills. It is visible without an entrance animation.

### Disclosures

FAQ uses native details and summary elements. The arrow changes orientation when open. The existing full pricing calculator sits in another native disclosure so its controls remain available without extending the default page. This is a homepage presentation decision, not a replacement of the pricing route.

### Motion

The page uses the Web Animations API with one-time intersection triggers and no new animation dependency. Headings fade briefly (420ms); onboarding steps move horizontally (16px, 360ms) with a short stagger (60ms); the price figure settles from scale (.98, 420ms). The arrival enters vertically (20px, 650ms) after a short delay (180ms). The hero image settles once from scale (1.025) over (12000ms, linear), pausing while the document is hidden.

The shared homepage easing is cubic-bezier(.23, 1, .32, 1). Reduced motion removes animation and transitions; changing that preference cancels active homepage animations. Calendar changes and keyboard tab selection stay immediate.

**The Visible Baseline Rule.** Content is visible before animation. Reduced motion removes decoration while interactions keep their meaning.

Source review supports these fallback descriptions. QA.md explicitly records that reduced-motion and no-JavaScript modes were not interactively exercised in its browser environment.

## Do's and Don'ts

### Do:

- Do keep the compact-home styles scoped to the homepage boundary.
- Do preserve the canonical raster wordmark and its proportions.
- Do use the recorded Inter Tight and Inter hierarchy for this homepage.
- Do show illustrative UI and generated hospitality imagery with the factual labels present in the implementation.
- Do preserve visible focus, keyboard tab selection and native disclosure behavior.
- Do preserve reduced-motion behavior and HTML visibility when enhancement is unavailable.

### Don't:

- Don't apply the compact homepage's typography, spacing or radii across the other routes without a separate task.
- Don't replace the canonical wordmark with text or an older vector adaptation.
- Don't promote demo data, generated imagery or in-development modules into product proof.
- Don't introduce Unicode U+2014 or encoded equivalents into public content.
- Don't treat this document, its preview snippets or QA notes as release approval.

The older guide's serif type, grid and larger card radii have not been reconciled globally. This document records the homepage exceptions and preserves that guide. Small inherited shared text and any findings from the separate visual reviewer are not canonized by this file. No conversion uplift, owner approval or production deployment is asserted.

