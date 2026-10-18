# Tourist tax city batch checkpoint

## Latest handoff, 2026-10-14, after first-wave evidence review

- Current local release state: 16/30 first-wave routes calculate and are indexable in this checkout; 14/30 remain unavailable; the 347 records outside wave one also remain closed. Total unavailable: 361/377. This is not a production deployment claim.
- Added `FIRST_WAVE_EVIDENCE_MATRIX_2026-10-14.md`, a row-by-row review of all 30 destinations, city/community KATOTTG codes, official evidence available, Excel conflicts, calculator decision and the exact next action for unresolved cases.
- Uzhhorod and Slavsko were added to the local release set based on signed 2026 DPS forms. The calculator uses each form's universal rate row; both public page drafts explain the contradictory zero detail rows with a visible asterisk. Values from the supplied workbook are explicitly recorded as rejected candidates.
- A page-by-page comparison found workbook-rate conflicts on 14 of the 16 locally released pages. Their displayed rate cards now carry `*`, with copy identifying the supplied workbook values and the official rate or tier model used. The two existing Uzhhorod/Slavsko explanations remain the detailed treatment for their internally inconsistent DPS forms.
- Mukachevo remains closed. Its signed DPS Form 6 lists 0.5% / 0.5%, while a DPS report about 2025 and the published text of council decision №3487 show 0.5% / 0.6%; the workbook suggests 0.5% / 1%. The newly launched DPS tourism-tax dashboard may help reconcile this but its community row was not extractable in this pass. Details: `sources/mukachevo-2026-followup.md`.
- Added `sources/kamyanets-podilskyy-2026.md`. The current 2026 form identifies decision №114/29 and city/community codes, but the available extraction does not verify the rate or period. Prior 2025 universal rates are not carried forward. Zhytomyr has official 2026 city rates 0.25% / 2.5% recorded, but its full operative decision chain and coverage still block the calculator.
- Remaining blocked first-wave cities: Kyiv, Odesa, Dnipro, Kharkiv, Poltava, Zhytomyr, Bukovel, Truskavets, Yaremche, Skhidnytsia, Mukachevo, Kamianets-Podilskyi, Pylypets and Solotvyno.
- Latest QA: tests 90/90; batch check 377 records; data validation 0 structural errors, 13 unmatched settlement codes in the full dataset; schema 56/56; release audit 16 ready / 14 blocked. Rate calendar regenerated for all 30.
- Production was not modified and no deployment was performed.

## Rate change and review calendar, 2026-10-14

- Added `RATE_REVIEW_CALENDAR.md` and `exports/FIRST_WAVE_RATE_REVIEW_CALENDAR.csv` for all 30 first-wave places. The CSV keeps source workbook rates beside official verification status, rule period, known next effective dates, community/codes, next review date and review action.
- The workbook does not contain reliable future rate-change dates. For verified rates the next annual review is scheduled for 2026-12-01; closed candidates are queued for another official-source check on 2026-10-20. These are internal reminders, not claimed council changes.
- Verified upcoming transitions: Vinnytsia decision №3535 and Pivdenne decision №2626-VIII have a 2027-01-01 start. Skhidnytsia's proposed 2027 table is separately marked as a draft, not an adopted rule.
- The supplied rates materially conflict with the currently verified rules: 12 verified records differ or use a different rate model, and 17 first-wave candidates remain unverified. No Excel percentage is used to silently replace an official rule.
- Updated the Zhytomyr source dossier after extracting the city council's 2026 attachment. It reports 0.25% domestic and 2.5% inbound, conflicting with the workbook's 0.3%/1%; the full operative decision chain and Veresy coverage still need review, so the route remains closed.
- Added follow-up source dossiers for Slavske and Yaremche. The 2026 signed DPS form for Slavske reports 0.20%/0.20% from 2026-01-01 under decision №1805, rather than Excel's 0.5%/1%. Yaremche's signed form shows 0.50% for hotels and 0.30% for several other accommodation types, with a zero-valued universal row that must be resolved against the primary act and calculator categories. Both remain unavailable pending that work.
- The 30-row calendar now keeps these official-form findings beside the supplied Excel values, source links, dates for review, and required next actions. It does not turn review reminders into assumed rate-change dates. Recheck annual hryvnia base on 2027-01-01; change percentages only when a new local decision or verified rate schedule requires it.

## Release readiness audit, 2026-10-14

This is the latest checkpoint and supersedes dated summaries below when they disagree.

- The planned first wave has 30 candidate URLs. Thirteen currently pass all local release gates: Lutsk, Sumy, Vinnytsia, Pivdenne, Ternopil, Zaporizhzhia, Rivne, Chernihiv, Kolomyia, Ivano-Frankivsk, Chernivtsi, Lviv and Cherkasy. The remaining 17 first-wave candidates are still blocked.
- The other 364 of 377 locations remain unavailable: 17 first-wave candidates plus 347 locations outside this wave. They have no city HTML route, catalogue/search link or sitemap entry, and the calculation API rejects their slugs. Unreleased routes return 404 without an HTML `noindex` page.
- The release gate is per locality: current official rate evidence tied to a council decision and its applicable period, exact locality/community KATOTTG match, safe calculator behavior, locally useful and fact-checked SEO text, and technical/indexing QA. A signed council-submitted Tax Service Form 6 can establish the current-year rate schedule when the page discloses that the full act text is unavailable and the calculator safely handles any ambiguity. A workbook row or an unsigned general summary alone does not clear the gate.
- Workbook SEO audit still flags 364 unverified local rate claims and daily amounts, 13 mismatched rate claims among the records compared against verified rates, old calculation base values, and unreviewed legal/tax/FAQ claims. The 377-row workbook is not safe to publish verbatim.
- The latest verification pass completed 87/87 repository tests, 53/53 schema routes, 0 structural data errors, and the batch audit with 13 ready / 17 first-wave candidates blocked. `git diff --check` passes; remaining messages are standard line-ending notices.
- Chernivtsi was added from the signed 2026 Tax Service Form 6, which has an exact city row for KATOTTG `UA73060610010033137`, a 0.30% / 0.30% rate and an effective date of 2026-01-01. The page clearly labels this as a Tax Service filing, not the full municipal decision. Its calculator rule is limited to 2026.
- Cherkasy was added after the signed 2026 Tax Service Form 6 and the city council's 2026–2028 budget forecast independently confirmed rates of 0.50% domestic / 5.00% inbound under decision №2-4690. City and community KATOTTG codes match. The rule is limited to 2026; source notes disclose that the exact restoration language in amendment №51-32 was not readable.
- Lviv was added from the signed council-submitted 2026 Tax Service Form 6, which identifies the community and city KATOTTG codes, decision №6373, the 2026 effective date and all three domestic price bands plus the 1.00% inbound rate. The full council act has not been retrieved. The page discloses this limitation and the calculator refuses results at exactly UAH 750 and UAH 1,200, where the published interval wording overlaps.
- No production deployment or production change was made. The counts above describe the local repository only.
- Next review window: 2026-10-20 or 2026-10-21. The cumulative target remains up to 30 only if enough URLs pass every gate. Checkpoints are 90 by Oct 28, 185 by Nov 4, 280 by Nov 11 and up to 377 by Nov 14; these are targets, not permission to bypass QA.
- Earlier historical checkpoints below describe their state at the time and are superseded by this latest release-readiness audit. Production was not inspected or changed and no deployment was performed.
- Kolomyia has a dedicated source dossier at `sources/kolomyya-2026.md`. Decision №781-16/2021 explicitly sets 0.5%/0.5% from 01.01.2022 without a stated end date; its rules cover the community and match city/community KATOTTG. The official municipal rates page for 2026 links to №781-16/2021. The 2025 Tax Service form separately corroborates the same rates, the 2026 municipal budget forecast cites №781-16/2021 in the local-tax framework, and the city report confirms 2026 tourist-tax collections. No separate Tax Service form for 2026 was found, but the applicable 2026 rate is supported by the current city rates page and the underlying council act.
- Next step: continue source review for the 21 blocked first-wave candidates using primary council acts and current official 2026 rate forms; then implement each rule, city-specific copy, calculation QA and route checks before adding it to the release list.

## Checkpoint, 2026-10-14, Ivano-Frankivsk added

- Reviewed the current council page for decision №140-43 and the signed form linked from the official 2026 Tax Service summary for Ivano-Frankivsk region. The decision sets 0.3% domestic / 1.0% inbound from 2025-01-01; the official 2026 dataset repeats decision number, community KATOTTG `UA26040190000081578`, applicable date and the two rates. City code `UA26040190010045761` matches the official KATOTTG import.
- Added the verified rate rule, official-source links, a city-specific six-section SEO block, example calculation, published route, catalogue link and sitemap entry. Added calculator, exact amount, city metadata and actual-router assertions.
- The first wave now has 10 locally ready pages and 20 blocked candidates. Other 367/377 city locations remain unavailable. No production deployment was performed.
- Targeted local verification: tourist-tax route and calculator tests passed 26/26. Data validation passed with 0 structural errors. Batch audit confirms 10 released/indexable and 367 unavailable. The full repo, schema and publication audits remain to be rerun after this checkpoint.
- Exact next step: continue with the remaining first-wave candidates with accessible primary decisions and 2026 evidence; do not activate a city until its local rule and calculator boundaries are verified, its KATOTTG mapping is confirmed, and its custom copy passes review.

## 2026-10-14 source review continuation

- Rechecked the 2026 Kolomyia rates index on the official city site. It links its current rate list to decision №781-16/2021. Updated the city-page sources, legal evidence, and dossier to reflect this current municipal confirmation.
- Checked official 2026 Tax Service forms for Lviv and Chernivtsi. Lviv’s signed form does identify the community, 2026 effective date, and three rate bands, but its inclusive thresholds overlap at exactly UAH 750 and UAH 1,200; the original council act, territory eligibility and page QA remain open. Chernivtsi’s consolidated form mixes legacy settlement-level rules and does not clearly establish the city rule for 2026. Both routes remain blocked.
- Rechecked Truskavets and Uzhhorod. The official Truskavets form confirms locality and an amended decision chain through 2025, but this source review did not obtain a clean 2026 tourist-rate schedule from the act. Uzhhorod’s signed 2026 DPS form presents inconsistent rate/exemption rows and needs the council act to resolve the calculation.
- Rechecked Odesa against both official DPS notices and its signed consolidated rate form. The later DPS notice confirms 0.5% for Ukrainian citizens and 1% for foreigners after decision №4314-VIII; the signed form predates that amendment and still shows 0.5%/0.5%. The exact effective date is not established in the accessible text, so the reported rates remain outside calculator data and Odesa stays blocked.
- All 21 currently blocked first-wave candidates remain blocked pending a readable controlling council act, clean applicable rate table, geography match, and calculation/SEO QA. Do not publish a local rate from the workbook or reinterpret contradictory Tax Service rows.

### Full plan audit, 2026-10-14

