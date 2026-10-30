import {canCalculateTouristTaxPlace, canIndexTouristTaxPlace, getTouristTaxBatch004Place, getTouristTaxBatch004RateModel, getTouristTaxPlace, getTouristTaxRule, hasPlaceSeoBlock, touristTaxBatch004Aliases, touristTaxBatch004Places, touristTaxCommunities, touristTaxPlaces, touristTaxSources} from './tourist-tax-data.mjs';
import {touristTaxDashboard2026} from './tourist-tax-dashboard-data.mjs';
import {touristTaxCityEditorialFaq,touristTaxCityIntroductions} from './tourist-tax-editorial.mjs';
import {touristTaxBatch24_25Drafts,touristTaxBatch24_25DraftSlugs,touristTaxBatch24_25PlaceForms} from './tourist-tax-draft-batch24-25.mjs';
import {assetVersion} from './assets.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ORIGIN = 'https://www.vdalo.tech';
const reviewHeaders=['settlement_slug','settlement','route','type','region','district','community','settlement_katottg','community_katottg','geo_status','tax_decision','decision_date','effective_from','effective_to','rate_model','rate_schedule','domestic_rate_percent','inbound_rate_percent','tax_status','tax_source','geo_reason','verification_basis','proposed_domestic_rate_unverified','proposed_inbound_rate_unverified','community_rate_variants','review_flags','seo_title_draft','seo_description_draft','source_record_notes'];
const h = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const touristTaxRegionLabel = value => {
  const region=String(value??'').trim().replace(/\s+/gu,' ');
  if(!region||region==='Інші регіони')return region||'Інші регіони';
  if(/^м\.\s*київ$/iu.test(region))return 'м. Київ';
  return `${region.replace(/\s+область$/iu,'')} область`;
};
const dateLabel = value => new Intl.DateTimeFormat('uk-UA',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T00:00:00Z`)).replace(/\sр\.$/,' року');
const addDays = (value, days) => { const date=new Date(`${value}T00:00:00Z`); date.setUTCDate(date.getUTCDate()+days); return date.toISOString().slice(0,10); };
function nextRateReviewDate(rule) {
  if(!rule?.checkedAt)return null;
  const scheduled=rule.nextReviewAt||touristTaxSources.reviewSchedule?.nextVerifiedRatesReviewAt||addDays(rule.checkedAt,30);
  return rule.effectiveTo&&rule.effectiveTo<scheduled?rule.effectiveTo:scheduled;
}
const decimalLabel = value => new Intl.NumberFormat('uk-UA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
const thresholdLabel = value => decimalLabel(value).replace(/,00$/,'');
const placeLocativeOverrides={kyyiv:'Києві',odesa:'Одесі',pivdenne:'Південному',polyana:'Поляні',sumy:'Сумах',ternopil:'Тернополі',vinnytsya:'Вінниці'};
const placeLocative=place=>placeLocativeOverrides[place?.slug]||place?.nameLocative||place?.name||'';
const locativePhrase=value=>{const locative=String(value??'').replace(/^(?:у|в)\s+/iu,'').trim();return `${/^[АЕЄИІЇОУЮЯ]/iu.test(locative)?'в':'у'} ${locative}`;};
const placeLocativePhrase=place=>locativePhrase(placeLocative(place));
function parseAccommodationPriceCents(value){
  if(value===undefined||value===null||value==='')return null;
  const match=String(value).trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if(!match)return null;
  const cents=Number(match[1])*100+Number((match[2]??'').padEnd(2,'0')||0);
  return Number.isSafeInteger(cents)?cents:null;
}

function shell({title,description,canonical,robots='index,follow',content,config={},footerAddon='',social=false,structuredData=null}) {
  const canonicalMeta=canonical?`<link rel="canonical" href="${h(ORIGIN+canonical)}">`:'';
  const socialMeta=social?`<meta property="og:type" content="website"><meta property="og:locale" content="uk_UA"><meta property="og:title" content="${h(title)}"><meta property="og:description" content="${h(description)}"><meta property="og:url" content="${h(ORIGIN+canonical)}"><meta property="og:image" content="${ORIGIN}/v1/assets/og-1200x630.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${h(title)}"><meta name="twitter:description" content="${h(description)}"><meta name="twitter:image" content="${ORIGIN}/v1/assets/og-1200x630.png">`:'';
  const schemaMarkup=structuredData?`<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g,'\\u003c')}</script>`:'';
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>${h(title)}</title><meta name="description" content="${h(description)}"><meta name="robots" content="${robots}">${canonicalMeta}${socialMeta}${schemaMarkup}<meta name="theme-color" content="#321d35"><link rel="stylesheet" href="/tourist-tax-assets/tourist-tax.css?v=${assetVersion('tourist-tax.css')}"><link rel="stylesheet" href="/tourist-tax-assets/tourist-tax-interactions.css?v=${assetVersion('tourist-tax-interactions.css')}"><script type="application/json" id="tourist-tax-config">${JSON.stringify(config).replace(/</g,'\\u003c')}</script></head><body><header class="tt-header"><a class="tt-brand" href="/" aria-label="VDALO, на головну">VDALO<span>·</span></a><span class="tt-header-note">Довідник для готелів і гостей</span></header>${content}<footer class="tt-footer"><a href="/blog/turystychnyi-zbir-gotel-ukraina">Повний посібник з туристичного збору у 2026 році</a><span>Інформаційний сервіс VDALO. Для податкового обліку звіряйте дані з першоджерелами.</span>${footerAddon}</footer><script src="/tourist-tax-assets/tourist-tax.js?v=${assetVersion('tourist-tax.js')}" defer></script></body></html>`;
}

function sourcesPanel() {
  return `<section class="tt-sources" aria-labelledby="tt-sources-title"><h2 id="tt-sources-title">Офіційні джерела</h2><ul><li><a href="${h(touristTaxSources.taxCode.url)}" rel="noopener">Податковий кодекс України, стаття 268</a>: правила туристичного збору й повноваження місцевих рад.</li><li><a href="${h(touristTaxSources.localCouncilDecisions.url)}" rel="noopener">ДПС: реєстр рішень місцевих рад</a>: довідковий каталог поданих рішень, який не замінює повний акт ради.</li><li><a href="${h(touristTaxSources.budget2026.url)}" rel="noopener">Закон про Державний бюджет України на 2026 рік</a>: база мінімальної зарплати на 1 січня 2026 року.</li><li><a href="${h(touristTaxSources.budgetClassification.url)}" rel="noopener">Наказ Мінфіну №11, бюджетна класифікація</a>: код 18030000 для туристичного збору.</li><li><a href="${h(touristTaxSources.katottg.url)}" rel="noopener">Кодифікатор адміністративно-територіальних одиниць</a>: перевірка населеного пункту та територіальної громади.</li></ul><p>Реквізити для оплати залежать від громади й актуального бюджетного рахунку. Перевірте їх в Електронному кабінеті платника або у відповідному органі ДПС. Посилання на Казначейство саме по собі не є універсальним рахунком для сплати.</p><p>Місцеву ставку визначає рішення відповідної ради. На міських сторінках наведено джерела для перевірки конкретних ставок і періодів їх дії.</p></section>`;
}

function touristTaxFunnelPromo({source, place, placement}={}) {
  const placeName=place?.name??'';
  const context=place ? ` ${placeLocativePhrase(place)}` : '';
  const titleId=place ? `tt-funnel-promo-title-${h(place.slug)}` : 'tt-funnel-promo-title-hub';
  const params=new URLSearchParams({utm_source:source,utm_medium:'internal',utm_campaign:'tourist_tax',...(place?{utm_content:place.slug,location:placeName}:{})});
  const href=`/tourist-tax/start?${params.toString()}`;
  return `<section class="tt-funnel-promo" aria-labelledby="${titleId}"><div><p class="tt-eyebrow">ДЛЯ ГОТЕЛІВ, САДИБ І КЕРІВНИКІВ ОБ’ЄКТІВ</p><h2 id="${titleId}">Впорядкуйте облік туристичного збору${place?h(context):''}</h2><p>Подивіться, як VDALO допомагає зібрати дані про проживання, застосувати місцеві ставки й підготуватися до квартального звіту. Місцеві рішення та підтвердні документи залишаються основою податкового обліку.</p></div><a class="tt-button" data-tax-funnel-cta="${h(placement||source)}" data-tax-entry-source="${h(source)}" href="${h(href)}">Побачити, як це працює <span aria-hidden="true">→</span></a></section>`;
}

