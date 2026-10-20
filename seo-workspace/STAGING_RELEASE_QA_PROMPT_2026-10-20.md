# Prompt for staging release QA

Use this prompt before preparing a VDALO website change for staging:

> Act as an independent release QA reviewer for the VDALO website. Inspect the active branch, its base branch, all commits, tracked and untracked changes, and the full release diff. Do not discard, rewrite, push, or deploy changes. Confirm that every file belongs to the requested release and that production and server deployment configuration are untouched. Run the complete Node test suite, the pricing check, schema validation, content and SEO audit, and production build for QR Studio. Review page metadata, routes, sitemap, internal links, robots directives, asset references, navigation behavior, keyboard and touch interaction, mobile layout rules, analytics event behavior, image and font loading, and critical CSS. Confirm that homepage video or animation assets have not been removed. Check for merge conflicts, whitespace errors, accidental secrets, unresolved regressions, and incomplete commits. Perform two separate review passes: first validate the release state and automated checks; second review the actual diff for correctness, UX, SEO, accessibility, and release risk. Report blockers separately from limitations that can only be checked after staging. Mark ready for staging only when every local blocker is resolved. Never claim a browser or Lighthouse result that was not actually observed.

## Two-pass QA recorded on 2026-10-20

### Pass 1: branch and automated validation

- Active branch: `codex/responsive-ux-pass`.
- Base: `origin/staging` at `eb070a4`; the pre-existing branch commit `54bbc1a` is one commit ahead of that base.
- `node --test`: 139 passed, 0 failed.
- `node scripts/check-prices.mjs`: passed.
- `node scripts/validate-schema.mjs`: 90 of 90 routes validated, 0 errors.
- `node scripts/audit-content-seo.mjs`: 92 active content pages, 92 unique titles, 92 unique descriptions, 57 local images checked, 2,591 internal route edges, 0 orphan pages.
- `qr-lab`: `npm run build` passed. Vite reports one large `fontkit` chunk (716.76 KB); this is a non-blocking bundle-size warning.
- `git diff --check`: passed. Git emitted only line-ending conversion warnings for existing audit CSV/Markdown files.
- No merge-conflict files were found.

### Pass 2: release diff and UX/SEO review

- Reviewed the changes to critical CSS extraction, self-hosted font loading, responsive image variants, desktop navigation hover/focus behavior, Escape handling, campaign robots metadata, sitemap `lastmod`, calculator analytics, pricing state labels, QR Studio copy/layout, and their regression tests.
- Reviewed local asset URL handling against the server's static asset route and confirmed the referenced fonts are served under the allowed `/assets/` path.
- Confirmed that the existing second homepage section (`Живий готель`) and its desktop/mobile CSS and JavaScript assets remain in the source and were not removed by the performance changes. The currently configured hero video remains hidden because `heroVideo` is `null`; the `Живий готель` section is an interactive animation, not a video file.
- No critical or high-severity issue was found in the reviewed diff.
- Release review is local only. No push or deploy was performed as part of this QA.

## Staging verification still required after deployment

- Open the staging homepage and key routes in a real browser at desktop, tablet, and mobile widths.
- Confirm the menu hover, keyboard focus, touch disclosure, and Escape behavior visually and interactively.
- Confirm the homepage hero, the `Живий готель` section, video/animation presentation, local fonts, and responsive images load without layout shift or broken assets.
- Re-run Lighthouse/PageSpeed on staging to measure LCP, CLS, and contrast findings. Local automated checks cannot prove deployed performance or real-browser rendering.

These staging checks are post-deploy smoke checks and do not block the code from being sent to the staging environment. Production must remain unchanged until staging review is accepted.