- Re-ran the complete local verification set: 81/81 repository tests; all 377 locality routes checked, with 5 indexable and 372 unavailable; 0 structural data errors; schema validation 45/45; first-wave audit 5 ready and 25 blocked; prepared SEO risk scan 377/377; decision queue 280 communities and 377 places.
- The workbook's prepared copy remains unsafe as publication-ready copy: 370 unsupported local rate/amount claims, 7 discrepancies against verified records, legacy calculation-base claims in all 377 rows, and unreviewed legal, payment, budget and FAQ claims. Do not publish the workbook text without source-based rewriting and review.
- Rechecked the Uzhhorod evidence trail. The signed Tax Service 2026 form links decision №2333 to the city and 2026 period and reports 0.50%/1.00%, but also contains zero-rate rows under section 1.1 despite stating that section should not be filled when uniform row 1.0.0 applies. The original act is still required to resolve this inconsistency; Uzhhorod remains unavailable and the calculator remains locked. The municipal open-data portal publishes its annual legal-acts CSV, but this review did not retrieve the 2025 CSV payload or the full act.
- Wave plan remains: review on 20/21 October, cumulative goal up to 30 only after all page gates pass; then review goals of 90 on 28 October, 185 on 4 November, 280 on 11 November and up to 377 by 14 November. These are conditional targets. Only 5 of the first 30 are locally ready today; 25 first-wave URLs and 347 other URLs remain withheld.
- No production checks, production changes or deployment were performed. The current run is a local code and evidence audit only.

### Kyiv decision-chain research, 2026-10-14

- The Kyiv City Council archive shows a later tourist-tax-table amendment, decision №159/10626 dated 2025-10-23 and published 2025-11-06, after decision №108/10575 dated 2025-10-09. This changes the source research priority: both amendments and their effective terms need review.
- Full text of №108/10575 remains inaccessible from its official PDF link (403); the official PDF linked for №159/10626 returned 404, and the council scan lookup was unavailable. No rates or effective dates were inferred from either card or from the workbook. Kyiv and Pushcha-Vodytsia stay withheld.
- Updated the Kyiv source dossier, decision-queue generator and its regression assertion. Regenerated queue coverage remains 280 communities / 377 places; 268 primary decisions pending, 3 council-act review pending, 4 rate-verified review pending and 5 fully ready.
- Verification after the queue change: focused research-queue test passed; full repository test suite passed 81/81. No production changes or deployment were performed.

## Banded-rule and calculator continuation, 2026-10-14

- Added an official-source dossier for Ternopil. The 2026 rule varies with accommodation price per person per day, so the public rule stores a banded schedule and leaves the flat-rate fields empty.
- Updated the shared calculator to ask for price per person per day only for banded-rate destinations. For Ternopil it calculates the rates below and above UAH 320, and refuses an automatic result at exactly UAH 320 because the council wording overlaps there.
- The Ternopil route passed geography, source, calculator, copy, route, sitemap and schema checks and is now the fifth local first-wave destination. The other 25 first-wave candidates stay unavailable; the remaining 347 places outside the first wave stay unavailable.
- Added unit, route/API and queue tests for the tier schedule and unresolved boundary. The queue export records the schedule without flattening it to one domestic and inbound rate pair.
- The full local suite passed 80/80. Batch audit: 377 places, 5 indexable, 372 unavailable. Data validation: 0 structural errors, 13 exact settlement-code matches still unresolved. Schema: 45/45 sitemap routes passed. Prepared-SEO risk scan: 377 rows, with remaining workbook legal and rate claims still blocked.
- Production was not inspected or modified. No deployment was performed.
- Next step: keep researching evidence for the 25 blocked first-wave candidates, starting with the official council act and exact KATOTTG match; do not expand the release set until their individual gates pass.

### Повторне звірення плану та архіву, 2026-10-14

- Перевірено першу хвилю з 30 локацій по кожному наявному gate: 4 готові, 26 заблоковані. Для чотирьох готових сторінок локальні SEO-блоки містять 248–261 слово у чотирьох змістових підрозділах; metadata має title 59–64 та description 106–123 символи. Усі чотири розрахункові приклади перевіряються тестами проти калькулятора.
- Повторний запуск перевірок: `node --test tests/*.test.mjs` 79/79; пакетний аудит 377 локацій, 4 доступні та 373 закриті; структурна перевірка 0 помилок і 13 відсутніх точних кодів населених пунктів; schema 39/39; SEO-risk scan 377/377; `git diff --check` пройшов.
- В аудиті підготовлених Excel-текстів лишаються застаріла база 8 000 грн у 377 рядках, 372 неперевірені локальні ставки/суми, 5 конфліктів серед перевірених ставок, а також неперевірені правові твердження, обов'язки агента/сплати, строки, призначення бюджету та FAQ structured data. Ці поля не переносяться у публічні міські сторінки.
- Для Одеси збережено пізніше повідомлення ДПС від 18.09.2026: воно повторно наводить ставки 0,5% / 1% і посилається на рішення №4314-VIII. Повний чинний текст і точна дата набрання чинності не підтверджені, тому калькулятор і індексація залишаються закритими.
- Ціль 30 сторінок на 14 жовтня не виконана в локальному коді; фактичний виробничий стан не перевірявся. Наступний контроль: 20/21 жовтня, до 30 сумарно лише після проходження всіх gates. Повне покриття до 14 листопада є плановим і залежить від перевірки кожної ставки та сторінки.

## Staged public release update, 2026-10-14

This update supersedes earlier statements in this checkpoint that all city routes resolve as noindex drafts. The user asked for unreleased locations to stay out of links and the sitemap without using `noindex`. City routes now return 404 until explicitly released and every data, legal, calculator and SEO gate passes.

- Added `versions/v1/tourist-tax-release.mjs` with a first-wave candidate list of 30 and an explicit release list.
- Only Lutsk, Sumy, Vinnytsia and Pivdenne currently pass all gates and are exposed in the directory, calculator suggestions, routes and generated sitemap.
- The other 373 records remain in internal source data but are not public routes, linked from the hub, exposed through search suggestions, or listed in the sitemap. The calculator API rejects their slugs.
- The first wave therefore has 30 planned candidates but only four are ready to open. The remaining 26 must not be enabled solely to meet a batch size: their legal, geographic, rate-period and/or QA evidence is incomplete.
- Added `seo-workspace/tourist-tax/RELEASE_WAVES.md` with the release procedure and verification commands.
- No deployment or production change was performed.

### Two verification passes for staged release

- Pass one: full repository suite passed 78/78 tests. The route suite checked published and withheld URLs through the actual app router, plus hub, calculator API and generated sitemap.
- Pass two: full repository suite passed 78/78 again; the 377-place batch audit returned 0 errors; the data validator returned 0 errors; `git diff --check` passed. Git only reported normal LF to CRLF conversion notices.
- Both passes produced the same release state: 30 planned in wave one, 4 published-ready, 373 unavailable, 4 public city routes.
- The remaining 26 first-wave candidates cannot be enabled from spreadsheet values alone. Primary council decisions, effective periods, exact locality-to-community identity and calculation QA remain incomplete for them. The wider batch also has 13 records without a matched settlement code.
- Deployment remains pending user instruction.

After the calculator's unavailable-location message was refined, the final checks were repeated twice: 78/78 tests on both runs; batch audit 0 errors on both runs; data validation 0 errors; whitespace check clean apart from Git line-ending notices.

Updated: 2026-10-14
Status at checkpoint creation: 377 locality records were loaded; 376 remained draft-only pending primary legal evidence. See the staged public release update below for the current route behavior.
Production deployment: not performed.

## Наступні 10 сторінок: посилений QA checkpoint, 2026-10-18

### Продовження циклу: підготовлено 10 сторінок

- За цей цикл завершено локальну підготовку Києва, Одеси, Дніпра, Житомира, Виноградова, Яремче, Ясіні, Тячева, Ірпеня та Сколе.
- Додано офіційні форми №6, точні коди КАТОТТГ, обмеження періоду 2026 року, окремі SEO-тексти, явні пояснення розбіжностей і приклади для Ясіні, Тячева, Ірпеня та Сколе.
- У третю хвилю staging локального коду включено Виноградів, Ясіню, Тячів, Ірпінь і Сколе. Загалом 28 міських сторінок у локальних маршрутах і sitemap. Віддалений staging не оновлювався; production не змінювався.
- Цільовий набір калькулятора й маршрутів пройшов 42/42 тести. Повний тестовий набір, release/batch/schema аудит і metadata/whitespace review виконати перед наступним checkpoint.
- Важливий статус Одеси: для 2026 року показано підтверджений у формі ДПС тариф 0,50% / 0,50%; пізніший запис про 1% лишається поясненим, але не застосовується до розрахунку без дати набрання чинності.
- Наступний крок: завершити повний QA цього набору, підготувати короткий перегляд усіх десяти та перелік джерельних питань на наступний цикл. Не надсилати зміни на сервер без окремої команди.

- Роботу продовжено в локальній гілці `staging`; production не змінювався. Remote staging/preview у цьому прогоні не підтверджено.
- Зафіксовано промт із чотирма проходами перевірки та незалежним red-team повтором: `NEXT_10_CITY_QA_PROMPT.md`.
- Зафіксовано статуси й блокери для кандидатів №1, 3, 10, 11, 15, 17, 19–22: `NEXT_10_CITY_REVIEW_2026-10-18.md`.
- Десять кандидатів: Київ, Одеса, Дніпро, Харків, Полтава, Житомир, Буковель/Поляниця, Трускавець, Яремче, Східниця. Ні один slug не активовано: для кожного залишається щонайменше один невирішений source, geography, calculation або editorial gate.
- Новий повний знімок першої хвилі: `FIRST_WAVE_AUDIT_2026-10-18.md` і `.csv`. Він підтверджує 16 ready, 14 blocked у запланованій хвилі та 16 публічних міських маршрутів у локальному коді.
- Два окремі проходи `node --test tests/*.test.mjs`: обидва 90/90. Валідатор даних: 377 записів, 0 структурних помилок, 13 записів без точного settlement code. Batch audit: 16 indexable, 361 withheld. Release audit: 16 ready, 14 blocked. Schema: 61/61 маршрутів, 0 помилок. `git diff --check` чистий, крім стандартних повідомлень Git про LF/CRLF.
- Окремий risk-аудит 377 SEO-чернеток: 352 не мають доказу первинного рішення; 352 мають неперевірені ставки/суми та FAQ JSON-LD; усі 377 містять застарілу базу мінімальної зарплати. Це чернетки Excel, не контент оприлюднених 16 міських сторінок.
- Пріоритетний порядок лишено як у початковій хвилі: точних запитів Google Search Console/Keyword Planner у робочій базі немає. Надходження туристичного збору можна використовувати лише як проксі туристичної активності, не як рейтинг пошукового попиту.
- Наступний крок: закривати першоджерельні gaps по одному. Для Яремче — повний додаток до №169-11/2021, усі зміни та категорійна модель; для Одеси — повний №4314-VIII і чинність; для Буковеля — прочитати додаток №1228-66-2026 і обґрунтувати адміністративну назву/код.

## Input workbook reconciliation

- `1_База_міста_та_ставки_377.xlsx`: 377 populated locality rows.
- `2_Готовий_SEO_контент_377.xlsx`: 377 SEO rows.
- Match key: normalized `SEO Slug (URL)`. The two books reconcile 377/377 with no missing or extra slugs.
- There are 280 application community records including the existing verified Lutsk community. 279 are imported candidate records.
- Candidate rates are not authoritative. Current imported candidate state: 254 communities `SECONDARY_SOURCE_ONLY`, 25 `CONFLICT`. Never average or select conflicting values automatically.
- Workbook data does not provide primary local decision links, effective periods, or source verification timestamps. No candidate rate is exposed or used by calculators.
- Some supplied draft SEO facts and examples are stale or unsupported. The city routes render safe explanatory content instead of publishing those unverified claims.