function touristTaxDashboard() {
  const data=touristTaxDashboard2026;
  const number=value=>new Intl.NumberFormat('uk-UA').format(value);
  const millions=value=>new Intl.NumberFormat('uk-UA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value/1000);
  const amount=value=>new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
  const metricCards=[
    ['Податкові агенти подали звітність',number(data.kpis.reportingAgents),'за звітний період'],
    ['Агенти сплатили збір',number(data.kpis.payingAgents),'за звітний період'],
    ['Об’єкти розміщення',number(data.kpis.accommodationObjects),'у даних ДПС'],
    ['Задекларовано',`${millions(data.kpis.declaredThousandUah)} млн ₴`,'186 564,77 тис. грн у звіті'],
    ['Сплачено',`${millions(data.kpis.paidThousandUah)} млн ₴`,'174 851,78 тис. грн у звіті'],
    ['Діб розміщення',`${millions(data.kpis.accommodationDaysThousand)} млн`,'4 824,78 тис. діб у звіті']
  ].map(([label,value,note])=>`<article class="tt-dash-kpi"><span>${h(label)}</span><strong>${h(value)}</strong><small>${h(note)}</small></article>`).join('');
  const stacked=(items,totalLabel)=>{
    const segments=items.map((item,index)=>`<span class="tt-dash-segment${index?' tt-dash-segment-alt':''}" style="--segment:${item.sharePercent}%" title="${h(item.label)}: ${h(amount(item.amountUah))}, ${h(String(item.sharePercent).replace('.',','))}%"></span>`).join('');
    const rows=items.map(item=>`<li><span><i class="tt-dash-dot${item===items[1]?' tt-dash-dot-alt':''}" aria-hidden="true"></i>${h(item.label)}</span><strong>${h(amount(item.amountUah))} <small>${h(String(item.sharePercent).replace('.',','))}%</small></strong></li>`).join('');
    return `<div class="tt-dash-stack" role="img" aria-label="${h(totalLabel)}: ${items.map(item=>`${item.label} ${amount(item.amountUah)}, ${String(item.sharePercent).replace('.',',')} відсотка`).join('; ')}">${segments}</div><ul class="tt-dash-legend">${rows}</ul>`;
  };
  const daysTotal=data.accommodationDaysByTourism.reduce((sum,item)=>sum+item.amount,0);
  const daysSegments=data.accommodationDaysByTourism.map((item,index)=>`<span class="tt-dash-segment${index?' tt-dash-segment-alt':''}" style="--segment:${item.sharePercent}%" title="${h(item.label)}: ${number(item.amount)} діб, ${h(String(item.sharePercent).replace('.',','))}%"></span>`).join('');
  const dayRows=data.accommodationDaysByTourism.map(item=>`<li><span><i class="tt-dash-dot${item===data.accommodationDaysByTourism[1]?' tt-dash-dot-alt':''}" aria-hidden="true"></i>${h(item.label)}</span><strong>${number(item.amount)} <small>${h(String(item.sharePercent).replace('.',','))}%</small></strong></li>`).join('');
  const regionalDeclared=data.byRegion.reduce((sum,region)=>sum+(region.declaredThousandUah??0),0);
  const regionalPaid=data.byRegion.reduce((sum,region)=>sum+(region.paidThousandUah??0),0);
  const regionalPaidGap=data.kpis.paidThousandUah-regionalPaid;
  const quarterRows=[
    ['Задекларовано, грн',...data.quarterly.flatMap(quarter=>[quarter.declaredFopUah,quarter.declaredLegalUah])],
    ['Сплачено, грн',...data.quarterly.flatMap(quarter=>[quarter.paidFopUah,quarter.paidLegalUah])],
    ['Діб розміщення',...data.quarterly.flatMap(quarter=>[quarter.daysFop,quarter.daysLegal])]
  ].map(([label,...values],rowIndex)=>`<tr><th scope="row">${h(label)}</th>${values.map(value=>`<td>${rowIndex<2?new Intl.NumberFormat('uk-UA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value):number(value)}</td>`).join('')}</tr>`).join('');
  const quarterlyTable=`<details class="tt-dash-table-details"><summary>Переглянути квартальну динаміку</summary><p>Звіт ДПС розділяє показники за кварталом і типом платника. Грошові суми нижче наведені у гривнях, дні розміщення є кількістю діб.</p><div class="tt-dash-table-scroll" role="region" aria-label="Квартальна динаміка туристичного збору за 2026 рік" tabindex="0"><table class="tt-dash-table"><thead><tr><th scope="col">Показник</th><th scope="col">I квартал, ФОП</th><th scope="col">I квартал, юрособи</th><th scope="col">II квартал, ФОП</th><th scope="col">II квартал, юрособи</th></tr></thead><tbody>${quarterRows}</tbody></table></div></details>`;
  const regionRows=data.byRegion.map(region=>`<tr><th scope="row">${h(region.name)}</th><td>${number(region.agents)}</td><td>${number(region.domesticDays)}</td><td>${h(region.domesticRate)}</td><td>${number(region.inboundDays)}</td><td>${h(region.inboundRate)}</td><td>${region.declaredThousandUah===null?'-':millions(region.declaredThousandUah)}</td><td>${region.paidThousandUah===null?'-':millions(region.paidThousandUah)}</td></tr>`).join('');
  const regionalTable=`<details class="tt-dash-table-details"><summary>Переглянути дані за областями та Києвом</summary><p>Суми в таблиці подані у мільйонах гривень. Значення ставок відтворені так, як вони показані в таблиці Power BI, і не замінюють рішення територіальної громади. Нуль у звіті не слід автоматично трактувати як підтверджену місцеву ставку 0%. Тире означає порожню клітинку в джерелі.</p><div class="tt-dash-table-scroll" role="region" aria-label="Регіональні показники туристичного збору за I–II квартали 2026 року" tabindex="0"><table class="tt-dash-table"><thead><tr><th scope="col">Область / місто</th><th scope="col">Агенти, що подали звіт</th><th scope="col">Доби внутрішнього туризму</th><th scope="col">Ставка внутрішнього туризму*</th><th scope="col">Доби в’їзного туризму</th><th scope="col">Ставка в’їзного туризму*</th><th scope="col">Задекларовано, млн грн</th><th scope="col">Сплачено, млн грн</th></tr></thead><tbody>${regionRows}</tbody></table></div><small>* Стовпці зі ставками показують агреговані значення з регіонального звіту. Для розрахунку збору гостю перевіряйте рішення конкретної громади.</small><p class="tt-dash-reconcile">Звірка підсумків: сума регіональних рядків задекларованого збору становить ${millions(regionalDeclared)} млн грн, загальний показник ДПС становить ${millions(data.kpis.declaredThousandUah)} млн грн. Різниця ${decimalLabel(Math.abs(regionalDeclared-data.kpis.declaredThousandUah))} тис. грн відповідає округленню рядків. Сума регіональних рядків сплати становить ${millions(regionalPaid)} млн грн, тоді як загальний показник дашборду становить ${millions(data.kpis.paidThousandUah)} млн грн. Розбіжність ${decimalLabel(regionalPaidGap)} тис. грн вже не пояснюється округленням, тому ці регіональні значення слід читати як оприлюднені в таблиці, а не як звірений розподіл загальної суми.</p></details>`;
  return `<section class="tt-dps-dashboard" aria-labelledby="tt-dps-title"><div class="tt-dps-head"><div><p class="tt-eyebrow">ОФІЦІЙНА АНАЛІТИКА ДПС</p><h2 id="tt-dps-title">Туристичний збір у цифрах</h2><p>Зведені дані про декларування, сплату та розміщення в Україні.</p></div><span class="tt-infographic-stamp">${h(data.period)}</span></div><div class="tt-dash-kpis">${metricCards}</div><div class="tt-dash-charts"><article class="tt-dash-panel"><h3>Задекларований збір за типом платника</h3>${stacked(data.declaredByPayer,'Задекларований збір')}</article><article class="tt-dash-panel"><h3>Сплачений збір за типом платника</h3>${stacked(data.paidByPayer,'Сплачений збір')}</article><article class="tt-dash-panel tt-dash-panel-wide"><h3>Доби розміщення за видом туризму</h3><div class="tt-dash-stack tt-dash-stack-days" role="img" aria-label="Доби розміщення: ${data.accommodationDaysByTourism.map(item=>`${item.label} ${number(item.amount)} діб, ${String(item.sharePercent).replace('.',',')} відсотка`).join('; ')}">${daysSegments}</div><ul class="tt-dash-legend">${dayRows}</ul><small class="tt-dash-rounding">У Power BI загальний показник подано округлено до 4 824,78 тис. діб; частки розраховані за значеннями категорій.</small></article></div>${quarterlyTable}${regionalTable}<p class="tt-dash-source">Статистичний зріз за I–II квартали 2026 року зафіксовано ${dateLabel(data.checkedAt)}. Показники в цьому блоці відтворюють зведені значення на цю дату.</p></section>`;
}

const cityComparisonPairs = {
  lutsk: 'berehove', vinnytsya: 'cherkasy',
  berehove: 'uzhhorod', uzhhorod: 'berehove',
  cherkasy: 'chernivtsi', chernivtsi: 'cherkasy',
  chernihiv: 'rivne', sumy: 'slavsko',
  'ivano-frankivsk': 'kolomyya', kolomyya: 'ivano-frankivsk',
  lviv: 'slavsko', slavsko: 'lviv',
  pivdenne: 'zaporizhzhya', zaporizhzhya: 'pivdenne',
  rivne: 'ternopil', ternopil: 'rivne',
  kyyiv: ['irpin','zhytomyr'], zhytomyr: 'kyyiv', irpin: 'kyyiv',
  dnipro: 'kyyiv', lviv: ['slavsko','dnipro'],
  vynohradiv: 'khust', khust: 'vynohradiv',
  yaremche: 'skole', skole: 'yaremche',
  yasinya: 'tyachiv', tyachiv: 'yasinya'
};

function cityComparisonDescription(rule) {
  if (rule?.rateSchedule) return 'ставка визначається за ціновим діапазоном вартості проживання на одну особу за добу';
  if (!Number.isFinite(rule?.rates?.domestic)||!Number.isFinite(rule?.rates?.inbound)) return 'для розрахунку використовуються підтверджене місцеве правило та зазначений період його дії';
  return `для внутрішнього туризму діє ставка ${decimalLabel(rule.rates.domestic).replace(/,00$/,'')}%, для в’їзного ${decimalLabel(rule.rates.inbound).replace(/,00$/,'')}%`;
}

function publicTaxCopy(value) {
  const source=String(value??'');
  const result=source
    .replace(/Чому ставка відрізняється від переданого Excel/gi,'Чому відрізняються довідкові ставки')
    .replace(/Що робити з іншими ставками в Excel/gi,'Як узгодити розбіжності у ставках')
    .replace(/Кандидатну Excel-ставку/gi,'Альтернативну ставку')
    .replace(/наданій робочій таблиці/gi,'попередньому довідковому наборі')
    .replace(/робочій таблиці ставок/gi,'попередньому довідковому наборі ставок')
    .replace(/робочим Excel/gi,'попередніми довідковими даними')
    .replace(/робочими Excel/gi,'попередніми довідковими даними')
    .replace(/переданому Excel/gi,'попередньому довідковому наборі')
    .replace(/переданого Excel/gi,'попередніх довідкових даних')
    .replace(/наданий Excel/gi,'попередній довідковий набір')
    .replace(/робочого Excel/gi,'попереднього довідкового набору')
    .replace(/робочий Excel/gi,'попередній довідковий набір')
    .replace(/Excel-ставк([ауиою])/gi,(_match,ending)=>`альтернативн${({а:'а',у:'у',и:'і',о:'у',ю:'у'})[ending.toLocaleLowerCase('uk-UA')]||'у'} ставк${ending.toLocaleLowerCase('uk-UA')}`)
    .replace(/Excel-кандидат/gi,'альтернативне значення ставки')
    .replace(/розбіжність з Excel/gi,'розбіжність з попередніми довідковими даними')
    .replace(/з Excel/gi,'з попередніми довідковими даними')
    .replace(/в Excel/gi,'у попередніх довідкових даних')
    .replace(/Excel/gi,'попередні довідкові дані');
  return /^\p{Lu}/u.test(source)&&/^\p{Ll}/u.test(result)?result[0].toLocaleUpperCase('uk-UA')+result.slice(1):result;
}

function cityComparisonLinks(place) {
  const relatedSlugs=cityComparisonPairs[place.slug]??[];
  const selected=(Array.isArray(relatedSlugs)?relatedSlugs:[relatedSlugs])
    .map(getTouristTaxPlace)
    .filter(candidate=>candidate&&candidate.slug!==place.slug&&canIndexTouristTaxPlace(candidate));
  const sameRegion=touristTaxPlaces
    .filter(candidate=>candidate.slug!==place.slug&&candidate.region===place.region&&canIndexTouristTaxPlace(candidate))
    .sort((a,b)=>a.name.localeCompare(b.name,'uk-UA'));
  const related=[...new Map([...selected,...sameRegion].map(candidate=>[candidate.slug,candidate])).values()].slice(0,3);
  const ownCopy=cityComparisonDescription(getTouristTaxRule(place));
  const relatedLinks=related.map(candidate=>`<li><a href="${h(candidate.route)}">Туристичний збір ${h(placeLocativePhrase(candidate))}: місцева ставка й калькулятор</a> <span>(${h(cityComparisonDescription(getTouristTaxRule(candidate)))})</span></li>`).join('');
  return `<aside class="tt-city-related" aria-labelledby="tt-city-related-title"><h3 id="tt-city-related-title">${related.length?'Порівняйте правила в інших громадах':'Перевірте туристичний збір за іншою адресою'}</h3><p>Для об’єкта ${h(placeLocativePhrase(place))} ${h(ownCopy)}. Ставку обирайте за адресою місця розміщення та періодом проживання: її встановлює відповідна місцева рада.</p>${related.length?`<ul>${relatedLinks}</ul>`:''}<p>Перегляньте <a href="/tourist-tax/rates/">реєстр місцевих ставок і статусів перевірки</a> або скористайтеся <a href="/tourist-tax/">довідником туристичного збору за містами</a>. Законодавчу базу й облік пояснює <a href="/blog/turystychnyi-zbir-gotel-ukraina">посібник з туристичного збору для готелів</a>, а формулу та приклади наведено у <a href="/blog/rozrakhunok-turystychnoho-zboru-2026">розрахунку за 2026 рік</a>.</p></aside>`;
}

function citySeoBlock(place) {
  const block=place?.editorial?.seoBlock;
  if(!hasPlaceSeoBlock(place))return '';
  const rule=getTouristTaxRule(place);
  if(rule?.status==='VERIFIED'&&place.geoStatus!=='ELIGIBLE'){
    const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
    const communityName=community?.officialName??community?.name??'відповідної територіальної громади';
    return `<section class="tt-seo-content" aria-labelledby="tt-city-seo-title"><p class="tt-eyebrow">ПРАКТИЧНИЙ ДОВІДНИК · ${h(place.region.toLocaleUpperCase('uk-UA'))}</p><h2 id="tt-city-seo-title">${h(block.title)}</h2><p>Для громади «${h(communityName)}» знайдено офіційне підтвердження ставки, але сторінка ще не пройшла повну перевірку первинного рішення, періоду дії та відповідності даних конкретному населеному пункту. Суму не показуємо, доки не звіримо весь набір доказів.</p><h3>Чому калькулятор поки недоступний</h3><p>Калькулятор вмикається лише після звірки місцевого рішення та його змін, строку дії ставки, категорій туризму й відповідності адреси громаді. Це не дозволяє застосувати ставку поза підтвердженим правилом.</p><h3>Що перевірити перед нарахуванням</h3><p>Звірте адресу об’єкта, коди населеного пункту й громади за офіційним КАТОТТГ, повний текст рішення ради з додатками та змінами, а також період проживання. Стаття 268 ПКУ пов’язує ставку з рішенням відповідної місцевої ради.</p>${cityComparisonLinks(place)}</section>`;
  }
  const sections=block.sections.map(section=>`<h3>${h(publicTaxCopy(section.heading))}</h3>${section.paragraphs.map(paragraph=>`<p>${h(publicTaxCopy(paragraph))}</p>`).join('')}`).join('');
  return `<section class="tt-seo-content" aria-labelledby="tt-city-seo-title"><p class="tt-eyebrow">ПРАКТИЧНИЙ ДОВІДНИК · ${h(place.region.toLocaleUpperCase('uk-UA'))}</p><h2 id="tt-city-seo-title">${h(publicTaxCopy(block.title))}</h2><p>${h(publicTaxCopy(block.intro))}</p>${sections}${cityComparisonLinks(place)}</section>`;
}

function citySources(place, rule) {
  const supportingSources=(rule.supportingSources??[]).map(source=>`<li><strong>${h(source.label)}</strong><p>${h(source.description)}</p><a href="${h(source.url)}" rel="noopener">${h(source.linkLabel)} ↗</a></li>`).join('');
  const ratePublication=rule.ratePublicationUrl?`<li><strong>${h(rule.ratePublicationLabel||'Офіційне пояснення місцевої ради')}</strong><p>${h(rule.ratePublicationDescription||'Документ допомагає звірити ставки й дату їх застосування.')}</p><a href="${h(rule.ratePublicationUrl)}" rel="noopener">${h(rule.ratePublicationLinkLabel||'Відкрити офіційне джерело')} ↗</a></li>`:'';
  const decisionSourceLabel=rule.decisionSourceLabel||`Рішення місцевої ради №${h(rule.decisionNumber)}`;
  const decisionSourceDescription=rule.decisionSourceDescription||`Рішення від ${dateLabel(rule.decisionDate)} встановлює ставки для відповідної територіальної громади.`;
  const decisionSourceLinkLabel=rule.decisionSourceLinkLabel||'Відкрити рішення ради';
  const reviewDate=nextRateReviewDate(rule);
  return `<section class="tt-section"><h2>Джерела ставок ${h(placeLocativePhrase(place))}</h2><ul class="tt-evidence-list"><li><strong>${h(decisionSourceLabel)}</strong><p>${h(decisionSourceDescription)}</p><a href="${h(rule.sourceUrl)}" rel="noopener">${h(decisionSourceLinkLabel)} ↗</a></li>${ratePublication}${supportingSources}</ul><aside class="tt-rate-review" aria-label="Актуальність ставки"><strong>${rule.status==='VERIFIED'?'Ставку звірено':'Попередній огляд джерел'} ${dateLabel(rule.checkedAt)}</strong><p>Наступна планова перевірка джерел: до ${reviewDate?dateLabel(reviewDate):'дати не визначено'}.</p><small>Це дата редакційного перегляду, а не гарантія незмінності ставки. Рада може змінити рішення раніше. Перед нарахуванням звірте першоджерело.</small></aside></section>`;
}

function canCalculatePreliminaryTouristTaxPlace(place, communities=touristTaxCommunities) {
  if(!place||place.geoStatus==='EXCLUDED')return false;
  if(getTouristTaxBatch004RateModel(place))return true;
  if(!touristTaxBatch24_25DraftSlugs.includes(place.slug))return false;
  const community=communities.find(item=>item.slug===place.communitySlug);
  const rule=community?.taxRule;
  const rates=rule?.proposedRates;
  return Boolean(community?.katottgCode&&/^UA[A-Z0-9]{17}$/.test(community.katottgCode)
    &&rule?.status==='SECONDARY_SOURCE_ONLY'&&rule.rateVariants?.length===1
    &&Number.isFinite(rates?.domestic)&&rates.domestic>0&&rates.domestic<=0.5
    &&Number.isFinite(rates?.inbound)&&rates.inbound>0&&rates.inbound<=5
    &&!rule.rateSchedule&&!rule.accommodationTypeRates);
}

function calculator(place = null, {preliminary=false} = {}) {
  const name = place?.name ?? '';
  const placeRule=place?getTouristTaxRule(place):null;
  const rateSchedule=placeRule?.rateSchedule;
  const accommodationTypeRates=placeRule?.accommodationTypeRates;
  const preliminaryCalculation=preliminary&&canCalculatePreliminaryTouristTaxPlace(place);
  if (place && !canCalculateTouristTaxPlace(place) && !preliminaryCalculation) {
    const batchPlace=getTouristTaxBatch004Place(place.slug);
    if(batchPlace){
      const hasNumericRate=/\d+(?:[,.]\d+)?\s*%/u.test(batchPlace.rateText);
      const geoReview=place.slug==='bar'&&touristTaxPlaces.some(existing=>existing.slug===place.slug&&existing.katottgSettlementCode===batchPlace.katottgSettlementCode&&existing.geoStatus==='REVIEW_REQUIRED');
      const reason=geoReview?'Для цієї локації розрахунок залишено вимкненим до повної перевірки рішення та територіальної відповідності.':hasNumericRate?'Ставку не вдалося однозначно розкласти за категоріями.':'У погодженому рядку немає числової ставки.';
      return `<section class="tt-calc-card tt-calc-card-locked" aria-labelledby="tt-calc-title"><div class="tt-calc-heading"><p class="tt-eyebrow">КАЛЬКУЛЯТОР *</p><h2 id="tt-calc-title">Для цього населеного пункту поки немає розрахунку</h2><p>* Дані ще перебувають на стадії підтвердження.</p></div><div class="tt-locked-state" role="status"><strong>${reason}</strong><span>Розрахунок з’явиться після уточнення даних.</span></div></section>`;
    }
    const ruleVerified=placeRule?.status==='VERIFIED';
    const statusTitle=ruleVerified?'Офіційне підтвердження ставки знайдено, повну перевірку запису завершуємо.':'Суму буде показано після перевірки ставки й періоду її дії.';
    const statusDetail=ruleVerified?'Потрібно звірити текст рішення та зміни, строк дії правила й відповідність локації. До цього калькулятор не застосовує ставку.':'Калькулятор не підставляє приблизні значення. Скористайтеся посиланням на першоджерело, щоб звірити правило.';
    return `<section class="tt-calc-card tt-calc-card-locked" aria-labelledby="tt-calc-title"><div class="tt-calc-heading"><p class="tt-eyebrow">КАЛЬКУЛЯТОР ДЛЯ ${h(place.name.toLocaleUpperCase('uk-UA'))}</p><h2 id="tt-calc-title">Для цього населеного пункту розрахунок недоступний</h2><p>У довіднику поки немає повного набору підтверджених місцевих даних для точного розрахунку.</p></div><div class="tt-locked-state" role="status"><strong>${statusTitle}</strong><span>${statusDetail}</span>${placeRule?.sourceUrl?`<a href="${h(placeRule.sourceUrl)}" rel="noopener">Відкрити рішення місцевої ради ↗</a>`:''}</div></section>`;
  }
  const placeField = place ? `<input type="hidden" name="place" value="${h(name)}"><div class="tt-field"><label for="tt-place-visible">Населений пункт</label><input id="tt-place-visible" value="${h(name)}" readonly></div>` : `<div class="tt-field tt-search-wrap"><label for="tt-calc-place">Населений пункт</label><input id="tt-calc-place" name="place" type="search" placeholder="Наприклад, Луцьк" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="tt-calc-place-results" aria-autocomplete="list" aria-describedby="tt-calc-place-help tt-calc-place-status"><span id="tt-calc-place-help" class="tt-hint">Оберіть населений пункт. Для попередніх даних результат буде позначено як орієнтовний.</span><div id="tt-calc-place-results" class="tt-results" role="listbox" aria-label="Населені пункти з різним статусом перевірки ставки"></div><p id="tt-calc-place-status" class="tt-hint" aria-live="polite"></p></div>`;
  const locked = place ? ' data-place-slug="'+h(place.slug)+'"' : '';
  const odesaCompareField='';
  const initialRateModel=accommodationTypeRates?'accommodation':rateSchedule?'banded':'flat';
  const accommodationPriceField=`<div class="tt-field" data-accommodation-price-field${rateSchedule?'':' hidden'}><label for="tt-accommodation-price">Вартість проживання на одну особу за добу, грн</label><input id="tt-accommodation-price" name="accommodationPricePerPersonPerDay" type="number" min="0.01" max="1000000" step="0.01" inputmode="decimal" ${rateSchedule?'required':''}><span class="tt-hint">Потрібно для міст, де місцеве рішення встановлює тарифні діапазони. Введіть ціну саме на одну особу за одну добу.</span></div>`;
  const accommodationTypeField=accommodationTypeRates?`<div class="tt-field"><label for="tt-accommodation-type">Тип місця проживання</label><select id="tt-accommodation-type" name="accommodationType" required><option value="">Оберіть тип житла</option>${Object.entries(accommodationTypeRates).map(([key,type])=>`<option value="${h(key)}">${h(type.label)}</option>`).join('')}</select><span class="tt-hint">Ставка Яремчанської громади залежить від категорії місця розміщення.</span></div>`:'';
  return `<section class="tt-calc-card${preliminaryCalculation?' tt-calc-card-preliminary':''}" aria-labelledby="tt-calc-title"><div class="tt-calc-heading"><p class="tt-eyebrow">${preliminaryCalculation?'ОРІЄНТОВНИЙ КАЛЬКУЛЯТОР *':'КАЛЬКУЛЯТОР'}</p><h2 id="tt-calc-title">Розрахуйте туристичний збір</h2><p>Вкажіть населений пункт, дату початку проживання, кількість розрахункових діб і гостей. Якщо місцева ставка залежить від вартості проживання, калькулятор попросить ціну на одну особу за добу.</p>${preliminaryCalculation?'<div class="tt-alert" role="note"><strong>* Дані ще перебувають на стадії підтвердження.</strong><span>Сума є попередньою. Перед нарахуванням або сплатою звірте ставку й умови її застосування.</span></div>':''}</div><form class="tt-calc" id="tourist-tax-calculator" method="post" action="/api/tourist-tax/calculate"${locked} data-rate-model="${initialRateModel}" novalidate>${placeField}${accommodationTypeField}<div class="tt-field"><label for="tt-start">Дата початку проживання</label><input id="tt-start" name="start" type="date" required></div><div class="tt-field"><label for="tt-days">Розрахункові доби</label><input id="tt-days" name="days" type="number" min="1" max="366" step="1" value="1" inputmode="numeric" required><span class="tt-hint">Одна доба дорівнює 24 годинам між розрахунковими годинами вашого об’єкта. Для точного обліку орієнтуйтеся на фактичний час заїзду та виїзду.</span></div><fieldset class="tt-field tt-guest-groups"><legend>Кількість гостей</legend><div><label for="tt-domestic-guests">Внутрішній туризм</label><input id="tt-domestic-guests" name="domesticGuests" type="number" min="0" max="1000" step="1" value="1" inputmode="numeric"></div><div><label for="tt-inbound-guests">В’їзний туризм</label><input id="tt-inbound-guests" name="inboundGuests" type="number" min="0" max="1000" step="1" value="0" inputmode="numeric"></div><span class="tt-hint">Категорію визначайте за пп. 268.3.1 Податкового кодексу: внутрішній туризм стосується громадян України, які подорожують у межах країни; в’їзний туризм стосується осіб, які прибули в Україну з-за кордону. У складних випадках уточніть її у податкового агента.</span></fieldset>${odesaCompareField}${accommodationPriceField}<div class="tt-field tt-exemption"><label for="tt-exemption">Чи є підстава для звільнення?</label><select id="tt-exemption" name="exemption"><option value="none">Не знаю або не застосовується</option><option value="claimed">Так, потрібно перевірити</option></select><span class="tt-hint">Результат покаже суму до врахування можливої пільги. Право на звільнення та документи перевірте з податковим агентом.</span></div><button class="tt-button" type="submit">Розрахувати збір</button><div class="tt-result" id="tt-result" role="status" aria-live="polite">${place ? 'Заповніть параметри проживання, щоб побачити орієнтовну суму.' : 'Оберіть населений пункт, щоб почати розрахунок.'}</div></form></section>`;
}

export function renderTouristTaxHub() {
  const verifiedPlaces=touristTaxPlaces.filter(place=>canIndexTouristTaxPlace(place));
  const preliminaryPlaces=touristTaxBatch24_25DraftSlugs.map(slug=>getTouristTaxPlace(slug)).filter(Boolean);
  const existingDirectoryPlaces=[...new Map([...verifiedPlaces,...preliminaryPlaces].map(place=>[place.route,{
    slug:place.slug,route:place.route,name:place.name,region:place.region||'Інші регіони',
    community:touristTaxCommunities.find(item=>item.slug===place.communitySlug)?.name||place.community||'',
  }])).values()];
  const batchDirectoryPlaces=touristTaxBatch004Places.map(place=>({slug:place.slug,route:place.route,name:place.name,region:place.region||'Інші регіони',community:place.community||''}));
  const directoryPlaces=[...new Map([...existingDirectoryPlaces,...batchDirectoryPlaces].map(place=>[place.route,place])).values()];
  const placesByRegion=new Map();
  for(const place of directoryPlaces){
    const region=touristTaxRegionLabel(place.region);
    if(!placesByRegion.has(region))placesByRegion.set(region,[]);
    placesByRegion.get(region).push(place);
  }
  const pluralPlaces=count=>count===1?'локація':count>=2&&count<=4?'локації':'локацій';
  const placeList=[...placesByRegion].sort(([a],[b])=>a.localeCompare(b,'uk')).map(([region,places])=>`<details class="tt-directory-region"><summary><span>${h(region)}</span><small>${places.length} ${pluralPlaces(places.length)}</small></summary><ul class="tt-place-list">${places.sort((a,b)=>a.name.localeCompare(b.name,'uk')).map(place=>`<li class="tt-place-row"><a href="${h(place.route)}"><span><strong>${h(place.name)}</strong><small>${h(place.community||region)}</small></span><span class="tt-place-arrow" aria-hidden="true">↗</span></a></li>`).join('')}</ul></details>`).join('');
  const minimumWage=touristTaxSources.budget2026.minimumWageOnJanuary1;
  const maxDomestic=decimalLabel(minimumWage*0.5/100);
  const maxInbound=decimalLabel(minimumWage*5/100);
  const infographic=`<section class="tt-infographic" id="tt-legal-basis" aria-labelledby="tt-infographic-title"><div class="tt-infographic-heading"><div><p class="tt-eyebrow">ТУРИСТИЧНИЙ ЗБІР · 2026</p><h2 id="tt-infographic-title">Ключові цифри для розрахунку</h2></div><span class="tt-infographic-stamp">Дані на 1 січня 2026</span></div><p class="tt-infographic-lead">Ці показники задають законодавчу базу. Фактичну ставку для гостей визначає рішення місцевої ради.</p><div class="tt-infographic-grid"><article class="tt-stat-card tt-stat-wage"><span class="tt-stat-icon" aria-hidden="true">₴</span><span class="tt-stat-label">Мінімальна зарплата на 1 січня</span><strong>${new Intl.NumberFormat('uk-UA').format(minimumWage)} ₴</strong><small>Розрахункова база туристичного збору у 2026 році</small></article><article class="tt-stat-card"><span class="tt-stat-index">01</span><span class="tt-stat-label">Внутрішній туризм</span><strong>до 0,5%</strong><small>Максимум за одну особу за одну добу: ${maxDomestic} ₴</small><div class="tt-cap-track" aria-hidden="true"><span class="tt-cap-fill tt-cap-domestic" style="width:10%"></span></div></article><article class="tt-stat-card"><span class="tt-stat-index">02</span><span class="tt-stat-label">В’їзний туризм</span><strong>до 5%</strong><small>Максимум за одну особу за одну добу: ${maxInbound} ₴</small><div class="tt-cap-track" aria-hidden="true"><span class="tt-cap-fill tt-cap-inbound" style="width:100%"></span></div></article></div><div class="tt-infographic-foot"><div><span class="tt-foot-icon" aria-hidden="true">×</span><p><strong>База нарахування</strong>Кількість розрахункових діб, гостей і місцева ставка</p></div><div><span class="tt-foot-icon" aria-hidden="true">↗</span><p><strong>Звітний період</strong>Календарний квартал згідно з правилами звітності</p></div></div><p class="tt-infographic-note">Граничні 0,5% та 5% не є автоматичною ставкою кожної громади. Суму вище показано для орієнтиру за мінімальною зарплатою 2026 року. Місцеві ставки, винятки та конкретний розрахунок перевіряйте окремо.</p></section>`;
  const dashboardData=touristTaxDashboard2026;
  const number=value=>new Intl.NumberFormat('uk-UA').format(value);
  const percent=value=>new Intl.NumberFormat('uk-UA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
  const millions=value=>new Intl.NumberFormat('uk-UA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value/1000);
  const domesticDays=dashboardData.accommodationDaysByTourism.find(item=>/внутріш/i.test(item.label));
  const seoCityRegions=new Map();
  for(const place of directoryPlaces){
    const region=touristTaxRegionLabel(place.region);
    if(!seoCityRegions.has(region))seoCityRegions.set(region,[]);
    seoCityRegions.get(region).push(place);
  }
  const seoCityLinks=[...seoCityRegions].sort(([a],[b])=>a.localeCompare(b,'uk')).map(([region,places])=>`<li><strong>${h(region)}:</strong> ${places.sort((a,b)=>a.name.localeCompare(b.name,'uk')).map(place=>`<a href="${h(place.route)}">туристичний збір ${h(placeLocativePhrase(place))}</a>`).join(', ')}.</li>`).join('');
  const dataInterpretation=`<section class="tt-data-guide" aria-labelledby="tt-data-guide-title"><div class="tt-data-guide-copy"><p class="tt-eyebrow">ЯК ЧИТАТИ СТАТИСТИКУ</p><h2 id="tt-data-guide-title">Дані країни дають контекст, ставку визначає громада</h2><p>У зведенні ДПС за ${h(dashboardData.period)} відображено ${millions(dashboardData.kpis.accommodationDaysThousand)} млн розрахункових діб. ${domesticDays?`${percent(domesticDays.sharePercent)}% з них припадає на внутрішній туризм.`:''} Це допомагає зрозуміти загальну структуру ринку розміщення в Україні.</p></div><div class="tt-data-guide-stats"><article><strong>${millions(dashboardData.kpis.accommodationDaysThousand)} млн</strong><span>діб розміщення у звітності</span></article><article><strong>${domesticDays?`${percent(domesticDays.sharePercent)}%`:'н/д'}</strong><span>частка внутрішнього туризму</span></article><article><strong>${directoryPlaces.length}</strong><span>локацій у довіднику</span></article></div><p class="tt-data-guide-note">Національні та регіональні показники ДПС не є ставкою для конкретного готелю. Для нарахування важливі рішення ради територіальної громади, період його дії, вид туризму, кількість гостей і розрахункових діб. На сторінці кожної локації наведено місцеві дані, джерела та примітки для розрахунку.</p><a class="tt-data-guide-link" href="#tt-directory-title">Знайти локацію в довіднику <span aria-hidden="true">↗</span></a></section>`;
  const seoBlock=`<section class="tt-seo-content" aria-labelledby="tt-seo-title"><p class="tt-eyebrow">ПРАКТИЧНИЙ ДОВІДНИК</p><h2 id="tt-seo-title">Туристичний збір в Україні у 2026 році: ставки, розрахунок і міста</h2><p>Туристичний збір сплачують за тимчасове розміщення в місцях проживання, а конкретну ставку встановлює місцева рада. Тому єдиної ставки для всіх міст України немає. Перед нарахуванням готелю або іншому об’єкту розміщення потрібно визначити територіальну громаду, знайти чинне рішення, перевірити його період дії та застосувати ставку для відповідної категорії туризму.</p><h3>Які ставки туристичного збору діють у 2026 році</h3><p>Податковий кодекс встановлює граничні ставки до 0,5% для внутрішнього туризму та до 5% для в’їзного туризму. Це максимальні межі, а не автоматична ставка кожної громади. У 2026 році розрахунковою базою є мінімальна заробітна плата на 1 січня, 8 647 гривень. Місцева рада може визначати власні ставки в межах цих лімітів, а в окремих рішеннях ставка може залежати від вартості проживання. Перед використанням калькулятора звірте офіційний акт громади та дату, з якої він застосовується.</p><h3>Як розрахувати суму туристичного збору</h3><p>Для орієнтовного розрахунку врахуйте кількість гостей, розрахункових діб, місцеву ставку та категорію туризму. Якщо рішення громади пов’язує ставку з ціною проживання, потрібна також вартість на одну особу за одну добу. Калькулятор на цій сторінці просить ці дані та показує розрахунок за правилами, доступними для обраної локації. Перед використанням результату відкрийте її сторінку й перевірте джерело та примітки. Він не встановлює право на пільгу й не замінює податковий облік: підставу для звільнення та підтвердні документи перевіряє податковий агент.</p><h3>Що показує статистика туристичного збору ДПС</h3><p>За зведенням ДПС за ${h(dashboardData.period)} задекларовано ${millions(dashboardData.kpis.declaredThousandUah)} млн гривень, сплачено ${millions(dashboardData.kpis.paidThousandUah)} млн гривень, а у звітності відображено ${millions(dashboardData.kpis.accommodationDaysThousand)} млн діб розміщення. Це загальнонаціональні агреговані показники за період, зазначений у дашборді, а не розмір збору для окремого міста чи готелю. Для конкретного проживання застосовуйте місцеве рішення та перевіряйте дані, наведені на сторінці локації й у калькуляторі.</p><h3>Сторінки туристичного збору за містами</h3><p>У довіднику зібрані сторінки населених пунктів із місцевими правилами, джерелами та калькулятором. Відкрийте сторінку потрібної локації, щоб переглянути ставку, громаду, період дії та примітки до даних.</p><ul class="tt-seo-city-links">${seoCityLinks}</ul><h3>Джерела та правила розрахунку</h3><p>Правила туристичного збору визначає стаття 268 <a href="${h(touristTaxSources.taxCode.url)}" rel="noopener">Податкового кодексу України</a>, а показники мінімальної зарплати на 2026 рік закріплено в <a href="${h(touristTaxSources.budget2026.url)}" rel="noopener">Законі про Державний бюджет України</a>. Для щоденного обліку використовуйте первинні дані про проживання та актуальні роз’яснення ДПС. Не передавайте в калькулятор імена гостей, паспортні дані чи іншу персональну інформацію.</p><p>Докладніше про правила збору читайте в <a href="/blog/turystychnyi-zbir-gotel-ukraina">посібнику для гостей і готелів</a>, а формулу та приклади дивіться у матеріалі <a href="/blog/rozrakhunok-turystychnoho-zboru-2026">як розрахувати туристичний збір у 2026 році</a>. Сторінку довідника оновлено 15 жовтня 2026 року. Статистичний зріз ДПС на цій сторінці зафіксовано окремо за період, указаний у дашборді. Перед застосуванням ставки перевіряйте дату рішення та його чинність.</p><h3>Як знайти ставку для адреси вашого об’єкта</h3><p>Почніть із населеного пункту, де розташоване місце розміщення. Якщо знаєте лише область, знайдіть місто або громаду в довіднику: область сама по собі не визначає ставку. Далі звірте, чи входить адреса об’єкта до зазначеної територіальної громади, і відкрийте сторінку з місцевим рішенням.</p><ol><li><a href="#tt-directory-title">Знайдіть населений пункт у довіднику</a> або введіть його в калькуляторі.</li><li>На міській сторінці перевірте громаду, джерело рішення, категорію туризму та період дії ставки.</li><li>Для розрахунку вкажіть кількість гостей і 24-годинних розрахункових діб; для тарифних діапазонів також потрібна ціна проживання на одну особу за добу.</li><li>Можливі законні звільнення та підтвердні документи перевірте окремо з податковим агентом.</li></ol><p>Калькулятор показує попередню суму за введеними даними. Для обліку й звітності використовуйте чинне рішення громади та первинні записи про проживання.</p></section>`;
  const quickSearch=`<div class="tt-search-wrap tt-directory-quick-search"><label for="tt-place-search">Знайти місто або громаду</label><input id="tt-place-search" type="search" placeholder="Наприклад, Львів або Яремчанська громада" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="tt-place-search-results" aria-autocomplete="list" aria-describedby="tt-place-search-help tt-place-search-status"><span class="tt-hint" id="tt-place-search-help">Почніть вводити назву міста, громади або області. У довіднику ${directoryPlaces.length} ${pluralPlaces(directoryPlaces.length)}, згрупованих за областями.</span><div id="tt-place-search-results" class="tt-results" role="listbox" aria-label="Опубліковані сторінки населених пунктів" hidden></div><p id="tt-place-search-status" class="tt-hint" aria-live="polite"></p><p class="tt-search-all"><a href="/tourist-tax/rates/">Переглянути реєстр місцевих ставок і джерел</a></p></div>`;
  const content = `<main class="tt-main"><section class="tt-hero"><p class="tt-eyebrow">ДОВІДНИК ДЛЯ УКРАЇНИ</p><h1>Туристичний збір в Україні у 2026 році: довідник громад і розрахунок</h1><p class="tt-lead">Перевірте місцеву ставку, зрозумійте принцип розрахунку та порахуйте орієнтовну суму для гостей вашого об’єкта.</p>${quickSearch}<a class="tt-button tt-hero-link" href="#tt-calculator">Перейти до калькулятора</a><a class="tt-inline-link" href="/tourist-tax/rates/">Переглянути реєстр ставок</a></section>${touristTaxDashboard()}${dataInterpretation}${infographic}<div id="tt-calculator">${calculator()}</div><section class="tt-section tt-directory" aria-labelledby="tt-directory-title"><div class="tt-section-heading"><div><p class="tt-eyebrow">ДОВІДНИК МІСТ</p><h2 id="tt-directory-title">Ставки туристичного збору за містами</h2><p class="tt-hint">${directoryPlaces.length} ${pluralPlaces(directoryPlaces.length)} у довіднику, згрупованих за областями. Відкрийте сторінку локації, щоб переглянути ставку, джерела й примітки.</p></div><a class="tt-directory-register" href="/tourist-tax/rates/">Переглянути реєстр ставок <span aria-hidden="true">↗</span></a></div>${placeList||'<p>Довідник оновлюється з офіційних рішень місцевих рад.</p>'}<p class="tt-hint">Ставки й періоди дії відрізняються між громадами. Перед застосуванням звірте першоджерело на сторінці населеного пункту.</p></section>${touristTaxFunnelPromo({source:'tourist_tax_hub',placement:'hub_after_directory'})}<section class="tt-method"><h2>Як працює туристичний збір</h2><p>Ставку встановлює місцева рада. За статтею 268 Податкового кодексу України її визначають за одну особу за одну добу тимчасового розміщення. Доба становить 24 години між розрахунковими годинами об’єкта.</p><p>Сума залежить від місцевого рішення, категорії туризму, кількості гостей і фактичної кількості діб. Калькулятор показує інформаційний розрахунок на основі вказаних параметрів і чинних даних для обраного міста.</p><p>Можливі звільнення від сплати до результату не застосовуються. Підставу та документи перевіряє податковий агент. Не вводьте в калькулятор імена, паспортні дані або іншу персональну інформацію.</p></section><p class="tt-article-link"><a href="/blog/turystychnyi-zbir-gotel-ukraina">Повний посібник з туристичного збору у 2026 році: ставки, пільги, розрахунок і звітність →</a></p><p class="tt-article-link"><a href="/blog/rozrakhunok-turystychnoho-zboru-2026">Формула туристичного збору у 2026 році та 7 прикладів розрахунку →</a></p>${seoBlock}${sourcesPanel()}</main>`;
  // Directory search covers verified, preliminary, and batch004 pages. The calculator only lists entries with an existing supported rate model.
  const publicPlaces=verifiedPlaces.map(place=>({slug:place.slug,name:place.name,region:place.region,district:place.district||'',community:touristTaxCommunities.find(item=>item.slug===place.communitySlug)?.name||'',verified:true,route:place.route,rateModel:getTouristTaxRule(place)?.rateSchedule?'banded':'flat'}));
  const preliminarySearchPlaces=preliminaryPlaces.map(place=>({slug:place.slug,name:place.name,region:place.region,district:place.district||'',community:touristTaxCommunities.find(item=>item.slug===place.communitySlug)?.name||'',verified:false,calculatorAvailable:canCalculatePreliminaryTouristTaxPlace(place),route:place.route}));
  const batchSearchPlaces=touristTaxBatch004Places.map(place=>{
    const calculatorAvailable=Boolean(getTouristTaxBatch004RateModel(place));
    const hasNumericRate=/\d+(?:[,.]\d+)?\s*%/u.test(place.rateText);
    return {slug:place.slug,name:place.name,region:place.region,district:place.district,community:place.community,verified:false,calculatorAvailable,calculatorUnavailableReason:calculatorAvailable?'':place.slug==='bar'?'GEO_REVIEW':hasNumericRate?'RATE_STRUCTURE':'NO_RATE',rateModel:'flat',route:place.route,aliases:place.source['Варіанти назв VDALO']||'',katottg:place.katottgSettlementCode,status:place.dataStatus};
  });
  const identityAliasSearchPlaces=touristTaxBatch004Aliases.map(place=>({slug:place.slug,name:place.name,region:place.region,district:'',community:place.community,verified:false,route:place.route,aliases:'Драгобрат',katottg:'',status:'АЛЬТЕРНАТИВНА НАЗВА ЛОКАЦІЇ'}));
  const footerAddon=`<span class="tt-dashboard-source">Джерело статистики: <a href="${h(touristTaxDashboard2026.powerBiUrl)}" target="_blank" rel="noopener noreferrer">дашборд ДПС у Power BI</a></span>`;
  return shell({title:'Туристичний збір 2026: громади й розрахунок | VDALO',description:`Довідник туристичного збору на 2026 рік за ${directoryPlaces.length} населеними пунктами. Шукайте громаду та відкривайте місцеві ставки, джерела й статус даних.`,canonical:'/tourist-tax/',content,config:{publicPlaces,preliminaryPlaces:preliminarySearchPlaces,batchPlaces:batchSearchPlaces,identityAliases:identityAliasSearchPlaces},footerAddon,social:true});
}

function touristTaxRateSummary(rule) {
  if (rule.ratePeriods?.length) {
    const first=rule.ratePeriods[0];
    return `Внутрішній: ${decimalLabel(rule.rates.domestic)}%; в’їзний: ${decimalLabel(rule.rates.inbound)}% до 15 липня, ${decimalLabel(first.rates.inbound)}% з 16 липня`;
  }
  if (rule.rateSchedule?.bands || rule.rateSchedule?.domestic || rule.rateSchedule?.inbound) return 'Залежить від ціни проживання';
  if (rule.accommodationTypeRates) return 'Залежить від типу розміщення';
  if (!rule.rates) return 'Умови наведено в рішенні';
  return `Внутрішній: ${decimalLabel(rule.rates.domestic)}%; в’їзний: ${decimalLabel(rule.rates.inbound)}%`;
}

export function renderTouristTaxRates() {
  const preliminaryPlaces=touristTaxBatch24_25DraftSlugs.map(getTouristTaxPlace).filter(Boolean);
  const places=[...new Map([
    ...touristTaxPlaces.filter(place=>canIndexTouristTaxPlace(place)||place.slug==='odesa'),
    ...preliminaryPlaces,
  ].map(place=>[place.slug,place])).values()].sort((a,b)=>a.name.localeCompare(b.name,'uk'));
  const existingRoutes=new Set(places.map(place=>place.route));
  const batchPlaces=touristTaxBatch004Places.filter(place=>!existingRoutes.has(place.route));
  const registerCount=places.length+batchPlaces.length;
  const rows=places.map(place=>{
    const rule=getTouristTaxRule(place);
    const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
    const confirmed=canIndexTouristTaxPlace(place);
    const draft=touristTaxBatch24_25Drafts[place.slug];
    const candidateRates=place.sourceRecord?.proposedRates;
    const searchable=[place.name,place.region,place.district,community?.name,place.katottgSettlementCode,community?.katottgCode].filter(Boolean).join(' ').toLocaleLowerCase('uk-UA');
    const hasDomestic=confirmed?Boolean(rule.rates?.domestic||rule.rateSchedule?.domestic||rule.rateSchedule?.bands||rule.accommodationTypeRates):Number.isFinite(candidateRates?.domestic);
    const hasInbound=confirmed?Boolean(rule.rates?.inbound||rule.rateSchedule?.inbound||rule.rateSchedule?.bands||rule.accommodationTypeRates):Number.isFinite(candidateRates?.inbound);
    const rateText=confirmed?touristTaxRateSummary(rule):`Попередні значення: внутрішній ${decimalLabel(candidateRates.domestic)}%; в’їзний ${decimalLabel(candidateRates.inbound)}%`;
    const effective=confirmed?(rule.ratePeriods?.length?'2026 рік; зміну ставки для в’їзного туризму застосовуємо з 16 липня':rule.effectiveFrom?`Від ${dateLabel(rule.effectiveFrom)}`:'Період перевіряється'):'Попередні дані для 2026 року; чинність звіряється';
    const sourceLink=confirmed
      ?(rule.sourceUrl?`<a href="${h(rule.sourceUrl)}" target="_blank" rel="noopener noreferrer">Офіційне джерело</a>`:'Офіційний акт перевіряється')
      :[draft?.sourceUrl&&`<a href="${h(draft.sourceUrl)}" target="_blank" rel="noopener noreferrer">${h(draft.sourceLabel||'Зведене джерело')}</a>`,draft?.secondarySourceUrl&&`<a href="${h(draft.secondarySourceUrl)}" target="_blank" rel="noopener noreferrer">Додаткове джерело</a>`].filter(Boolean).join('<br>');
    const reviewNote=confirmed?(rule.checkedAt?`Перевірено ${h(dateLabel(rule.checkedAt))}`:'Дату звірки уточнюємо'):`${h(draft?.decision||'Повний місцевий акт і чинність ще звіряються')}`;
    const regionLabel=touristTaxRegionLabel(place.region);
    return `<tr data-search="${h(searchable)}" data-region="${h(regionLabel)}" data-domestic="${hasDomestic}" data-inbound="${hasInbound}" data-status="${confirmed?'verified':'review'}" data-year="2026"><th scope="row"><a href="${h(place.route)}">${h(place.name)}</a><span>${h(community?.name||place.community||'')}</span></th><td>${h(regionLabel)}</td><td>${h(community?.katottgCode||'Не зазначено')}</td><td>${h(rateText)}</td><td>${h(effective)}</td><td>${sourceLink}<span class="tt-rates-checked">${reviewNote}</span></td><td><span class="tt-rates-status${confirmed?'':' is-review'}">${confirmed?'Підтверджено':'Попередні дані · перевірка триває'}</span></td></tr>`;
  }).join('');
  const batchRows=batchPlaces.map(place=>{
    const source=place.source;
    const publicText=value=>h(String(value??'').replace(/\u2014/g,'\u2013'));
    const regionLabel=touristTaxRegionLabel(place.region);
    const searchable=[place.name,source['Варіанти назв VDALO'],place.region,regionLabel,place.district,place.community,place.katottgSettlementCode,place.communityCode].filter(Boolean).join(' ').toLocaleLowerCase('uk-UA');
    const sourceFields=['PDF ДПС / сторінки','Рішення як вказано у файлі','ID файлів/рішень ДПС'];
    const sourceUrls=[...new Set(sourceFields.flatMap(key=>String(source[key]??'').match(/https?:\/\/[^\s|,;)}\]]+/g)||[]).map(value=>value.replace(/[.]+$/,'')))].filter(value=>{try{return new URL(value).protocol==='https:';}catch{return false;}});
    const sourceLink=sourceUrls.length?`<a href="${h(sourceUrls[0])}" target="_blank" rel="noopener noreferrer">Джерело з погодженої бази</a>`:'URL джерела в окремому полі рядка не зазначено';
    const statusLabels={VDALO_PARTIAL_RATE_DATA:'Часткові дані, потрібна звірка',READY_FROM_DPS_FILE:'Дані перенесено з файла ДПС',READY_FROM_DPS_AND_VDALO:'Дані зіставлено за матеріалами ДПС і VDALO',READY_FROM_VDALO:'Дані підготовлено у базі VDALO'};
    const sourceStatus=source['Статус ставки на сайті']||'Не зазначено у джерельному файлі';
    const dataStatus=statusLabels[place.dataStatus]||place.dataStatus||'Статус даних не заповнено';
    const sourceNotes=[source['Рішення як вказано у файлі'],source['Статус форми/розбору ДПС'],source['Джерело ставки, пріоритетне']].filter(Boolean).map(publicText);
    const sourceNote=`${sourceNotes.length?sourceNotes.join(' · ')+' · ':''}Статус у файлі: ${publicText(sourceStatus)}; ${publicText(dataStatus)}.`;
    const hasDomestic=/внутріш|domestic/i.test(place.rateText);
    const hasInbound=/в’їзн|в'їзн|inbound/i.test(place.rateText);
    return `<tr data-search="${publicText(searchable)}" data-region="${publicText(regionLabel)}" data-domestic="${hasDomestic}" data-inbound="${hasInbound}" data-status="review" data-year="2026"><th scope="row"><a href="${h(place.route)}">${publicText(place.name)}</a><span>${publicText(place.community||'')}</span></th><td>${publicText(regionLabel)}</td><td>${publicText(place.communityCode||'Не зазначено')}</td><td>${publicText(place.rateText)}</td><td>2026 рік у погодженій базі; період чинності потребує звірки</td><td>${sourceLink}<span class="tt-rates-checked">${sourceNote}</span></td><td><span class="tt-rates-status is-review">Попередні дані · перевірка триває</span></td></tr>`;
  }).join('');
  const rowsMarkup=rows+batchRows;
  const regions=[...new Set([...places.map(place=>touristTaxRegionLabel(place.region)),...batchPlaces.map(place=>touristTaxRegionLabel(place.region))])].sort((a,b)=>a.localeCompare(b,'uk'));
  const regionOptions=regions.map(region=>`<option value="${h(region)}">${h(region)}</option>`).join('');
  const confirmedCount=places.filter(place=>canIndexTouristTaxPlace(place)).length;
  const reviewCount=places.length-confirmedCount+batchPlaces.length;
  const content=`<main class="tt-main tt-rates-main"><nav class="tt-breadcrumb" aria-label="Навігаційний ланцюжок"><a href="/tourist-tax/">Туристичний збір в Україні</a><span aria-current="page">Реєстр місцевих ставок</span></nav><section class="tt-city-hero"><p class="tt-eyebrow">ДОВІДНИК МІСЦЕВИХ ПРАВИЛ</p><h1>Реєстр ставок туристичного збору за локаціями</h1><p class="tt-lead">Перегляньте ставки й джерела для всіх ${registerCount} локацій. У реєстрі окремо показані підтверджені записи та значення, які потребують звірки. У таблиці окремо позначені підтверджені ставки й попередні значення, які ще перевіряємо.</p><p class="tt-rates-count"><strong>${confirmedCount}</strong> перевірених <span aria-hidden="true">·</span> ${reviewCount} попередніх або таких, що потребують звірки</p></section><section class="tt-section" aria-labelledby="tt-rates-method-title"><h2 id="tt-rates-method-title">Як читати реєстр</h2><p>Ставку встановлює місцева рада. Відсоток може бути фіксованим або залежати від вартості проживання чи типу об’єкта. У таблиці зібрані наявні значення для всіх локацій, а статус показує, чи завершена перевірка першоджерела.</p><p>Для ${reviewCount} локацій значення позначені як попередні або такі, що потребують звірки. Значення, реквізити й статуси перенесено з погоджених матеріалів. Територію дії та чинність місцевого акта перевіряйте за джерелом у рядку або на сторінці локації. Перед нарахуванням звірте документ громади.</p></section><section class="tt-rates-table-wrap" aria-labelledby="tt-rates-table-title"><div class="tt-rates-heading"><div><p class="tt-eyebrow">2026 РІК</p><h2 id="tt-rates-table-title">Ставки, джерела й статус звірки</h2></div><span>${registerCount} локацій</span></div><form class="tt-rates-filters" id="tt-rates-filters" role="search"><div><label for="tt-rates-query">Пошук за містом, громадою або КАТОТТГ</label><input id="tt-rates-query" type="search" autocomplete="off" placeholder="Наприклад, Львів або код громади"></div><div><label for="tt-rates-region">Область</label><select id="tt-rates-region"><option value="">Усі області</option>${regionOptions}</select></div><div><label for="tt-rates-year">Податковий рік</label><select id="tt-rates-year"><option value="2026">2026</option></select></div><div><label for="tt-rates-tourism">Категорія туризму</label><select id="tt-rates-tourism"><option value="">Усі категорії</option><option value="domestic">Внутрішній туризм</option><option value="inbound">В’їзний туризм</option></select></div><div><label for="tt-rates-status">Статус</label><select id="tt-rates-status"><option value="">Усі статуси</option><option value="verified">Підтверджено</option><option value="review">Попередні дані · перевірка триває</option></select></div><button type="reset">Очистити фільтри</button></form><p class="tt-rates-results" id="tt-rates-results" role="status" aria-live="polite">Показано ${registerCount} локацій.</p><div class="tt-rates-scroll" tabindex="0" role="region" aria-label="Таблиця місцевих ставок туристичного збору"><table class="tt-rates-table"><thead><tr><th scope="col">Населений пункт і громада</th><th scope="col">Область</th><th scope="col">КАТОТТГ громади</th><th scope="col">Правило ставки</th><th scope="col">Чинність</th><th scope="col">Джерело та примітка</th><th scope="col">Статус</th></tr></thead><tbody>${rowsMarkup}</tbody></table><p class="tt-rates-empty" id="tt-rates-empty" hidden>За цими умовами записів не знайдено. Змініть пошуковий запит або фільтри.</p></div></section><section class="tt-method"><h2>Як перевіряємо дані</h2><p>Для підтверджених записів наводимо місцеве рішення, період його дії та дату звірки. Для попередніх записів показуємо зібрані відсотки й доступні джерела, а територіальне застосування, повний текст акта та його чинну редакцію ще перевіряємо.</p><p>Якщо ви помітили розбіжність у документі чи території, напишіть нам через <a href="/contact">сторінку контактів</a>. Не надсилайте персональні дані гостей.</p></section><p class="tt-article-link"><a href="/tourist-tax/">Повернутися до довідника та калькулятора</a></p></main><script src="/tourist-tax-assets/tourist-tax-rates.js" defer></script>`;
  return shell({title:'Туристичний збір 2026: реєстр ставок | VDALO',description:`Реєстр ставок туристичного збору на 2026 рік за ${registerCount} локаціями: значення, громади, джерела та статус перевірки.`,canonical:'/tourist-tax/rates/',content:content.replace('/tourist-tax-assets/tourist-tax-rates.js" defer',`/tourist-tax-assets/tourist-tax-rates.js?v=${assetVersion('tourist-tax-rates.js')}" defer`),social:true});
}

export function renderTouristTaxCity(slug) {
  const place = getTouristTaxPlace(slug);
  // Keep the existing URL useful while conflicting official rates are reviewed.
  if(place?.slug==='odesa'&&getTouristTaxRule(place)?.status==='CONFLICT'){
    const rule=getTouristTaxRule(place);
    return shell({title:'Туристичний збір в Одесі 2026: перевірка змін ставки | VDALO',description:'Офіційні джерела Одеси містять різні ставки. Пояснюємо розбіжність і що перевірити перед нарахуванням туристичного збору.',canonical:'/tourist-tax/odesa/',robots:'noindex,follow',social:true,content:`<main class="tt-main"><nav class="tt-breadcrumb" aria-label="Навігаційний ланцюжок"><a href="/tourist-tax/">Туристичний збір в Україні</a><span aria-current="page">Одеса</span></nav><section class="tt-city-hero"><p class="tt-eyebrow">ДЖЕРЕЛА НА ПЕРЕВІРЦІ</p><h1>Туристичний збір в Одесі у 2026 році: уточнюємо період дії ставки</h1><p class="tt-lead">Річна форма ДПС наводить 0,50% для в’їзного туризму, а повідомлення ДПС від 18 вересня 2026 року про рішення №4314-VIII – 1%. Дата застосування нового правила потребує звірки з повним текстом рішення.</p></section><section class="tt-section"><h2>Чому зараз немає розрахунку</h2><p>Поки джерела суперечать одне одному, калькулятор не визначає суму для Одеси. Не варто автоматично застосовувати старий відсоток до всього року або новий – від дати ухвалення рішення. Перед нарахуванням перевірте чинний акт, його додатки та період проживання з бухгалтером або місцевою ДПС.</p><p>Редакційне уточнення: 23 жовтня 2026 року. Ця дата не означає, що нову ставку вже підтверджено.</p><p><a href="/blog/rozrakhunok-turystychnoho-zboru-2026">Як обчислюють туристичний збір</a> · <a href="/tourist-tax/">Повернутися до довідника громад</a> · <a href="/tourist-tax/rates/">Переглянути реєстр місцевих правил</a></p></section>${citySources(place,rule)}</main>`});
  }
  if (!place || !canIndexTouristTaxPlace(place)) return null;
  const rule=getTouristTaxRule(place);
  const placeInLocative=placeLocative(place);
  const minimumWage=touristTaxSources.budget2026.minimumWageOnJanuary1;
  const isBanded=Boolean(rule.rateSchedule);
  const accommodationTypeRates=rule.accommodationTypeRates;
  const workbookRates=place.sourceRecord?.proposedRates;
  // A verified city may still have a source mismatch even when the imported
  // workbook happens to match the selected rate. Prefer the explicit,
  // page-level comparison recorded during research.
  const referenceRates=place.editorial?.rateConflict?.referenceRates??workbookRates;
  const hasWorkbookRateConflict=Number.isFinite(referenceRates?.domestic)&&Number.isFinite(referenceRates?.inbound)&&(
    isBanded
    || Boolean(accommodationTypeRates)
    || referenceRates.domestic!==rule.rates?.domestic
    || referenceRates.inbound!==rule.rates?.inbound
  );
  const workbookConflictNote=hasWorkbookRateConflict
    ? `<p class="tt-rate-caveat"><strong>* Значення у джерелах відрізняються.</strong> ${place.slug==='odesa'?'Попередні довідкові дані наводили 0,50% / 5%, а ДПС у 2026 році повідомила про 1% для іноземців за рішенням №4314-VIII. На 2026 рік калькулятор застосовує 0,50% / 0,50% із підписаної річної форми ДПС; загальне правило Податкового кодексу пов’язує зміну ставки з початком бюджетного періоду. Період застосування нового рішення належить звірити з його повним текстом.':`За попередніми довідковими даними ставка становила ${h(decimalLabel(referenceRates.domestic).replace(/,00$/,''))}% / ${h(decimalLabel(referenceRates.inbound).replace(/,00$/,''))}%. ${accommodationTypeRates?'Рішення громади розрізняє категорії місць проживання; калькулятор застосовує ставку після вибору типу об’єкта.':isBanded?'Офіційне джерело задає кілька тарифів залежно від ціни проживання однієї особи за добу. Калькулятор застосовує відповідний ціновий діапазон.':'Для розрахунку на цій сторінці використано '+h(decimalLabel(rule.rates.domestic).replace(/,00$/,''))+'% / '+h(decimalLabel(rule.rates.inbound).replace(/,00$/,''))+'% із підтвердженого офіційного джерела, наведеного нижче.'}`}</p>`
    : '';
  const odesa2026Rule=place.slug==='odesa';
  const rateCards=accommodationTypeRates
    ?Object.entries(accommodationTypeRates).map(([key,type])=>`<article><span>${h(type.label)}</span><strong>${h(decimalLabel(type.domestic).replace(/,00$/,''))}% / ${h(decimalLabel(type.inbound).replace(/,00$/,''))}%${hasWorkbookRateConflict?'*':''}</strong><small>Внутрішній / в’їзний туризм; категорію оберіть у калькуляторі</small></article>`).join('')
    :isBanded
    ? ['domestic','inbound'].map((category,index)=>{
      const label=category==='domestic'?'Внутрішній туризм':'В’їзний туризм';
      const bands=rule.rateSchedule.bands;
      const tiers=rule.rateSchedule[category];
      const content=bands
        ?bands.map((band,index)=>{
          const rate=category==='domestic'?band.domesticRatePercent:band.inboundRatePercent;
          const lower=band.minPriceExclusiveUahPerPersonPerDay!==undefined?`понад ${thresholdLabel(band.minPriceExclusiveUahPerPersonPerDay)}`:band.minPriceUahPerPersonPerDay===undefined?'':`від ${thresholdLabel(band.minPriceUahPerPersonPerDay)}`;
          const upper=band.maxPriceUahPerPersonPerDay===undefined?'і більше':`до ${thresholdLabel(band.maxPriceUahPerPersonPerDay)} включно`;
          return `<small>${[lower,upper].filter(Boolean).join(' ')} грн за особу за добу: ${h(decimalLabel(rate).replace(/,00$/,''))}%</small>`;
        }).join('')
      :tiers.map(tier=>`<small>${tier.operator==='lt'?'менше':'понад'} ${h(thresholdLabel(rule.rateSchedule.thresholdUahPerPersonPerDay))} грн за особу за добу: ${h(decimalLabel(tier.ratePercent).replace(/,00$/,''))}%</small>`).join('');
      const range=bands?bands.map(band=>decimalLabel(category==='domestic'?band.domesticRatePercent:band.inboundRatePercent).replace(/,00$/,'')).join('–'):tiers.map(tier=>decimalLabel(tier.ratePercent).replace(/,00$/,'')).join('–');
      return `<article><span>${label}</span><strong>${h(range)}%${hasWorkbookRateConflict?'*':''}</strong>${content}</article>`;
    }).join('')
    : (()=>{
      const dailyDomestic=decimalLabel(minimumWage*rule.rates.domestic/100),dailyInbound=decimalLabel(minimumWage*(odesa2026Rule?1:rule.rates.inbound)/100);
      const domesticRate=decimalLabel(rule.rates.domestic).replace(/,00$/,''),inboundRate=decimalLabel(odesa2026Rule?1:rule.rates.inbound).replace(/,00$/,'');
      return `<article><span>Внутрішній туризм</span><strong>${h(domesticRate)}%${hasWorkbookRateConflict?'*':''}</strong><small>${odesa2026Rule?'43,24 грн з особи за добу у 2026 році':`приблизно ${h(dailyDomestic)} грн за одну особу за добу`}</small></article><article><span>В’їзний туризм</span><strong>${h(inboundRate)}%${hasWorkbookRateConflict?'*':''}</strong><small>${odesa2026Rule?'86,47 грн з особи за добу з 16 липня 2026 року':`приблизно ${h(dailyInbound)} грн за одну особу за добу`}</small></article>`;
    })();
  const ambiguousPrices=rule.rateSchedule?.bands?rule.rateSchedule.ambiguousBoundariesUahPerPersonPerDay||[]:[rule.rateSchedule?.thresholdUahPerPersonPerDay].filter(Number.isFinite);
  const cityIntroduction=touristTaxCityIntroductions[place.slug];
  const rateLead=accommodationTypeRates?'У 2026 році ставка залежить від типу місця розміщення: 0,50% для закладів готельного типу та 0,30% для садиб, квартир, котеджів та інших перелічених місць. Для внутрішнього й в’їзного туризму ставки однакові. У калькуляторі оберіть тип житла.':isBanded?`У 2026 році відсоток залежить від вартості проживання на одну особу за добу.${ambiguousPrices.length?` Для ціни рівно ${ambiguousPrices.map(thresholdLabel).join(' та ')} грн межа ставки не визначена однозначно, тому калькулятор не вгадує ставку.`:''}`:odesa2026Rule?'За рішенням №4314-VIII ставка для громадян України становить 0,5%, для іноземних гостей - 1%. Зміна застосовується з 16 липня 2026 року. Калькулятор розділяє розрахунок, якщо проживання припадає на періоди до і після цієї дати.':'На цій сторінці наведено дані для проживання у 2026 році. Дату початку дії місцевого рішення та дату редакційної перевірки вказано окремо нижче. Розрахуйте орієнтовну суму за кількістю гостей і діб.';
  const calculationSection=isBanded
    ? `<section class="tt-section"><h2>Як розрахувати туристичний збір у ${h(placeInLocative)}</h2><p>Для 2026 року мінімальна зарплата, від якої обчислюють збір, становить ${new Intl.NumberFormat('uk-UA').format(minimumWage)} грн. Оберіть тариф за ціною проживання однієї особи за добу та категорією туризму, потім помножте його на кількість гостей і розрахункових діб.</p><div class="tt-formula"><strong>Мінімальна зарплата × місцева ставка × кількість гостей × розрахункові доби</strong><span>${ambiguousPrices.length?`Ціна рівно ${ambiguousPrices.map(thresholdLabel).join(' та ')} грн потребує уточнення, калькулятор не вгадує тариф.`:'Спершу перевірте ціновий діапазон за місцевим рішенням.'}</span></div><p>Наприклад, ставка для кожної особи за одну добу залежить від її категорії туризму й відповідного цінового діапазону. Калькулятор округлює загальну суму до копійок після множення.</p></section>`
    : `<section class="tt-section"><h2>Як розрахувати суму</h2><p>Розрахунок залежить від мінімальної заробітної плати на 1 січня відповідного податкового року, місцевої ставки, кількості гостей та розрахункових діб. У 2026 році мінімальна зарплата для цієї формули становить 8 647 грн.</p><div class="tt-formula"><strong>Мінімальна зарплата × ставка громади × кількість гостей × розрахункові доби</strong><span>Розрахункову добу визначають за правилами об’єкта, з інтервалом 24 години між двома розрахунковими годинами.</span></div><p>Ставки встановлюються за кожну добу проживання. Податкове зобов’язання й можливі звільнення перевіряйте за місцевим рішенням і статтею 268 Податкового кодексу.</p></section>`;
  const faqRates=accommodationTypeRates?'Ставки різняться за видом місця проживання: 0,50% для готелів, мотелів і закладів готельного типу; 0,30% для житлових будинків, квартир, котеджів, кімнат, садиб та інших місць тимчасового проживання. Для внутрішнього й в’їзного туризму застосовуються однакові відсотки. У калькуляторі потрібно обрати категорію, що відповідає вашому об’єкту.':isBanded
    ? rule.rateSchedule.bands
      ? `Для однієї особи за добу ставки залежать від ціни проживання. Для внутрішнього туризму застосовуються рівні ${rule.rateSchedule.bands.map(band=>`${band.domesticRatePercent}%`).join(', ')}, для в’їзного туризму ${rule.rateSchedule.bands.map(band=>`${band.inboundRatePercent}%`).filter((rate,index,rates)=>rates.indexOf(rate)===index).join(' та ')}.${ambiguousPrices.length?` Ціна рівно ${ambiguousPrices.map(thresholdLabel).join(' та ')} грн неоднозначна в офіційній формі, тому калькулятор не повертає суму на цих межах.`:''}`
      : `У ${placeInLocative} ставка залежить від вартості проживання однієї особи за добу. Нижче ${thresholdLabel(rule.rateSchedule.thresholdUahPerPersonPerDay)} грн діють ставки ${rule.rateSchedule.domestic.find(tier=>tier.operator==='lt')?.ratePercent}% та ${rule.rateSchedule.inbound.find(tier=>tier.operator==='lt')?.ratePercent}%; вище порогу діють ${rule.rateSchedule.domestic.find(tier=>tier.operator==='gt')?.ratePercent}% та ${rule.rateSchedule.inbound.find(tier=>tier.operator==='gt')?.ratePercent}%. За ціни рівно ${ambiguousPrices.map(thresholdLabel).join(' та ')} грн калькулятор не видає суму через перетин у формулюванні місцевого рішення.`
    : odesa2026Rule?'До 15 липня 2026 року включно ставки становили 0,5% для внутрішнього та в’їзного туризму. Від 16 липня ставка для внутрішнього туризму становить 0,5%, для в’їзного - 1%. Рішення №4314-VIII набирає чинності з дня офіційного оприлюднення; дата сторінки акта на офіційному сайті ради - 16 липня 2026 року. Річна форма ДПС із попередніми ставками була сформована до цієї зміни.'
    : `${decimalLabel(rule.rates.domestic).replace(/,00$/,'')}% для внутрішнього та ${decimalLabel(rule.rates.inbound).replace(/,00$/,'')}% для гостей, які прибули з-за кордону від мінімальної зарплати на 1 січня податкового року за кожну особу й розрахункову добу. Ставки діють з ${dateLabel(rule.effectiveFrom)}.`;
  const faqItems=[
    {question:`Які ставки туристичного збору діють ${placeLocativePhrase(place)}?`,answer:faqRates},
    ...(odesa2026Rule?[{question:'Коли в Одесі змінилася ставка для іноземних гостей?',answer:'Рішення №4314-VIII встановлює, що набирає чинності з дня офіційного оприлюднення. На офіційному сайті Одеської міської ради сторінка акта має дату створення 16 липня 2026 року. Тому калькулятор застосовує 1% до розрахункових діб від цієї дати. У примітці до акта також зазначено публікацію в газеті «Одеська правда» 30 липня 2026 року.'}]:[]),
    ...(touristTaxCityEditorialFaq[place.slug]?[touristTaxCityEditorialFaq[place.slug]]:[]),
    {question:'Як рахуються доби проживання?',answer:'Податковий кодекс визначає добу як 24 години між двома послідовними розрахунковими годинами. Звірте період проживання з годинами, встановленими вашим об’єктом.'},
    {question:'Чи враховує калькулятор пільги?',answer:'Ні. Він показує орієнтовну суму до врахування можливої пільги. Підставу й документи перевірте з податковим агентом.'},
    {question:'Чи можна використовувати результат для звітності?',answer:'Використовуйте його для попередньої оцінки. Для обліку та декларації застосовуйте фактичні дані проживання, чинні першоджерела, документи та вимоги податкового законодавства.'},
  ];
  const faqMarkup=faqItems.map(item=>`<details><summary>${h(item.question)}</summary><p>${h(item.answer)}</p></details>`).join('');
  const publicationBasis=rule.publicationBasisText||`Ставки встановлено рішенням міської ради №${h(rule.decisionNumber)} від ${dateLabel(rule.decisionDate)}. Вони діють з ${dateLabel(rule.effectiveFrom)}.`;
  const locationLabel=place.district?`${place.region} · ${place.district}`:place.region;
  const content = `<main class="tt-main"><nav class="tt-breadcrumb" aria-label="Навігаційний ланцюжок"><a href="/tourist-tax/">Туристичний збір в Україні</a><span aria-current="page">${h(place.name)}</span></nav><section class="tt-city-hero"><p class="tt-eyebrow">${h(locationLabel)}</p><h1>Туристичний збір ${h(placeLocativePhrase(place))} у 2026 році</h1>${cityIntroduction?`<p class="tt-city-intro">${h(cityIntroduction)}</p>`:''}<p class="tt-lead">${rateLead}</p><div class="tt-rate-grid">${rateCards}</div><p class="tt-updated">${h(publicationBasis)}</p>${workbookConflictNote}</section>${calculator(place)}${calculationSection}${touristTaxFunnelPromo({source:'tourist_tax_city',place,placement:'city_after_calculator'})}<section class="tt-section"><h2>Кому нараховують збір і коли перевіряти пільгу</h2><p>Стаття 268 Податкового кодексу визначає платників збору, правила справляння та випадки, коли особа не є платником. Серед передбачених законом категорій є, зокрема, діти до 18 років, окремі особи у відрядженні під час проживання у визначених законом об’єктах, а також інші категорії зі статті 268.2.2.</p><p>Калькулятор не встановлює право на пільгу й не збирає підтвердні документи. Якщо є можлива підстава для звільнення, її слід перевірити з податковим агентом та за актуальним текстом закону.</p></section><section class="tt-method"><h2>Поширені запитання</h2>${faqMarkup}</section>${citySeoBlock(place)}${citySources(place,rule)}<p class="tt-article-link"><a href="/tourist-tax/">Повернутися до довідника туристичного збору</a> · <a href="/tourist-tax/rates/">Переглянути реєстр підтверджених ставок</a></p>${sourcesPanel()}</main>`;
  const title=['kyyiv','odesa','polyana','khust','dnipro','zhytomyr','vynohradiv','yaremche','yasinya','tyachiv','irpin','skole'].includes(place.slug)&&place.editorial.title?place.editorial.title:`Туристичний збір ${placeLocativePhrase(place)} 2026: ставки | VDALO`;
  const description=publicTaxCopy(place.editorial.description);
  const canonical=ORIGIN+place.route;
  const structuredData={'@context':'https://schema.org','@graph':[
    {'@type':'WebPage','@id':`${canonical}#webpage`,url:canonical,name:title,description,inLanguage:'uk','isPartOf':{'@type':'WebSite','@id':`${ORIGIN}/#website`,url:`${ORIGIN}/`,name:'VDALO'},breadcrumb:{'@id':`${canonical}#breadcrumb`},mainEntity:{'@id':`${canonical}#faq`}},
    {'@type':'BreadcrumbList','@id':`${canonical}#breadcrumb`,itemListElement:[
      {'@type':'ListItem',position:1,name:'Туристичний збір в Україні',item:`${ORIGIN}/tourist-tax/`},
      {'@type':'ListItem',position:2,name:place.name,item:canonical},
    ]},
    {'@type':'FAQPage','@id':`${canonical}#faq`,inLanguage:'uk',mainEntity:faqItems.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))},
  ]};
  return shell({title,description,canonical:place.route,robots:'index,follow',content,config:{placeSlug:place.slug,calculationState:'READY'},social:true,structuredData});
}

export function touristTaxBatch24_25PreviewSlugs() {
  return touristTaxBatch24_25DraftSlugs;
}

export function renderTouristTaxBatch004Place(slug) {
  const place=getTouristTaxBatch004Place(slug);
  if(!place)return null;
  const source=place.source;
  const display=value=>h(String(value??'').replace(/\u2014/g,'\u2013'));
  const sourceFields=['PDF ДПС / сторінки','Рішення як вказано у файлі','ID файлів/рішень ДПС'];
  const candidateUrls=[...new Set(sourceFields.flatMap(key=>String(source[key]??'').match(/https?:\/\/[^\s|,;)}\]]+/g)||[])
    .map(value=>value.replace(/[.]+$/,''))
    .filter(value=>{try{const parsed=new URL(value);return parsed.protocol==='https:'&&!/(^|\.)vdalo\.tech$/i.test(parsed.hostname);}catch{return false;}}))];
  const sourcesMarkup=candidateUrls.length
    ?`<ul>${candidateUrls.map((url,index)=>`<li><a href="${h(url)}" target="_blank" rel="noopener noreferrer">${index===0?'Відкрити джерело з погодженої бази':'Додаткове джерело з погодженої бази'}</a></li>`).join('')}</ul>`
    :'<p>Пряме посилання на першоджерело в окремому полі цього рядка не зазначене. Перевірте реквізити рішення з погодженої бази та актуальний документ громади.</p>';
  const decision=source['Рішення як вказано у файлі'];
  const dpsStatus=source['Статус форми/розбору ДПС'];
  const sourceRegistry=source['Джерело ставки, пріоритетне'];
  const sourceNote=[decision&&`Рішення у книзі: ${decision}`,dpsStatus&&`Статус запису ДПС у книзі: ${dpsStatus}`,sourceRegistry&&`Примітка до джерела: ${sourceRegistry}`].filter(Boolean);
  const statusText=place.dataStatus||'Статус не заповнено';
  const sourceRateStatus=source['Статус ставки на сайті']||'Не зазначено в книзі';
  const isPreliminary=true;
  const statusHeading=isPreliminary
    ?'Попередні дані · перевірка триває'
    :sourceRateStatus==='Не зазначено в книзі'?'Статус за погодженою базою':sourceRateStatus;
  const statusNote=isPreliminary
    ?'* Дані ще перебувають на стадії підтвердження. Перед застосуванням звірте чинне рішення громади.'
    :'Сторінку сформовано з погодженого файла. Перевірте зазначені реквізити та першоджерело перед застосуванням даних до конкретного об’єкта.';
  const locationRef=`для локації «${place.name}»`;
  const dataStatusLabels={
    VDALO_PARTIAL_RATE_DATA:'Часткові дані, потрібна звірка',
    READY_FROM_DPS_FILE:'Дані перенесено з файла ДПС',
    READY_FROM_DPS_AND_VDALO:'Дані зіставлено за матеріалами ДПС і VDALO',
    READY_FROM_VDALO:'Дані підготовлено у базі VDALO',
    RATE_FROM_PUBLISHED_SITE_CONFIRMED:'Запис пов’язаний із підтвердженою ставкою на сайті',
    RATE_FROM_PUBLISHED_SITE_PRELIMINARY:'Попередній запис, перевірка триває',
  };
  const readerStatus=dataStatusLabels[place.dataStatus]||statusText;
  const sourceStatusMarkup=`Статус ставки у книзі: ${display(sourceRateStatus)}<br>Статус даних: ${display(readerStatus)} <span>(код: <code>${display(statusText)}</code>)</span>`;
  const communityLabel=place.community||'громада у вихідному рядку не зазначена';
  const districtLabel=place.district?`, ${place.district}`:'';
  const relatedCandidates=touristTaxBatch004Places.filter(candidate=>candidate.slug!==slug&&candidate.communityCode&&candidate.communityCode===place.communityCode);
  const sameArea=relatedCandidates.length?relatedCandidates:touristTaxBatch004Places.filter(candidate=>candidate.slug!==slug&&candidate.region===place.region);
  const relatedLinks=[...new Map(sameArea.map(item=>[item.route,item])).values()].slice(0,3);
  const relatedSeoLinks=relatedLinks.length?`<h3>Інші локації поруч у довіднику</h3><ul>${relatedLinks.map(item=>`<li><a href="${h(item.route)}">Туристичний збір: ${display(item.name)}</a>${item.community?` <span>(${display(item.community)})</span>`:''}</li>`).join('')}</ul>`:'';
  const linkedSourceAnswer=candidateUrls.length
    ?`У погодженій базі є посилання на джерело. <a href="${h(candidateUrls[0])}" target="_blank" rel="noopener noreferrer">Відкрити документ або сторінку джерела</a>. Звірте повний текст рішення та період його дії.`
    :'У рядку погодженої бази немає прямого URL першоджерела. Реквізити, наведені на цій сторінці, допоможуть знайти документ громади.';
  const faqItems=[
    {question:`Яку ставку туристичного збору для локації «${place.name}» наведено на 2026 рік?`,answer:`У погодженій базі зазначено: ${place.rateText}. Статус ставки у вихідному рядку: ${sourceRateStatus}.`},
    {question:`До якої громади належить запис про туристичний збір для локації «${place.name}»?`,answer:`У рядку вказано: ${place.name}, ${communityLabel}${districtLabel}, ${place.region}. КАТОТТГ поселення: ${place.katottgSettlementCode}. КАТОТТГ громади: ${place.communityCode||'не зазначений у цьому рядку'}.`},
    {question:`Як перевірити туристичний збір для об’єкта в локації «${place.name}»?`,answer:`Зіставте адресу об’єкта з територією громади «${communityLabel}» в області «${place.region}», а потім перевірте категорію, період і редакцію місцевого рішення. Для цього запису бази даних зазначено статус «${sourceRateStatus}».`},
    {question:`Де знайти джерело ставки туристичного збору для «${place.name}»?`,answer:linkedSourceAnswer},
  ];
  const faqMarkup=faqItems.map(item=>`<details><summary>${display(item.question)}</summary><p>${item.answer}</p></details>`).join('');
  const sourceContext=sourceRegistry?`У полі пріоритету джерела книги зазначено: ${display(sourceRegistry)}.`:'';
  const rateStatusMark=' *';
  const localitySeoBlock=`<section class="tt-section tt-batch-seo" aria-labelledby="tt-batch-seo-title"><p class="tt-eyebrow">ДОВІДКА ЗА НАСЕЛЕНИМ ПУНКТОМ</p><h2 id="tt-batch-seo-title">Туристичний збір: дані для локації «${display(place.name)}»</h2><p>Ця сторінка відповідає на запит про ставку туристичного збору для локації «${display(place.name)}» на 2026 рік. У погодженому рядку вказано текст ставки «${display(place.rateText)}», громаду «${display(communityLabel)}» та область «${display(place.region)}». Наведене значення перенесено без перерахунку; статус запису показано вище.</p><h3>Як звірити запис із адресою об’єкта</h3><p>Для готелю, садиби чи іншого місця тимчасового проживання спершу зіставте населений пункт «${display(place.name)}» та КАТОТТГ ${display(place.katottgSettlementCode)} з адресою об’єкта. Далі перевірте, чи поширюється на цю адресу рішення ${display(communityLabel)}, яка категорія туриста й період застосування зазначені в документі. Сам факт належності до області ${display(place.region)} не визначає ставку для конкретної адреси.</p><h3>Статус і джерело даних</h3><p>${display(statusNote)} ${sourceContext} ${decision?`У погодженій базі також наведено реквізити рішення: ${display(decision)}.`:''} Загальні правила туристичного збору встановлює стаття 268 Податкового кодексу України; місцеві умови потрібно звіряти з документом відповідної ради.</p>${relatedSeoLinks}<p class="tt-article-link"><a href="/tourist-tax/">Повернутися до довідника локацій</a> · <a href="/tourist-tax/rates/">Переглянути реєстр ставок</a> · <a href="/blog/turystychnyi-zbir-gotel-ukraina">Посібник для готелів про туристичний збір</a> · <a href="/blog/rozrakhunok-turystychnoho-zboru-2026">Як рахувати туристичний збір</a></p></section>`;
  const preliminaryCalculator=calculator(place,{preliminary:true});
  const enhancedContent=`<main class="tt-main tt-batch004-page"><nav class="tt-breadcrumb" aria-label="Навігаційний ланцюжок"><a href="/tourist-tax/">Туристичний збір в Україні</a><span aria-current="page">${display(place.name)}</span></nav><section class="tt-city-hero"><p class="tt-eyebrow">ДОВІДНИК МІСЦЕВИХ СТАВОК</p><h1>${display(place.h1)}</h1><p class="tt-lead">Довідкова інформація про туристичний збір ${display(locationRef)}, область ${display(place.region)}. Ставку та її статус перенесено з погодженої бази локацій.</p><div class="tt-rate-review" role="note"><strong>${display(statusHeading)}</strong><p>${display(statusNote)}</p><small>${sourceStatusMarkup}</small></div><div class="tt-batch-rate"><span>Ставка за погодженою базою на 2026 рік</span><p>${display(place.rateText)}${rateStatusMark}</p></div></section><section class="tt-section" aria-labelledby="tt-location-title"><h2 id="tt-location-title">Територіальна прив’язка запису</h2><dl class="tt-location-facts"><div><dt>Населений пункт</dt><dd>${display(place.name)}</dd></div><div><dt>Громада</dt><dd>${display(communityLabel)}</dd></div><div><dt>Область</dt><dd>${display(place.region||'У базі не зазначена')}</dd></div>${place.district?`<div><dt>Район</dt><dd>${display(place.district)}</dd></div>`:''}<div><dt>КАТОТТГ поселення</dt><dd><code>${display(place.katottgSettlementCode)}</code></dd></div><div><dt>КАТОТТГ громади</dt><dd><code>${display(place.communityCode||'У рядку не зазначено')}</code></dd></div></dl><p>КАТОТТГ допомагає відрізнити поселення з однаковими назвами. Зіставте його та адресу об’єкта з територією громади, яку зазначено в місцевому рішенні.</p></section><section class="tt-section" aria-labelledby="tt-rate-title"><h2 id="tt-rate-title">Ставка туристичного збору ${display(locationRef)}</h2><p class="tt-batch-rate-text">${display(place.rateText)}${rateStatusMark}</p><p>Текст ставки показано в тому вигляді, у якому його перенесено з погодженого рядка. Позначки категорій, попередності чи потреби в уточненні є частиною вихідного запису.</p><p>Для застосування до конкретного об’єкта звірте адресу, категорію туриста, період та чинну редакцію документа громади. Не використовуйте область як єдину підставу для визначення місцевої ставки.</p></section>${preliminaryCalculator}<section class="tt-section tt-sources" aria-labelledby="tt-local-sources-title"><h2 id="tt-local-sources-title">Джерела та реквізити</h2>${sourcesMarkup}${sourceNote.length?`<ul>${sourceNote.map(note=>`<li>${display(note)}</li>`).join('')}</ul>`:''}<p><a href="${h(touristTaxSources.taxCode.url)}" target="_blank" rel="noopener noreferrer">Стаття 268 Податкового кодексу України</a> описує загальні правила туристичного збору. Місцеву ставку встановлює відповідна рада.</p></section><section class="tt-section tt-batch-faq" aria-labelledby="tt-faq-title"><h2 id="tt-faq-title">Питання про туристичний збір для «${display(place.name)}»</h2>${faqMarkup}</section>${localitySeoBlock}</main>`;
  const canonical=`${ORIGIN}${place.route}`;
  const structuredData={'@context':'https://schema.org','@graph':[
    {'@type':'WebPage','@id':`${canonical}#webpage`,url:canonical,name:place.h1,description:place.description,inLanguage:'uk','isPartOf':{'@type':'WebSite','@id':`${ORIGIN}/#website`,url:`${ORIGIN}/`,name:'VDALO'},breadcrumb:{'@id':`${canonical}#breadcrumb`},mainEntity:{'@id':`${canonical}#faq`}},
    {'@type':'BreadcrumbList','@id':`${canonical}#breadcrumb`,itemListElement:[{'@type':'ListItem',position:1,name:'Туристичний збір в Україні',item:`${ORIGIN}/tourist-tax/`},{'@type':'ListItem',position:2,name:place.name,item:canonical}]},
    {'@type':'FAQPage','@id':`${canonical}#faq`,inLanguage:'uk',mainEntity:faqItems.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer.replace(/<[^>]*>/g,'')}}))},
  ]};
  return shell({title:place.title,description:place.description,canonical:place.route,content:enhancedContent,social:true,structuredData});
}

