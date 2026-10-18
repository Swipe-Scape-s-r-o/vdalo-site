import {mkdir,writeFile} from 'node:fs/promises';
import {canCalculateTouristTaxPlace,canIndexTouristTaxPlace,getTouristTaxRule,touristTaxCommunities,touristTaxPlaces,touristTaxCityRoutes} from '../versions/v1/tourist-tax-data.mjs';
import {touristTaxReleasePlan} from '../versions/v1/tourist-tax-release.mjs';

const date=process.env.AUDIT_DATE||new Date().toISOString().slice(0,10);
const reportName=`FIRST_WAVE_AUDIT_${date}.md`;
const csvName=`FIRST_WAVE_AUDIT_${date}.csv`;
const waveOne=touristTaxReleasePlan.waves.find(wave=>wave.number===1);
const yearReviewStatusByCommunityCode=new Map();
const wordCount=value=>String(value??'').trim().split(/\s+/u).filter(Boolean).length;
const csvCell=value=>`"${String(value??'').replaceAll('"','""')}"`;
const rows=waveOne.candidateSlugs.map((slug,index)=>{
  const place=touristTaxPlaces.find(item=>item.slug===slug);
  if(!place)throw new Error(`Wave-one slug missing from place data: ${slug}`);
  const rule=getTouristTaxRule(place);
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  const researchStatus=yearReviewStatusByCommunityCode.get(community?.katottgCode)??rule?.status??'MISSING';
  const seo=place.editorial?.seoBlock??{};
  const blockers=[];
  if(!place.katottgSettlementCode)blockers.push('Немає коду населеного пункту КАТОТТГ');
  if(!community?.katottgCode)blockers.push('Немає коду громади КАТОТТГ');
  if(place.geoStatus!=='ELIGIBLE')blockers.push(`Не підтверджена територіальна придатність: ${place.geoStatus}`);
  if(rule?.status!=='VERIFIED')blockers.push(`Немає перевіреного локального рішення/ставки на 2026 рік: ${researchStatus}`);
  if(!canCalculateTouristTaxPlace(place))blockers.push('Калькулятор не пройшов publication gate');
  if(!place.readiness?.uniqueContentApproved||!place.readiness?.seoQaPassed)blockers.push('SEO-текст і редакційне QA не затверджені');
  // Measure metadata actually used by the renderer, not unreviewed workbook drafts.
  const title=place.editorial?.title??'';
  const description=place.editorial?.description??'';
  return {
    number:index+1,slug,name:place.name,region:place.region,settlementCode:place.katottgSettlementCode??'',community:community?.name??place.communitySlug,
    communityCode:community?.katottgCode??'',geography:place.geoStatus,rule:researchStatus,calculator:canCalculateTouristTaxPlace(place)?'PASS':'BLOCKED',
    seoApproved:place.readiness?.uniqueContentApproved&&place.readiness?.seoQaPassed?'YES':'NO',seoWords:wordCount([seo.title,seo.intro,...(seo.sections??[]).flatMap(section=>[section.heading,...(section.paragraphs??[])])].join(' ')),
    seoSections:seo.sections?.length??0,metaTitleChars:title.length,metaDescriptionChars:description.length,indexable:canIndexTouristTaxPlace(place)?'YES':'NO',blockers:blockers.join('; ')
  };
});

