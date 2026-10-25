# VDALO implementation register

Date: 2026-10-25
Repository: `vdalo-site-homepage-oct24`
Branch: `codex/implementation-pack-oct25`
Release state: local changes only. No push, staging deploy, or production deploy.

## Scope and rules

- The 70 prepared content revisions were compared with the active revision registry and existing site implementation. They were already carefully adapted in the repository, so this pass preserves them and does not bulk-replace live page content.
- Public product claims remain limited to checked product truth. Product pages and incomplete product claims were not published from draft packs.
- No long em dash character was added to public website copy.
- Only public, checksum-verified files from the website starter pack are exposed. Internal source indexes, competitor research, and migration metadata are not served.
- New calculators run in the visitor's browser. Financial inputs are not sent to an endpoint. Housekeeping results stay in the current page and are only saved if the user downloads the JSON.

## Prepared page revisions

All 70 registered revisions were compared with the active registry and current implementation. The prepared page revision files are already adapted and available at their existing canonical URLs. This pass retained them without mass replacement. The content package test covers one H1, metadata, index policy, forms, local links, anchors, authors/dates and preservation of product and funnel routes.

| ID | Canonical route | Source revision | Existing state | Action | Canonical owner | Check | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P001 | `/blog/channel-manager-ical-gotelyu` | `versions/v1/content-revisions/pages/P001_blog__channel-manager-ical-gotelyu.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/channel-manager-ical-gotelyu | `node --test tests/content-package.test.mjs` | Already present |
| P002 | `/blog/pryami-bronyuvannya-ta-vidzhet-gotelyu` | `versions/v1/content-revisions/pages/P002_blog__pryami-bronyuvannya-ta-vidzhet-gotelyu.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/pryami-bronyuvannya-ta-vidzhet-gotelyu | `node --test tests/content-package.test.mjs` | Already present |
| P003 | `/blog/shakhmatka-bronyuvan-gotelyu` | `versions/v1/content-revisions/pages/P003_blog__shakhmatka-bronyuvan-gotelyu.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/shakhmatka-bronyuvan-gotelyu | `node --test tests/content-package.test.mjs` | Already present |
| P004 | `/blog/perehid-na-pms-bez-vtraty-danyh` | `versions/v1/content-revisions/pages/P004_blog__perehid-na-pms-bez-vtraty-danyh.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/perehid-na-pms-bez-vtraty-danyh | `node --test tests/content-package.test.mjs` | Already present |
| P005 | `/blog/yak-gotelyu-prodavaty-dodatkovi-poslugy` | `versions/v1/content-revisions/pages/P005_blog__yak-gotelyu-prodavaty-dodatkovi-poslugy.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/yak-gotelyu-prodavaty-dodatkovi-poslugy | `node --test tests/content-package.test.mjs` | Already present |
| P006 | `/blog/pidhotovka-zaselennya-gostya` | `versions/v1/content-revisions/pages/P006_blog__pidhotovka-zaselennya-gostya.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/pidhotovka-zaselennya-gostya | `node --test tests/content-package.test.mjs` | Already present |
| P007 | `/blog/status-gotovnosti-nomera-housekeeping` | `versions/v1/content-revisions/pages/P007_blog__status-gotovnosti-nomera-housekeeping.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/status-gotovnosti-nomera-housekeeping | `node --test tests/content-package.test.mjs` | Already present |
| P008 | `/blog/shcho-avtomatyzuvaty-v-goteli-pershym` | `versions/v1/content-revisions/pages/P008_blog__shcho-avtomatyzuvaty-v-goteli-pershym.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/shcho-avtomatyzuvaty-v-goteli-pershym | `node --test tests/content-package.test.mjs` | Already present |
| P009 | `/blog/shcho-take-pms-dlya-gotelyu` | `versions/v1/content-revisions/pages/P009_blog__shcho-take-pms-dlya-gotelyu.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/shcho-take-pms-dlya-gotelyu | `node --test tests/content-package.test.mjs` | Already present |
| P010 | `/blog/yak-obraty-pms-dlya-gotelyu` | `versions/v1/content-revisions/pages/P010_blog__yak-obraty-pms-dlya-gotelyu.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/yak-obraty-pms-dlya-gotelyu | `node --test tests/content-package.test.mjs` | Already present |
| P011 | `/blog/qr-kody-dlya-goteliv` | `versions/v1/content-revisions/pages/P011_blog__qr-kody-dlya-goteliv.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/qr-kody-dlya-goteliv | `node --test tests/content-package.test.mjs` | Already present |
| P012 | `/blog/qr-wifi-dlya-gotelyu` | `versions/v1/content-revisions/pages/P012_blog__qr-wifi-dlya-gotelyu.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/qr-wifi-dlya-gotelyu | `node --test tests/content-package.test.mjs` | Already present |
| P013 | `/blog/qr-kartka-v-nomer-gotelyu` | `versions/v1/content-revisions/pages/P013_blog__qr-kartka-v-nomer-gotelyu.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/qr-kartka-v-nomer-gotelyu | `node --test tests/content-package.test.mjs` | Already present |
| P014 | `/blog/turystychnyi-zbir-gotel-ukraina` | `versions/v1/content-revisions/pages/P014_blog__turystychnyi-zbir-gotel-ukraina.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/turystychnyi-zbir-gotel-ukraina | `node --test tests/content-package.test.mjs` | Already present |
| P015 | `/blog/rozrakhunok-turystychnoho-zboru-2026` | `versions/v1/content-revisions/pages/P015_blog__rozrakhunok-turystychnoho-zboru-2026.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/rozrakhunok-turystychnoho-zboru-2026 | `node --test tests/content-package.test.mjs` | Already present |
| P016 | `/cases/guest-services-glamping` | `versions/v1/content-revisions/pages/P016_cases__guest-services-glamping.md` | Adapted revision present | Preserve; no bulk overwrite | /cases/guest-services-glamping | `node --test tests/content-package.test.mjs` | Already present |
| P017 | `/cases/direct-bookings-calendar` | `versions/v1/content-revisions/pages/P017_cases__direct-bookings-calendar.md` | Adapted revision present | Preserve; no bulk overwrite | /cases/direct-bookings-calendar | `node --test tests/content-package.test.mjs` | Already present |
| P018 | `/cases/hotel-booking-reconciliation` | `versions/v1/content-revisions/pages/P018_cases__hotel-booking-reconciliation.md` | Adapted revision present | Preserve; no bulk overwrite | /cases/hotel-booking-reconciliation | `node --test tests/content-package.test.mjs` | Already present |
| P019 | `/cases/night-self-checkin-germany` | `versions/v1/content-revisions/pages/P019_cases__night-self-checkin-germany.md` | Adapted revision present | Preserve; no bulk overwrite | /cases/night-self-checkin-germany | `node --test tests/content-package.test.mjs` | Already present |
| P020 | `/cases/hotel-data-migration` | `versions/v1/content-revisions/pages/P020_cases__hotel-data-migration.md` | Adapted revision present | Preserve; no bulk overwrite | /cases/hotel-data-migration | `node --test tests/content-package.test.mjs` | Already present |
| P021 | `/cases/booking-widget-study-2118` | `versions/v1/content-revisions/pages/P021_cases__booking-widget-study-2118.md` | Adapted revision present | Preserve; no bulk overwrite | /cases/booking-widget-study-2118 | `node --test tests/content-package.test.mjs` | Already present |
| P022 | `/` | `versions/v1/content-revisions/pages/P022_home.md` | Adapted revision present | Preserve; no bulk overwrite | / | `node --test tests/content-package.test.mjs` | Already present |
| P023 | `/about` | `versions/v1/content-revisions/pages/P023_about.md` | Adapted revision present | Preserve; no bulk overwrite | /about | `node --test tests/content-package.test.mjs` | Already present |
| P024 | `/contact` | `versions/v1/content-revisions/pages/P024_contact.md` | Adapted revision present | Preserve; no bulk overwrite | /contact | `node --test tests/content-package.test.mjs` | Already present |
| P025 | `/sign-up` | `versions/v1/content-revisions/pages/P025_sign-up.md` | Adapted revision present | Preserve; no bulk overwrite | /sign-up | `node --test tests/content-package.test.mjs` | Already present |
| P026 | `/hotel-automation` | `versions/v1/content-revisions/pages/P026_hotel-automation.md` | Adapted revision present | Preserve; no bulk overwrite | /hotel-automation | `node --test tests/content-package.test.mjs` | Already present |
| P027 | `/authors` | `versions/v1/content-revisions/pages/P027_authors.md` | Adapted revision present | Preserve; no bulk overwrite | /authors | `node --test tests/content-package.test.mjs` | Already present |
| P028 | `/authors/oleh-stepeniev` | `versions/v1/content-revisions/pages/P028_authors__oleh-stepeniev.md` | Adapted revision present | Preserve; no bulk overwrite | /authors/oleh-stepeniev | `node --test tests/content-package.test.mjs` | Already present |
| P029 | `/authors/kostiantyn-tripailo` | `versions/v1/content-revisions/pages/P029_authors__kostiantyn-tripailo.md` | Adapted revision present | Preserve; no bulk overwrite | /authors/kostiantyn-tripailo | `node --test tests/content-package.test.mjs` | Already present |
| P030 | `/blog` | `versions/v1/content-revisions/pages/P030_blog.md` | Adapted revision present | Preserve; no bulk overwrite | /blog | `node --test tests/content-package.test.mjs` | Already present |
| P031 | `/cases` | `versions/v1/content-revisions/pages/P031_cases.md` | Adapted revision present | Preserve; no bulk overwrite | /cases | `node --test tests/content-package.test.mjs` | Already present |
| P032 | `/tools/` | `versions/v1/content-revisions/pages/P032_tools.md` | Adapted revision present | Preserve; no bulk overwrite | /tools/ | `node --test tests/content-package.test.mjs` | Already present |
| P033 | `/tools/hotel-profitability-calculator/` | `versions/v1/content-revisions/pages/P033_tools__hotel-profitability-calculator.md` | Adapted revision present | Preserve; no bulk overwrite | /tools/hotel-profitability-calculator/ | `node --test tests/content-package.test.mjs` | Already present |
| P034 | `/tools/pms-checklist/` | `versions/v1/content-revisions/pages/P034_tools__pms-checklist.md` | Adapted revision present | Preserve; no bulk overwrite | /tools/pms-checklist/ | `node --test tests/content-package.test.mjs` | Already present |
| P035 | `/tools/qr-studio/` | `versions/v1/content-revisions/pages/P035_tools__qr-studio.md` | Adapted revision present | Preserve; no bulk overwrite | /tools/qr-studio/ | `node --test tests/content-package.test.mjs` | Already present |
| P036 | `/pricing` | `versions/v1/content-revisions/pages/P036_pricing.md` | Adapted revision present | Preserve; no bulk overwrite | /pricing | `node --test tests/content-package.test.mjs` | Already present |
| P037 | `/privacy` | `versions/v1/content-revisions/pages/P037_privacy.md` | Adapted revision present | Preserve; no bulk overwrite | /privacy | `node --test tests/content-package.test.mjs` | Already present |
| P038 | `/offer` | `versions/v1/content-revisions/pages/P038_offer.md` | Adapted revision present | Preserve; no bulk overwrite | /offer | `node --test tests/content-package.test.mjs` | Already present |
| P039 | `/refunds` | `versions/v1/content-revisions/pages/P039_refunds.md` | Adapted revision present | Preserve; no bulk overwrite | /refunds | `node --test tests/content-package.test.mjs` | Already present |
| P040 | `/tourist-tax/cherkasy/` | `versions/v1/content-revisions/pages/P040_tourist-tax__cherkasy.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/cherkasy/ | `node --test tests/content-package.test.mjs` | Already present |
| P041 | `/tourist-tax/chernihiv/` | `versions/v1/content-revisions/pages/P041_tourist-tax__chernihiv.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/chernihiv/ | `node --test tests/content-package.test.mjs` | Already present |
| P042 | `/tourist-tax/berehove/` | `versions/v1/content-revisions/pages/P042_tourist-tax__berehove.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/berehove/ | `node --test tests/content-package.test.mjs` | Already present |
| P043 | `/tourist-tax/dnipro/` | `versions/v1/content-revisions/pages/P043_tourist-tax__dnipro.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/dnipro/ | `node --test tests/content-package.test.mjs` | Already present |
| P044 | `/tourist-tax/chernivtsi/` | `versions/v1/content-revisions/pages/P044_tourist-tax__chernivtsi.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/chernivtsi/ | `node --test tests/content-package.test.mjs` | Already present |
| P045 | `/tourist-tax/irpin/` | `versions/v1/content-revisions/pages/P045_tourist-tax__irpin.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/irpin/ | `node --test tests/content-package.test.mjs` | Already present |
| P046 | `/tourist-tax/ivano-frankivsk/` | `versions/v1/content-revisions/pages/P046_tourist-tax__ivano-frankivsk.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/ivano-frankivsk/ | `node --test tests/content-package.test.mjs` | Already present |
| P047 | `/tourist-tax/khust/` | `versions/v1/content-revisions/pages/P047_tourist-tax__khust.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/khust/ | `node --test tests/content-package.test.mjs` | Already present |
| P048 | `/tourist-tax/odesa/` | `versions/v1/content-revisions/pages/P048_tourist-tax__odesa.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/odesa/ | `node --test tests/content-package.test.mjs` | Already present |
| P049 | `/tourist-tax/lutsk/` | `versions/v1/content-revisions/pages/P049_tourist-tax__lutsk.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/lutsk/ | `node --test tests/content-package.test.mjs` | Already present |
| P050 | `/tourist-tax/lviv/` | `versions/v1/content-revisions/pages/P050_tourist-tax__lviv.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/lviv/ | `node --test tests/content-package.test.mjs` | Already present |
| P051 | `/tourist-tax/kyyiv/` | `versions/v1/content-revisions/pages/P051_tourist-tax__kyyiv.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/kyyiv/ | `node --test tests/content-package.test.mjs` | Already present |
| P052 | `/tourist-tax/kolomyya/` | `versions/v1/content-revisions/pages/P052_tourist-tax__kolomyya.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/kolomyya/ | `node --test tests/content-package.test.mjs` | Already present |
| P053 | `/tourist-tax/slavsko/` | `versions/v1/content-revisions/pages/P053_tourist-tax__slavsko.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/slavsko/ | `node --test tests/content-package.test.mjs` | Already present |
| P054 | `/tourist-tax/polyana/` | `versions/v1/content-revisions/pages/P054_tourist-tax__polyana.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/polyana/ | `node --test tests/content-package.test.mjs` | Already present |
| P055 | `/tourist-tax/skole/` | `versions/v1/content-revisions/pages/P055_tourist-tax__skole.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/skole/ | `node --test tests/content-package.test.mjs` | Already present |
| P056 | `/tourist-tax/rivne/` | `versions/v1/content-revisions/pages/P056_tourist-tax__rivne.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/rivne/ | `node --test tests/content-package.test.mjs` | Already present |
| P057 | `/tourist-tax/pivdenne/` | `versions/v1/content-revisions/pages/P057_tourist-tax__pivdenne.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/pivdenne/ | `node --test tests/content-package.test.mjs` | Already present |
| P058 | `/tourist-tax/ternopil/` | `versions/v1/content-revisions/pages/P058_tourist-tax__ternopil.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/ternopil/ | `node --test tests/content-package.test.mjs` | Already present |
| P059 | `/tourist-tax/vinnytsya/` | `versions/v1/content-revisions/pages/P059_tourist-tax__vinnytsya.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/vinnytsya/ | `node --test tests/content-package.test.mjs` | Already present |
| P060 | `/tourist-tax/uzhhorod/` | `versions/v1/content-revisions/pages/P060_tourist-tax__uzhhorod.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/uzhhorod/ | `node --test tests/content-package.test.mjs` | Already present |
| P061 | `/tourist-tax/tyachiv/` | `versions/v1/content-revisions/pages/P061_tourist-tax__tyachiv.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/tyachiv/ | `node --test tests/content-package.test.mjs` | Already present |
| P062 | `/tourist-tax/sumy/` | `versions/v1/content-revisions/pages/P062_tourist-tax__sumy.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/sumy/ | `node --test tests/content-package.test.mjs` | Already present |
| P063 | `/tourist-tax/zaporizhzhya/` | `versions/v1/content-revisions/pages/P063_tourist-tax__zaporizhzhya.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/zaporizhzhya/ | `node --test tests/content-package.test.mjs` | Already present |
| P064 | `/tourist-tax/yaremche/` | `versions/v1/content-revisions/pages/P064_tourist-tax__yaremche.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/yaremche/ | `node --test tests/content-package.test.mjs` | Already present |
| P065 | `/tourist-tax/yasinya/` | `versions/v1/content-revisions/pages/P065_tourist-tax__yasinya.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/yasinya/ | `node --test tests/content-package.test.mjs` | Already present |
| P066 | `/tourist-tax/zhytomyr/` | `versions/v1/content-revisions/pages/P066_tourist-tax__zhytomyr.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/zhytomyr/ | `node --test tests/content-package.test.mjs` | Already present |
| P067 | `/tourist-tax/vynohradiv/` | `versions/v1/content-revisions/pages/P067_tourist-tax__vynohradiv.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/vynohradiv/ | `node --test tests/content-package.test.mjs` | Already present |
| P068 | `/tourist-tax/` | `versions/v1/content-revisions/pages/P068_tourist-tax.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/ | `node --test tests/content-package.test.mjs` | Already present |
| P069 | `/tourist-tax/start` | `versions/v1/content-revisions/pages/P069_tourist-tax__start.md` | Adapted revision present | Preserve; no bulk overwrite | /tourist-tax/start | `node --test tests/content-package.test.mjs` | Already present |
| P070 | `/blog/qr-kody-dlya-restoranu` | `versions/v1/content-revisions/pages/P070_blog__qr-kody-dlya-restoranu.md` | Adapted revision present | Preserve; no bulk overwrite | /blog/qr-kody-dlya-restoranu | `node --test tests/content-package.test.mjs` | Already present |