export function renderTouristTaxBatch24_25Preview(slug) {
  const draft=touristTaxBatch24_25Drafts[slug];
  const place=getTouristTaxPlace(slug);
  if(!draft||!place||place.indexable===true)return null;
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  if(!community)return null;
  const forms=touristTaxBatch24_25PlaceForms[slug];
  if(!forms)return null;
  const locationPhrase=locativePhrase(forms.locative);
  const title=`Туристичний збір ${locationPhrase}: 2026 | VDALO`;
  const description=`Попередні дані про туристичний збір ${locationPhrase}. Перевірка місцевого рішення та чинності триває. Звірте ставку з офіційним першоджерелом.`;
  const candidateRates=place.sourceRecord?.proposedRates;
  const hasCandidateRates=Number.isFinite(candidateRates?.domestic)&&Number.isFinite(candidateRates?.inbound);
  const rateLabel=value=>`${new Intl.NumberFormat('uk-UA',{maximumFractionDigits:2}).format(value)}%`;
  const preliminaryRates=hasCandidateRates
    ?`<section class="tt-preliminary-rates" aria-labelledby="tt-preliminary-rates-title"><p class="tt-eyebrow">НЕПІДТВЕРДЖЕНІ ОРІЄНТИРИ</p><h2 id="tt-preliminary-rates-title">Попередні значення зі зведених матеріалів</h2><dl><div><dt>Внутрішній туризм</dt><dd>${rateLabel(candidateRates.domestic)}</dd></div><div><dt>В’їзний туризм</dt><dd>${rateLabel(candidateRates.inbound)}</dd></div></dl><p>Ці відсотки перенесені зі зведених матеріалів і ще не підтверджені повним чинним рішенням ради. Нижче можна порахувати умовну суму для попередньої оцінки. Вона може не відповідати ставці, періоду або території конкретного об’єкта. Не використовуйте їх для нарахування чи сплати збору.</p></section>`
    :`<section class="tt-preliminary-rates" aria-labelledby="tt-preliminary-rates-title"><p class="tt-eyebrow">ПЕРЕВІРКА ТРИВАЄ</p><h2 id="tt-preliminary-rates-title">Ставка потребує додаткової звірки</h2><p>У робочих матеріалах немає однозначного значення, яке можна показати як попередній орієнтир. Відсоток і калькулятор буде додано після звірки першоджерел.</p></section>`;
  const questions=[
    {name:`Яка ставка туристичного збору діє ${locationPhrase}?`,text:`Сторінка показує попередній довідковий запис, а не підтверджену чинну ставку. Калькулятор може порахувати умовний орієнтир за наведеними відсотками, але перед нарахуванням або сплатою звірте рішення громади, період і територію його дії з офіційним першоджерелом.`},
    {name:`Яку громаду вказано для ${place.name}?`,text:`У робочому наборі для звірки вказано громаду «${community.name}» у ${place.region} області. Географічний запис ще проходить перевірку, тому перед податковим застосуванням потрібно звірити адресу об’єкта та територіальне охоплення місцевого рішення.`},
    {name:'Як читати результат попереднього калькулятора?',text:`Це умовний розрахунок за ставкою зі зведених матеріалів і законодавчою базою 2026 року. Він допомагає оцінити можливу суму, але не підтверджує чинну ставку, її період або застосування до конкретного об’єкта. Для обліку і сплати звірте повний акт громади.`},
    {name:'Де перевірити правило для цієї локації?',text:`Почніть з офіційного джерела, наведеного на цій сторінці, а потім звірте повний текст рішення ради, його туристичний додаток і подальші зміни. Загальні правила визначає стаття 268 Податкового кодексу України.`}
  ];
  const faqMarkup=questions.map((item,index)=>`<details${index===0?' open':''}><summary>${h(item.name)}</summary><p>${h(item.text)}</p></details>`).join('');
  const sourceLinks=[`<li><a href="${h(draft.sourceUrl)}" rel="noopener noreferrer">${h(draft.sourceLabel)}</a>: ${h(draft.decision)}.</li>`];
  if(draft.secondarySourceUrl)sourceLinks.push(`<li><a href="${h(draft.secondarySourceUrl)}" rel="noopener noreferrer">Додаткове офіційне джерело</a>: для зіставлення публікацій ради та запису ДПС.</li>`);
  const disclaimer=`<section class="tt-preliminary-disclaimer" aria-labelledby="tt-disclaimer-title"><p class="tt-eyebrow">ВАЖЛИВО ПЕРЕД ЗАСТОСУВАННЯМ</p><h2 id="tt-disclaimer-title">Самостійно звірте місцеве рішення</h2><p>Ця сторінка є інформаційною довідкою, а не індивідуальною податковою консультацією. Наведені відсотки є попередніми, можуть бути неповними або застарілими та не підтверджують ставку для конкретної адреси, категорії туриста чи періоду.</p><p>Перед нарахуванням, утриманням або сплатою збору перевірте чинне рішення відповідної ради, його додатки, територію дії, категорію туриста, дату набрання чинності та подальші зміни. За потреби зверніться до громади, ДПС або фахівця з оподаткування. Не покладайтеся лише на цей матеріал.</p><p>VDALO не підтверджує чинність попередніх значень до завершення перевірки першоджерел. Інформацію буде оновлено після звірки. Загальні норми містить <a href="https://tax.gov.ua/nk/rozdil-xii--mistsevi-podatki-i/" rel="noopener noreferrer">розділ XII Податкового кодексу на сайті ДПС</a>, зокрема стаття 268 про туристичний збір.</p></section>`;
  const verifiedPlaces=touristTaxPlaces.filter(item=>item.slug!==slug&&canIndexTouristTaxPlace(item,touristTaxCommunities));
  const regionalPlaces=verifiedPlaces.filter(item=>item.region===place.region).slice(0,2);
  const relatedPlaces=(regionalPlaces.length?regionalPlaces:verifiedPlaces.slice(0,2)).map(item=>`<li><a href="${h(item.route)}">Туристичний збір ${h(placeLocativePhrase(item))}</a></li>`).join('');
  const seoContent=`<section class="tt-section tt-preliminary-seo" aria-labelledby="tt-preliminary-seo-title"><p class="tt-eyebrow">ДОВІДКА ДЛЯ ГОТЕЛІВ І ЗАСОБІВ РОЗМІЩЕННЯ</p><h2 id="tt-preliminary-seo-title">Туристичний збір ${h(locationPhrase)}: як користуватися довідкою</h2><p>Якщо ви шукаєте ставку туристичного збору ${h(locationPhrase)} на 2026 рік, сприймайте наведений запис як попередній орієнтир. У матеріалах для цієї локації вказано громаду «${h(community.name)}», однак територіальне охоплення, редакція місцевого акта й дата його чинності ще перевіряються. Для готелю чи іншого засобу розміщення починайте перевірку з адреси об’єкта та рішення відповідної ради, а не переносіть ставку з іншого населеного пункту.</p><h3>Що перевірити перед розрахунком</h3><p>${h(draft.focus)} Для конкретного об’єкта звірте адресу з територією дії рішення, категорію гостя, правила та період застосування ставки. Зведена форма податкової служби допомагає знайти потрібний акт, але не замінює його повний текст, додатки й перевірку подальших змін.</p><h3>Як читати попередню суму</h3><p>Калькулятор на цій сторінці показує умовну оцінку за попередніми відсотками для дат у 2026 році. Результат не підтверджує, що саме така ставка діє для конкретної адреси або всього періоду. ${h(draft.followUp)} Поки перевірка триває, використовуйте суму лише для ознайомлення, а не для нарахування, утримання чи сплати збору.</p><h3>Корисні матеріали</h3><ul class="tt-related-links"><li><a href="/tourist-tax/">Довідник туристичного збору за населеними пунктами</a></li><li><a href="/tourist-tax/rates/">Реєстр місцевих ставок туристичного збору</a></li><li><a href="/blog/turystychnyi-zbir-gotel-ukraina">Посібник з туристичного збору для готелів</a></li>${relatedPlaces}</ul></section>`;
  let content=`<main class="tt-main tt-draft-preview"><nav class="tt-breadcrumb" aria-label="Навігаційний ланцюжок"><a href="/tourist-tax/">Довідник туристичного збору</a><span aria-current="page">${h(place.name)}</span></nav><section class="tt-city-hero"><p class="tt-eyebrow">ПОПЕРЕДНІ ДАНІ · ПЕРЕВІРКА ТРИВАЄ</p><h1>Туристичний збір ${h(locationPhrase)} на 2026 рік</h1><p class="tt-lead">Зібрані матеріали стосуються локації «${h(place.name)}». Для звірки в них вказано громаду «${h(community.name)}», область «${h(place.region)}». Географічний запис, застосовність місцевого акта та його чинну редакцію ще перевіряємо.</p><div class="tt-alert" role="note"><strong>Це попередні довідкові дані</strong><span>Ставка та територія її застосування ще не підтверджені за повним чинним рішенням громади. Їх можна використати лише для попередньої оцінки. Не застосовуйте до нарахування чи сплати до перевірки першоджерела.</span></div></section>${preliminaryRates}<section class="tt-section" aria-labelledby="tt-draft-source-title"><h2 id="tt-draft-source-title">Що відомо про цю локацію</h2><p>${h(draft.context)}</p><ul class="tt-draft-facts"><li><strong>Населений пункт</strong><span>${h(place.name)}</span></li><li><strong>Громада для звірки</strong><span>${h(community.name)}</span></li><li><strong>Область</strong><span>${h(place.region)}</span></li><li><strong>Стан перевірки</strong><span>Попередні дані, перевірка першоджерела триває</span></li></ul></section><section class="tt-section" aria-labelledby="tt-draft-review-title"><h2 id="tt-draft-review-title">Що ще перевіряємо</h2><ol class="tt-draft-checklist"><li>Звірити повний текст рішення місцевої ради та його підписані додатки.</li><li>Перевірити, яку територію й категорії платників охоплює правило.</li><li>Підтвердити дату набрання чинності та всі подальші зміни.</li><li>Після цього окремо перевірити відсотки, формулу та редакційний текст.</li></ol><p>Загальні норми туристичного збору наведені у <a href="https://zakon.rada.gov.ua/laws/show/2755-17#Text" rel="noopener noreferrer">статті 268 Податкового кодексу України</a>. Вона не підтверджує ставку конкретної громади.</p></section><section class="tt-method tt-draft-faq" aria-labelledby="tt-draft-faq-title"><h2 id="tt-draft-faq-title">Поширені запитання</h2>${faqMarkup}</section><section class="tt-sources" aria-labelledby="tt-draft-sources-title"><h2 id="tt-draft-sources-title">Джерела та матеріали для звірки</h2><ul>${sourceLinks.join('')}</ul><p>Зведений запис допомагає знайти місцевий акт, але не підтверджує його чинну редакцію, територіальне охоплення чи застосування до конкретного об’єкта.</p><p><a href="/tourist-tax/">Повернутися до довідника туристичного збору</a></p></section>${seoContent}${disclaimer}</main>`;
  content=content.replace('</section>'+preliminaryRates,'</section>'+preliminaryRates+(hasCandidateRates?calculator(place,{preliminary:true}):''));
  const canonical=ORIGIN+place.route;
  const structuredData={'@context':'https://schema.org','@graph':[
    {'@type':'WebPage','@id':`${canonical}#webpage`,url:canonical,name:title,description,inLanguage:'uk','isPartOf':{'@type':'WebSite','@id':`${ORIGIN}/#website`,url:`${ORIGIN}/`,name:'VDALO'},breadcrumb:{'@id':`${canonical}#breadcrumb`},mainEntity:{'@id':`${canonical}#faq`}},
    {'@type':'BreadcrumbList','@id':`${canonical}#breadcrumb`,itemListElement:[
      {'@type':'ListItem',position:1,name:'Довідник туристичного збору',item:`${ORIGIN}/tourist-tax/`},
      {'@type':'ListItem',position:2,name:place.name,item:canonical},
    ]},
    {'@type':'FAQPage','@id':`${canonical}#faq`,inLanguage:'uk',mainEntity:questions.map(item=>({'@type':'Question',name:item.name,acceptedAnswer:{'@type':'Answer',text:item.text}}))},
  ]};
  return shell({title,description,canonical:place.route,robots:'index,follow',content,social:true,structuredData});
}