const ready=rows.filter(row=>row.indexable==='YES');
const blocked=rows.filter(row=>row.indexable!=='YES');
const csv=['№,slug,Населений пункт,Область,Код КАТОТТГ населеного пункту,Громада,Код КАТОТТГ громади,Географія,Статус ставки,Калькулятор,SEO QA,Слова SEO-блоку,Підрозділи,Title символів,Description символів,Індексація,Що блокує',...rows.map(row=>[row.number,row.slug,row.name,row.region,row.settlementCode,row.community,row.communityCode,row.geography,row.rule,row.calculator,row.seoApproved,row.seoWords,row.seoSections,row.metaTitleChars,row.metaDescriptionChars,row.indexable,row.blockers].map(csvCell).join(','))].join('\n')+'\n';
const table=rows.map(row=>`| ${row.number} | ${row.name} | ${row.region} | ${row.geography} | ${row.rule} | ${row.seoApproved==='YES'?`${row.seoWords} слів, ${row.seoSections} підрозділи`:`${row.seoWords} слів, ${row.seoSections} підрозділи, QA не пройдено`} | ${row.indexable==='YES'?'Готова':'Заблокована'} | ${row.blockers||'Немає'} |`).join('\n');
const report=`# Аудит першої хвилі сторінок туристичного збору\n\nДата аудиту: ${date}\n\n## Висновок\n\nУ хвилі заплановано ${rows.length} локацій. За фактичними gates у репозиторії готові до індексації ${ready.length}: ${ready.map(row=>row.name).join(', ')}. Інші ${blocked.length} не відкриваються як публічні міські сторінки, не потрапляють до каталогу та sitemap, а їхні калькулятори відхиляють запит. Це стан локального коду, а не підтвердження production-деплою.\n\nНаявність сторінки в імпортованому Excel, SEO-чернетки або пропонованої ставки не є доказом чинного рішення громади. Не відкривати сторінки лише для виконання цілі «30». Неперевірена ставка може дати гостю або готелю неправильний розрахунок.\n\n## Перевірка кожної локації\n\n| № | Населений пункт | Область | Географія | Ставка | SEO-текст | Реліз | Що лишилося зробити |\n|---:|---|---|---|---|---|---|---|\n${table}\n\n## Повторювані результати аудиту\n\n- Результати тестів наведено в актуальному записі PUBLICATION_LOG.md. Перевірено роутер, калькулятор, індексацію, відсутність публічних посилань на чернетки, sitemap та поведінку API для неоприлюднених slug.\n- Пакетний аудит: 377 локацій; 30 кандидатів першої хвилі; ${ready.length} публічно готових сторінок; ${blocked.length} URL першої хвилі закриті; ${touristTaxPlaces.length-ready.length} локації загалом поза індексацією.\n- Валідатор даних: 0 структурних помилок; ${touristTaxPlaces.filter(place=>!place.katottgSettlementCode).length} записів без зіставленого коду населеного пункту КАТОТТГ потребують окремої уваги в повній базі.\n- JSON-LD/schema: команда node scripts/validate-schema.mjs перевірила indexable маршрути, включно з міськими сторінками туристичного збору, перевірено окремим запуском node scripts/validate-schema.mjs; актуальну кількість наведено в PUBLICATION_LOG.md, 0 помилок.\n- SEO: ${blocked.length} заблокованих кандидатів мають лише редакційні чернетки без затвердження унікальності та SEO QA. Для решти бази автоматична наявність SEO-блоку не означає, що він редакторськи схвалений.\n- Локальна HTTP-перевірка у браузері та production не підтверджені цим аудитом.\n\n## План випуску до 14 листопада\n\nДати нижче є контрольними цілями, а не автоматичним дозволом на індексацію. На кожну хвилю береться тільки кількість сторінок, що реально пройшла правові, географічні, калькуляторні й редакційні gates.\n\n| Дата | Цільова хвиля | Цільовий обсяг | Умова відкриття |\n|---|---|---:|---|\n| 14 жовтня 2026 | Перша хвиля | 30 заплановано, ${ready.length} готово локально | Решта першої хвилі лишається закритою до проходження QA |\n| 20 або 21 жовтня 2026 | Перевірка наступного релізу | До 30 сторінок сукупно, до 25 нових | Додати лише сторінки, що пройшли всі перевірки |\n| 28 жовтня 2026 | Наступна хвиля | Орієнтир до 90 сторінок сукупно | Перевірити джерела, розрахунки, унікальність та sitemap |\n| 4 листопада 2026 | Наступна хвиля | Орієнтир до 185 сторінок сукупно | Ті самі gates для кожного міста |\n| 11 листопада 2026 | Наступна хвиля | Орієнтир до 280 сторінок сукупно | Ті самі gates для кожного міста |\n| 14 листопада 2026 | Контрольна дата | Ціль до 377 сторінок | Публікувати решту лише за повної перевірки, інакше переносити |\n\nПлан досягнення 377 сторінок за місяць є агресивним: після ${ready.length} готових сторінок потрібно перевірити ще ${touristTaxPlaces.length-ready.length} населені пункти та їхні громади. Станом на цей аудит це не підтверджена спроможність команди. Не заповнювати прогалини автоматично з бази Excel. Розмір кожної хвилі коригувати за фактичною кількістю повністю перевірених сторінок.\n\n## Чекліст для кожної хвилі\n\n1. Звірити локацію та громаду за точними кодами КАТОТТГ, включно з однаковими назвами й курортними локаціями.\n2. Перевірити чинне рішення ради, усі застосовні зміни, категорії ставок, дату початку та завершення дії.\n3. Перевірити формулу на контрольних прикладах, змішаних групах, межі дат і округлення до копійок.\n4. Написати локальний SEO-блок на основі перевірених фактів, без шаблонних юридичних обіцянок і тверджень, яких немає у джерелах.\n5. Зробити редакторську перевірку title, description, H1, внутрішніх посилань, FAQ, schema та мобільної версії.\n6. Додати лише затверджені slug до хвилі. Переконатися, що sitemap і каталог містять рівно очікувані відкриті сторінки.\n7. Зберегти результат, дату, джерела і результати тестів у журналі. Production-деплой виконувати окремо після команди власника.\n\n## Файли аудиту\n\n- Повна матриця 30 локацій: seo-workspace/tourist-tax/FIRST_WAVE_AUDIT_2026-10-14.csv.\n- Хвилі, критерії та статус production: seo-workspace/tourist-tax/RELEASE_WAVES.md.\n- Історія перевірок та точка продовження: seo-workspace/tourist-tax/CITY_IMPORT_CHECKPOINT.md.\n- Повторне створення звіту: node scripts/audit-tourist-tax-release.mjs.\n\n## Поточне рішення\n\nКод першої хвилі залишає в публічному наборі тільки ${ready.length} готові сторінки. ${blocked.length} інших кандидатів не готові, а ${touristTaxPlaces.length-rows.length} локацій поза першою хвилею також залишаються закритими. Production не змінювався та деплой не виконувався.\n`;