## Website tools and resources

Every proposal was matched to the existing canonical route where applicable. New routes are added to the existing tools catalog and sitemap only after local implementation and schema checks.

| Item | Source | Existing state | Action | Canonical owner | Check | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T01, ADR/RevPAR/OCC | `03_TOOLS_CHANNELS/T01.txt` | Existing hotel profitability calculator | Retain the existing first-screen calculation. | `/tools/hotel-profitability-calculator/` | Existing tool tests | Already present |
| T02, OTA and direct booking economics | `03_TOOLS_CHANNELS/T02.txt` | No dedicated calculator | Added client-side scenario calculator and CSV export. | `/tools/direct-booking-cost-calculator/` | `tests/tool-calculations.test.mjs` | Implemented |
| T03, room cost and break-even | `03_TOOLS_CHANNELS/T03.txt` | No dedicated calculator | Added bounded-input scenario calculator and CSV export. | `/tools/hotel-room-cost-calculator/` | `tests/tool-calculations.test.mjs` | Implemented |
| T04, room acceptance | `03_TOOLS_CHANNELS/T04.txt` | Text checklist asset available | Added interactive checklist, critical checks, print and explicit JSON export. Human confirms physical readiness. | `/tools/housekeeping-checklist/` | `tests/tool-calculations.test.mjs` | Implemented |
| T05, PMS choice checklist | `03_TOOLS_CHANNELS/T05.txt` | Existing 25-criterion comparison | Retained and extended with a separate TCO module. | `/tools/pms-checklist/` | Content and tools tests | Already present, extended |
| T06, QR Studio | `03_TOOLS_CHANNELS/T06.txt` | Existing QR Studio | Retained. | `/tools/qr-studio/` | Existing tools tests | Already present |
| T07, PMS TCO | `03_TOOLS_CHANNELS/T07.txt` | Not present in checklist | Added 1-60 month comparison for up to three quotes; unknown costs must be entered explicitly; internal time stays separate from cash cost. | `/tools/pms-checklist/` | TCO control example in `tests/tool-calculations.test.mjs` | Implemented |
| T08, review response | `03_TOOLS_CHANNELS/T08.txt` | No dedicated page or API config | Added honest local templates only. No AI, API, server storage, or auto-publishing claim. | `/tools/hotel-review-response/` | Tools tests and page renderer checks | Implemented, template-only |
| T09, guest message builder | `03_TOOLS_CHANNELS/T09.txt` | No interactive builder | Added local UA/EN drafts for nine guest communication scenarios, copy and TXT download. | `/tools/guest-message-builder/` | Tools tests and page renderer checks | Implemented |
| T10, loyalty model | `03_TOOLS_CHANNELS/T10.txt` | No calculator | Deferred because the rollout order requires demand validation first. | Proposed `/tools/hotel-loyalty-calculator/` remains unpublished | No test; not in sitemap/catalog | Deferred |
| T11, hotel market research | `03_TOOLS_CHANNELS/T11.txt` | Existing evidence is not sufficient for a reproducible dataset | No new public dataset or claims added. Primary data, method, denominators, and permissions are required. | Existing case URL only | No public result added | Blocked by missing research source |
| T12, tourist tax | `03_TOOLS_CHANNELS/T12.txt` | Existing sourced directory and calculators | Retained current rules, sources, routes, and conservative conflict handling. | `/tourist-tax/` and released city routes | Full test suite and schema checks | Already present |
| T13, booking calendar | `03_TOOLS_CHANNELS/T13.txt` | Existing product page | No new product claims or mock demo added. Needs verified product artifact and status. | `/hotel-booking-calendar` | Product evidence required | Blocked by product verification |
| T14, direct booking module | `03_TOOLS_CHANNELS/T14.txt` | Existing product page | No new capability claims. Needs verified workflow and current status. | `/hotel-direct-booking` | Product evidence required | Blocked by product verification |
| T15, channel manager | `03_TOOLS_CHANNELS/T15.txt` | Existing product page | No new integration statuses. Needs current compatibility evidence. | `/hotel-channel-manager` | Product evidence required | Blocked by integration verification |
| T16, rate shopper | `03_TOOLS_CHANNELS/T16.txt` | Product status unverified | No released feature claims added. | Existing relevant product page only | Product evidence required | Blocked by product verification |
| T17, price optimizer | `03_TOOLS_CHANNELS/T17.txt` | Product status unverified | No released feature claims added. | Existing relevant product page only | Product evidence required | Blocked by product verification |
| T18, reputation module | `03_TOOLS_CHANNELS/T18.txt` | Product status unverified | No released feature claims added. | Existing relevant product page only | Product evidence required | Blocked by product verification |
| T19, guest segmentation/GMS | `03_TOOLS_CHANNELS/T19.txt` | Product status unverified | No released feature claims added. | Existing relevant product page only | Product evidence required | Blocked by product verification |
| T20, guest payment links | `03_TOOLS_CHANNELS/T20.txt` | Payment capabilities need verification | No payment or payment-link claims added. | Existing relevant product page only | Product and payment evidence required | Blocked by product verification |
| F01, extended hotel KPIs | `04_COMPETITOR_FREE_TOOLS/F01.txt` | Existing T01 is limited to RevPAR and monthly scenario | Added optional TRevPAR, GOPPAR, TRevPAB, cohort ALOS, and a user-entered MPI/ARI/RGI ratio. | `/tools/hotel-profitability-calculator/` | Formula boundary tests | Implemented |
| F02, admin time | `04_COMPETITOR_FREE_TOOLS/F02.txt` | No local time calculator | Added local before/after model, separates time resource value from possible payroll reduction, and exports CSV. | `/tools/hotel-admin-time-calculator/` | Prepared 47.5/25/22.5 hour example | Implemented |
| F03, hotel website checklist | `04_COMPETITOR_FREE_TOOLS/F03.txt` | No manual checklist tool | Added 24-point manual review, open-action summary, JSON export and print. Does not scan a site. | `/tools/hotel-website-checklist/` | 24-item renderer test | Implemented |
| F04, PMS migration file review | `04_COMPETITOR_FREE_TOOLS/F04.txt` | No agreed production import contract | No file parser or migration readiness claim added. Needs real import schema and authorized test fixture. | Proposed `/tools/pms-migration-check/` remains unpublished | No migration run | Blocked by missing import contract |
| F05, shift handover | `04_COMPETITOR_FREE_TOOLS/F05.txt` | Original handover text asset in starter resources | Made the verified text template downloadable from the resource hub; no PMS synchronization claim. | `/resources` and `/downloads/hotel/frontdesk_shift.txt` | Resource hash verification | Already present as template |
| F06, housekeeping workload | `04_COMPETITOR_FREE_TOOLS/F06.txt` | Workbook asset only | Added local capacity model with deficits, zero-worker and zero-task handling, and CSV export. | `/tools/housekeeping-workload-calculator/` | 790/750/-40 sample test | Implemented |
| F07, cancellation impact | `04_COMPETITOR_FREE_TOOLS/F07.txt` | Workbook asset only | Added local net-retention/re-sale calculation; no payment or legal rule behavior. | `/tools/hotel-cancellation-cost-calculator/` | 3200/2500/700 sample test | Implemented |
| F08, guest content pack | `04_COMPETITOR_FREE_TOOLS/F08.txt` | Guest template files and T09 planned | Extended T09 with welcome, fact card, arrival-time request, group inquiry, checkout, thanks, and neutral feedback scenarios. | `/tools/guest-message-builder/` | Template modes and local-only behavior tests | Implemented, local template mode |
| F09, resources hub | `04_COMPETITOR_FREE_TOOLS/F09.txt` | No matching hub on current canonical | Added library at current `/resources` URL to avoid the proposed duplicate `/resources/templates/`. | `/resources` | 18 asset hashes and schema test | Implemented |
| F10, product demo and price evidence | `04_COMPETITOR_FREE_TOOLS/F10.txt` | Current price/demo evidence not available in approved sources | No invented pricing, demo, client logo, or capability proof added. | Existing pricing/product pages only | Evidence review required | Blocked by missing approved product evidence |
| T01-T20 / F01-F10 supporting files | Package source tree | Read-only source material | Original package sources left unchanged. | Not applicable | SHA-256 validated assets only | Retained |