Input SHA-256:

- Base workbook: `c560abe296ffb506d0a3976db89a2b5c279aae3c4a4b941bcb51f4db5c9a3865`
- SEO workbook: `adcc2932d44477b18e835bc6acae78057e9e0b3728f4bd336e93628de05799a0`

## Official geography import

- Imported the Ministry of Communities and Territories Development KATOTTG workbook dated 2026-07-07, order 1321. The official release page is [KATOTTG, official Ministry source](https://mininfra.gov.ua/diialnist/rozvytok-mistsevoho-samovriaduvannia/kodyfikator-administratyvno-terytorialnykh-odynyts-ta-terytorii-terytorialnykh-hromad).
- Pinned workbook: `seo-workspace/tourist-tax/sources/kodifikator-2026-07-07.xlsx`.
- SHA-256: `5c5317759b2b90208e9b00338bc3db3c5e694272a166acf73f1543b3e18ecbea`.
- Joined 352/377 settlement codes, 277/280 community codes, and 351 district names. Kyiv uses its special-city code and has no district label in this import.
- 25 locality aliases or ambiguous names remain unmatched. Three imported communities lack a unique official community code.
- Same-name communities in Ivano-Frankivsk and Zakarpattia are separated by official code, not merged by label.
- Review list: `seo-workspace/tourist-tax/exports/katottg-match-review.csv`.

## Implemented in repository

- Reproducible source import and audit scripts: `scripts/import-tourist-tax-workbooks.py`, `scripts/audit-tourist-tax-workbooks.py`, and `scripts/import-katottg-official.py`.
- Versioned workbook and geography snapshots: `versions/v1/tourist-tax-workbook-data.json` and `versions/v1/tourist-tax-katottg-2026-07-07.json`.
- All 377 locality URLs resolve in the actual app router and render one H1, canonical, bounded title and description, and a locality SEO block.
- Lutsk is the only verified public city page. It is indexable and its calculator uses its recorded primary decision.
- The other 376 pages are `noindex,follow`; their calculators are locked and fail closed. Draft candidate rates do not appear in page content or calculation responses.
- Directory search covers locality, oblast, district and community, with up to six suggestions. Imported pages can be found while their rate status is clearly unverified.
- Sitemap contains only the city route that passes all publication gates.
- Review CSV/XLSX exports keep candidate and verified fields separate.
- A prepared-copy risk audit now covers every source SEO row and records findings in `seo-workspace/tourist-tax/exports/prepared-seo-risk-audit.csv`.
- The actual-router batch audit checks that long source workbook copy fields are not leaked into city pages and that the obsolete 8,000 UAH base is absent from every rendered city route.

## Remaining work before all pages can be publicly treated as finished

1. Match and review the official territory eligibility list, including order 376 and current amendments, against the pinned locality codes.
2. Find the primary local council decision and all relevant amendments for each of the 279 candidate communities. Record act ID, source URL, decision date, effective dates and verified rates.
3. Resolve the 25 rate conflicts using primary decisions. Do not choose between conflicting workbook values without evidence.
4. Manually reconcile the 25 unmatched locality names and three missing community codes.
5. Only after evidence is complete, create calculation rules and test representative cases for each distinct rate and effective period.
6. Review each city page's locality-specific facts, SEO copy, metadata and internal links. Publish/index only pages that pass the data, calculation, legal and editorial gates.

## Two-pass verification

Pass 1 and pass 2 completed on 2026-10-14. Each pass ran the actual-router route suite, city batch audit, and data validation. Both returned 15 tourist-tax tests passed, 0 failed; 377 routes and SEO blocks rendered; 377 titles and H1s are unique; 1 verified/indexable route and 376 noindex drafts; 352 settlement codes, 277 community codes, and 351 district labels; 0 validation errors and 376 review warnings. The KATOTTG importer was rerun between passes and reproduced the same SHA-256 and join counts. All review warnings are intentional until local primary sources and territory eligibility are reconciled.

### Final independent recheck

- Ran the full repository suite: 73 tests passed, 0 failed.
- Ran schema validation: 39/39 indexable routes passed with 0 errors.
- Reran the 377-route city audit and data validator: 0 errors; 1 verified/indexable city, 376 review-required draft cities, all draft calculations locked.
- Ran JavaScript syntax checks for the server, city data, renderer, browser calculator, and calculation article. All passed.
- Ran `git diff --check`; no whitespace errors were reported. Git emitted only expected LF-to-CRLF notices on edited files.
- Audited all 377 supplied SEO records: all 377 contain the obsolete 8,000 UAH calculation base, unverified local rate and daily amount claims, legal exemption claims, tax-agent/payment claims, budget-use claims, deadlines, budget codes and unreviewed FAQ structured data. The source workbook copy must be editorially and legally rewritten before publication. The post-import audit is `seo-workspace/tourist-tax/exports/prepared-seo-risk-audit.csv`.
- Added a fail-closed route assertion covering all 377 rendered pages: long unreviewed source SEO fields and the obsolete base must not appear in the live HTML.
- Corrected the territory-list research metadata: Order 376 had amendments №987 (registered as z0782-26) and №1389 (registered as z1117-26, effective 2026-08-21). Added both amendment links to page source lists and the implementation plan. The consolidated territory dataset is still not imported or matched to KATOTTG, so eligibility remains an explicit unresolved publication gate.
- A separate live HTTP smoke check could not open a localhost socket in this execution sandbox. The direct actual-router and calculation API tests passed, so route behavior is verified at the application layer, but external browser delivery was not independently exercised in this pass.
- No implementation defect surfaced in these checks. The 376 draft city pages are not fully complete or publishable: primary council rate decisions, territory eligibility, and 25 unmatched locality codes still need evidence and reconciliation. Their noindex and locked-calculator state is deliberate protection against publishing an incorrect tax rate.

### User-requested repeat verification after audit fix

- Fixed a latent undefined-variable reference in `scripts/audit-tourist-tax-prepared-seo.mjs`; the report now resolves each route's community status through the actual application data.
- Repeated the full suite twice after the fix. Each pass: 73/73 repository tests passed; 377 city routes and SEO blocks checked; data validation 0 errors; 39/39 indexable schema routes passed; source-copy risk scan processed all 377 rows; `git diff --check` passed (CRLF notices only).
- Both passes reproduce the same safe publication state: 1 verified/indexable city (Lutsk), 376 noindex drafts with locked calculators, 376 missing primary decision evidence, and 25 unresolved locality codes. These are outstanding evidence/content-completion items, not test failures.
- No production deployment was performed. Live HTTP smoke remains unverified because the sandbox blocks localhost sockets; actual-router and calculation API tests pass.

### Follow-up verification and source-queue correction

- Reran the full suite and publication audits after generating the municipal decision research queue: 73/73 tests passed, 377 city routes rendered, data validation returned 0 errors, all 39 indexable schema routes passed, all 377 prepared SEO records were scanned, and whitespace checks were clean apart from Git line-ending notices.
- Confirmed that the Tax Service root page lists 24 oblast indexes and a separate Kyiv city index. Corrected the regional URL transliterations in the queue builder for Zhytomyr, Kirovohrad, Mykolaiv, Kharkiv, Khmelnytsky and Chernihiv, and added the Luhansk source mapping. The queue now validates its full 25-index configuration and preserves 280 communities across all 377 locality pages.
- The 2026 Tax Service summaries are discovery and cross-check evidence based on IAC LOGICA data as of 2026-01-30. They do not replace local council decisions. The Tax Service explicitly says missing community data does not mean a zero rate or exemption. The remaining 279 community decisions and current territory eligibility are still unresolved, so the site remains in the same safe state: 1 verified/indexable page and 376 noindex drafts with locked calculators.
- Completed two sequential independent verification passes after the source-queue correction. Each pass: 74/74 repository tests passed, 377 routes and SEO blocks rendered, 0 data validation errors, 39/39 schema routes passed, prepared SEO audit processed all 377 workbook rows, syntax checks passed, and `git diff --check` found no whitespace errors. Git printed only line-ending notices.
- The added research-queue test confirms 280 community rows cover 377 unique locality slugs, 1 verified community, 279 pending primary decisions, corrected Tax Service transliterations, and the Lutsk official community name/code. The queue was regenerated successfully before both passes.
- No application defect was found in either pass. There are still 376 draft city routes, missing primary rate decisions for 279 communities, 25 locality KATOTTG matches needing reconciliation, and an unresolved current territory eligibility match. These are unfinished research/content prerequisites, not green-check failures. No production deployment was performed.

Commands to repeat after edits:

- `node --test tests/tourist-tax.test.mjs tests/tourist-tax-routes.test.mjs`
- `node scripts/check-tourist-tax-city-batch.mjs`
- `node scripts/validate-tourist-tax-data.mjs`
- `node scripts/audit-tourist-tax-prepared-seo.mjs`
- `git -c safe.directory=C:/Users/kosti/Documents/ChatGPT/Alisio/vdalo-site diff --check`

## Checkpoint 2026-10-14, current state and next action

- The intended first wave is 30 localities. Five currently pass all automated publication gates: Lutsk, Sumy, Vinnytsia, Pivdenne, and Ternopil. The other 25 first-wave candidates and 347 localities outside the wave stay unavailable.
- Bar's signed 2026 Tax Service form confirms reported 0.40% / 1.00% rates and the 2021 council decision reference; the council meeting protocol confirms adoption. The full effective attachment and amendment chain still need review. Keep Bar unavailable and do not invent an end date. Evidence is in `sources/bar-2026.md`.
- Verification just completed: 81/81 repository tests; 377-place batch audit, 5 public and 372 unavailable; data validator 0 errors and 13 missing exact settlement codes; schema 45/45; release audit 5 ready / 25 blocked; prepared-SEO scan 377 rows; decision queue 280 communities / 377 slugs with 268 primary-decision research pending.
- Next action: resume with the next blocked first-wave candidate whose official local decision and amendments can be obtained. For every candidate, finish exact KATOTTG match, effective period, calculator examples and boundaries, original SEO rewrite and route/sitemap checks before adding a release flag.
- Review window: 20 or 21 October 2026, target up to 30 cumulative only if each remaining page passes. Later checkpoints are up to 90 on Oct 28, up to 185 on Nov 4, up to 280 on Nov 11, and up to 377 on Nov 14. These are conditional targets.
- Production has not been checked or changed. No deployment was run.

No production deployment was performed.

### Rollout plan re-audit, 2026-10-14

- Reviewed first-wave release state against the route, calculator, data and sitemap gates.
- The planned first wave contains 30 locations. Four are locally indexable and calculation-ready: Vinnytsia, Lutsk, Sumy and Pivdenne. The other 26 candidates remain unavailable. The 347 places outside wave one also remain unavailable.
- Wrote a row-by-row audit and repeatable generator: `FIRST_WAVE_AUDIT_2026-10-14.md`, `FIRST_WAVE_AUDIT_2026-10-14.csv`, `scripts/audit-tourist-tax-release.mjs`.
- Added a calendar with checkpoint targets for Oct 20/21, Oct 28, Nov 4, Nov 11 and the Nov 14 deadline. Targets are subordinate to each page's legal, geography, calculation, SEO and technical QA.
- Updated the master prompt to match the current release behavior: unavailable routes return 404 without HTML and `noindex`, and stay out of internal links, search suggestions and sitemap.
- Verification on this pass: repository suite 78/78; batch auditor 377 total, 30 wave-one candidates, 4 ready; data validation 0 errors; schema validator 39/39 with 0 errors; first-wave report regenerated successfully.
- The initial attempt used a non-existent schema script name; located and ran the correct `scripts/validate-schema.mjs`. The verification itself passed.
- No production state was changed. This code-level check does not confirm public deployment.
- Next step: primary-source research and page-specific SEO/calculator QA for the blocked 26, then choose a realistically ready subset for the Oct 20/21 release review. Do not switch flags based on calendar targets alone.

## Resume point

Continue with primary territory eligibility and local council decision research. Keep every unresolved place noindex and its calculator locked. Do not promote a `SECONDARY_SOURCE_ONLY`, `CONFLICT`, or `REVIEW_REQUIRED` record to verified based on the workbooks alone.

### Latest repeated audit, 2026-10-14

- Completed two sequential full verification passes after correcting the prepared-SEO audit status precedence for Lutsk. Each pass: 74/74 repository tests passed; all 377 city routes and SEO blocks rendered; data validation returned 0 errors; schema validation passed 39/39; all 377 prepared SEO rows were scanned; syntax checks passed; `git diff --check` was clean apart from expected Git line-ending notices.
- The audit-script fix ensures a verified application tax rule takes precedence over the source workbook's `SECONDARY_SOURCE_ONLY` label. The source workbook still contains a rate statement for Lutsk that differs from the verified rule; the workbook copy remains excluded from page output.
- Read the official Tax Service 2026 Sumy region summary and one signed community tax appendix. The summary states its data is from IAC LOGICA as of 2026-01-30 and that missing community data is not a zero rate or exemption. The PDF contains local decision metadata and effective dates, but the inspected decision is dated 2021 and applies from 2022. It cannot alone prove an unamended rule is still current without checking the council decision and amendments.
- The official 13 KB community-to-PDF crosswalk could not be retrieved in this environment: the Tax Service download endpoint returned HTTP 403 with the official page as referrer, and the browser download was blocked. No records were promoted based on that partial discovery.
- Current implementation remains technically sound and deliberately incomplete as public tax guidance: 377 routes exist, 1 verified/indexable (Lutsk), and 376 noindex drafts with locked calculators. Remaining blockers are 279 local-decision checks, current territory-eligibility matching, and 25 unresolved locality-code matches. No deployment was performed.

### Latest user-requested repeat verification, 2026-10-14

- Completed two fresh sequential audit passes. Each pass ran the full repository test suite (74/74 passed), the actual-router 377-city audit, tourist-tax data validation (0 errors), prepared-SEO risk audit (377/377 source rows), schema validation (39/39 indexable routes), JavaScript syntax checks, and `git diff --check` (clean; only Git LF/CRLF notices).
- Both passes returned the same results: all 377 routes render one unique H1, title, canonical and locality SEO block; one city (Lutsk) is verified, indexable and has an active calculator; 376 pages remain noindex with locked calculators and no candidate rates shown. Directory search and sitemap gates are covered by actual-router tests.
- The two passes found no implementation or data-integrity errors. The 376 unresolved pages are intentionally incomplete for public tax claims: their provided source SEO copy contains unverified legal/rate assertions, 279 communities still lack reviewed primary decisions, current territory eligibility is not reconciled, and 25 locality codes remain unmatched.
- Attempted a live HTTP smoke request against the local server, but Windows sandbox policy denied opening a loopback socket. Server rendering and endpoints were instead verified via the actual-router and calculation tests; an external browser delivery check remains unavailable here.
- No code changes or production deployment were made during this repeat audit.

### Latest two-pass completeness recheck, 2026-10-14

- Repeated the full repository suite and all tourist-tax publication audits in two sequential passes. Both passes completed with 78/78 tests, 377/377 rendered city routes and SEO blocks, 0 data validation errors, 39/39 schema routes, and a 377/377 prepared-copy audit. JavaScript syntax checks and `git diff --check` passed; Git emitted only expected line-ending notices.
- Both passes reproduced the same state: one verified/indexable city with an active calculator (Lutsk), and 376 noindex city drafts with locked calculators. Thirteen locality pages still lack a unique KATOTTG settlement code; the current territorial eligibility list is not reconciled against the imported places.
- The prepared SEO workbook remains excluded from city-page output. Its audit still flags legacy 8,000 UAH base and unsupported legal/rate assertions across the source rows; 372 rows lack primary decision evidence and 5 rate statements conflict with reviewed data. Do not describe all 377 pages as content-complete or ready for indexing.
- No implementation defect was found by either pass. Remaining incompleteness is source verification and locality-specific editorial work, not a failing technical check. No production deployment was performed.

### Primary-decision research progress, 2026-10-14

- Verified the Sumy City Territorial Community rule from the official council/development finance sources: decision №1238-МР dated 2021-07-14, applicable from 2022-01-01, 0.5% for both domestic and inbound tourism. The 2026 budget material confirms these rates; the Tax Service attachment ties the record to community code UA59080270000073662 and the Sumy settlement. Sources: [Sumy Finance Department rate page](https://finance.smr.gov.ua/47-opodatkuvannya-v-ukraini), [2026 budget material](https://finance.smr.gov.ua/files/%D0%91%D1%8E%D0%B4%D0%B6%D0%B5%D1%82%202026/360-smva-23122025-oprylyudnennya.pdf), [Tax Service 2026 regional attachment](https://tax.gov.ua/data/material/000/801/934864/e2ba70ad_f3b6_4097_86bd_9ecadab9d8aa.pdf), [official council act archive entry](https://finance.smr.gov.ua/files/%D0%94%D0%BE%D1%85%D0%BE%D0%B4%D0%B8/%D0%9D%D0%BE%D1%80%D0%BC%D0%B0%D1%82%D0%B8%D0%B2%D0%BD%D0%B0%20%D0%B1%D0%B0%D0%B7%D0%B0/%D0%BC%D1%96%D1%81%D1%86%D0%B5%D0%B2%D1%96%20%D0%BF%D0%BE%D0%B4%D0%B0%D1%82%D0%BA%D0%B8/%D0%BD%D0%B0%202022%20%D1%80%D1%96%D0%BA/1238-mr.zip).
- The workbook candidate for Sumy (0.25% domestic / 1% inbound) conflicts with these primary sources and remains preserved only as a rejected candidate. The application rule now contains 0.5% / 0.5%; the locality page stays noindex and calculator-locked because Order 376 territory eligibility is not reconciled.
- Updated the research queue so council-rate verification and territory/calculator readiness are separate states. Counts now show 1 fully ready community (Lutsk), 1 rate-verified community awaiting eligibility review (Sumy), and 278 still awaiting primary decision research.
- Corrected the prepared-copy audit to report decision evidence independently of calculator readiness. It now flags the Sumy workbook rate as conflicting with verified council data rather than calling the primary decision missing.
- Repeated the complete verification twice after the Sumy addition and the final copy/test fixes. Each pass: 75/75 repository tests passed, all 377 city routes and locality SEO blocks rendered, data validation returned 0 errors, schema validation passed 39/39, the prepared-SEO audit scanned 377/377 rows, and `git diff --check` reported no whitespace errors (Git emitted only LF/CRLF notices).
- The two passes found and fixed two audit defects: the route checker was treating `%20` inside URL-encoded source links as a visible tax rate, and Sumy's verified community rate was being described as unverified even though calculation is blocked only by unresolved territorial eligibility. The checker now strips `href` values before scanning visible copy; Sumy page copy and machine-readable state distinguish verified rate from ambiguous territorial applicability.
- Final current state: all 377 routes render; 1 city (Lutsk) is indexable and calculator-ready; 376 are noindex with locked calculators; Sumy is explicitly classified as rate-verified but awaiting territorial eligibility; 278 communities still await primary-decision research; 25 locality settlement codes need reconciliation. No production deployment was performed.
- A direct external/local-browser smoke check remains unavailable because the Windows sandbox denies loopback sockets. Actual application router, routes, sitemap, calculation API, and page output were verified through the automated application-level checks.

### Additional primary-source review: Vinnytsia, 2026-10-14

- Reviewed the Vinnytsia City Council local taxes page, its 2021 base decision №469, and later amendment records. The council page was current as of July 2026 and explicitly lists the current local tax decisions. Appendix 4 to decision №469 sets tourist-tax rates of 0.5% for domestic tourism and 1.5% for inbound tourism. A 2026 restatement in decision №3535 repeats those rates for the next period starting 2027-01-01. The reviewed 2022, 2024 and 2025 amendments did not alter Appendix 4.
- The supplied workbook candidate for Vinnytsia was 0.3% / 1.0%, which conflicts with the primary council rule. The application now records 0.5% / 1.5% with the source candidate kept separately so it cannot leak into user-facing copy or calculations.
- Official source links: [Vinnytsia City Council local tax decisions](https://vmr.gov.ua/mistsevi-podatky-ta-zbory), [decision №469, 2021](https://www.vmr.gov.ua/media/%D0%94%D0%B5%D0%BF%D0%B0%D1%80%D1%82%D0%B0%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%94%D0%A4/%D0%94%D0%A4%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%9F%D0%9E%D0%94%D0%90%D0%A2%D0%9A%D0%98/%D0%A0%D1%96%D1%88%D0%B5%D0%BD%D0%BD%D1%8F%20%D0%BC%D1%96%D1%81%D1%8C%D0%BA%D0%BE%D1%97%20%D1%80%D0%B0%D0%B4%D0%B8%20%D0%B2%D1%96%D0%B4%2025.06.2021%20%E2%84%96469.pdf), [decision №3535, 2026, applies in 2027](https://vmr.gov.ua/media/%D0%94%D0%B5%D0%BF%D0%B0%D1%80%D1%82%D0%B0%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%94%D0%A4/%D0%94%D0%A4%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%9F%D0%9E%D0%94%D0%90%D0%A2%D0%9A%D0%98/%D0%A0%D1%96%D1%88%D0%B5%D0%BD%D0%BD%D1%8F%20%D0%BC%D1%96%D1%81%D1%8C%D0%BA%D0%BE%D1%97%20%D1%80%D0%B0%D0%B4%D0%B8%20%E2%84%963535%20%D0%B2%D1%96%D0%B4%2019-06-2025.pdf).
- Vinnytsia’s KATOTTG identity is matched to community code `UA05020030000031457` and settlement code `UA05020030010063857`. The calculator and index gate remain locked because the current Order 376 eligibility list has not yet been matched to KATOTTG.
- The research queue now has 280 communities across 377 locality routes: 277 pending primary decision research, 2 with a verified rate awaiting territory review (Sumy and Vinnytsia), and 1 fully ready (Lutsk). There are still 25 unmatched settlement codes.
- Added regression coverage for the rate conflict, the separate verification and eligibility gates, noindex, and the blocked calculation response. The city batch checker now treats any verified community rule consistently while requiring unverified candidate rates to stay out of the rendered content.
- First verification pass after this change: full repository suite 76/76 passed; tourist-tax route and city batch checks passed for all 377 routes; data validation returned 0 errors; schema validation passed 39/39; prepared SEO risk audit scanned 377/377 workbook rows; syntax checks and `git diff --check` passed (line-ending notices only).
- Second full verification pass after the checkpoint update: regenerated the 280-community queue; full repository suite 76/76 passed; the 377-city actual-router audit passed; data validation returned 0 errors; schema validation passed 39/39; prepared SEO risk audit scanned all 377 rows; syntax checks passed; and `git diff --check` found no whitespace errors (only Git LF-to-CRLF notices).
- Both passes returned the same publication state: 1 indexable and calculator-ready city (Lutsk), 2 rate-verified communities awaiting territory review (Sumy and Vinnytsia), 277 communities awaiting primary research, 376 noindex routes with locked calculators, and 25 unmatched settlement codes. The full city routes remain unpublishable as a group until source and territory gates are resolved.

### Additional official rate-schedule review: Lviv, 2026-10-14

- The official Tax Service form for Lviv identifies municipal decision №6373 dated 2025-06-12, application from 2026-01-01, and KATOTTG `UA46060250000025047`. It records a domestic schedule of 0.30%, 0.40%, and 0.50% based on accommodation price per person per day, and 1.00% for inbound tourism. Source: [signed Tax Service rate form](https://tax.gov.ua/data/material/000/801/934883/01bb5e61_0220_47aa_ba69_8f53584d7e19.pdf), pages 28-29.
- The official form's domestic wording overlaps at exactly UAH 750: one band ends “up to 750 inclusive” and the next begins “from 750.” The original council text must resolve this before the calculator can calculate exact totals. The current flat-rate calculator cannot represent domestic guest counts by price band, so the verified schedule is recorded in the research queue only and is not attached to a public page.
- Current Order №376 eligibility remains unmatched. The Lviv city routes stay noindex and the calculator stays locked until both territorial eligibility and the banded-rate calculation model are verified.
- Added `seo-workspace/tourist-tax/sources/lviv-2026.md` and extended the research queue with a separate `VERIFIED_RATE_SCHEDULE_MODEL_PENDING` state. Current queue: 276 communities awaiting primary rate research, 2 simple-rate communities verified but awaiting territory review, 1 banded-rate schedule awaiting model and territory review, 1 fully ready community, 280 communities total, 377 locality routes.
- First full verification after this queue and evidence update: 76/76 repository tests passed; all 377 routes and SEO blocks passed the actual-router audit; data validation returned 0 errors; schema validation passed 39/39; all 377 prepared SEO rows were scanned; JavaScript syntax checks passed; `git diff --check` found no whitespace errors. Remaining audit warnings represent incomplete source evidence and deliberately locked draft routes.
- Second full verification after regenerating the research queue: 76/76 repository tests passed; all 377 routes and SEO blocks passed; data validation returned 0 errors; schema validation passed 39/39; all 377 prepared SEO records were audited; queue coverage matched 280 communities and 377 locality routes with 276 primary decisions pending, 2 simple-rate records pending territory review, 1 banded-rate record pending calculator model and territory review, and 1 fully ready community. Syntax checks passed and `git diff --check` found no whitespace errors. Git only printed its standard LF/CRLF notices.
- No production deployment was performed.

### Pivdennivska primary-rate confirmation and verification refresh, 2026-10-14

- Reviewed Pivdennivska City Council decision №2626-VIII dated 2026-05-28. It sets domestic and inbound tourist-tax rates at 0.5% from 2027-01-01 and explicitly states that decision №422-VIII ceases to apply on that date.
- Matched the official 2025 Tax Service rate form to community KATOTTG `UA51100410000059549` and locality code `UA51100410010044384`. The form identifies decision №422-VIII dated 2021-06-17, applies it from 2022-01-01, and lists 0.5% for both tourism categories. Since the council's replacement act ends that rule only on 2027-01-01, recorded the verified 2026 interval as 2022-01-01 through 2026-12-31. Original workbook candidate rates 0.4% / 1.5% remain separate and rejected.
- Added evidence dossier `seo-workspace/tourist-tax/sources/pivdenne-2026.md`, regression assertions, and current-year decision queue fields. Pivdenne's rate is source-verified, but the city page and calculator remain gated pending Order №376 territory review.
- Updated queue totals: 1 fully ready community, 3 flat-rate communities awaiting territory review, 1 banded-rate community awaiting model and territory review, and 275 communities awaiting primary decision research, across 280 communities and 377 locality routes.
- This source update does not authorize indexation or deployment. Two full verification passes are being run after this change; record their exact outputs below before handoff.

### User-requested second full recheck, 2026-10-14

- Ran two separate consecutive verification passes after reviewing the current checkout. Both passes returned 76/76 repository tests, all 377 city routes and their SEO blocks rendered, 0 city-data validation errors, 39/39 indexable schema routes valid, and all 377 supplied SEO rows included in the prepared-copy risk audit. JavaScript syntax checks and `git diff --check` passed; Git only reported expected LF-to-CRLF notices.
- Both route audits found exactly 1 fully verified and indexable city (Lutsk), 376 noindex draft city routes with calculators locked, and 376 intentional review warnings. The versioned city routes and draft SEO blocks exist, but the city program is not complete for public launch: 276 communities still need primary decision research; 2 verified simple-rate communities (Sumy and Vinnytsia) still need territory review; Lviv's verified banded schedule needs calculator support, a resolved UAH 750 boundary, and territory review; 25 locality KATOTTG matches remain unresolved. The provided SEO workbook still has unsupported legal and rate claims across its 377 rows and is not used as live copy.
- Corrected `DECISION_RESEARCH_QUEUE.md` so it reflects the present queue: 1 ready, 2 simple-rate/territory pending, 1 banded-rate/model-and-territory pending, and 276 awaiting primary decisions, across 280 communities and 377 locality routes.
- No route/data/test defect was found in the two passes. The 376 draft routes are technically routed and safely gated, not fully source-verified or ready for indexation. No production deployment was performed.

### Follow-up source reconciliation, 2026-10-14

- Found an official Odesa Tax Service notice dated 2026-07-24 that reports Odesa's current rates as 0.5% domestic and 1% inbound and cites City Council decision №4314-VIII dated 2026-07-14. The notice links to the council act, but the official act URL is inaccessible in this environment. The exact effective period and act wording therefore remain unverified for the app's year-specific data model.
- Recorded Odesa as an official-secondary-source lead in `DECISION_RESEARCH_QUEUE.md`. Did not promote the Odesa workbook candidates into verified rates, page copy, calculator data, or indexable state. Its current Order №376 territorial status is also unresolved.
- Primary-source references: [Odesa Tax Service notice](https://od.tax.gov.ua/media-ark/news-ark/print-1033334.html), [Odesa City Council decision №4314-VIII](https://omr.gov.ua/ua/acts/council/222272/), and [Tax Code Article 12](https://zakon.rada.gov.ua/rada/show/2755-17) for local-decision timing requirements. This citation establishes a research lead, not the decision's effective start date.
- No code, rate, SEO copy, calculator, route, or deployment state changed during this follow-up. The prior two full verification passes remain the current code verification evidence; this documentation-only note was checked for consistency against the queue counts and route gate policy.
- After adding the source note, ran two more full sequential repository verification passes. Each pass returned: 76/76 tests; 377/377 city routes and SEO blocks rendered; 1 indexable city and 376 noindex drafts; data validator 0 errors; schema validator 39/39; prepared SEO risk scan 377/377 records; all targeted JS syntax checks passed; `git diff --check` passed with only expected LF-to-CRLF notices.
- The prepared-copy scan continues to find unsupported or stale assertions in the input workbook: all 377 rows include legacy base and legal/exemption/payment/duty/budget claims; 374 rows lack primary decision evidence and have unverified rates/amounts/FAQ JSON-LD; 3 rate copies conflict with the currently verified records. These are input-copy risks, not live-page leaks; actual-router tests confirm source copy and candidate rates do not enter the draft HTML.
- The 376 review warnings remain evidence gates, not defects: 276 communities await primary decision research, 2 verified simple-rate communities await Order №376 review, Lviv awaits supported band-model and territory review, and 25 locality KATOTTG matches remain unresolved. Odesa's 2026 Tax Service notice is now documented as a lead but does not yet meet the primary-act/effective-date gate.
- No production deployment was performed.

### KATOTTG crosswalk refinement, 2026-10-14

- Rechecked unresolved locality joins against the original pinned Ministry KATOTTG workbook, not only the generated crosswalk. Updated `scripts/import-katottg-official.py` to use a parenthetical qualifier only when the base locality, oblast, and a unique exact parent-community code identify exactly one official locality. This resolved 9 rows, including the two Shepits and two Bukys.
- Added three explicit exact-code mappings for Bar, Pivdenne, and the renamed Yuzhnoukrayinsk city. Each override asserts the official code exists in the pinned source, belongs to the expected oblast and expected community, and stores its rationale in the versioned crosswalk.
- Three attraction/descriptor routes (Kolochava museums, Opishnya museum, Skhidnytsia descriptor) resolve to the same official locality as an existing route. They are explicitly marked `LOCALITY_ALIAS_DUPLICATE`; the duplicate route keeps its community but receives no duplicate settlement code. Two further names, Krekhiv and Lyadova, remain ambiguous because the locality's official parent community conflicts with the workbook community.
- Regenerated the official KATOTTG snapshot from the pinned 2026-07-07 source. Current coverage is 364/377 settlement codes, 279/280 unique community codes, and 363 district labels. Thirteen page routes have no settlement code: 8 names are not exact locality entries, 2 are ambiguous, and 3 are editorial aliases of already-mapped localities. One community remains without a unique official code.
- Added regression tests for all 12 new code resolutions and the three duplicate-alias no-code decisions. Current tests and route audit pass; all 377 pages remain routed, with only Lutsk eligible for calculation and indexation. Rate, territorial-eligibility, SEO publication, and deploy gates are unchanged.
- Ran two full current-state verification passes after these code changes. Each passed 76/76 repository tests, all 377 route/SEO-block checks, data validation with 0 errors, schema validation 39/39, the prepared SEO risk scan for 377 rows, targeted JavaScript syntax checks, and `git diff --check`. Only expected LF-to-CRLF notices appeared.

### Додатковий повторний контроль і Південне, 2026-10-14

- Зафіксовано Південне як п’яту громаду з підтвердженим правилом ставки, не знімаючи територіальний gate. Повний доказ та автоматичні перевірки описані вище.
- Прохід 1 після змін: `node --test tests/*.test.mjs` пройшов 77/77; перевірка маршрутизатором 377/377 маршрутів і SEO-блоків; data validator 0 помилок, 1 eligible і 376 review-required; schema 39/39; аудит підготовлених SEO-рядків охопив 377/377; перевірка JS синтаксису та `git diff --check` пройшли.
- Прохід 2 повторив ті самі команди незалежно: 77/77 тестів, 377/377 маршрутів, 0 помилок даних, 39/39 schema-маршрутів, 377/377 рядків аудиту, JS syntax і diff check пройшли.
- Актуальна черга: 1 готова до індексації громада (Луцьк); 3 підтверджені ставки чекають на зіставлення з наказом №376 (Суми, Вінниця, Південне); 1 тарифний розклад потребує калькулятора з діапазонами, уточнення межі та територіальної перевірки (Львів); 275 громад чекають на першоджерела. Всього 280 громад і 377 маршрутів.
- В аудиті підготовленого Excel-контенту ще залишаються юридично й редакторськи неперевірені твердження. Він не рендериться як живий текст міських сторінок. Дизайн і SEO-оболонки маршрутів існують, але це не означає, що всі 377 сторінок завершені та готові до публікації.
- Перевірки виконані на рівні справжнього app-router і розрахункового API. HTTP-перевірка локально не виконувалась: sandbox блокує loopback sockets. Production не розгортався.

### Барська громада, першоджерело ставки, 2026-10-14

- Додано правило Барської міської територіальної громади за точним кодом `UA05060010000053179`: рішення №19 від 06.07.2021, застосування з 01.01.2022, ставки 0,4% для внутрішнього та 1,0% для в’їзного туризму. Підписана форма ДПС за 2026 рік підтверджує код громади та ставки; протокол Барської ради підтверджує пункт рішення й додаток із туристичним збором.
- Кандидатна ставка 0,25% для внутрішнього туризму з робочого Excel суперечить офіційній формі. Її лишено в полі кандидатних даних для аудиту, але вона не використовується для правила чи розрахунку.
- Додано досьє `sources/bar-2026.md`, перевірку черги та регресійний тест сторінки й калькулятора. Територіальний статус за актуальною редакцією наказу №376 і повний текст рішення зі змінами не підтверджені, тому Бар лишається `REVIEW_REQUIRED`, `noindex`, поза sitemap і з заблокованим калькулятором.
- Оновлена черга: 280 громад, 377 населених пунктів; 1 повністю готова громада, 4 громади з перевіреними ставками, що чекають територіальної перевірки, 1 тарифний розклад чекає підтримки моделі та територіальної перевірки, 274 громади чекають на першоджерела рішень. Із 377 маршрутів 1 індексується, 376 залишаються noindex.
- Повна перевірка 1: 78/78 тестів; усі 377 маршрутів і SEO-блоків; валідатор даних 0 помилок; schema 39/39; аудит SEO-кандидатів 377/377.
- Повторна повна перевірка 2: 78/78 тестів; усі 377 маршрутів і SEO-блоків; валідатор даних 0 помилок; schema 39/39; аудит SEO-кандидатів 377/377; перевірка синтаксису та `git diff --check` пройшли. В обох проходах залишилися однакові результати та publication gates.
- Production не розгортався.


### Повторна перевірка та уточнення правила публікації, 2026-10-14

- Проведено два повні послідовні проходи після виправлень. У кожному: 78/78 тестів; усі 377 маршрутів і SEO-блоків відрендерені; data validator 0 помилок; schema validator 39/39; пакетний аудит підтвердив 4 готові сторінки, 373 noindex-чернетки та 373 заблоковані калькулятори; синтаксис JavaScript і `git diff --check` пройшли. Підготовлений SEO-аудит охопив усі 377 рядків.
- Виправлено хибний publication gate, який вимагав зіставляти всі туристичні сторінки з наказом №376. Стаття 268 ПКУ пов’язує туристичний збір із місцевим рішенням ради та відповідною територією. Наказ №376 не є універсальною умовою для ставок і розрахунку. Тому його прибрано з публічних блоків джерел і з правил активації сторінок.
- На основі перевірених локальних рішень, офіційних форм ДПС, точних кодів КАТОТТГ та QA калькулятора активовано `/tourist-tax/sumy/`, `/tourist-tax/vinnytsya/` і `/tourist-tax/pivdenne/`. Перевірки підтверджують їх у sitemap, index/follow та калькуляторах. Для Південного розрахунок обмежено строком дії рішення до 31.12.2026; з 01.01.2027 використовується наступне рішення.
- Актуальний стан: 4 із 377 міських сторінок мають підтверджені ставки, робочий калькулятор і SEO індексацію. Решта 373 маршрутів існують, мають унікальні метадані та SEO-блоки, але залишаються noindex без показу непідтверджених ставок. Із них 274 громади чекають на перевірку першоджерел рішень; окремо Бар потребує повного тексту рішення зі змінами; Львів потребує вирішення межі 750 грн і підтримки тарифних діапазонів. 13 локальних зіставлень КАТОТТГ усе ще потребують перегляду.
- Аудит підготовлених SEO-таблиць повторно виявив 372 рядки без першоджерельної перевірки ставок і правових тверджень та 5 конфліктів із підтвердженими ставками. Ці поля залишаються поза живими сторінками й калькуляторами.
- Попередні нотатки в цьому файлі, які називають наказ №376 універсальним gate, є історичними й superseded цим уточненням. Не розгортати production без окремої команди користувача.

### Контрольне повторення на запит користувача, 2026-10-14

- Виконано два окремі повторні прогони. В обох пройшли 78/78 тестів, роутер перевірив 377/377 міських маршрутів і SEO-блоків, валідатор даних повернув 0 помилок, schema пройшла 39/39 маршрутів, JavaScript syntax та `git diff --check` пройшли.
- Стан стабільний в обох проходах: 4 сторінки повністю активні з підтвердженими ставками, калькулятором та індексацією; 373 маршрути залишаються noindex з заблокованими калькуляторами до локальної перевірки ставок і правил. Усі 377 мають маршрут і SEO-блок, але це не означає готовність усіх 377 до публікації.
- Аудит підготовленого SEO Excel охопив 377 рядків і повторно знайшов 372 записи без перевірки першоджерела, 5 конфліктів ставок та неперевірені правові твердження. Цей контент не підставляється у сторінки чи розрахунки.
- Для Бару повторний пошук офіційних матеріалів не виявив повного затвердженого тексту рішення №19 за 2021 рік з актуальними змінами. Знайдений документ міської ради є проєктом рішення на 2020 рік, тому його не використано як доказ чинного правила 2026 року. Бар залишається заблокованим до звірки повного акта та періоду дії.
- Усі технічні перевірки пройшли, але завершення всіх 377 сторінок не підтверджене: 373 сторінки ще не мають достатньої локальної доказової бази. Production не змінювався, деплою не було.

### Офіційне повідомлення ДПС для Одеси, 2026-10-14

- За повідомленням ДПС Одеської області від 24.07.2026, рішення Одеської міської ради №4314-VIII від 14.07.2026 встановлює для громадян України ставку 0,5%, а для іноземців 1% від мінімальної зарплати на 1 січня звітного року. Ставку для іноземців змінено з 0,5%.
- Дані записані як `reportedRates` у правилі громади КАТОТТГ `UA51100270000073549`, окремо від підтверджених розрахункових `rates`. Період дії та повний текст/публікація рішення залишаються на перевірці; сторінка Одеси залишається noindex і калькулятор закритий.
- Чергу оновлено: 273 громади очікують первинного пошуку; одна громада має знайдений акт і офіційно повідомлену ставку, але потребує звірки чинності; Бар, Львів і чотири готові громади зберігають попередні статуси. Сумарно 280 громад і 377 маршрутів.
- Джерела й межі перевірки: `seo-workspace/tourist-tax/sources/odesa-2026.md`, [повідомлення ДПС](https://od.tax.gov.ua/media-ark/news-ark/print-1033334.html), [рішення міськради](https://omr.gov.ua/ua/acts/council/222272/).

### Два повторні проходи за запитом користувача, 2026-10-14

- Прохід 1 і незалежний прохід 2 дали однаковий результат: `node --test tests/*.test.mjs` пройшов 78/78; роутер підтвердив 377/377 сторінок і SEO-блоків; валідатор даних повернув 0 помилок; schema пройшла 39/39; аудит підготовленого SEO охопив 377/377 рядків; JS syntax і `git diff --check` пройшли. Git показав лише попередження про нормалізацію LF/CRLF.
- Підтверджено стан маршрутизації: 4 сторінки з перевіреними ставками, доступним калькулятором та індексацією; 373 сторінки `noindex` із заблокованим калькулятором. Усі 377 мають маршрут і SEO-блок, але 373 ще не завершені як перевірені публічні сторінки.
- Повторний аудит SEO-книги виявив 372 рядки без підтвердження першоджерелом, 5 конфліктів ставок, неперевірені правові/звітні твердження та FAQ JSON-LD. Ці дані не використовуються як живі ставки для заблокованих сторінок.
- Повторно переглянуто офіційну підписану форму ДПС Львівської громади: вона підтверджує рішення №6373, ставки 0,30%, 0,40% і 0,50% для внутрішнього туризму за ціновими діапазонами та 1,00% для в’їзного. Межа 750 грн перетинається у двох рядках форми; оригінальний текст ухвали, який має розв’язати цю межу, не знайдений. Львів залишено заблокованим.
- Посилання ДПС на повний текст рішення Одеської міськради №4314-VIII залишається недоступним через веб-перегляд. ДПС підтверджує ставки, але дата їх набрання чинності в повідомленні не вказана. Одесу залишено заблокованою з `reportedRates`, без активних ставок.
- Перевірки виконані через застосунковий роутер і набір тестів. Локальний HTTP smoke test не виконувався, оскільки sandbox блокує loopback sockets. Production не розгортався.

### Контрольна перевірка за повторним запитом, 2026-10-14

- Виконано два послідовні повні проходи однаковим набором перевірок. В обох проходах: 78/78 тестів пройшли; batch-аудит перевірив 377/377 маршрутів і SEO-блоків; валідатор даних повернув 0 помилок; schema пройшла 39/39; аудит підготовленого SEO охопив 377/377 рядків; JavaScript syntax та `git diff --check` пройшли.
- Обидва проходи дали той самий стан: 4 активні міські сторінки з калькуляторами та індексацією; 373 маршрути лишаються `noindex` із заблокованими калькуляторами; 13 населених пунктів не мають однозначного коду поселення КАТОТТГ.
- Технічно перевірені маршрути, розрахунок для дозволених громад, fail-closed поведінка для решти, sitemap, canonical/meta, унікальність H1/title та наявність SEO-блоків. Тести підтверджують коректну роботу на рівні фактичного роутера та API-модулів. Окремий зовнішній HTTP smoke test із браузера в цій sandbox-сесії не запускався.
- Повний обсяг 377 сторінок ще не завершений як верифікований публічний довідник. 373 сторінки навмисно лишені чернетками, бо для них бракує достатнього підтвердження чинних місцевих рішень, ставок, періодів дії та/або однозначного географічного зіставлення. Імпортована SEO-книга не є безпечною для прямого оприлюднення: повторний аудит виявив 372 непідтверджені записи та 5 розбіжностей ставок.
- Жодних змін у production або деплою не виконано.
## Оновлення контрольної точки, 14 жовтня 2026

- Повторно перевірена перша хвиля з 30 міст. Локально всі publication gates проходять чотири сторінки: Луцьк, Суми, Вінниця та Південне. Решта 26 кандидатів хвилі та 347 інших локацій недоступні: немає HTML сторінки, посилання в каталозі чи запису в sitemap; калькулятор відхиляє їхні slug. Це локальний стан, production не змінювався.
- Перевірки після оновлення реєстру: 78/78 тестів; batch audit 377 локацій, 30 кандидатів, 4 готові; валідатор даних 0 структурних помилок; schema 39/39 маршрутів, 0 помилок; підготовлений SEO-аудит 377/377 рядків; `git diff --check` без помилок.
- Офіційне рішення Івано-Франківської міськради №140-43 та форма ДПС підтверджують ставку 0,30% / 1,00% з 01.01.2025, але перевірена форма стосується 2025 року. Значення не внесено до розрахункових ставок 2026 року. Річне підтвердження, зміни, точне зіставлення й редакційний QA очікують перевірки. Досьє: `sources/ivano-frankivsk-2026.md`.
- Черга тепер має 272 громади без знайденого першоджерела і 2 записи з рішенням/офіційним повідомленням, які ще не проходять перевірку періоду 2026 року. Публічну готовність це не збільшує.
- Наступний контрольний перегляд заплановано на 20 або 21 жовтня. Це дата перевірки й можливого релізу лише фактично готових сторінок, не обіцянка кількості. Ціль повного покриття до 14 листопада зберігається як планова межа, не як підстава послаблювати QA.
- Production deploy не виконувався. Для нього потрібна окрема команда власника.

## Наступний контрольний прохід першої хвилі, 14 жовтня 2026

- Аудит повторно охопив 30 кандидатів першої хвилі за ставками, географією, розрахунком, SEO-блоками, індексацією та sitemap. Під усі code-level gates проходять 4 міста: Вінниця, Луцьк, Суми та Південне. 26 кандидатів закриті. У всій базі 4 URL індексовані локально, 373 недоступні.
- Якість наявного тексту: чотири готові блоки мають близько 201-210 слів і три секції; 26 інших чернеток мають близько 125 слів і дві секції, не готові для публікації як завершені локальні SEO-сторінки. Meta title переданих Excel-чернеток мають 71-83 символи, meta description 166-197 символів; потрібна редакторська робота перед релізом.
- ДПС форма на 2026 рік для Чернівців вказує 0,30% / 0,30% для міста з 01.01.2026, на відміну від Excel 0,25% / 1,00%. Ужгородська форма вказує 0,50% / 1,00% з 01.01.2026, але також містить нульові рядки, що суперечать примітці самої форми. Досьє: `sources/chernivtsi-2026.md` та `sources/uzhhorod-2026.md`. Калькулятори не активовані, сторінки не відкриті до звірки первинних рішень.
- Черга налічує 269 громад без знайденого першоджерельного рішення, 3 з офіційно вказаними ставками, що очікують звірки первинного акта (Бар, Чернівці, Ужгород), 3 зі знайденими актами, але непідтвердженим періодом або ставками на 2026 рік (Івано-Франківськ, Одеса, Київ), одну модель діапазонів із нерозв'язаною межею (Львів), та 4 повністю готові громади.
- Перевірки після оновлення: 78/78 тестів пройшли; аудит хвилі 30/30, 4 ready, 26 blocked; batch audit 377 записів, 4 indexable, 373 unavailable; data validator 0 структурних помилок, 13 записів без коду населеного пункту; schema 39/39 без помилок; SEO-risk audit 377/377 записів. `git diff --check` пройшов з попередженнями Git про CRLF.
- Перевірка Excel SEO-контенту й далі виявляє стару базу розрахунку, непідтверджені ставки й суми, правові обіцянки, винятки та неузгоджену FAQ-розмітку. Ці твердження не можна переносити на міські сторінки без джерела.
- План публікації 30 міст на 14 жовтня не виконаний, оскільки лише чотири готові. Наступна дата перегляду 20 або 21 жовтня. Production не змінювався, деплой не проводився.


### Уточнення стану індексації та редакційного QA, 2026-10-14

- Уточнено формулювання попередніх зведень: у поточній реалізації 373 неопубліковані адреси повертають 404 без HTML і без `noindex`, не з'являються в sitemap, каталозі чи внутрішніх посиланнях. Старі записи про `noindex` описують попередній етап і не є поточним станом.
- Автоматизовані publication gates проходять чотири міські сторінки, але це не означає, що виконана ціль «максимально деталізовані SEO-сторінки». Їхні локальні SEO-блоки мають приблизно 201-210 слів; перед масштабуванням їх варто посилити прикладами розрахунку та відповідями на питання користувачів. Інші 26 текстів залишаються короткими чернетками.
- Повторна валідація: 78/78 тестів, batch audit 377/377, data validator 0 структурних помилок, schema 39/39, SEO-risk scan 377/377. Робота виконана локально; production не перевірявся і не змінювався.

## SEO-розширення чотирьох чинних міських сторінок, 14 жовтня 2026

- Для Луцька, Сум, Вінниці та Південного додано по одному окремому розрахунковому прикладу з місцевою ставкою та базою 8 647 грн на 2026 рік. Блоки тепер мають чотири секції й приблизно 248-261 слово.
- Кожний опублікований приклад перевіряється трьома способами: точна арифметика до копійки, результат `calculateTouristTax` та відповідність сумі у SEO-тексті. Додано регресійний тест для всіх чотирьох міст.
- Для Сум, Вінниці та Луцька створено окремі досьє джерел. Досьє Південного вже існувало; у реєстр джерел внесені ключові офіційні акти й форми.
- Уточнено застарілі службові записи, які помилково стверджували, що перевірки чи публікація для цих чотирьох міст іще заблоковані.
- Це просуває сторінки до потрібного рівня практичної користі, але не є завершеним ручним аудитом кожного факту й пошукового наміру. Решта 26 кандидатів першої хвилі та 347 інших записів залишаються закритими до проходження джерельних, географічних, розрахункових і редакційних перевірок.

## Повний аудит і контрольна точка, 14 жовтня 2026

- Два проходи перевірок після оновлення джерельних досьє: обидва рази 79/79 тестів, batch 377 локацій / 4 indexable / 373 unavailable, data validation 0 структурних помилок, schema 39/39, перша хвиля 4 готові та 26 заблоковані, `git diff --check` без помилок окрім попереджень про конвертацію LF/CRLF.
- SEO ризик-аудит охопив усі 377 рядків на обох проходах. 377 містять базу мінімальної зарплати 8 000 грн, 372 містять непідтверджені ставки та суми, 377 містять юридичні, платіжні чи бюджетні твердження для первинної перевірки, 372 мають неперевірену FAQ-розмітку; 5 відсоткових значень не збігаються з перевіреними правилами застосунку. Excel SEO не є готовим до публікації.
- Одеса: офіційна ДПС підтверджує, що повідомляє ставки 0,5% / 1% після рішення №4314-VIII. Пряме посилання міськради знайдене, але текст акта не вдалося відкрити та перевірити на дату чинності. Ставки не внесені в калькулятор.
- Чернівці: підписана форма ДПС 2026 року містить міський код КАТОТТГ і ставки 0,30% / 0,30%; первинний текст змін №282 та міський додаток не звірені. Ставки не внесені в калькулятор.
- Актуальні досьє й журнал: `sources/odesa-2026.md`, `sources/chernivtsi-2026.md`, `PUBLICATION_LOG.md`.
- Наступний контроль: 20 або 21 жовтня. До 30 сторінок сукупно є умовною ціллю; відкривати лише ті slug, де пройдені всі gates. Повне покриття до 14 листопада лишається плановою ціллю, а не дозволом відкрити неперевірені записи.
- Production не перевірявся і не змінювався. Деплой не виконувався.

### Публічний статус актуальності ставки, 14 жовтня 2026

- У кожній індексованій міській сторінці після блоку джерел показуються дата останньої звірки ставки й дата наступної планової перевірки. Для чинних підтверджених правил першої хвилі це 14.10.2026 і 01.12.2026 відповідно; дата планової перевірки береться з центрального `touristTaxSources.reviewSchedule`.
- Текст прямо пояснює, що дата планового перегляду не гарантує незмінність ставки: рішення ради може змінитися раніше, тому перед нарахуванням треба звірити першоджерело. На 1 грудня заплановано повторний перегляд рішень громад перед переходом на 2027 рік; гривневу базу треба оновити після закону про Державний бюджет.
- Неопубліковані 17 кандидатів не отримують публічних сторінок, дат або ставок, доки не пройдуть юридичну, географічну, калькуляторну й редакційну перевірки. Загальний статус лишається 13/30 готових, 17/30 заблокованих.
- Перевірка після змін: повний набір 87/87 тестів успішний, release audit 13 ready / 17 blocked, 13 публічних міських маршрутів.

### Київське джерельне досьє, 14 жовтня 2026

- Картка Київради підтверджує рішення №108/10575 (09.10.2025), опубліковане 29.12.2025, яке змінює місцеве рішення №242/5629. Офіційний PDF повернув 403; не виводити ставку чи дату дії з Excel-кандидата або попереднього проєкту.
- Офіційна зведена сторінка ДПС для Києва за 2026 рік спирається на LOGICA станом на 30.01.2026 та застерігає, що відсутність запису не означає нульову ставку або пільгу.
- Код міста й громади `UA80000000000093317`. Виявлений дефект експорту черги виправлено: код тепер зіставляється з канонічною громадою через код підтвердженої локації, а не тільки через її назву. Статус податкового доказу не змінений.
- Київ і Пуща-Водиця залишаються закритими до отримання читабельного тексту акта, перевірки всіх змін і періоду дії, правил ставок, калькулятора, унікального тексту та маршрутів. Деталі: `sources/kyiv-2026.md`.
- Production не змінювався.
### Official-source follow-up, 2026-10-14

- Added focused dossiers for Cherkasy and Zhytomyr after finding official council publications. Cherkasy's 2022 council amendment says the tourist-tax rate is 0% during martial law, while the council archive shows a later 2023 amendment and its site links a 2026 tax-rate table. Read and reconcile the full amendments/current attachment before adding rates to calculator data. Zhytomyr's 2026 council page links separate city and Veresy tax tables, but accessible text did not reveal the tourist-tax values.
- Polianytsia and Truskavets also have newer 2026 council acts with relevant annexes still requiring inspection. Do not infer their rates from old decisions or workbook candidates.
- Release state is unchanged: 8 of 30 first-wave destinations are locally ready, 22 remain blocked, and 369 of 377 stay unavailable. Current code does not route unreleased localities, link them, or include them in the sitemap. No production deployment was made.
- Verification baseline after implementation: full tests 84/84; data structure 0 errors and 13 unresolved settlement-code matches; schema 48/48; first-wave audit 8 ready / 22 blocked. Re-run after any source or implementation changes.

### Повторна перевірка продовження роботи, 14 жовтня 2026

- Повторно виконано `node --test tests/*.test.mjs`: 84/84 пройшли.
- `node scripts/check-tourist-tax-city-batch.mjs`: 377 локацій, 30 заплановано у хвилі 1, 8 проходять індексаційні gates, 369 закриті.
- `node scripts/validate-tourist-tax-data.mjs`: 0 структурних помилок; 13 записів без точного коду населеного пункту лишаються на review.
- `node scripts/validate-schema.mjs`: 48/48 маршрутів, 0 помилок.
- `node scripts/audit-tourist-tax-release.mjs`: 8 готових і 22 заблоковані у першій хвилі. Результат локального коду, не підтвердження production.
- Перезапущено `node scripts/audit-tourist-tax-prepared-seo.mjs`: наданий SEO workbook має 367 чернеток із непідтвердженими ставками або сумами; вміст workbook не використовується як перевірений текст публічних сторінок і не може автоматично замінити ручні блоки перевірених локацій.
- Додано джерельне досьє Харкова. Зведення ДПС за 2025 рік повідомляє, що громада не надала тоді дані, але воно не доводить ставки на 2026 рік. Місцеве рішення 2026 року не знайдене, місто лишається закритим.
- ДПС Дніпропетровської області має окремий каталог рішень туристичного збору з файлом Excel, але переглядач не зміг прочитати вкладення. Сам каталог не підтверджує ставку Дніпра. Досьє: `sources/dnipro-2026.md`.
- Найближчий наступний крок: отримати або прочитати вкладення місцевих актів для Києва, Одеси, Трускавця, Поляницької громади, Черкас, Житомира та решти закритих локацій; повторити точне звіряння території; впроваджувати лише підтверджені правила. Не відкривати решту URL задля формального числа 30.
- Production не перевірявся і не змінювався; deployment не виконувався.

### Нормативні пояснення та спроба довести першу хвилю, 14 жовтня 2026

- Залишено незмінним підтверджений користувачем список першої хвилі з репозиторію. Файл `top30_official_sources.xlsx` використано як індекс для пошуку, а не як джерело ставок: список міст інший, частина рішень застаріла, а частина відсотків суперечить пізнішим офіційним даним.
- У загальний блок офіційних джерел додано реєстр рішень місцевих рад ДПС та наказ Мінфіну №11 з кодом туристичного збору 18030000. Сторінка пояснює, що реєстр ДПС не замінює повний акт ради, а код класифікації не визначає ані місцевої ставки, ані рахунку для платежу. Реквізити треба звіряти для конкретної громади.
- У статті про розрахунок доповнено строки: декларація за календарний квартал у 40-денний період; порядок сплати згідно з підпунктом 268.7.1, включно з можливістю щомісячних авансів, якщо цей спосіб передбачений рішенням ради. Додано посилання на роз’яснення ДПС від 15.06.2026 і вказівку перевіряти точну дату та реквізити перед платежем.
- Додано регресійні перевірки на наявність реєстру ДПС, бюджетної класифікації та пояснення про реквізити у довіднику й міській сторінці.
- Після змін перевірено 87/87 тестів; аудити хвилі й даних підтверджують 13 із 30 сторінок готовими, 17 заблокованими, 13 активними міськими маршрутами, 364 закритими локаціями й нуль структурних помилок. Загальне нормативне доопрацювання не зняло жодного з 17 локальних правових блокерів. Деплой не виконувався.

Наступний крок: перевірити повні місцеві рішення й періоди дії для 17 закритих міст, використовуючи таблицю як покажчик джерел; після кожного підтвердження оновити правило, приклад розрахунку, унікальний текст і заново пройти release audit.

### Додатковий пошук офіційних форм ДПС, 14 жовтня 2026

- Повторно підтверджено підписану форму №6 Славської громади на 2026 рік: рішення №1805 від 07.07.2022, застосування з 01.01.2026, універсальний рядок показує 0,20% / 0,20%. Дата, територіальне покриття селища Славсько та розбіжність із таблицею-кандидатом зафіксовані; сторінка лишається закритою до звірки з первинним актом і перевірки калькулятора.
- Знайдено читабельнішу підписану форму №6 Ужгородської громади: рішення №2333 від 08.07.2025, застосування з 01.01.2026, універсальний рядок показує 0,50% / 1,00%. Форма також містить окремі нульові рядки за типами проживання, тому потрібне зіставлення з повним рішенням та категорією об’єкта, яку розраховує калькулятор. Джерело додане до `SOURCE_LEDGER.csv`; сторінка не відкривається до цього зіставлення.
- Наявність форми ДПС допомагає підтвердити запис і дату, але не прибирає автоматично блокер типу житла, можливі зміни після подання та редакційний QA. Аудит на цей момент залишається 13/30 готових, 17/30 закритих. Новий повний прогін: тести 87/87, структурна валідація даних без помилок, 13 активних міських маршрутів.
- Production не перевірявся і не змінювався. Деплой не виконувався.


## Checkpoint: першоджерела та стан хвилі, 2026-10-14

Цей запис є найновішим станом і замінює застарілі проміжні лічильники у попередніх історичних записах.

- 14/30 кандидатів першої хвилі пройшли локальні gates; 16/30 залишаються заблокованими. У sitemap і каталозі вихідного коду присутні 14 міських сторінок. Production deployment не виконувався.
- Нове підтвердження: Берегове. Форма №6 ДПС для 2026 року ідентифікує рішення №794 від 09.07.2021, застосування з 01.01.2022, код селища `UA21020030010083215`, код громади `UA21020030000019624`, 0,25% / 0,25%. Для калькулятора встановлено контроль межі 2026 року; перед 2027 роком правило треба переоцінити, а не переносити автоматично.
- Офіційна сторінка ДПС пояснює, що зведення за 2026 рік побудовано на LOGICA станом на 30.01.2026 і відсутність громади не є нульовою ставкою. Для Солотвина збережено правильне зіставлення до Закарпатської громади; однойменне село/громада на Івано-Франківщині не використовувати як доказ.
- Підсумкові перевірки цього checkpoint: тести 88/88; перевірка даних 377 рядків, 0 структурних помилок, 363 попередження про записи поза опублікованим набором; схема 54/54; release audit 14 ready / 16 blocked; міські маршрути й sitemap містять тільки 14 відкритих записів.
- Часовий напис на сторінці має розрізняти дату звірки джерела й наступну планову перевірку. Станом на зараз це 14.10.2026 та 01.12.2026 відповідно для підтверджених сторінок. Це не гарантує незмінність ставки до цієї дати. До початку 2027 розрахункового періоду повторно перевірити рішення ради і нову базу мінімальної зарплати.
- Production лишився незмінним. Наступний крок: продовжити окреме джерельне дослідження 16 заблокованих міст, вносити лише підтверджене та повторно проганяти повний QA. Не відкривати сторінку через сам факт появи кандидата в Excel чи через дедлайн хвилі.

## Оновлення черги міст, 2026-10-18

- Київський gate закрито на підставі форми №6 ДПС за 2026 рік: 0,40% / 1,00% за рішенням №2/6658. Код КАТОТТГ зіставлений з офіційним кодифікатором; помилкове відображення коду в рядку форми описане у досьє.
- Київ додано як 17-ту перевірену міську сторінку першої хвилі. Для калькулятора встановлено період 01.01.2026–31.12.2026; перехід через межу року відхиляється до повторної перевірки.
- SEO-текст, джерела, дата перевірки та приклади розрахунку додані. Маршрут, картка каталогу й sitemap генеруються зі списку опублікованих записів.
- Перевірки: туристичні тести 32/32; повний набір тестів 91/91; release audit — 17 готових, 13 заблокованих, 17 публічних міських маршрутів.
- Поточний список наступних десяти після Києва лишається затвердженим; наступне місто в черзі — Одеса. Для Одеси до зміни коду потрібно окремо підтвердити повний акт, дату оприлюднення/застосування, територію, ставки та правила пільг.
- Зміни лише у локальному staging worktree. Не виконувались push, merge чи production deploy.

## Перевірка Одеси, 2026-10-18

- Підписана форма №6 ДПС для Одеської громади за 2026 рік підтверджує ставки 0,50% / 0,50% за туристичним збором; звірені коди громади й населеного пункту. Пізніше повідомлення ДПС про №4314-VIII вказує 0,50% / 1%, однак не називає дату застосування. Розбіжність пояснена на сторінці, а 1% не застосовується до калькулятора за 2026 рік.
- Одесу додано як 18-ту перевірену міську сторінку в staging. Калькулятор приймає дати тільки 01.01.2026–31.12.2026; контрольний приклад 2 гості × 3 доби × 0,50% = 259,41 грн. Для 2027 року потрібне повторне підтвердження повним текстом №4314-VIII та актуальною формою ДПС.
- Повний текст рішення міськради і точну дату його оприлюднення/застосування потрібно перевірити до 01.12.2026. До цього 2027 ставка не активується; місцеві зміни щодо пільг також не описуються як остаточні.
- Досьє: `sources/odesa-2026.md`; черга: `NEXT_10_CITY_REVIEW_2026-10-18.md`. Наступне місто для перевірки — Дніпро.
- Точковий прогін після правок: туристичні тести та перевірка роутів мають пройти; повний тестовий набір і release audit оновити перед наступним checkpoint. Робота тільки у локальному `staging`, без push, merge чи production deploy.

## Перевірка Києва, 2026-10-18

- Виправлено помилку в попередньому досьє: рішення Київради №108/10575 і №159/10626 змінюють таблицю №1 додатка 5 до рішення №242/5629. Консолідована сторінка ГУ ДПС у м. Києві визначає додаток 5 як збір за паркування, а туристичний збір — як додаток 4. Ці два рішення виключені з доказового ланцюга туристичного збору.
- Підтверджено офіційною новиною Київради історичні ставки 0,4% для внутрішнього та 1% для в'їзного туризму, запроваджені з 01.01.2019 рішенням №2/6658. Чинність цих ставок на 2026 рік не встановлено.
- План Київради щодо регуляторної діяльності на 2026 рік прямо включає майбутній проєкт змін до №242/5629 із темою врегулювання ставки туристичного збору. Це підстава уважно перевірити можливі зміни протягом 2026 року, а не доказ нової ставки. Окремий проєкт №887 з кінця 2025 року у доступній картці має статус розгляду комісією.
- Зведення ДПС за 2026 рік сформовано на основі LOGICA станом на 30.01.2026, але текстове відображення не надає рядка туристичного збору Києва. Сам портал попереджає, що відсутній запис не означає нульову ставку.
- Результат міського source gate: **не пройдено**. Київ і Пуща-Водиця лишаються закритими; ставки не змінювалися, калькулятор/SEO/маршрути не відкривалися. Потрібен актуальний офіційний запис форми ДПС/LOGICA або повний чинний акт з додатком 4 та датою застосування, плюс перевірка статусу проєкту 2026 року. Деталі й усі посилання: `sources/kyiv-2026.md`.

## Продовження другої хвилі: Поляна та Хуст, 2026-10-18

- Поляну та Хуст включено до хвилі 2 локального staging. Разом у sitemap і каталозі коду тепер 20 міських маршрутів: 18 попередніх + 2 нових; із набору 377 решта 357 залишаються закритими.
- Поляна: форма №6 ДПС із рішенням №1778 і кодом населеного пункту підтверджує деталізовані ставки 0,50% / 1,00% для 2026 року. Попередня довідкова ставка 0,40% / 1,00% та технічний конфлікт форми пояснені користувачу. Зірочка стоїть безпосередньо біля ставок.
- Хуст: додаток 5 до рішення №344 і підписана форма №6 ДПС підтверджують 0,50% / 1,50%; коди міста й громади звірено. Попередні довідкові 0,40% / 1,00% показано як розбіжність; примітка форми про взаємовиключні універсальний і деталізований розділи пояснена.
- QA: туристичні тести 36/36; batch — 377 записів, 20 активних/індексованих у локальній конфігурації та 357 закритих; структурована схема 65/65 маршрутів, 0 помилок; `git diff --check` пройшов.
- Наступна черга — Ясіня. Спершу отримати читабельне першоджерело місцевого акта й вирішити конфлікт ставок у формі; до цього маршрут не відкривати.
- Зміни лише у локальному `staging` worktree. Push, merge і production deploy не виконувались.