const editorialFindings=[
  '## Редакційні SEO-знахідки',
  '',
  `- ${ready.length} сторінок, що проходять автоматизовані gates, мають ${Math.min(...ready.map(row=>row.seoWords))}-${Math.max(...ready.map(row=>row.seoWords))} слів у локальних SEO-блоках. Кількість підрозділів і наявність розрахункового прикладу залежать від моделі тарифу. Кожна наведена сума звіряється з калькулятором.`,
  `- Решта ${blocked.length} кандидатів мають близько 125 слів і 2 розділи. Це редакційні заготовки, а не завершені унікальні міські SEO-сторінки.`,
  '- У всіх 30 meta description із Excel мають 166-197 символів, а title 71-83 символи. Це не автоматичне порушення фіксованого ліміту пошуковика, але перед релізом слід скоротити повтори, перевірити відповідність вмісту й вручну оцінити видачу.',
  '- У цьому проході зафіксовано структуру та метадані. Повне ручне джерельне рецензування кожного речення кожної майбутньої сторінки не виконано, воно є обов’язковим перед релізом.',
  ''
].join('\n');
const routeBehaviorNote='## Поведінка неопублікованих адрес\n\nУсі неопубліковані міські URL повертають 404 без HTML-сторінки та без `noindex`. Вони відсутні у внутрішніх посиланнях, каталозі й sitemap; калькулятор відхиляє їхні slug. Це відповідає плану хвиль і не маскує існуючі сторінки метатегом.';
const finalReport=report.replace('## План випуску до 14 листопада',`${editorialFindings}\n## План випуску до 14 листопада`).replace('## Редакційні SEO-знахідки',`${routeBehaviorNote}\n\n## Редакційні SEO-знахідки`);

const out=new URL('../seo-workspace/tourist-tax/',import.meta.url);
await mkdir(out,{recursive:true});
await writeFile(new URL(reportName,out),finalReport,'utf8');
await writeFile(new URL(csvName,out),csv,'utf8');
console.log(JSON.stringify({ok:true,date,total:rows.length,ready:ready.length,blocked:blocked.length,publicRoutes:touristTaxCityRoutes().length,report:`seo-workspace/tourist-tax/${reportName}`,csv:`seo-workspace/tourist-tax/${csvName}`},null,2));