## Resource files


| Resource set | Status | Disposition |
| --- | --- | --- |
| Website starter public resources | Implemented | 18 vetted files copied byte-for-byte to `versions/v1/public/downloads/hotel/`, checked against source hashes, and served through an allowlist. |
| Competitor pack internal files | Skipped | Research and source artifacts are not public website downloads. |
| Tools pack source indexes and internal metadata | Skipped | Kept out of the public asset directory and out of the public catalog. |

## Marketing and external distribution

| Package area | Status | Disposition |
| --- | --- | --- |
| C01-C16 distribution proposals | Skipped | No external messages, outreach, ad spend, account changes, or third-party publishing performed. |
| Draft product claims without evidence | Deferred | Must be checked against `02_PRODUCT_TRUTH.md`, `CURRENT_PUBLIC_CLAIMS.md`, and the supplied evidence rules before public use. |

## Validation performed

- `node --check versions/v1/public/tools.js` passed.
- `node --test tests/*.test.mjs` passed: 269 tests.
- `npm run validate:schema` passed: 102/102 routes, zero errors.
- Resource file hashes match the allowlist manifest.
- A local HTTP/browser smoke check could not be completed because the available local ports were already occupied and the shell's localhost socket access was blocked. Direct render, content, calculations, route/schema, and asset-integrity tests passed; live staging behavior remains to be reviewed after an authorized deploy.

## Release boundary

This register describes a local implementation only. Changes have not been pushed or deployed. Review the diff and staging configuration before a staging release. Do not promote to the main domain from this work without a separate release decision.