export function calculateTouristTax({placeSlug, start, end, days, nights, guests, category, guestGroups, accommodationPricePerPersonPerDay, accommodationType, exemption='none', scenario='official'}, places=touristTaxPlaces, communities=touristTaxCommunities) {
  if(scenario!=='official')return {state:'INVALID_INPUT',reason:'Для цього місця доступний лише підтверджений розрахунок.'};
  const stayDays=days??nights;
  const groups=Array.isArray(guestGroups)?guestGroups:(Number.isSafeInteger(guests)&&['domestic','inbound'].includes(category)?[{category,guests}]:[]);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start ?? '') || !Number.isSafeInteger(stayDays) || stayDays < 1 || stayDays > 366 || !groups.length || groups.some(group=>!['domestic','inbound'].includes(group.category)||!Number.isSafeInteger(group.guests)||group.guests<0||group.guests>1000) || groups.every(group=>group.guests===0) || !['none','claimed'].includes(exemption)) return {state:'INVALID_INPUT'};
  const first = new Date(`${start}T00:00:00Z`);
  if (Number.isNaN(+first) || first.toISOString().slice(0,10)!==start) return {state:'INVALID_INPUT'};
  if (end!==undefined&&end!==null&&end!=='') {
    const lastInput=new Date(`${end}T00:00:00Z`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(end)||Number.isNaN(+lastInput)||lastInput.toISOString().slice(0,10)!==end||lastInput<=first)return {state:'INVALID_INPUT'};
  }
  const batchPlace=getTouristTaxBatch004Place(placeSlug);
  const batchModel=batchPlace?getTouristTaxBatch004RateModel(batchPlace):null;
  if(batchPlace&&batchModel){
    const model=batchModel;
    if(scenario!=='official')return {state:'INVALID_INPUT',reason:'Для цього місця доступний лише умовний розрахунок за даними погодженої бази.'};
    const last=new Date(+first+(stayDays-1)*86400000);
    if(start.slice(0,4)!=='2026'||last.toISOString().slice(0,4)!=='2026')return {state:'RATE_OUT_OF_PERIOD',reason:'Попередні значення можна оцінити лише для дат 2026 року.'};
    if((accommodationPricePerPersonPerDay!==undefined&&accommodationPricePerPersonPerDay!==null&&accommodationPricePerPersonPerDay!=='')||accommodationType)return {state:'INVALID_INPUT',reason:'Ця попередня модель не підтримує тариф за ціною або типом місця проживання.'};
    const annualBase=touristTaxSources.annualBases['2026'];
    if(!annualBase||!Number.isSafeInteger(annualBase.minimumWageOnJanuary1))return {state:'RATE_OUT_OF_PERIOD',reason:'Для цього року ще немає розрахункової бази.'};
    let totalNumerator=0n;
    const breakdown=[];
    for(const group of groups){
      if(!group.guests)continue;
      const ratePercent=model.rates[group.category];
      if(!Number.isFinite(ratePercent)||ratePercent<0)return {state:'RATE_UNVERIFIED'};
      totalNumerator+=BigInt(annualBase.minimumWageOnJanuary1)*BigInt(Math.round(ratePercent*100))*BigInt(group.guests)*BigInt(stayDays);
      breakdown.push({category:group.category,guests:group.guests,ratePercent,days:stayDays});
    }
    return {
      state:'PRELIMINARY_RESULT',totalCents:((totalNumerator+50n)/100n).toString(),days:stayDays,
      guestGroups:breakdown,minimumWage:annualBase.minimumWageOnJanuary1,
      ruleVersion:'batch004-preliminary-2026',verificationStatus:'PRELIMINARY',
      warning:model.hasMultipleRates
        ?'* Дані ще перебувають на стадії підтвердження. Оцінка використовує першу пару ставок із кількох у базі, не для нарахування чи сплати.'
        :'* Дані ще перебувають на стадії підтвердження. Розрахунок попередній, не для нарахування чи сплати.',
      scenario,exemptionReviewRequired:exemption==='claimed',
    };
  }
  const place = places.find(candidate=>candidate.slug===placeSlug) ?? null;
  if (!place) return batchPlace?{state:'RATE_UNVERIFIED',reason:'Для цього запису немає однозначної попередньої моделі розрахунку.'}:{state:'AMBIGUOUS_PLACE'};
  const rule=getTouristTaxRule(place,communities);
  if(!rule)return {state:'RATE_UNVERIFIED'};
  const preliminaryCalculation=canCalculatePreliminaryTouristTaxPlace(place,communities);
  const last=new Date(+first+(stayDays-1)*86400000);
  if (place.geoStatus==='EXCLUDED') return {state:'EXCLUDED_LOCATION'};
  if (rule.status==='CONFLICT') return {state:'SOURCE_CONFLICT'};
  if (rule.status!=='VERIFIED'&&!preliminaryCalculation) return {state:'RATE_UNVERIFIED', reason:'Місцеве правило ще не має підтвердженого офіційного джерела та періоду дії.'};
  const community=communities.find(item=>item.slug===place.communitySlug);
  if(preliminaryCalculation){
    if(start.slice(0,4)!=='2026'||last.toISOString().slice(0,4)!=='2026')return {state:'RATE_OUT_OF_PERIOD',reason:'Попередні значення можна оцінити лише для періоду 2026 року.'};
  }else{
    if (place.geoStatus!=='ELIGIBLE'||!place.readiness?.safetyEligible||!place.readiness?.placeVerified||!community?.katottgCode) return {state:'AMBIGUOUS_PLACE', reason:place.geoStatusReason};
    if (!place.readiness?.calculatorQaPassed) return {state:'RATE_UNVERIFIED', reason:'Калькулятор для цього правила ще не пройшов перевірку.'};
  }
  if(rule.accommodationTypeRates&&(!accommodationType||!rule.accommodationTypeRates[accommodationType]))return {state:'INVALID_INPUT',reason:'Оберіть тип місця проживання за категоріями місцевого рішення.'};
  if(!rule.accommodationTypeRates&&accommodationType)return {state:'INVALID_INPUT',reason:'Для цього населеного пункту вибір типу місця проживання не передбачений.'};
  const endDate=last.toISOString().slice(0,10);
  if (!preliminaryCalculation&&(start<rule.effectiveFrom || (rule.effectiveTo && endDate>rule.effectiveTo))) return {state:'RATE_OUT_OF_PERIOD'};
  if (start.slice(0,4)!==endDate.slice(0,4)) return {state:'RATE_OUT_OF_PERIOD', reason:'Період перетинає податкові роки і потребує окремих підтверджених річних правил.'};
  if(scenario==='odesa-inbound-1-percent'&&start.slice(0,4)!=='2026')return {state:'RATE_OUT_OF_PERIOD',reason:'Порівняльний сценарій доступний лише для дат 2026 року.'};
  const unresolvedRateWindow=rule.unverifiedRateWindows?.find(window=>groups.some(group=>group.category===window.category&&group.guests>0)&&endDate>=window.from);
  if(unresolvedRateWindow)return {state:'RATE_UNVERIFIED',reason:unresolvedRateWindow.reason,sourceUrl:rule.sourceUrl,checkedAt:rule.checkedAt};
  const exemptionReviewRequired=exemption==='claimed'||Boolean(rule.exemptionReviewRequired);
  const annualBase=touristTaxSources.annualBases[start.slice(0,4)];
  if(!annualBase||!Number.isSafeInteger(annualBase.minimumWageOnJanuary1))return {state:'RATE_OUT_OF_PERIOD',reason:'Для цього року ще немає підтвердженої законодавчої бази.'};
  const priceCents=parseAccommodationPriceCents(accommodationPricePerPersonPerDay);
  if(rule.rateSchedule&&(!Number.isSafeInteger(priceCents)||priceCents<1||priceCents>100000000))return {state:'INVALID_INPUT',reason:'Для цього місця вкажіть вартість проживання однієї особи за добу.'};
  const thresholds=rule.rateSchedule?.bands
    ?rule.rateSchedule.ambiguousBoundariesUahPerPersonPerDay||[]
    :rule.rateSchedule?[rule.rateSchedule.thresholdUahPerPersonPerDay]:[];
  const ambiguousThreshold=rule.rateSchedule?.bands
    ?thresholds.find(value=>priceCents===value*100)
    :rule.rateSchedule?.exactThresholdStatus==='AMBIGUOUS'&&priceCents===rule.rateSchedule.thresholdUahPerPersonPerDay*100?rule.rateSchedule.thresholdUahPerPersonPerDay:null;
  if(ambiguousThreshold!==undefined&&ambiguousThreshold!==null)return {state:'RATE_THRESHOLD_AMBIGUOUS',thresholdUah:ambiguousThreshold,sourceUrl:rule.sourceUrl};
  let totalNumerator=0n;
  const breakdown=[];
  for(const group of groups){
    if(!group.guests)continue;
    const baseRatePercent=preliminaryCalculation
      ?rule.proposedRates?.[group.category]
      :rule.accommodationTypeRates
      ?rule.accommodationTypeRates[accommodationType][group.category]
      :rule.rateSchedule?.bands
      ?rule.rateSchedule.bands.find(band=>(band.minPriceExclusiveUahPerPersonPerDay!==undefined?priceCents>band.minPriceExclusiveUahPerPersonPerDay*100:band.minPriceUahPerPersonPerDay===undefined||priceCents>=band.minPriceUahPerPersonPerDay*100)&&(band.maxPriceUahPerPersonPerDay===undefined||priceCents<=band.maxPriceUahPerPersonPerDay*100))?.[group.category==='domestic'?'domesticRatePercent':'inboundRatePercent']
      :rule.rateSchedule
        ?rule.rateSchedule[group.category]?.find(tier=>tier.operator==='lt'?priceCents<rule.rateSchedule.thresholdUahPerPersonPerDay*100:tier.operator==='gt'?priceCents>rule.rateSchedule.thresholdUahPerPersonPerDay*100:false)?.ratePercent
        :rule.rates?.[group.category];
    if(!Number.isFinite(baseRatePercent)||baseRatePercent<=0)return {state:'RATE_UNVERIFIED'};
    const rateDays=new Map();
    for(let offset=0;offset<stayDays;offset++){
      const day=new Date(+first+offset*86400000).toISOString().slice(0,10);
      const period=rule.ratePeriods?.find(window=>day>=window.from&&day<=window.to);
      const dayRate=period?.rates?.[group.category]??baseRatePercent;
      if(!Number.isFinite(dayRate)||dayRate<=0)return {state:'RATE_UNVERIFIED'};
      const rateHundredths=BigInt(Math.round(dayRate*100));
      totalNumerator+=BigInt(annualBase.minimumWageOnJanuary1)*rateHundredths*BigInt(group.guests);
      rateDays.set(dayRate,(rateDays.get(dayRate)||0)+1);
    }
    const rateBreakdown=[...rateDays].map(([ratePercent,rateDays])=>({ratePercent,days:rateDays}));
    breakdown.push({category:group.category,guests:group.guests,...(rateBreakdown.length===1?{ratePercent:rateBreakdown[0].ratePercent}:{ratePeriods:rateBreakdown}),...(rule.rateSchedule?{accommodationPricePerPersonPerDay:Number(accommodationPricePerPersonPerDay)}:{}),...(rule.accommodationTypeRates?{accommodationType,accommodationTypeLabel:rule.accommodationTypeRates[accommodationType].label}:{})});
  }
  const totalCents=((totalNumerator+50n)/100n).toString();
  return {state:preliminaryCalculation?'PRELIMINARY_RESULT':'VERIFIED_RESULT',totalCents,days:stayDays,guestGroups:breakdown,minimumWage:annualBase.minimumWageOnJanuary1,ruleVersion:rule.version,sourceUrl:preliminaryCalculation?touristTaxBatch24_25Drafts[place.slug]?.sourceUrl:rule.sourceUrl,checkedAt:rule.checkedAt,verificationStatus:preliminaryCalculation?'PRELIMINARY':'VERIFIED',warning:preliminaryCalculation?'Результат умовний: ставка, період її дії та застосування до локації ще перевіряються. Не використовуйте його для нарахування або сплати.':undefined,scenario,exemptionReviewRequired};
}

// Exact rational arithmetic in kopecks. ratePercent is represented at 2 decimal places.
// Round once after multiplying people and stay days, not per person/day.
export function calculateExactTouristTaxCents({minimumWage, ratePercent, guests, nights}) {
  if (!Number.isSafeInteger(minimumWage) || minimumWage<0 || !Number.isFinite(ratePercent) || ratePercent<0 || Math.round(ratePercent*100)!==ratePercent*100 || !Number.isSafeInteger(guests) || guests<1 || !Number.isSafeInteger(nights) || nights<1) throw new TypeError('Invalid exact tourist-tax calculation inputs');
  const rateHundredths=BigInt(Math.round(ratePercent*100));
  const numerator=BigInt(minimumWage)*rateHundredths*BigInt(guests)*BigInt(nights);
  const denominator=100n;
  return (numerator+denominator/2n)/denominator;
}

export function exportTouristTaxReviewCsv() {
  const rows=[reviewHeaders];
  for(const place of touristTaxPlaces){const rule=getTouristTaxRule(place),community=touristTaxCommunities.find(item=>item.slug===place.communitySlug),candidate=place.sourceRecord;rows.push([place.slug,place.name,place.route,place.settlementType,place.region,place.district,community?.name??'',place.katottgSettlementCode??'',community?.katottgCode??'',place.geoStatus,rule?.decisionNumber,rule?.decisionDate,rule?.effectiveFrom,rule?.effectiveTo,rule?.rateSchedule?'BANDED':'FLAT',JSON.stringify(rule?.rateSchedule??null),rule?.rates?.domestic,rule?.rates?.inbound,rule?.status,rule?.sourceUrl,place.geoStatusReason,rule?.verificationBasis??'',candidate?.proposedRates?.domestic??'',candidate?.proposedRates?.inbound??'',JSON.stringify(community?.review?.rateVariants??[]),JSON.stringify(place.review??{}),candidate?.preparedSeo?.title??'',candidate?.preparedSeo?.description??'',candidate?.localNotes??'']);}
  return '\uFEFF'+rows.map(row=>row.map(value=>`"${String(value??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
}

function xml(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
function columnName(index){let name='';for(index++;index;index=Math.floor((index-1)/26))name=String.fromCharCode(65+(index-1)%26)+name;return name;}
function crc32(buffer){let crc=0xffffffff;for(const byte of buffer){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function zipStored(files){
  const local=[],central=[];let offset=0;
  for(const [name,content] of files){
    const filename=Buffer.from(name,'utf8'),data=Buffer.from(content,'utf8'),crc=crc32(data);
    const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50,0);header.writeUInt16LE(20,4);header.writeUInt16LE(0x0800,6);header.writeUInt16LE(0,8);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);
    local.push(header,filename,data);
    const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50,0);directory.writeUInt16LE(20,4);directory.writeUInt16LE(20,6);directory.writeUInt16LE(0x0800,8);directory.writeUInt16LE(0,10);directory.writeUInt32LE(crc,16);directory.writeUInt32LE(data.length,20);directory.writeUInt32LE(data.length,24);directory.writeUInt16LE(filename.length,28);directory.writeUInt32LE(offset,42);
    central.push(directory,filename);offset+=header.length+filename.length+data.length;
  }
  const centralData=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(centralData.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,centralData,end]);
}

export function exportTouristTaxReviewXlsx(){
  const rows=[reviewHeaders];
  for(const place of touristTaxPlaces){const rule=getTouristTaxRule(place),community=touristTaxCommunities.find(item=>item.slug===place.communitySlug),candidate=place.sourceRecord;rows.push([place.slug,place.name,place.route,place.settlementType,place.region,place.district,community?.name??'',place.katottgSettlementCode??'',community?.katottgCode??'',place.geoStatus,rule?.decisionNumber,rule?.decisionDate,rule?.effectiveFrom,rule?.rates?.domestic,rule?.rates?.inbound,rule?.status,rule?.sourceUrl,place.geoStatusReason,rule?.verificationBasis??'',candidate?.proposedRates?.domestic??'',candidate?.proposedRates?.inbound??'',JSON.stringify(community?.review?.rateVariants??[]),JSON.stringify(place.review??{}),candidate?.preparedSeo?.title??'',candidate?.preparedSeo?.description??'',candidate?.localNotes??'']);}
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row,r)=>`<row r="${r+1}">${row.map((value,c)=>{const ref=`${columnName(c)}${r+1}`;return typeof value==='number'?`<c r="${ref}"><v>${value}</v></c>`:`<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`}).join('')}</row>`).join('')}</sheetData></worksheet>`;
  return zipStored([
    ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
    ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Tourist tax review" sheetId="1" r:id="rId1"/></sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],
    ['xl/worksheets/sheet1.xml',sheet],
  ]);
}

export async function writeTouristTaxEditorialExports(outputDirectory){
  const moduleRoot=path.dirname(fileURLToPath(import.meta.url));
  const destination=outputDirectory??path.resolve(moduleRoot,'../../seo-workspace/tourist-tax/exports');
  await mkdir(destination,{recursive:true});
  await Promise.all([
    writeFile(path.join(destination,'tourist-tax-review.csv'),exportTouristTaxReviewCsv()),
    writeFile(path.join(destination,'tourist-tax-review.xlsx'),exportTouristTaxReviewXlsx()),
  ]);
  return destination;
}

export async function handleTouristTaxCalculation(req,res){
  const respond=(status,payload)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'});res.end(JSON.stringify(payload));};
  if(req.method!=='POST')return respond(405,{error:'Method not allowed'});
  const origin=req.headers.origin,host=req.headers.host;
  try{if(!origin||!host||new URL(origin).host.toLowerCase()!==host.toLowerCase())return respond(403,{error:'Origin not allowed'});}catch{return respond(403,{error:'Origin not allowed'});}
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))return respond(415,{error:'Content-Type must be application/json'});
  const declaredLength=Number(req.headers['content-length']||0);
  if(declaredLength>4096)return respond(413,{error:'Request too large'});
  const chunks=[];let size=0;
  try{for await(const chunk of req){size+=chunk.length;if(size>4096)return respond(413,{error:'Request too large'});chunks.push(Buffer.from(chunk));}}catch{return respond(400,{error:'Invalid request'});}
  let body;
  try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return respond(400,{error:'Invalid JSON'});}
  const requestedPlace=touristTaxPlaces.find(place=>place.slug===body.placeSlug);
  if(requestedPlace&&!canCalculateTouristTaxPlace(requestedPlace)&&!canCalculatePreliminaryTouristTaxPlace(requestedPlace)&&!getTouristTaxBatch004Place(body.placeSlug))return respond(404,{state:'PLACE_UNAVAILABLE'});
  const result=calculateTouristTax({placeSlug:body.placeSlug,start:body.start,days:body.days,nights:body.nights,guests:body.guests,category:body.category,guestGroups:body.guestGroups,accommodationPricePerPersonPerDay:body.accommodationPricePerPersonPerDay,accommodationType:body.accommodationType,exemption:body.exemption,scenario:body.scenario});
  return respond(200,result);
}
