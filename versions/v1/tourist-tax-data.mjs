import workbook from './tourist-tax-workbook-data.json' with { type: 'json' };
import katottgImport from './tourist-tax-katottg-2026-07-07.json' with { type: 'json' };
import {isTouristTaxPlacePublished,touristTaxReleasePlan,validateTouristTaxReleasePlan} from './tourist-tax-release.mjs';

// Tax readiness is deliberately independent from settlement identity and SEO state.
// VERIFIED means the current primary sources and calculation inputs have been checked.
const annualTaxBases = Object.freeze({
  2026: {minimumWageOnJanuary1: 8647, url: 'https://zakon.rada.gov.ua/laws/show/4695-IX'},
});

export const touristTaxSources = Object.freeze({
  reviewSchedule: { nextVerifiedRatesReviewAt: '2026-12-01', cadenceNote: 'Перевірити рішення громад і ставки на 2027 податковий рік; суми в гривнях оновлювати після закону про Державний бюджет.' },
  katottg: {
    url: 'https://mininfra.gov.ua/diialnist/rozvytok-mistsevoho-samovriaduvannia/kodyfikator-administratyvno-terytorialnykh-odynyts-ta-terytorii-terytorialnykh-hromad',
    releaseDate: '2026-07-07',
    orderNumber: '1321',
    imported: true,
    sha256: katottgImport.sourceSha256,
  },
  territoryList: {
    url: 'https://zakon.rada.gov.ua/laws/show/z0380-25',
    currentAsOf: '2026-08-21',
    activeAmendments: [
      {number:'987',date:'2026-05-26',registration:'z0782-26',url:'https://zakon.rada.gov.ua/laws/show/z0782-26'},
      {number:'1389',date:'2026-07-16',effectiveFrom:'2026-08-21',registration:'z1117-26',url:'https://zakon.rada.gov.ua/laws/show/z1117-26'},
    ],
    matchedToKatottg: false,
    snapshotImported: false,
  },
  taxCode: { url: 'https://tax.gov.ua/nk/rozdil-xii--mistsevi-podatki-i/' },
  localCouncilDecisions: { url: 'https://tax.gov.ua/rishennya-mistsevih-rad-/' },
  budgetClassification: { url: 'https://zakon.rada.gov.ua/rada/show/v0011201-11' },
  budget2026: annualTaxBases[2026],
  annualBases: annualTaxBases,
});

const verifiedTouristTaxCommunities = [
  {
    slug: 'lutsk-community',
    name: 'Луцька міська територіальна громада',
    katottgCode: 'UA07080170000013585',
    taxRule: {
      decisionNumber: '77/72',
      decisionDate: '2025-06-25',
      sourceUrl: 'https://www.lutskrada.gov.ua/documents/17496325233676686-pro-vstanovlennya-stavok-turistichnogo-zboru',
      ratePublicationUrl: 'https://www.lutskrada.gov.ua/publications/u-lutsku-zbilshyly-stavky-turystychnoho-zboru-dlia-v-iznoho-ta-vnutrishnoho-turyzmu',
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
      rates: { domestic: 0.5, inbound: 1.5 },
      supportingSources: [
        {label:'ДПС Волині: код Луцької громади в КАТОТТГ',description:'Підтвердження коду територіальної громади для звірки місця розміщення.',url:'https://vl.tax.gov.ua/media-ark/news-ark/978756.html',linkLabel:'Перевірити код громади'},
        {label:'ДПС: обчислення сум із копійками',description:'Пояснення щодо точного обчислення та відображення сум туристичного збору.',url:'https://km.tax.gov.ua/media-ark/news-ark/print-1020882.html',linkLabel:'Переглянути роз’яснення ДПС'}
      ],
      status: 'VERIFIED',
      verificationBasis: 'Чинне рішення та роз’яснення Луцької міської ради, Податковий кодекс, офіційне підтвердження коду громади ДПС Волині, автоматизовані тести розрахунку',
      checkedAt: '2026-10-14',
      version: 'lutsk-2026-01',
    },
  },
];

const katottgByPlaceSlug=new Map(katottgImport.places.map(place=>[place.slug,place]));
const normalizeCommunityIdentity=value=>String(value??'').trim().toLocaleLowerCase('uk-UA').replace(/\s+/g,' ');
const communityGroups=new Map();
for(const source of workbook.places){
  if(source.slug==='lutsk')continue;
  const geography=katottgByPlaceSlug.get(source.slug);
  const groupKey=geography?.communityCode?`katottg:${geography.communityCode}`:`fallback:${normalizeCommunityIdentity(source.region)}:${normalizeCommunityIdentity(source.community)}`;
  if(!communityGroups.has(groupKey))communityGroups.set(groupKey,{name:source.community,region:source.region,katottgCode:geography?.communityCode??null,officialName:geography?.officialCommunityName??null,placeSlugs:[],ratePairs:new Map(),hasIncompleteRate:false});
  const group=communityGroups.get(groupKey);
  if(!group.katottgCode&&geography?.communityCode){group.katottgCode=geography.communityCode;group.officialName=geography.officialCommunityName;}
  group.placeSlugs.push(source.slug);
  if(Number.isFinite(source.proposedRates?.domestic)&&Number.isFinite(source.proposedRates?.inbound))group.ratePairs.set(`${source.proposedRates.domestic}|${source.proposedRates.inbound}`,source.proposedRates);
  else group.hasIncompleteRate=true;
}
const workbookCommunityRecords=[...communityGroups.values()];
const communitySlugByPlaceSlug=new Map();
const workbookCommunities=workbookCommunityRecords.map((community,index)=>{
  const slug=community.katottgCode?`katottg-community-${community.katottgCode.toLocaleLowerCase('en-US')}`:`workbook-community-${String(index+1).padStart(3,'0')}`;
  for(const placeSlug of community.placeSlugs)communitySlugByPlaceSlug.set(placeSlug,slug);
  const rateVariants=[...community.ratePairs.values()];
  const rateConflict=rateVariants.length>1;
  const status=rateConflict?'CONFLICT':(community.hasIncompleteRate||rateVariants.length===0?'UNKNOWN':'SECONDARY_SOURCE_ONLY');
  const proposedRates=rateVariants.length===1&&!community.hasIncompleteRate?rateVariants[0]:{domestic:null,inbound:null};
  return {
    slug,name:community.name,region:community.region,officialName:community.officialName,katottgCode:community.katottgCode,
    taxRule:{decisionNumber:null,decisionDate:null,sourceUrl:null,ratePublicationUrl:null,effectiveFrom:null,effectiveTo:null,rates:null,proposedRates,rateVariants,status,verificationBasis:null,checkedAt:null,version:null},
    review:{status,rateConflict,proposedRates,rateVariants,hasIncompleteRate:community.hasIncompleteRate,placeCount:community.placeSlugs.length,geographySourceVersion:katottgImport.version},
  };
});
const primaryRuleOverrides = new Map([
  ['UA26120150000021671', {
    decisionNumber:'169-11/2021',
    decisionDate:'2021-06-24',
    sourceUrl:'https://rada.info/upload/users_files/33309833/docs/9f7c52294745cc50c16d4710d56f1422.pdf',
    decisionSourceLabel:'Яремчанська міська рада: рішення №169-11/2021 і ставки туристичного збору',
    decisionSourceLinkLabel:'Відкрити рішення та додаток ради',
    ratePublicationUrl:'https://if.tax.gov.ua/media-ark/local-news/558315.html',
    ratePublicationLabel:'ДПС Івано-Франківщини: пояснення ставок Яремчанської громади',
    ratePublicationDescription:'ДПС підтверджує 0,50% для готелів і 0,30% для садиб, котеджів та інших місць проживання для внутрішнього й в’їзного туризму.',
    effectiveFrom:'2026-01-01',
    effectiveTo:'2026-12-31',
    accommodationTypeRates:{
      hotel:{label:'Готель, мотель або заклад готельного типу',domestic:0.5,inbound:0.5},
      other:{label:'Садиба, котедж, квартира або інше тимчасове житло',domestic:0.3,inbound:0.3},
    },
    decisionSourceDescription:'Рішення №169-11/2021 визначає 0,50% для готелів, мотелів і закладів готельного типу та 0,30% для інших перелічених місць проживання; обидві ставки однакові для внутрішнього та в’їзного туризму. Рішення діє з 01.01.2022. Підписана форма №6 ДПС у наборі 2026 року пов’язує ці ставки з Яремчанською громадою та кодами КАТОТТГ міста й громади.',
    supportingSources:[
      {label:'ДПС: підписана форма №6 Яремчанської громади',description:'Форма №6 у наборі ДПС на 2026 рік називає рішення №169-11/2021, дату застосування 01.01.2022, Яремчанську громаду та КАТОТТГ міста Яремче й громади. Деталізовані рядки відображають різні ставки для готельної та інших категорій; нульовий універсальний рядок не застосовується одночасно з деталізацією.',url:'https://tax.gov.ua/data/material/000/801/934869/lbc_0956300000_edrpou_20555668_version_5.pdf',linkLabel:'Переглянути форму №6 ДПС'},
      {label:'ДПС Івано-Франківщини: ставки за рішенням №169-11/2021',description:'Офіційне роз’яснення податкової від 21.01.2022 наводить 0,50% для готелів і 0,30% для садиб, котеджів та інших місць проживання, однаково для внутрішнього й в’їзного туризму.',url:'https://if.tax.gov.ua/media-ark/local-news/558315.html',linkLabel:'Переглянути пояснення ДПС'},
      {label:'ДПС Івано-Франківщини: надходження громад за січень–липень 2026 року',description:'Яремчанська громада отримала 3,7 млн грн туристичного збору. Це показник активності громади, а не доказ ставки для окремого місця проживання.',url:'https://if.tax.gov.ua/media-ark/news-ark/print-1041769.html',linkLabel:'Переглянути дані ДПС'},
      {label:'Податковий кодекс України: стаття 268',description:'Загальні правила туристичного збору та повноваження місцевої ради встановлювати ставки.',url:'https://zakon.rada.gov.ua/laws/show/2755-17#n3691',linkLabel:'Переглянути статтю 268 ПКУ'},
    ],
    status:'VERIFIED',
    verificationBasis:'Рішення Яремчанської міської ради №169-11/2021 від 24.06.2021 встановлює 0,50% для готелів/мотелів/закладів готельного типу та 0,30% для житлових будинків, квартир, котеджів, кімнат, садиб та інших місць тимчасового проживання; для обох груп внутрішнього та в’їзного туризму ставка однакова. Рішення набрало чинності 01.01.2022. Підписана форма №6 ДПС у наборі 2026 року ідентифікує Яремчанську громаду, місто й рішення та показує деталізовані ставки. Нульовий універсальний рядок форми не застосовуємо, оскільки інструкція передбачає вибір між універсальним рядком і деталізацією. ДПС Івано-Франківщини окремо підтвердила ставки. Калькулятор вимагає вибрати категорію місця проживання та обмежений 2026 роком. Попередні довідкові дані щодо в’їзної ставки не збігаються з офіційними джерелами; для розрахунку використано місцеве рішення й форму ДПС.',
    checkedAt:'2026-10-18',
    version:'yaremche-decision-form6-2026-10-18',
  }],
  ['UA12020010000033698', {
    decisionNumber: '5/6 зі змінами №6/40',
    decisionDate: '2010-12-27',
    sourceUrl: 'https://www.tax.gov.ua/data/material/000/801/934845/865ba29b_179e_49b0_95dd_13ac5c61a3c2.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/dnipropetrovska-oblast/zvedena-informatsiya-2026/',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rateSchedule: {
      priceBasis: 'вартість проживання однієї особи за одну добу',
      bands: [
        {maxPriceUahPerPersonPerDay:200,domesticRatePercent:0.35,inboundRatePercent:0.35},
        {minPriceUahPerPersonPerDay:200,maxPriceUahPerPersonPerDay:3000,domesticRatePercent:0.5,inboundRatePercent:0.5},
        {minPriceExclusiveUahPerPersonPerDay:3000,domesticRatePercent:0.5,inboundRatePercent:1.5},
      ],
      ambiguousBoundariesUahPerPersonPerDay: [200],
    },
    decisionSourceLabel: 'ДПС: підписана форма №6 Дніпровської міської ради на 2026 рік',
    decisionSourceDescription: 'Форму №6 підписано уповноваженою особою 30.01.2026. Вона пов’язує місто Дніпро з КАТОТТГ UA12020010010037010, базовим рішенням №5/6 і змінами, та показує три ставки залежно від вартості проживання однієї особи за добу.',
    decisionSourceLinkLabel: 'Переглянути форму №6 ДПС',
    publicationBasisText: 'Ставки для 2026 року взято з підписаної форми №6 ДПС Дніпровської міської ради від 30.01.2026. Форма встановлює тарифи за ціною ночівлі на одну особу: до 200 грн - 0,35% / 0,35%; від 200 до 3 000 грн - 0,50% / 0,50%; понад 3 000 грн - 0,50% / 1,50%. Межу рівно 200 грн калькулятор не рахує, бо текст одночасно включає її в обидва сусідні діапазони.',
    supportingSources: [
      {label:'ДПС: підписана форма №6 Дніпровської міської ради на 2026 рік',description:'Додаток 6 підписаний 30.01.2026, ідентифікує місто Дніпро кодом КАТОТТГ UA12020010010037010, наводить рішення №5/6 та зміни й три категорії ставок за ціною проживання однієї особи за добу. У першому діапазоні - 0,35% / 0,35%, у другому - 0,50% / 0,50%, у третьому - 0,50% / 1,50%.',url:'https://www.tax.gov.ua/data/material/000/801/934845/865ba29b_179e_49b0_95dd_13ac5c61a3c2.pdf',linkLabel:'Переглянути форму №6 ДПС'},
      {label:'ДПС: зведення ставок Дніпропетровської області за 2026 рік',description:'Офіційний розділ ДПС зі зведеними ставками на 2026 рік; набір використано разом із підписаною формою міської ради.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/dnipropetrovska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути зведення ДПС'},
      {label:'Дніпровська міська рада: місцеві податки та збори',description:'Міська рада підтверджує базове рішення №5/6 та публікує перелік змін до місцевого порядку. Ставки для 2026 року звірено за підписаною формою №6.',url:'https://testdniprorada.bissoft.org/uk/page/miscevi-podatki-ta-zbori-m-dnipro',linkLabel:'Переглянути сторінку міської ради'},
      {label:'Податковий кодекс України: стаття 268',description:'Визначає платників, базу, порядок справляння та законодавчі межі туристичного збору.',url:'https://zakon.rada.gov.ua/laws/show/2755-17#n3691',linkLabel:'Переглянути статтю 268 ПКУ'},
    ],
    status:'VERIFIED',
    verificationBasis:'Для Дніпра використано підписану форму №6 ДПС, накладену 30.01.2026 уповноваженою особою Дніпровської міської ради. Форма прямо називає місто та КАТОТТГ UA12020010010037010, базове рішення №5/6 зі змінами і три тарифні категорії за ціною проживання однієї особи за добу. Ставки для 2026 року: до 200 грн - 0,35% / 0,35%; від 200 до 3 000 грн - 0,50% / 0,50%; понад 3 000 грн - 0,50% / 1,50%. Розбіжність із робочою таблицею 0,30% / 1,00% показана як довідкова, але не використовується для розрахунку. Формулювання діапазонів перекриваються рівно на 200 грн; цю межу калькулятор блокує. Ставки застосовуються лише для 2026 року; перед 2027 роком потрібна нова перевірка. Пільги перевіряє податковий агент.',
    checkedAt:'2026-10-18',
    version:'dnipro-form6-2026-10-18',
  }],
  ['UA18040190000029215', {
    decisionNumber:'1361 (підтверджено міською таблицею ставок на 2026 рік)',
    decisionDate:'2019-02-07',
    sourceUrl:'https://www.zt-rada.gov.ua/?pages=18912',
    ratePublicationUrl:'https://www.zt-rada.gov.ua/?pages=18912',
    effectiveFrom:'2026-01-01',
    effectiveTo:'2026-12-31',
    rates:{domestic:0.25,inbound:2.5},
    decisionSourceLabel:'Житомирська міська рада: таблиця ставок на 2026 рік для міста Житомира',
    decisionSourceDescription:'Окремий міський документ у переліку ставок на 2026 рік підтверджує 0,25% для внутрішнього та 2,5% для в’їзного туризму саме для міста Житомира. У тому самому переліку село Вереси має окрему таблицю.',
    decisionSourceLinkLabel:'Переглянути таблицю ставок міськради',
    supportingSources:[
      {label:'Житомирська міська рада: ставки податків у 2026 році',description:'Сторінка від 13.01.2026 окремо перелічує документи для міста Житомира і села Вереси; для калькулятора використано лише документ міста.',url:'https://www.zt-rada.gov.ua/?pages=18912',linkLabel:'Переглянути перелік документів на 2026 рік'},
      {label:'Житомирська міська рада: місцеві податки, рішення №1361',description:'Офіційний текст пов’язує туристичний збір із рішенням №1361 від 07.02.2019 і наводить базові категорійні ставки 0,25% / 2,5%.',url:'https://zt-rada.gov.ua/files/upload/sitefiles/doc1639059843.pdf',linkLabel:'Переглянути офіційний текст ради'},
      {label:'Податковий кодекс України: стаття 268',description:'Визначає базу, категорії туризму, правила справляння та законодавчі вимоги до туристичного збору.',url:'https://zakon.rada.gov.ua/laws/show/2755-17#n3691',linkLabel:'Переглянути статтю 268 ПКУ'},
    ],
    status:'VERIFIED',
    verificationBasis:'Ставки й період 2026 року підтверджує офіційна таблиця Житомирської міської ради, опублікована в окремому переліку документів на 2026 рік для міста Житомира. Таблиця відрізняє місто від села Вереси, для якого є окремий документ. Офіційний текст ради пов’язує туристичний збір із рішенням №1361 від 07.02.2019 та наводить 0,25% / 2,5%. КАТОТТГ міста й громади звірені окремо; правило застосовується лише до міста та дат 2026 року. Робочий Excel із 0,30% / 1,00% суперечить офіційним відомостям і не використовується. Перед 2027 роком перевірити нову таблицю та правові зміни.',
    publicationBasisText:'Для міста Житомира на 2026 рік офіційна таблиця міськради вказує 0,25% для внутрішнього та 2,5% для в’їзного туризму. У таблиці для села Вереси наведено окремі дані, тому міські ставки не переносяться на нього або інші поселення громади. Значення робочої таблиці 0,30% / 1,00% відрізняються. Правило діє в межах 2026 року.',
    checkedAt:'2026-10-18',
    version:'zhytomyr-city-table-2026-10-18',
  }],
  ['UA21040210000079273', {
    decisionNumber: '1778',
    decisionDate: '2025-07-01',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934858/lbc_0750300000_edrpou_41087685_version_4.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.5,inbound:1.0},
    decisionSourceLabel: 'Підписана форма №6 ДПС для Полянської громади у наборі ставок на 2026 рік',
    decisionSourceDescription: 'Форма, підписана уповноваженою особою ради, називає рішення №1778 від 01.07.2025, застосування з 01.01.2026 та село Поляна з кодом КАТОТТГ. У деталізованій таблиці місць проживання наведено 0,50% / 1,00%; форма також має некоректно заповнений універсальний нульовий рядок.',
    decisionSourceLinkLabel: 'Переглянути форму №6 ДПС',
    ratePublicationLabel: 'ДПС: зведені ставки Закарпатської області на 2026 рік',
    ratePublicationDescription: 'ДПС зазначає, що зведений набір відображає дані ІАС LOGICA станом на 30.01.2026. Він є датованим офіційним підтвердженням, але перед розрахунками за 2027 рік потрібна нова перевірка.',
    ratePublicationLinkLabel: 'Переглянути зведений набір ДПС',
    publicationBasisText: 'Для 2026 року підписана форма №6 ДПС показує 0,50% / 1,00% у деталізованих рядках за місцями проживання. Універсальний рядок 0,00% у цій формі суперечить її власній інструкції й не використовується як ставка. Дані Excel з 0,40% / 1,00% також відрізняються; нижче наведено, чому для розрахунку обрано офіційні категорійні рядки ДПС.',
    supportingSources: [
      {label:'ДПС: підписана форма №6 Полянської громади',description:'Форма називає рішення №1778 від 01.07.2025, Полянську громаду й село Поляна з кодом КАТОТТГ UA21040210010063908, застосування з 01.01.2026, а деталізовані рядки за місцями проживання містять ставки 0,50% / 1,00%. Універсальний рядок 1.0.0 одночасно має 0,00% / 0,00%, хоча інструкція забороняє заповнювати його разом із категорійним розділом 1.1; для сторінки використовуються категорійні рядки.',url:'https://tax.gov.ua/data/material/000/801/934858/lbc_0750300000_edrpou_41087685_version_4.pdf',linkLabel:'Переглянути офіційну форму №6'},
      {label:'ДПС: зведений набір місцевих ставок на 2026 рік',description:'Пояснення ДПС: дані сформовано з ІАС LOGICA станом на 30.01.2026. Набір підтверджує часову рамку перевірки; ставки на 2027 рік потребують окремого оновлення.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути опис набору ДПС'},
      {label:'Податковий кодекс України: стаття 268',description:'Законодавча основа туристичного збору, категорії внутрішнього та в’їзного туризму, база розрахунку й пільги.',url:'https://zakon.rada.gov.ua/laws/show/2755-17#n3691',linkLabel:'Переглянути статтю 268 ПКУ'},
      {label:'КАТОТТГ: код населеного пункту',description:'У формі ДПС село Поляна назване окремо від інших населених пунктів громади й має код UA21040210010063908; код Полянської громади - UA21040210000079273.',url:'https://mininfra.gov.ua/diialnist/rozvytok-mistsevoho-samovriaduvannia/kodyfikator-administratyvno-terytorialnykh-odynyts-ta-terytorii-terytorialnykh-hromad',linkLabel:'Перевірити КАТОТТГ'},
    ],
    status:'VERIFIED',
    verificationBasis:'Ставку для попереднього розрахунку за 2026 рік беремо з підписаної форми №6 ДПС Полянської ради у зведеному наборі 2026 року: рішення №1778 від 01.07.2025, застосування з 01.01.2026, населений пункт Поляна з КАТОТТГ UA21040210010063908; деталізовані категорійні рядки показують 0,50% / 1,00%. У цій самій формі універсальний рядок 1.0.0 із нулями заповнено одночасно з рядками 1.1 усупереч інструкції форми; нулі не трактуємо як ставку чи пільгу. Переданий Excel показує 0,40% / 1,00%; для розрахунку обрано підписану форму ДПС, а розбіжність показуємо користувачу. Зведені дані ДПС сформовані з ІАС LOGICA станом на 30.01.2026; калькулятор обмежує правило 2026 роком. Перед розрахунками з 01.01.2027 перевірити нове рішення/набір ставок. Пільги перевіряє податковий агент, калькулятор їх автоматично не визначає.',
    checkedAt:'2026-10-18',
    version:'polyana-dps-form-6-logica-2026-10-18',
  }],
  ['UA21060070000049340', {
    decisionNumber:'3860',
    decisionDate:'2025-07-07',
    sourceUrl:'https://tax.gov.ua/data/material/000/801/934858/lbc_0756400000_edrpou_44070868_version_1.pdf',
    ratePublicationUrl:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',
    effectiveFrom:'2026-01-01',
    effectiveTo:'2026-12-31',
    rates:{domestic:0.3,inbound:1.0},
    decisionSourceLabel:'Підписана форма №6 ДПС Ясінянської громади на 2026 рік',
    decisionSourceDescription:'Форма ДПС пов’язує селище Ясіня та його КАТОТТГ-код із рішенням №3860 від 07.07.2025, що застосовується з 01.01.2026. Універсальний рядок 1.0.0 містить ставки 0,30% / 1,00%. У формі є нульові категорійні рядки, що суперечать примітці про незаповнення розділу 1.1 разом з універсальним рядком; це розкрито на сторінці.',
    decisionSourceLinkLabel:'Переглянути форму №6 ДПС',
    ratePublicationLabel:'ДПС: зведений набір ставок Закарпатської області на 2026 рік',
    ratePublicationDescription:'Офіційний набір ставок на 2026 рік для громад Закарпатської області.',
    ratePublicationLinkLabel:'Переглянути зведений набір ДПС',
    publicationBasisText:'Для попереднього розрахунку за 2026 рік обрано універсальний рядок 1.0.0 підписаної форми №6 ДПС: 0,30% для внутрішнього та 1,00% для в’їзного туризму. *Форма одночасно має нульові рядки за категоріями проживання, хоча її інструкція забороняє заповнювати їх разом з універсальним рядком. Ці нулі не трактуються як альтернативні ставки чи пільги. Раніші дані Excel 0,50% / 1,00% не є першоджерелом; перед розрахунками за 2027 рік потрібне повторне звірення.',
    supportingSources:[
      {label:'ДПС: підписана форма №6 Ясінянської громади',description:'Туристичний додаток вказує рішення №3860 від 07.07.2025, дату застосування 01.01.2026, громаду UA21060070000049340, селище Ясіня UA21060070010074038 і універсальні ставки 0,30% / 1,00%. Нульові деталізовані рядки не використовуються одночасно з універсальним тарифом.',url:'https://tax.gov.ua/data/material/000/801/934858/lbc_0756400000_edrpou_44070868_version_1.pdf',linkLabel:'Переглянути підписану форму №6'},
      {label:'ДПС: зведена інформація про ставки на 2026 рік',description:'Офіційний розділ ДПС із наборами рішень територіальних громад Закарпатської області.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути набір ставок ДПС'},
      {label:'КАТОТТГ: код громади та селища Ясіня',description:'Коди в туристичному додатку ДПС: Ясінянська громада UA21060070000049340, селище Ясіня UA21060070010074038.',url:'https://mininfra.gov.ua/diialnist/rozvytok-mistsevoho-samovriaduvannia/kodyfikator-administratyvno-terytorialnykh-odynyts-ta-terytorii-terytorialnykh-hromad',linkLabel:'Перевірити КАТОТТГ'},
      {label:'Податковий кодекс України: стаття 268',description:'Визначає базу туристичного збору, категорії туризму та законодавчі правила справляння.',url:'https://zakon.rada.gov.ua/laws/show/2755-17#n3691',linkLabel:'Переглянути статтю 268 ПКУ'},
    ],
    status:'VERIFIED',
    verificationBasis:'Підписана форма №6 ДПС за 2026 рік прямо називає рішення Ясінянської селищної ради №3860 від 07.07.2025, селище Ясіня UA21060070010074038 та громаду UA21060070000049340, дату застосування 01.01.2026 і універсальну ставку 0,30% / 1,00%. Форма також містить нульові рядки за видами проживання, хоча її інструкція забороняє заповнювати деталізований розділ одночасно з універсальним. Для попереднього калькулятора обрано універсальний рядок, а суперечність явно показано; нулі не використовуються як ставки або пільги. Excel із 0,50% / 1,00% не є першоджерелом. Калькулятор обмежено 2026 роком; перед 2027 роком потрібно перевірити нове рішення та форму ДПС. Пільги перевіряє податковий агент.',
    checkedAt:'2026-10-18',
    version:'yasinya-form6-2026-10-18',
  }],
  ['UA80000000000093317', {
    decisionNumber: '2/6658',
    decisionDate: '2019-01-31',
    sourceUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/m-kiiv/zvedena-informatsiya-2026/',
    decisionSourceLabel: 'ДПС: зведені ставки Києва на 2026 рік',
    decisionSourceDescription: 'Офіційна сторінка ДПС з даними ІАС LOGICA станом на 30.01.2026. У звіті для Києва наведено рішення №242/5629, №1910/5974 і №2/6658 та ставки туристичного збору 0,40% / 1,00%.',
    decisionSourceLinkLabel: 'Переглянути дані ДПС за 2026 рік',
    ratePublicationUrl: 'https://kyivcity.gov.ua/news/kivrada_ukhvalila_novi_stavki_turistichnogo_zboru/',
    ratePublicationLabel: 'Київрада: рішення про ставки 0,4% і 1%',
    ratePublicationDescription: 'Повідомлення Київради про ухвалення рішення №2/6658 і ставки 0,4% для внутрішнього та 1% для в’їзного туризму. Офіційна консультація ДПС уточнює дату набрання чинності рішенням - 14.02.2019.',
    ratePublicationLinkLabel: 'Переглянути повідомлення Київради',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.4,inbound:1.0},
    supportingSources: [
      {label:'ГУ ДПС у м. Києві: рішення №242/5629 та туристичний збір',description:'Консолідована сторінка підтверджує, що туристичний збір встановлений у додатку 4 до рішення №242/5629. Додаток 5 стосується паркування; рішення №108/10575 та №159/10626 не є змінами туристичного збору.',url:'https://kyiv.tax.gov.ua/rishennya-mistsevih-rad-/mistsevi-podatki-ta-zbori/turistichniy-zbir/',linkLabel:'Перевірити консолідовану сторінку ДПС'},
      {label:'ДПС: індивідуальна консультація щодо рішення №2/6658',description:'У тексті наведено пункти положення Києва: 0,4% / 1% від мінімальної зарплати на 1 січня, дата набрання чинності рішенням 14.02.2019. Це індивідуальна консультація, яку використовуємо як пояснювальне джерело, а не як універсальну консультацію для читача.',url:'https://ipk.vobu.ua/view/9877-1110-6-99-99-12-02-03-15-IPK',linkLabel:'Перевірити текст консультації'},
      {label:'Київрада: проєкт №887 про можливу зміну ставки',description:'Картка проєкту показує, що це проєкт на розгляді комісій, а не ухвалене рішення. Пропоновані зміни не включені до калькулятора. Повторно перевірити статус перед 2027 роком.',url:'https://old.kmr.gov.ua/uk/content/proekt-rishennya-kyyivskoyi-miskoyi-rady-29954',linkLabel:'Перевірити статус проєкту'},
      {label:'КАТОТТГ: код міста й громади Києва',description:'У чинному імпорті КАТОТТГ місто Київ і Київська міська територіальна громада мають код UA80000000000093317. У формі ДПС за 2026 рік код у рядку Києва відображено зі скороченням одного нуля; назва ради та території збігається.',url:'https://mininfra.gov.ua/diialnist/rozvytok-mistsevoho-samovriaduvannia/kodyfikator-administratyvno-terytorialnykh-odynyts-ta-terytorii-terytorialnykh-hromad',linkLabel:'Перевірити кодифікатор'},
    ],
    status:'VERIFIED',
    verificationBasis:'Для застосування у 2026 році офіційна форма №6 ДПС для Київської міської ради прямо перелічує рішення №242/5629, №1910/5974 і №2/6658, зазначає дату застосування 01.01.2026 та ставки 0,40% для внутрішнього і 1,00% для в’їзного туризму. Київрада повідомляє про ухвалення рішення №2/6658; консультація ДПС наводить формулу ставок і дату набрання чинності 14.02.2019. Новіший зареєстрований міський проєкт №887 має статус розгляду комісії, тому його ставки не застосовуємо. Період калькулятора обмежений 2026 роком і даними LOGICA станом на 30.01.2026; до розрахунків за 2027 рік необхідна нова перевірка. КАТОТТГ звірено окремо; у PDF ДПС код Києва має очевидну невідповідність формату кодифікатора, яку не використовуємо як ідентифікатор сторінки. Пільги калькулятор не визначає автоматично.',
    checkedAt:'2026-10-18',
    version:'kyiv-dps-form-6-logica-2026-10-18',
  }],
  ['UA21020030000019624', {
    decisionNumber: '794',
    decisionDate: '2021-07-09',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934858/lbc_0751700000_edrpou_26031452_version_1.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',
    taxOfficeCommunityFileUrl: 'https://tax.gov.ua/data/material/000/801/934858/lbc_0751700000_edrpou_26031452_version_1.pdf',
    effectiveFrom: '2022-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.25,inbound:0.25},
    supportingSources: [
      {label:'ДПС: форма ставок туристичного збору Берегівської громади у наборі на 2026 рік',description:'Форма №6 називає Берегівську громаду та місто Берегове за кодами КАТОТТГ, рішення №794 від 09.07.2021, застосування з 01.01.2022 і ставки 0,25% для внутрішнього та в’їзного туризму. Набір ДПС на 2026 рік сформований за даними ІАС LOGICA станом на 30.01.2026.',url:'https://tax.gov.ua/data/material/000/801/934858/lbc_0751700000_edrpou_26031452_version_1.pdf',linkLabel:'Переглянути форму ДПС'},
      {label:'ДПС: набір місцевих ставок, що діють у 2026 році',description:'Сторінка пояснює, що дані відображають стан ІАС LOGICA на 30.01.2026, а відсутність громади у наборі не означає нульову ставку.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути опис набору 2026 року'},
    ],
    status:'VERIFIED',
    verificationBasis:'У формі №6 Берегівської громади з офіційного набору ДПС на 2026 рік місто Берегове прямо назване з КАТОТТГ UA21020030010083215, код громади UA21020030000019624, базове рішення №794 від 09.07.2021 і дату застосування 01.01.2022. Таблиця туристичного збору показує універсальну ставку 0,25% для внутрішнього та 0,25% для в’їзного туризму; окремі рядки за видами місць розміщення також містять ці відсотки. Для локального калькулятора правило обмежено 2026 роком, оскільки джерельний знімок ДПС має дату 30.01.2026. До 2027 року ставку потрібно звірити повторно. Результат калькулятора не визначає пільги гостя автоматично.',
    checkedAt:'2026-10-14',
    version:'berehove-dps-form-6-logica-2026-10-14',
  }],
  ['UA71080490000022110', {
    decisionNumber: '2-4690',
    decisionDate: '2019-06-27',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934849/d8b5e601_2eea_43c3_86ad_ec0e8d6023f6.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/cherkaska-oblast/zvedena-informatsiya-2026/',
    taxOfficeCommunityFileUrl: 'https://tax.gov.ua/data/material/000/801/934849/d8b5e601_2eea_43c3_86ad_ec0e8d6023f6.pdf',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.5,inbound:5.0},
    supportingSources: [
      {label:'ДПС: підписана форма ставок туристичного збору Черкаської громади',description:'Форма №6 ДПС за 2026 рік називає рішення №2-4690, код Черкаської міської громади та ставки 0,50% для внутрішнього і 5,00% для в’їзного туризму. Набір ДПС сформований за даними ІАС LOGICA станом на 30.01.2026.',url:'https://tax.gov.ua/data/material/000/801/934849/d8b5e601_2eea_43c3_86ad_ec0e8d6023f6.pdf',linkLabel:'Переглянути форму №6 ДПС'},
      {label:'Черкаська міська рада: прогноз бюджету на 2026–2028 роки',description:'Міськрада окремо наводить туристичний збір у розмірі 0,5% для внутрішнього і 5% для в’їзного туризму та посилається на рішення №2-4690.',url:'https://cherkasy-rada.gov.ua/wp-content/uploads/documents/2025/08/prognoz-2026-2028.pdf',linkLabel:'Переглянути прогноз міськради'},
      {label:'Черкаська міська рада: архів чинних рішень про місцеві податки',description:'Офіційний архів перелічує базове рішення №2-4690 і його зміни, зокрема №21-4 та №51-32.',url:'https://cherkasy-rada.gov.ua/documents/miska-vlada/departamenty/departament-finansovoyi-polityky/rishennya-pro-misczevi-podatky-ta-zbory/diyuchi-rishennya-pro-misczevi-podatky-i-zbory/pro-zatverdzhennya-polozhen-ta-stavok-misczevyh-podatkiv-i-zboriv-na-terytoriyi-mista-cherkasy/',linkLabel:'Перевірити архів рішень'},
      {label:'Черкаська міська рада: звіт про виконання бюджету за 2024 рік',description:'Підтверджує, що після тимчасової нульової ставки у 2022–2023 роках справляння збору було відновлено у 2024 році.',url:'https://cherkasy-rada.gov.ua/novyny/informacziya-departamentu-finansovoyi-polityky-cherkaskoyi-miskoyi-rady-pro-vykonannya-byudzhetu-cherkaskoyi-miskoyi-terytorialnoyi-gromady-za-2024-rik/',linkLabel:'Переглянути звіт міськради'},
    ],
    status:'VERIFIED',
    verificationBasis:'Для розрахунків за 2026 рік підписана форма №6 ДПС для Черкаської громади вказує рішення №2-4690, код громади UA71080490000022110 і ставки 0,50% / 5,00%; набір ДПС позначений як ставки, що діють у 2026 році, та сформований за ІАС LOGICA станом на 30.01.2026. Прогноз бюджету самої Черкаської міської ради на 2026–2028 роки незалежно підтверджує ті самі ставки й посилається на базове рішення. Рішення №21-4 у 2022 році запроваджувало 0% на період воєнного стану; звіт міськради за 2024 рік підтверджує відновлення справляння збору у 2024 році. Територія міста та громади звірена окремо за КАТОТТГ. У базі сторінки правило обмежено 2026 роком; калькулятор не визначає пільги гостей автоматично.',
    checkedAt:'2026-10-14',
    version:'cherkasy-2026-tax-form-and-council-budget-2026-10-14',
  }],
  ['UA26040190000081578', {
    decisionNumber: '140-43',
    decisionDate: '2024-06-20',
    sourceUrl: 'https://www.namvk.if.ua/dt/1013488/',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/ivano-frankivska-oblast/zvedena-informatsiya-2026/',
    taxOfficeCommunityFileUrl: 'https://tax.gov.ua/data/material/000/801/934869/c2141f1f_5b12_4be6_a95c_fc738535012e.pdf',
    effectiveFrom: '2025-01-01',
    effectiveTo: '2026-12-31',
    rates: { domestic: 0.3, inbound: 1.0 },
    supportingSources: [
      {label:'Івано-Франківська міська рада: рішення №140-43',description:'Чинне рішення встановлює ставки 0,3% для внутрішнього та 1% для в’їзного туризму для місць тимчасового проживання на території громади, починаючи з 01.01.2025.',url:'https://www.namvk.if.ua/dt/1013488/',linkLabel:'Переглянути рішення ради'},
      {label:'ДПС: зведені ставки Івано-Франківської області на 2026 рік',description:'У формі громади для звітного набору 2026 року наведені рішення №140-43, код громади, дата застосування 01.01.2025 та ставки 0,30% / 1,00%. Дані сформовані з ІАС LOGICA станом на 30.01.2026.',url:'https://tax.gov.ua/data/material/000/801/934869/c2141f1f_5b12_4be6_a95c_fc738535012e.pdf',linkLabel:'Переглянути підписану форму ДПС'},
      {label:'ДПС: опис набору ставок на 2026 рік',description:'ДПС зазначає, що набір 2026 року сформований за даними ІАС LOGICA станом на 30.01.2026, а відсутність окремого запису не означає нульову ставку.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/ivano-frankivska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути пояснення ДПС'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Рішення Івано-Франківської міської ради №140-43 від 20.06.2024 прямо встановлює 0,3% для внутрішнього та 1% для в’їзного туризму від мінімальної зарплати на 1 січня за одну особу за добу та набирає чинності з 01.01.2025. Підписана форма громади в офіційному наборі ДПС ставок на 2026 рік містить те саме рішення, код громади UA26040190000081578, дату застосування 01.01.2025 і ставки 0,30% / 1,00%. Код Івано-Франківська UA26040190010045761 звірено з офіційним КАТОТТГ. Рішення №140-43 позначене радою як чинне. Калькулятор застосовує річну мінімальну зарплату відповідного року; додаткові місцеві пільги автоматично не визначаються.',
    checkedAt: '2026-10-14',
    version: 'ivano-frankivsk-140-43-2026-10-14',
  }],
  ['UA46060250000025047', {
    decisionNumber: '6373',
    decisionDate: '2025-06-12',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934883/01bb5e61_0220_47aa_ba69_8f53584d7e19.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/data/material/000/801/934883/01bb5e61_0220_47aa_ba69_8f53584d7e19.pdf',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    decisionSourceLabel: 'Підписана форма №6 ДПС, подана Львівською міською радою на 2026 рік',
    decisionSourceDescription: 'Форма пов’язує рішення №6373 від 12.06.2025 з кодом Львівської міської територіальної громади та застосуванням з 01.01.2026. Вона підтверджує ставки й цінові рівні, але не замінює повний текст рішення ради.',
    decisionSourceLinkLabel: 'Переглянути підписану форму ДПС',
    publicationBasisText: 'Підписана форма ДПС підтверджує ставки від 01.01.2026. Калькулятор не видає суму для ціни рівно 750 грн або 1 200 грн, бо формулювання діапазонів перекриваються.',
    rateSchedule: {
      priceBasis: 'Вартість тимчасового розміщення однієї особи за одну добу',
      bands: [
        {maxPriceUahPerPersonPerDay:750,domesticRatePercent:0.3,inboundRatePercent:1.0},
        {minPriceUahPerPersonPerDay:750,maxPriceUahPerPersonPerDay:1200,domesticRatePercent:0.4,inboundRatePercent:1.0},
        {minPriceUahPerPersonPerDay:1200,domesticRatePercent:0.5,inboundRatePercent:1.0},
      ],
      ambiguousBoundariesUahPerPersonPerDay: [750,1200],
    },
    supportingSources: [
      {label:'ДПС: підписана Львівською міськрадою форма ставок на 2026 рік',description:'Офіційна форма №6 вказує рішення №6373 від 12.06.2025, застосування з 01.01.2026, код Львівської громади та три цінові рівні туристичного збору.',url:'https://tax.gov.ua/data/material/000/801/934883/01bb5e61_0220_47aa_ba69_8f53584d7e19.pdf',linkLabel:'Переглянути офіційну форму ДПС'},
      {label:'ДПС Львівщини: місцеві рішення про туристичний збір',description:'Сторінка податкової служби пояснює, що ставки встановлюють рішеннями відповідних місцевих рад.',url:'https://lv.tax.gov.ua/rishennya-mistsevih-rad-/mistsevi-podatki-ta-zbori/turistichniy-zbir/',linkLabel:'Переглянути розділ ДПС Львівщини'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Офіційна форма ДПС, підписана уповноваженою представницею Львівської міської ради, пов’язує рішення №6373 з кодом Львівської міської територіальної громади та датою застосування 01.01.2026. Форма містить три внутрішні цінові діапазони і ставку 1% для в’їзного туризму. У формулюваннях є перетин на рівно 750 та 1200 грн, тому калькулятор має відмовляти у результаті на цих межах до уточнення первинного тексту рішення.',
    checkedAt: '2026-10-14',
    version: 'lviv-banded-2026-10-14',
  }],
  ['UA61040490000035010', {
    decisionNumber: '8/52/08',
    decisionDate: '2025-10-24',
    sourceUrl: 'https://ternopilcity.gov.ua/sesiya/rishennya-sesii/29955.html',
    ratePublicationUrl: 'https://ternopilcity.gov.ua/sesiya/rishennya-sesii/93883.html',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    rateSchedule: {
      thresholdUahPerPersonPerDay: 320,
      domestic: [{operator:'lt',threshold:320,ratePercent:0.15},{operator:'gt',threshold:320,ratePercent:0.25}],
      inbound: [{operator:'lt',threshold:320,ratePercent:0.3},{operator:'gt',threshold:320,ratePercent:0.5}],
      exactThresholdStatus: 'AMBIGUOUS',
      thresholdBasis: 'вартість проживання однієї особи за одну добу',
    },
    supportingSources: [
      {label:'Тернопільська міська рада: чинний текст місцевого рішення',description:'Рішення №7/35/5 містить чинні тарифні діапазони туристичного збору для Тернопільської міської територіальної громади.',url:'https://ternopilcity.gov.ua/sesiya/rishennya-sesii/29955.html',linkLabel:'Переглянути текст місцевого рішення'},
      {label:'Тернопільська міська рада: зміна порогу до 320 грн',description:'Рішення №8/52/08 встановлює застосування зміненого порогу з 1 січня 2026 року.',url:'https://ternopilcity.gov.ua/sesiya/rishennya-sesii/93883.html',linkLabel:'Переглянути рішення №8/52/08'},
      {label:'Тернопільська міська рада: перевірка рішення №8/54/29',description:'Переглянуто пізніші зміни до цього рішення; рішення №8/54/29 стосується майнових і земельних положень, а не туристичного збору.',url:'https://ternopilcity.gov.ua/sesiya/rishennya-sesii/96026.html',linkLabel:'Переглянути рішення №8/54/29'},
      {label:'Тернопільська міська рада: перевірка пізнішої зміни',description:'Рішення №8/57/07 від 8 травня 2026 року стосується земельної плати й майнових пільг, не змінює туристичні ставки.',url:'https://ternopilcity.gov.ua/en/sesiya/rishennya-sesii/100218.html',linkLabel:'Переглянути рішення №8/57/07'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Офіційний текст базового рішення міськради №7/35/5 встановлює тарифні діапазони; рішення №8/52/08 від 24.10.2025 змінює поріг із 200 на 320 грн і набирає чинності 01.01.2026. Рішення №8/54/29 та №8/57/07 переглянуто, вони змінюють майнові/земельні положення, а не туристичний збір. Місто Тернопіль і громаду звірено за КАТОТТГ UA61040490010069060 та UA61040490000035010. Вартість рівно 320 грн навмисно не розраховується через перетин формулювань «до 320» та «320 і вище».',
    checkedAt: '2026-10-14',
    version: 'ternopil-banded-2026-10-14',
  }],
  ['UA05020030000031457', {
    decisionNumber: '469',
    decisionDate: '2021-06-25',
    sourceUrl: 'https://www.vmr.gov.ua/media/%D0%94%D0%B5%D0%BF%D0%B0%D1%80%D1%82%D0%B0%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%94%D0%A4/%D0%94%D0%A4%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%9F%D0%9E%D0%94%D0%90%D0%A2%D0%9A%D0%98/%D0%A0%D1%96%D1%88%D0%B5%D0%BD%D0%BD%D1%8F%20%D0%BC%D1%96%D1%81%D1%8C%D0%BA%D0%BE%D1%97%20%D1%80%D0%B0%D0%B4%D0%B8%20%D0%B2%D1%96%D0%B4%2025.06.2021%20%E2%84%96469.pdf',
    ratePublicationUrl: 'https://vmr.gov.ua/mistsevi-podatky-ta-zbory',
    effectiveFrom: '2022-01-01',
    effectiveTo: '2026-12-31',
    rates: { domestic: 0.5, inbound: 1.5 },
    supportingSources: [
      {label:'Вінницька міська рада: місцеві податки та збори',description:'Актуалізована сторінка міськради містить перелік чинних рішень і посилається на базове рішення №469.',url:'https://vmr.gov.ua/mistsevi-podatky-ta-zbory',linkLabel:'Перевірити місцеві податки'},
      {label:'Вінницька міська рада: рішення №3535 від 19.06.2026',description:'Нова редакція порядку туристичного збору для застосування з 1 січня 2027 року зберігає ставки 0,5% і 1,5%.',url:'https://vmr.gov.ua/media/%D0%94%D0%B5%D0%BF%D0%B0%D1%80%D1%82%D0%B0%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%94%D0%A4/%D0%94%D0%A4%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%9F%D0%9E%D0%94%D0%90%D0%A2%D0%9A%D0%98/%D0%A0%D1%96%D1%88%D0%B5%D0%BD%D0%BD%D1%8F%20%D0%BC%D1%96%D1%81%D1%8C%D0%BA%D0%BE%D1%97%20%D1%80%D0%B0%D0%B4%D0%B8%20%E2%84%963535%20%D0%B2%D1%96%D0%B4%2019-06-2025.pdf',linkLabel:'Переглянути нову редакцію порядку'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Ставки 2026 року звірено з додатком 4 до рішення №469 та перехідними положеннями рішення №3535 для наступного періоду з 2027 року. Офіційна сторінка Вінницької міської ради містить чинні податкові документи. Населений пункт і громаду зіставлено з КАТОТТГ; окрема сторінка міста проходить перевірки калькулятора й індексації.',
    checkedAt: '2026-10-14',
    version: 'vinnytsia-2026-10-14',
  }],
  ['UA59080270000073662', {
    decisionNumber: '1238-МР',
    decisionDate: '2021-07-14',
    decisionSourceLabel: 'Сумська міська рада: перелік рішень і додатків',
    decisionSourceDescription: 'Офіційна сторінка громади містить посилання на рішення №1238-МР від 14.07.2021 та додаток про туристичний збір. Це сторінка-покажчик; ставки звіряйте з документами й формою ДПС нижче.',
    decisionSourceLinkLabel: 'Відкрити перелік рішень громади',
    sourceUrl: 'https://gromada.smr.gov.ua/pages/238785-stavki-opodatkuvannia-na-teritoriyi-sumskoyi-miskoyi-teritorialnoyi-gromadi',
    ratePublicationUrl: 'https://finance.smr.gov.ua/47-opodatkuvannya-v-ukraini',
    taxOfficeCommunityFileUrl: 'https://tax.gov.ua/data/material/000/801/934864/e2ba70ad_f3b6_4097_86bd_9ecadab9d8aa.pdf',
    effectiveFrom: '2022-01-01',
    effectiveTo: null,
    rates: { domestic: 0.5, inbound: 0.5 },
    supportingSources: [
      {label:'ДПС: звіт Сумської громади зі ставками туристичного збору',description:'Офіційний звіт наводить рішення №1238-МР, дату початку дії та ставки 0,5% для внутрішнього й в’їзного туризму.',url:'https://tax.gov.ua/data/material/000/801/934864/e2ba70ad_f3b6_4097_86bd_9ecadab9d8aa.pdf',linkLabel:'Переглянути звіт ДПС'},
      {label:'Департамент фінансів Сумської міської ради: ставки на 2026 рік',description:'Офіційна сторінка громади підтверджує ставку 0,5% для обох категорій туризму та посилається на рішення №1238-МР.',url:'https://finance.smr.gov.ua/47-opodatkuvannya-v-ukraini',linkLabel:'Перевірити інформацію громади'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Рішення №1238-МР і початок застосування звірено з офіційним звітом ДПС. Ставку для 2026 року підтверджує Департамент фінансів Сумської міської ради. Населений пункт і громаду зіставлено з КАТОТТГ; сторінка й калькулятор проходять перевірки для підтвердженого періоду.',
    checkedAt: '2026-10-14',
    version: 'sumy-2026-10-14',
  }],
  ['UA51100410000059549', {
    decisionNumber: '422-VIII',
    decisionDate: '2021-06-17',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934878/lbc_1559100000_edrpou_22491872_version_5.pdf',
    ratePublicationUrl: 'https://ymtg.gov.ua/documents/327388-pro-vstanovlennia-stavok-turisticnogo-zboru-na-teritoriyi-pivdennivskoyi-miskoyi-teritorialnoyi-gromadi-odeskogo-raionu',
    effectiveFrom: '2022-01-01',
    effectiveTo: '2026-12-31',
    rates: { domestic: 0.5, inbound: 0.5 },
    supportingSources: [
      {label:'ДПС: форма ставок туристичного збору Південної міської ради',description:'Офіційна форма ДПС пов’язує рішення №422-VIII з кодом громади UA51100410000059549 і ставками 0,5% для внутрішнього та в’їзного туризму.',url:'https://tax.gov.ua/data/material/000/801/934878/lbc_1559100000_edrpou_22491872_version_5.pdf',linkLabel:'Переглянути форму ДПС'},
      {label:'Південнівська міська рада: рішення №2626-VIII',description:'Нове рішення встановлює ставки 0,5% і 0,5% з 01.01.2027 та визначає припинення дії рішення №422-VIII з цієї дати, що підтверджує період попереднього рішення до кінця 2026 року.',url:'https://ymtg.gov.ua/documents/327388-pro-vstanovlennia-stavok-turisticnogo-zboru-na-teritoriyi-pivdennivskoyi-miskoyi-teritorialnoyi-gromadi-odeskogo-raionu',linkLabel:'Переглянути рішення ради'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Ставки 0,5% / 0,5% звірено з офіційною формою ДПС для рішення №422-VIII та кодом громади. Рішення №2626-VIII від 28.05.2026 встановлює ті самі ставки з 01.01.2027 і припиняє дію №422-VIII з цієї дати, тому період правила для 2026 року обмежено 31.12.2026. Населений пункт і громаду зіставлено з КАТОТТГ; перевірки калькулятора й індексації обмежені підтвердженим строком.',
    checkedAt: '2026-10-14',
    version: 'pivdennivska-2026-10-14',
  }],
  ['UA05060010000053179', {
    decisionNumber: '19',
    decisionDate: '2021-07-06',
    sourceUrl: 'https://bar-city.gov.ua/upload/docs/e7c2874665b63af9ebc117b4d855f41c.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/vinnitska-oblast/zvedena-informatsiya-2026/',
    taxOfficeCommunityFileUrl: 'https://tax.gov.ua/data/material/000/801/934810/29055e58_7a8e_4550_8aab_ca459a1ab2da.pdf',
    effectiveFrom: '2022-01-01',
    effectiveTo: '2026-12-31',
    rates: { domestic: 0.4, inbound: 1.0 },
    supportingSources: [
      {label:'ДПС: підписана форма ставок туристичного збору Барської громади на 2026 рік',description:'Форма містить код громади UA05060010000053179, рішення №19 від 06.07.2021, застосування з 01.01.2022 і ставки 0,40% для внутрішнього та 1,00% для в’їзного туризму.',url:'https://tax.gov.ua/data/material/000/801/934810/29055e58_7a8e_4550_8aab_ca459a1ab2da.pdf',linkLabel:'Переглянути форму ДПС'},
      {label:'Барська міська рада: протокол засідання з рішенням №19',description:'Протокол підтверджує ухвалення елементів туристичного збору за додатком 4 та їх застосування з 01.01.2022.',url:'https://bar-city.gov.ua/upload/docs/e7c2874665b63af9ebc117b4d855f41c.pdf',linkLabel:'Переглянути протокол ради'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Підписана форма ДПС на 2026 рік пов’язує Барську громаду з рішенням №19 від 06.07.2021, кодом громади UA05060010000053179, застосуванням з 01.01.2022 і ставками 0,4% / 1,0%. Протокол ради підтверджує одностайне ухвалення елементів туристичного збору за додатком 4; окремий повний текст затвердженого додатка не знайдений. Ставки перевірені для 2026 року, тому розрахунок обмежено 31.12.2026; на наступний податковий рік потрібне нове підтвердження. Кандидатну Excel-ставку 0,25% відхилено. Населений пункт Бар має окремий підтверджений код КАТОТТГ UA05060010010059821 у цій громаді.',
    checkedAt: '2026-10-14',
    version: 'bar-2026-10-14',
  }],
  ['UA73060610000066784', {
    decisionNumber: '1635',
    decisionDate: '2015-06-25',
    sourceUrl: 'https://www.tax.gov.ua/data/material/000/801/934846/ba390b74_22f5_46b0_a1e3_0b55dc45343b.pdf',
    decisionSourceLabel: 'Підписана форма №6 ДПС для туристичного збору на 2026 рік',
    decisionSourceDescription: 'Офіційна форма, підписана уповноваженою представницею Чернівецької міської ради, пов’язує ставку з базовим рішенням №1635 та його переліченими змінами. У рядку міста Чернівці (КАТОТТГ UA73060610010033137) вказано застосування з 01.01.2026 та однакові ставки для всіх місць тимчасового проживання.',
    decisionSourceLinkLabel: 'Переглянути підписану форму ДПС',
    publicationBasisText: 'Ставки на 2026 рік підтверджує підписана Чернівецькою міською радою форма №6 ДПС. У ній зазначені базове рішення №1635 та зміни до нього.',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/chernivetska-oblast/zvedena-informatsiya-2026/',
    ratePublicationLabel: 'ДПС: зведений набір ставок на 2026 рік, Чернівецька область',
    ratePublicationDescription: 'Сторінка містить підписану Чернівецькою міською радою форму №6 та окремі рядки для населених пунктів громади.',
    ratePublicationLinkLabel: 'Відкрити набір ДПС за 2026 рік',
    taxOfficeCommunityFileUrl: 'https://www.tax.gov.ua/data/material/000/801/934846/ba390b74_22f5_46b0_a1e3_0b55dc45343b.pdf',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: { domestic: 0.3, inbound: 0.3 },
    proposedRates: { domestic: 0.25, inbound: 1.0 },
    supportingSources: [
      {label:'Чернівецька міська рада: пошук прийнятих рішень',description:'Офіційний портал ради дає змогу шукати акти за номером і датою. Форма ДПС вказує базове рішення №1635 від 25.06.2015 та зміни №80, №581, №1289, №1619 і №282.',url:'https://chernivtsi.golos.net.ua/?p=pryynyati_rishennya&sp=list',linkLabel:'Відкрити офіційний пошук рішень'},
      {label:'ДПС: зведені ставки місцевих податків і зборів у Чернівецькій області на 2026 рік',description:'Сторінка обласного набору ДПС містить підписану форму зі ставками та територіальним кодом міста Чернівці.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/chernivetska-oblast/zvedena-informatsiya-2026/',linkLabel:'Відкрити набір ДПС за 2026 рік'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Ставки та територіальну область застосування перевірено за підписаною формою №6 ДПС, наданою Чернівецькою міською радою для 2026 року: окремий рядок міста Чернівці з кодом КАТОТТГ UA73060610010033137, застосування з 01.01.2026, 0,30% / 0,30% для всіх місць тимчасового проживання. Форма називає базове рішення №1635 від 25.06.2015 та зміни №80, №581, №1289, №1619 і №282. Вона є офіційним підтвердженням поданих на 2026 рік ставок, але не замінює текст рішення ради; тому сторінка посилається на форму як доказ ставки, а на міський портал як місце для перевірки актів. Excel-кандидат 0,25% / 1,00% відхилено. Правило обмежено 2026 роком.',
    checkedAt: '2026-10-14',
    version: 'chernivtsi-2026-10-14',
  }],
  ['UA51100270000073549', {
    decisionNumber: '4192-VIII',
    decisionDate: '2019-01-30',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934878/lbc_1556400000_edrpou_02315044_version_1.pdf',
    decisionSourceLabel: 'ДПС: підписана форма ставок Одеської громади',
    decisionSourceDescription: 'Підписана річна форма ДПС наводить 0,50% для внутрішнього та в’їзного туризму. Вона не усуває питання про період дії пізнішого рішення №4314-VIII; його повний текст потрібно перевірити окремо.',
    decisionSourceLinkLabel: 'Переглянути форму ДПС',
    ratePublicationUrl: 'https://od.tax.gov.ua/diialnist/zabezpechennya-nadhodjen/print-1050922.html',
    ratePublicationLabel: 'ДПС Одещини: повідомлення про рішення №4314-VIII',
    ratePublicationDescription: 'Повідомлення ДПС від 18.09.2026 наводить 1% для іноземних гостей за рішенням №4314-VIII. Для правильного нарахування потрібно встановити дату застосування зміни за повним актом і перевірити її відповідність річній формі ДПС.',
    ratePublicationLinkLabel: 'Переглянути пояснення ДПС',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.5,inbound:0.5},
    reportedRates: {domestic:0.5,inbound:1.0,confirmedAsOf:'2026-09-18'},
    supportingSources: [
      {label:'ДПС: підписана форма ставок туристичного збору Одеської громади',description:'Річна форма ДПС наводить 0,50% для внутрішнього та в’їзного туризму. Не застосовуйте її автоматично до періоду після зміни правила без звірки нового акта.',url:'https://tax.gov.ua/data/material/000/801/934878/lbc_1556400000_edrpou_02315044_version_1.pdf',linkLabel:'Переглянути форму №6 ДПС'},
      {label:'ДПС Одещини: повідомлення про рішення №4314-VIII від 14.07.2026',description:'ДПС підтверджує 1% для іноземних гостей, 0,5% для громадян України та умову щодо окремих ВПО. Повний текст рішення та його положення про чинність потрібно звірити перед застосуванням відсотка.',url:'https://od.tax.gov.ua/diialnist/zabezpechennya-nadhodjen/print-1050922.html',linkLabel:'Переглянути повідомлення ДПС'},
      {label:'ДПС Одещини: перше повідомлення про зміну',description:'Публікація від 24.07.2026 підтверджує, що рада внесла зміни рішенням №4314-VIII, але також не наводить дату їх застосування.',url:'https://od.tax.gov.ua/diialnist/zabezpechennya-nadhodjen/print-1033334.html',linkLabel:'Переглянути повідомлення від 24 липня'},
      {label:'Одеська міська рада: сесія 14.07.2026',description:'Порядок денний підтверджує розгляд змін до Положення про туристичний збір, але не замінює повний текст ухваленого акта з датою його застосування.',url:'https://deputat.omr.gov.ua/session/14-lipnya-2026-roku/',linkLabel:'Перевірити порядок денний'},
      {label:'Податковий кодекс: часові правила місцевих рішень',description:'Підпункти 12.3.4, 12.4.3 і 12.5 визначають строки оприлюднення та набрання чинності місцевими змінами до ставок. Це загальне правило для оцінки періоду дії рішення №4314-VIII; його конкретний пункт про чинність треба звірити з повним текстом акта.',url:'https://zakon.rada.gov.ua/laws/show/2755-17',linkLabel:'Переглянути Податковий кодекс'},
      {label:'ДПС Одещини: порядок місцевого збору та джерела',description:'Публічна сторінка ДПС перелічує офіційні документи Одеси та форми зі ставками туристичного збору.',url:'https://od.tax.gov.ua/rishennya-mistsevih-rad-/mistsevi-podatki-ta-zbori/turistichniy-zbir/',linkLabel:'Перевірити сторінку ДПС'},
    ],
    status:'CONFLICT',
    verificationBasis:'Джерела містять різні ставки для в’їзного туризму: підписана річна форма ДПС – 0,50%, а повідомлення ДПС від 18.09.2026 про рішення №4314-VIII – 1%. Повний текст нового рішення та дату застосування не підтверджено. Загальні положення ПКУ не замінюють перевірку конкретного акта. До усунення розбіжності калькулятор для Одеси не визначає суму.',
    checkedAt:'2026-10-23',
    version:'odesa-source-conflict-2026-10-23',
  }],
  ['UA23060070000082704', {
    decisionNumber: '39',
    decisionDate: '2019-01-30',
    sourceUrl: 'https://zp.gov.ua/documents/95368-pro-vstanovlennia-turisticnogo-zboru',
    ratePublicationUrl: 'https://tax.gov.ua/data/material/000/801/934863/f5fade5e_db5d_4526_ab5a_8d2105263251.pdf',
    ratePublicationLabel: 'Підписана форма ставок ДПС на 2026 рік',
    ratePublicationLinkLabel: 'Переглянути форму ДПС на 2026 рік',
    effectiveFrom: '2019-02-04',
    effectiveTo: null,
    rateSchedule: {
      priceBasis: 'Вартість тимчасового розміщення однієї особи за одну добу',
      bands: [
        {maxPriceUahPerPersonPerDay:300,domesticRatePercent:0.05,inboundRatePercent:0.5},
        {minPriceExclusiveUahPerPersonPerDay:300,maxPriceUahPerPersonPerDay:600,domesticRatePercent:0.25,inboundRatePercent:1.5},
        {minPriceExclusiveUahPerPersonPerDay:600,domesticRatePercent:0.5,inboundRatePercent:1.5},
      ],
      ambiguousBoundariesUahPerPersonPerDay: [],
    },
    supportingSources: [
      {label:'ДПС: підписана форма ставок туристичного збору на 2026 рік',description:'Форма №6 ідентифікує Запорізьку міську територіальну громаду та місто за КАТОТТГ, наводить рішення №39 і три тарифні умови для внутрішнього та в’їзного туризму.',url:'https://tax.gov.ua/data/material/000/801/934863/f5fade5e_db5d_4526_ab5a_8d2105263251.pdf',linkLabel:'Переглянути форму ДПС на 2026 рік'},
      {label:'Запорізька міська рада: перелік місцевих податків і зборів',description:'Чинна сторінка ради відносить рішення №39 від 30.01.2019 до туристичного збору.',url:'https://zp.gov.ua/pages/164604-miscevi-podatki-ta-zbori',linkLabel:'Перевірити перелік рішень ради'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Рішення №39 від 30.01.2019 і його додаток оприлюднені на офіційному сайті Запорізької міської ради. Підписана Запорізькою міською радою форма ДПС для 2026 року повторно підтверджує це рішення, код громади UA23060070000082704, код міста UA23060070010069526, дати чинності та ставки. Цінові межі у формі розмежовані як до 300 грн включно, понад 300 до 600 грн включно та понад 600 грн; для в’їзного туризму до 300 грн включно діє 0,5%, понад 300 грн 1,5%.',
    checkedAt: '2026-10-14',
    version: 'zaporizhzhya-banded-2026-10-14',
  }],
  ['UA56060470000086729', {
    decisionNumber: '783',
    decisionDate: '2021-06-24',
    sourceUrl: 'https://rivnerada.gov.ua/publicservicesapi/api/search-document/load-senate-document/23153/0/783/24-06-2021',
    ratePublicationUrl: 'https://tax.gov.ua/data/material/000/801/934870/db34b3dd_b4d1_4766_8186_ebc29a7a42f4.pdf',
    ratePublicationLabel: 'Підписана форма ставок ДПС на 2026 рік',
    ratePublicationLinkLabel: 'Переглянути форму ДПС на 2026 рік',
    effectiveFrom: '2022-01-01',
    effectiveTo: null,
    rates: {domestic:0.25,inbound:1.0},
    supportingSources: [
      {label:'Рівненська міська рада: рішення №783 про туристичний збір',description:'Рішення від 24.06.2021 встановлює ставки 0,25% для внутрішнього та 1% для в’їзного туризму на території громади й набирає чинності 01.01.2022.',url:'https://rivnerada.gov.ua/publicservicesapi/api/search-document/load-senate-document/23153/0/783/24-06-2021',linkLabel:'Переглянути рішення №783'},
      {label:'ДПС: підписана форма ставок туристичного збору на 2026 рік',description:'Форма №6 підтверджує для міста Рівне рішення №783, КАТОТТГ громади й міста, ставки 0,25% та 1% і застосування з 01.01.2022.',url:'https://tax.gov.ua/data/material/000/801/934870/db34b3dd_b4d1_4766_8186_ebc29a7a42f4.pdf',linkLabel:'Переглянути форму ДПС на 2026 рік'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Повний текст рішення Рівненської міської ради №783 від 24.06.2021 установлює 0,25% для внутрішнього та 1,0% для в’їзного туризму на території громади, застосування з 01.01.2022 та замінює попередні рішення №170 і зміни №5624 та №6142. Підписана радою форма №6 ДПС на 2026 рік повторно вказує №783, дату застосування 01.01.2022, КАТОТТГ Рівненської громади UA56060470000086729 і міста UA56060470010041018 та ті самі ставки.',
    checkedAt: '2026-10-14',
    version: 'rivne-decision-783-2026-10-14',
  }],
  ['UA74100390000073425', {
    decisionNumber: '18/VIII-19',
    decisionDate: '2022-06-30',
    sourceUrl: 'https://chernigiv-rada.gov.ua/storage/files/06/21/09/24/d2591043db2538471681da9ec338c0fb.pdf',
    ratePublicationUrl: 'https://chernigiv-rada.gov.ua/storage/files/15/23/07/00/f60a2b68ff122f255a01a6efbdc24ea6.pdf',
    ratePublicationLabel: 'Ставки туристичного збору Чернігівської міськради на 2026 рік',
    ratePublicationLinkLabel: 'Переглянути ставки ради на 2026 рік',
    effectiveFrom: '2023-01-01',
    effectiveTo: null,
    rates: {domestic:0.5,inbound:0.5},
    supportingSources: [
      {label:'Чернігівська міська рада: рішення №18/VIII-19',description:'Рішення від 30.06.2022 встановило місцеві податки й збори, затвердило положення про туристичний збір та набрало чинності 01.01.2023.',url:'https://chernigiv-rada.gov.ua/storage/files/06/21/09/24/d2591043db2538471681da9ec338c0fb.pdf',linkLabel:'Переглянути рішення №18/VIII-19'},
      {label:'Чернігівська міська рада: ставки туристичного збору на 2026 рік',description:'Офіційна таблиця ради для 2026 року вказує рішення №18/VIII-19, КАТОТТГ громади UA74100390000073425 та 0,5% для внутрішнього й в’їзного туризму.',url:'https://chernigiv-rada.gov.ua/storage/files/15/23/07/00/f60a2b68ff122f255a01a6efbdc24ea6.pdf',linkLabel:'Переглянути таблицю ставок 2026 року'},
      {label:'Чернігівська міська рада: сторінка туристичного збору',description:'На офіційній сторінці міськрада окремо оприлюднює положення та ставки туристичного збору, зокрема файл ставок на 2026 рік.',url:'https://chernigiv-rada.gov.ua/fin-miscevi-podatky/id-35780/',linkLabel:'Відкрити сторінку міськради'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Офіційне рішення Чернігівської міської ради №18/VIII-19 від 30.06.2022 затвердило місцеві податки та положення про туристичний збір і набрало чинності 01.01.2023. Окрема таблиця туристичного збору, оприлюднена самою міськрадою для 2026 року, посилається на це базове рішення, дату застосування 01.01.2023, КАТОТТГ громади UA74100390000073425 та ставки 0,5% для внутрішнього і 0,5% для в’їзного туризму. Міська сторінка туристичного збору пропонує файл ставок 2026 року як актуальний документ.',
    checkedAt: '2026-10-14',
    version: 'chernihiv-18-viii-19-2026-10-14',
  }],
  ['UA26080070000092582', {
    decisionNumber: '781-16/2021',
    decisionDate: '2021-06-24',
    sourceUrl: 'https://nbkolrada.gov.ua/dt/348928/',
    ratePublicationUrl: 'https://kolrada.gov.ua/p/podatki',
    effectiveFrom: '2022-01-01',
    effectiveTo: null,
    rates: {domestic:0.5,inbound:0.5},
    supportingSources: [
      {label:'Коломийська міська рада: рішення №781-16/2021 та Положення про туристичний збір',description:'Чинне положення встановлює ставку 0,5% для внутрішнього та 0,5% для в’їзного туризму від мінімальної зарплати на 1 січня звітного року за одну особу за одну добу.',url:'https://nbkolrada.gov.ua/dt/348928/',linkLabel:'Переглянути рішення та положення'},
      {label:'Коломийська міська рада: ставки місцевих податків, чинні з 2026 року',description:'Офіційна сторінка ставок, що діють з 01.01.2026, посилається на рішення №781-16/2021, яке містить Положення про туристичний збір.',url:'https://kolrada.gov.ua/p/podatki',linkLabel:'Переглянути ставки на 2026 рік'},
      {label:'ДПС: форма ставок Коломийської громади за 2025 рік',description:'Підписана форма №6 показує 0,5% для внутрішнього та в’їзного туризму в таблиці туристичного збору громади, з датою застосування 01.01.2025. Номер рішення в цій формі не використовується тут як доказ саме туристичної ставки.',url:'https://tax.gov.ua/data/material/000/801/934869/lbc_0953000000_edrpou_04054334_version_2.pdf',linkLabel:'Переглянути форму ДПС'},
      {label:'Коломийська міська рада: звіт про виконання програми за І півріччя 2026 року',description:'Офіційний звіт міськради фіксує надходження туристичного збору до бюджету громади у 2026 році.',url:'https://nbkolrada.gov.ua/dt/789086/',linkLabel:'Переглянути звіт за 2026 рік'},
      {label:'Коломийська міська рада: прогноз бюджету громади на 2027–2029 роки',description:'Офіційний прогноз, схвалений 08.09.2026, використовує рішення №781-16/2021 серед чинної нормативної бази місцевих податків і зборів.',url:'https://nbkolrada.gov.ua/dt/789139/',linkLabel:'Переглянути бюджетний прогноз'},
    ],
    status:'VERIFIED',
    verificationBasis:'Рішення Коломийської міської ради №781-16/2021 від 24.06.2021 набрало чинності 01.01.2022, поширюється на Коломийську територіальну громаду та затверджує Положення про туристичний збір. Пункт 3.1 Положення встановлює 0,5% для внутрішнього і 0,5% для в’їзного туризму від мінімальної заробітної плати на 1 січня звітного року за одну особу за одну добу. Офіційна сторінка міськради зі ставками, чинними з 01.01.2026, посилається на це рішення. Підписана форма ДПС за 2025 рік також показує ставки 0,5% / 0,5% у таблиці туристичного збору, хоча її поле номера рішення неоднозначно відображене, тому первинним доказом ставки лишається Положення №781-16/2021. Звіт міськради підтверджує надходження туристичного збору у першому півріччі 2026 року, а схвалений 08.09.2026 бюджетний прогноз на 2027–2029 роки посилається на №781-16/2021 як на нормативну основу місцевих податків і зборів. Таким чином, ставка підтверджується чинним положенням та актуальним переліком ставок міськради, а не лише даними ДПС за 2025 рік. Населений пункт Коломия UA26080070010075786 і громаду UA26080070000092582 зіставлено з офіційним КАТОТТГ.',
    checkedAt:'2026-10-14',
    version:'kolomyya-781-16-2021-2026-10-14',
  }],
  ['UA21100230000083101', {
    decisionNumber: '2333',
    decisionDate: '2025-07-08',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934858/lbc_0755900000_edrpou_02313559_version_1.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.5,inbound:1.0},
    proposedRates: {domestic:0.4,inbound:1.0},
    supportingSources: [
      {label:'ДПС: підписана форма №6 Ужгородської громади на 2026 рік',description:'Форма називає місто Ужгород (КАТОТТГ UA21100230010016545), громаду UA21100230000083101, рішення №2333 від 08.07.2025, застосування з 01.01.2026 та універсальну ставку 0,50% / 1,00%. У тій самій формі додатково надруковані нульові рядки для типів житла, хоча примітка до форми вимагає не заповнювати деталізацію 1.1 за наявності універсальної ставки 1.0.0. Для цього розрахунку застосовується універсальний рядок; нулі трактуються як помилкова/зайва деталізація, а не як окремі тарифи.',url:'https://tax.gov.ua/data/material/000/801/934858/lbc_0755900000_edrpou_02313559_version_1.pdf',linkLabel:'Переглянути форму №6 ДПС'},
      {label:'ДПС: зведений набір місцевих ставок Закарпатської області на 2026 рік',description:'Зведення сформоване з даних ІАС LOGICA станом на 30.01.2026; відсутність громади в наборі не означає ставку 0%.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути зведення ДПС'},
    ],
    status:'VERIFIED',
    verificationBasis:'Підписана форма №6 ДПС для 2026 року прямо називає Ужгород UA21100230010016545 у складі Ужгородської громади UA21100230000083101, рішення №2333 від 08.07.2025 та застосування ставок з 01.01.2026. Універсальний рядок 1.0.0 задає 0,50% для внутрішнього і 1,00% для в’їзного туризму. Форма водночас містить нулі в окремих рядках типів житла, хоча її примітка каже, що за заповненого 1.0.0 розділ 1.1 не заповнюється. Тому для інформаційного калькулятора беремо універсальну ставку 1.0.0, а не помилкову деталізацію з нулями. Наданий Excel пропонує 0,40% / 1,00%; для внутрішнього туризму це суперечить актуальній підписаній формі ДПС, тому застосовуємо 0,50%. Сторінка пояснює це розходження. Правило обмежене 2026 роком; перед 2027 роком звірити нове рішення та форму ДПС.',
    checkedAt:'2026-10-14',
    version:'uzhhorod-form6-universal-rate-2026-10-14',
  }],
  ['UA46100210000027970', {
    decisionNumber: '1805',
    decisionDate: '2022-07-07',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934883/d5ac4701_e753_4c8a_9d0c_a0f735173f94.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/lvivska-oblast/zvedena-informatsiya-2026/',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.2,inbound:0.2},
    proposedRates: {domestic:0.5,inbound:1.0},
    supportingSources: [
      {label:'ДПС: підписана форма №6 Славської громади на 2026 рік',description:'Форма називає селище Славсько (КАТОТТГ UA46100210010024884), громаду UA46100210000027970, рішення №1805 від 07.07.2022, застосування з 01.01.2026 і універсальну ставку 0,20% / 0,20%. Зайві нульові рядки за типами житла суперечать примітці форми, за якою деталізація 1.1 не заповнюється за наявності універсального рядка 1.0.0. Для калькулятора використовуємо саме універсальні 0,20% / 0,20%.',url:'https://tax.gov.ua/data/material/000/801/934883/d5ac4701_e753_4c8a_9d0c_a0f735173f94.pdf',linkLabel:'Переглянути форму №6 ДПС'},
      {label:'ДПС: зведений набір місцевих ставок Львівської області на 2026 рік',description:'Офіційне зведення ставок, поданих громадами на 2026 рік.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/lvivska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути зведення ДПС'},
    ],
    status:'VERIFIED',
    verificationBasis:'Підписана форма №6 ДПС за 2026 рік прямо включає селище Славсько UA46100210010024884 до Славської селищної громади UA46100210000027970, вказує рішення №1805 від 07.07.2022 та дату застосування 01.01.2026. Універсальний рядок 1.0.0 встановлює 0,20% для внутрішнього та 0,20% для в’їзного туризму. Нульові рядки окремих типів житла у цій же формі конфліктують з приміткою, що розділ 1.1 не заповнюється при встановленні універсальної ставки; тому їх не трактуємо як нульову ставку. Excel пропонує 0,50% / 1,00%, але це не збігається з підписаною формою ДПС. Для попереднього розрахунку беремо універсальні значення з офіційної форми, показуємо зіркове пояснення та обмежуємо правило 2026 роком. Перед 2027 роком перевірити нове рішення і форму ДПС.',
    checkedAt:'2026-10-14',
    version:'slavsko-form6-universal-rate-2026-10-14',
  }],
  ['UA21120250000077532', {
    decisionNumber: '344 (зі змінами №866 і №2542)',
    decisionDate: '2021-06-30',
    sourceUrl: 'https://khust-miskrada.gov.ua/wp-content/uploads/2021/07/Dodatok-5-do-rishennia-344.pdf',
    decisionSourceLabel: 'Хустська міська рада: Положення, додаток 5 до рішення №344',
    decisionSourceDescription: 'Додаток 5 до рішення №344 від 30.06.2021 встановлює 0,50% / 1,50% для туристичного збору на території Хустської міської громади. Підписана форма №6 ДПС на 2026 рік підтверджує ставки для міста Хуст і кодів КАТОТТГ міста та громади.',
    decisionSourceLinkLabel: 'Переглянути Положення ради',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',
    ratePublicationLabel: 'ДПС: зведена інформація про місцеві ставки Закарпатської області на 2026 рік',
    ratePublicationLinkLabel: 'Переглянути зведення ДПС на 2026 рік',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.5,inbound:1.5},
    proposedRates: {domestic:0.4,inbound:1.0},
    supportingSources: [
      {label:'Хустська міська рада: рішення №344 і Положення про туристичний збір (додаток 5)',description:'Чинний базовий місцевий акт затверджено 30.06.2021. Додаток 5 прямо встановлює 0,5% для внутрішнього та 1,5% для в’їзного туризму й поширює порядок на Хустську міську територіальну громаду. Рішення набрало чинності 01.01.2022; ставка підтверджена формою №6 ДПС на 2026 рік.',url:'https://khust-miskrada.gov.ua/wp-content/uploads/2021/07/Dodatok-5-do-rishennia-344.pdf',linkLabel:'Переглянути Положення ради'},
      {label:'Хустська міська рада: рішення №866 від 22.07.2022',description:'Зміни стосуються положень про плату за землю, транспортний податок і податок на нерухомість; туристичний збір у переліку змінених додатків відсутній.',url:'https://khust-miskrada.gov.ua/wp-content/uploads/2022/08/Rishennia-866.pdf',linkLabel:'Переглянути рішення №866'},
      {label:'Хустська міська рада: рішення №2542 від 30.06.2025',description:'Рішення викладає в новій редакції додатки 6 і 7 та додає додаток 8 - ставки податку на нерухомість і землі. Положення про туристичний збір не змінює; чинність змін починається 01.01.2026.',url:'https://khust-miskrada.gov.ua/wp-content/uploads/2025/07/Rishennia-2542.pdf',linkLabel:'Переглянути рішення №2542'},
      {label:'ДПС: підписана форма №6 Хустської громади',description:'Універсальний рядок форми встановлює 0,50% / 1,50%; форма пов’язує правило з рішенням №344 зі змінами №866 і №2542, а також однозначно називає КАТОТТГ міста та громади. Нулі у деталізованих рядках не застосовуємо, бо інструкція форми забороняє заповнювати розділ 1.1 разом із рядком 1.0.0.',url:'https://tax.gov.ua/data/material/000/801/934858/lbc_0756100000_edrpou_25440728_version_1.pdf',linkLabel:'Переглянути підписану форму №6'},
      {label:'ДПС: зведення місцевих ставок Закарпатської області на 2026 рік',description:'Офіційний розділ ДПС для ставок на 2026 рік; відсутність іншого значення не використовується як доказ нульової ставки.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути зведення ставок'},
      {label:'Закарпатська ОВА: надходження туристичного збору за перше півріччя 2026 року',description:'Регіональне джерело повідомляє 593,1 тис. грн надходжень Хустської громади за січень–червень 2026 року; це сигнал туристичної активності, а не доказ ставки.',url:'https://zaktour.gov.ua/en/za-6-misiatsiv-2026-roku-na-zakarpatti-splatyly-16-7-mln-hrn-turystychnoho-zboru/',linkLabel:'Переглянути статистику ОВА'},
      {label:'Офіційний кодифікатор КАТОТТГ',description:'Зіставлення міста Хуст UA21120250010053148 і Хустської міської громади UA21120250000077532.',url:'https://mininfra.gov.ua/diialnist/rozvytok-mistsevoho-samovriaduvannia/kodyfikator-administratyvno-terytorialnykh-odynyts-ta-terytorii-terytorialnykh-hromad',linkLabel:'Перевірити кодифікатор'},
    ],
    status:'VERIFIED',
    verificationBasis:'Місцеве рішення №344 від 30.06.2021 та його додаток 5 прямо встановлюють 0,50% для внутрішнього і 1,50% для в’їзного туризму на території Хустської міської територіальної громади. Рішення набрало чинності 01.01.2022. Повний текст зміни №866 від 22.07.2022 перелічує зміни до плати за землю, транспортного податку й податку на нерухомість, не змінюючи додаток 5 про туристичний збір; рішення №2542 від 30.06.2025 змінює додатки 6–8 про нерухомість і землю, також не змінюючи туристичний збір. Підписана форма №6 ДПС на 2026 рік незалежно підтверджує місто Хуст UA21120250010053148, громаду UA21120250000077532 та універсальну ставку 0,50% / 1,50%. Форма містить нульові деталізовані рядки поряд з універсальним рядком, хоча її інструкція забороняє їх одночасне заповнення; застосовуємо узгоджений універсальний рядок, а нулі не трактуємо як тарифи. Робочий Excel пропонує 0,40% / 1,00%, але суперечить двом офіційним першоджерелам і не застосовується. Ставка на сторінці обмежена 2026 роком; перед розрахунками за 2027 рік перевірити нове рішення, зміни та форму ДПС.',
    checkedAt:'2026-10-18',
    version:'khust-form6-2026-10-18',
  }],
  ['UA21020110000091104', {
    decisionNumber: '297',
    decisionDate: '2021-07-14',
    sourceUrl: 'https://www.tax.gov.ua/data/material/000/801/934858/a266f45f_e9e4_457e_a9c3_c2c533a28700.pdf',
    decisionSourceLabel: 'ДПС: підписана форма №6 Виноградівської громади',
    decisionSourceDescription: 'Форма №6 називає рішення Виноградівської міської ради №297 від 14.07.2021, застосування з 01.01.2022, громаду та коди її населених пунктів. Для міста Виноградів вказаний КАТОТТГ UA21020110010043238.',
    decisionSourceLinkLabel: 'Переглянути форму №6 ДПС',
    ratePublicationUrl: 'https://vin-rada.gov.ua/news/%D0%BD%D0%B0%D1%80%D0%B0%D0%B4%D0%B0/',
    ratePublicationLabel: 'Виноградівська міська рада: підтвердження ставки у 2026 році',
    ratePublicationDescription: 'На робочій нараді 16.04.2026 міська рада повідомила, що туристичний збір у громаді становить 0,25% для внутрішнього та в’їзного туризму.',
    ratePublicationLinkLabel: 'Переглянути повідомлення ради',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.25,inbound:0.25},
    proposedRates: {domestic:0.3,inbound:1.0},
    supportingSources: [
      {label:'Виноградівська міська рада: рішення №297 та Положення про туристичний збір',description:'Офіційна сторінка міської ради відтворює рішення №297 та його додаток. Положення встановлює 0,25% для внутрішнього та в’їзного туризму й описує базу на одну особу за одну добу.',url:'https://old.vin-rada.gov.ua/%D1%82%D1%83%D1%80%D0%B8%D0%B7%D0%BC/%D1%82%D1%83%D1%80%D0%B8%D1%81%D1%82%D0%B8%D1%87%D0%BD%D0%B8%D0%B9-%D0%B7%D0%B1%D1%96%D1%80/',linkLabel:'Переглянути рішення та Положення'},
      {label:'Виноградівська міська рада: підтвердження ставки у 2026 році',description:'Повідомлення про нараду 16.04.2026 прямо підтверджує, що ставка в громаді становить 0,25% для внутрішнього та в’їзного туризму.',url:'https://vin-rada.gov.ua/news/%D0%BD%D0%B0%D1%80%D0%B0%D0%B4%D0%B0/',linkLabel:'Переглянути підтвердження ради'},
      {label:'ДПС: підписана форма №6 Виноградівської громади',description:'Форма №6 підписана 11.07.2025, називає базове рішення №297 і застосування з 01.01.2022, показує 0,25% / 0,25%, та перелічує місто Виноградів з кодом UA21020110010043238 у складі громади UA21020110000091104. Нульові категорійні рядки не тлумачимо окремо від заповненого універсального рядка.',url:'https://www.tax.gov.ua/data/material/000/801/934858/a266f45f_e9e4_457e_a9c3_c2c533a28700.pdf',linkLabel:'Переглянути підписану форму №6'},
      {label:'ДПС: зведені ставки Закарпатської області на 2026 рік',description:'Сторінка ДПС пояснює, що набір відображає дані ІАС LOGICA станом на 30.01.2026. Відсутність окремої ставки в реєстрі не трактувалася б як нульова ставка.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути зведений набір ДПС'},
      {label:'Податковий кодекс України: стаття 268',description:'Законодавча база туристичного збору та повноваження місцевої ради встановлювати ставки.',url:'https://zakon.rada.gov.ua/laws/show/2755-17#n3691',linkLabel:'Переглянути статтю 268 ПКУ'},
    ],
    status:'VERIFIED',
    verificationBasis:'Для міста Виноградів використовується рішення ради №297 від 14.07.2021 і ставка 0,25% / 0,25%. Її підтверджують додаток до місцевого рішення, підписана форма №6 ДПС і окреме повідомлення Виноградівської міської ради від 16.04.2026 про ставку в громаді. Форма №6 перелічує місто Виноградів UA21020110010043238 і Виноградівську громаду UA21020110000091104. У наданому Excel зазначено 0,30% / 1,00%; ця розбіжність вирішується на користь узгоджених офіційних джерел. Ставка застосовується на цій сторінці для розрахунків у 2026 році; перед 2027 роком слід перевірити нові рішення та форму ДПС. У формі №6 присутні нульові категорійні рядки разом з універсальним рядом; їх не тлумачимо як пільги або альтернативні ставки. Пільгу для конкретного гостя підтверджує податковий агент за документами.',
    checkedAt:'2026-10-18',
    version:'vynohradiv-form6-council-2026-10-18',
  }],
  ['UA21080150000014443', {
    decisionNumber:'2936',decisionDate:'2025-06-12',sourceUrl:'https://tax.gov.ua/data/material/000/801/934858/lbc_0750200000_edrpou_43360202_version_1.pdf',
    effectiveFrom:'2026-01-01',effectiveTo:'2026-12-31',rates:{domestic:0.5,inbound:1.0},
    decisionSourceLabel:'ДПС: підписана форма №6 Тячівської громади на 2026 рік',decisionSourceDescription:'Форма називає рішення №2936 від 12.06.2025, Тячівську громаду, місто Тячів UA21080150010051267 і застосування ставки з 01.01.2026. Універсальний рядок містить 0,50% / 1,00%; деталізовані нульові рядки не використовуються одночасно з ним.',decisionSourceLinkLabel:'Переглянути форму №6 ДПС',
    publicationBasisText:'Для розрахунку в місті Тячів за 2026 рік використано універсальний рядок 1.0.0 підписаної форми №6 ДПС: 0,50% для внутрішнього та 1,00% для в’їзного туризму. Форма також містить нульові деталізовані рядки, хоча її інструкція вимагає обрати універсальний або деталізований спосіб. Нулі не трактуються як ставка чи пільга. У робочій довідковій таблиці внутрішня ставка відрізняється; вибір джерела пояснений на сторінці.',
    supportingSources:[
      {label:'ДПС: підписана форма №6 Тячівської громади',description:'Форма вказує рішення №2936 від 12.06.2025, застосування з 01.01.2026, місто Тячів UA21080150010051267 і універсальний тариф 0,50% / 1,00%.',url:'https://tax.gov.ua/data/material/000/801/934858/lbc_0750200000_edrpou_43360202_version_1.pdf',linkLabel:'Переглянути форму ДПС'},
      {label:'КАТОТТГ: громада й місто Тячів',description:'Коди громади та міста також наведені в підписаній формі №6 ДПС.',url:'https://mininfra.gov.ua/diialnist/rozvytok-mistsevoho-samovriaduvannia/kodyfikator-administratyvno-terytorialnykh-odynyts-ta-terytorii-terytorialnykh-hromad',linkLabel:'Перевірити кодифікатор'},
      {label:'Податковий кодекс України: стаття 268',description:'Загальні правила туристичного збору, база, категорії туризму та звільнення.',url:'https://zakon.rada.gov.ua/laws/show/2755-17#n3691',linkLabel:'Переглянути статтю 268 ПКУ'},
    ],status:'VERIFIED',verificationBasis:'Підписана форма №6 ДПС Тячівської міської ради вказує рішення №2936 від 12.06.2025, місто Тячів UA21080150010051267 і дату застосування 01.01.2026. Універсальний рядок 1.0.0 містить 0,50% / 1,00%. Нульові деталізовані рядки заповнені поряд із ним усупереч примітці форми; використовуємо універсальний рядок, а нулі не трактуємо як тарифи чи пільги. Робочі дані з іншим внутрішнім відсотком не є першоджерелом. Калькулятор обмежений 2026 роком; ставки на 2027 рік перевірити до 01.12.2026.',checkedAt:'2026-10-18',version:'tyachiv-form6-2026-10-18',
  }],
  ['UA32080150000035443', {
    decisionNumber:'3989-52-VIII',decisionDate:'2025-06-05',sourceUrl:'https://tax.gov.ua/data/material/000/801/934872/lbc_1054600000_edrpou_02318025_version_1.pdf',
    effectiveFrom:'2026-01-01',effectiveTo:'2026-12-31',rates:{domestic:0.5,inbound:5.0},
    decisionSourceLabel:'ДПС: форма №6 Ірпінської громади на 2026 рік',decisionSourceDescription:'Підписана форма називає рішення №3989-52-VIII від 05.06.2025, місто Ірпінь UA32080150010049888 та дату застосування 01.01.2026. У рядку 1.0.0 вказано 0,50% / 5,00%.',decisionSourceLinkLabel:'Переглянути форму №6 ДПС',
    publicationBasisText:'Для міста Ірпінь на 2026 рік форма №6 ДПС указує 0,50% для внутрішнього та 5,00% для в’їзного туризму. Це максимальна ставка для в’їзного туризму за нормою ПКУ, але у формі вона подана як місцеве рішення Ірпінської ради. Застосування обмежено адресою міста Ірпінь і датами 2026 року.',
    supportingSources:[
      {label:'ДПС: форма №6 Ірпінської громади',description:'Офіційна форма називає рішення №3989-52-VIII, Ірпінь UA32080150010049888 і дату застосування 01.01.2026; рядок міста відображає універсальні ставки 0,50% / 5,00%.',url:'https://tax.gov.ua/data/material/000/801/934872/lbc_1054600000_edrpou_02318025_version_1.pdf',linkLabel:'Переглянути форму ДПС'},
      {label:'КАТОТТГ: громада й місто Ірпінь',description:'Зіставлення коду територіальної громади та міста Ірпінь за офіційним кодифікатором.',url:'https://mininfra.gov.ua/diialnist/rozvytok-mistsevoho-samovriaduvannia/kodyfikator-administratyvno-terytorialnykh-odynyts-ta-terytorii-terytorialnykh-hromad',linkLabel:'Перевірити кодифікатор'},
      {label:'Податковий кодекс України: стаття 268',description:'Визначає основу обчислення туристичного збору та граничні ставки.',url:'https://zakon.rada.gov.ua/laws/show/2755-17#n3691',linkLabel:'Переглянути статтю 268 ПКУ'},
    ],status:'VERIFIED',verificationBasis:'Підписана форма №6 ДПС на 2026 рік ідентифікує Ірпінську міську раду, рішення №3989-52-VIII від 05.06.2025, місто Ірпінь UA32080150010049888 і застосування з 01.01.2026. Універсальний рядок 1.0.0 містить 0,50% / 5,00%; інші категорійні ставки в формі не наведені як чинні тарифи міста. Калькулятор обмежено 2026 роком і точним населеним пунктом Ірпінь; перед 2027 роком повторно перевірити новий акт і форму ДПС.',checkedAt:'2026-10-18',version:'irpin-form6-2026-10-18',
  }],
  ['UA46100190000081766', {
    decisionNumber:'5663, 5664, 5662',decisionDate:'2025-06-26',sourceUrl:'https://tax.gov.ua/data/material/000/801/934883/2193442c_a7bd_4832_adde_b89bbc479258.pdf',
    effectiveFrom:'2026-01-01',effectiveTo:'2026-12-31',rates:{domestic:0.5,inbound:2.5},
    decisionSourceLabel:'ДПС: підписана форма №6 Сколівської громади на 2026 рік',decisionSourceDescription:'Форма називає рішення №5663, №5664 і №5662 від 26.06.2025 та місто Сколе UA46100190010093837. У міському рядку на 2026 рік зазначено 0,50% / 2,50%; рядки інших населених пунктів громади відрізняються.',decisionSourceLinkLabel:'Переглянути форму №6 ДПС',
    publicationBasisText:'Сторінка та калькулятор стосуються саме міста Сколе, а не всієї Сколівської громади. Підписана форма №6 ДПС на 2026 рік пов’язує місто Сколе з рішеннями №5663, №5664 і №5662 та показує для міста 0,50% / 2,50%. Форма має нульові категорійні рядки поряд із тарифом; їх не трактуємо як нульову ставку чи пільгу. Інші населені пункти громади мають окремі рядки, тож ставку Сколе не поширюємо на них.',
    supportingSources:[
      {label:'ДПС: підписана форма №6 Сколівської громади',description:'Додаток №6 називає рішення №5663, №5664, №5662 від 26.06.2025, місто Сколе UA46100190010093837 та застосування з 01.01.2026; міський рядок - 0,50% / 2,50%.',url:'https://tax.gov.ua/data/material/000/801/934883/2193442c_a7bd_4832_adde_b89bbc479258.pdf',linkLabel:'Переглянути форму ДПС'},
      {label:'КАТОТТГ: Сколе та Сколівська громада',description:'Офіційні коди міста Сколе й територіальної громади наведені в формі ДПС і кодифікаторі.',url:'https://mininfra.gov.ua/diialnist/rozvytok-mistsevoho-samovriaduvannia/kodyfikator-administratyvno-terytorialnykh-odynyts-ta-terytorii-terytorialnykh-hromad',linkLabel:'Перевірити кодифікатор'},
      {label:'Податковий кодекс України: стаття 268',description:'Загальні правила щодо бази та ставок туристичного збору.',url:'https://zakon.rada.gov.ua/laws/show/2755-17#n3691',linkLabel:'Переглянути статтю 268 ПКУ'},
    ],status:'VERIFIED',verificationBasis:'Підписана форма №6 ДПС на 2026 рік пов’язує Сколівську міську раду з рішеннями №5663, №5664 і №5662 від 26.06.2025 та містом Сколе UA46100190010093837. Міський рядок містить 0,50% для внутрішнього і 2,50% для в’їзного туризму з 01.01.2026. Категорійна частина форми заповнена нулями одночасно з міськими тарифами; цей технічний конфлікт показано, нулі не трактуємо як ставки або пільги. Інші населені пункти громади мають окремі записи. Калькулятор обмежено містом Сколе й 2026 роком.',checkedAt:'2026-10-18',version:'skole-form6-2026-10-18',
  }],
]);

export const touristTaxCommunities = Object.freeze([
  ...verifiedTouristTaxCommunities,
  ...workbookCommunities.map(community=>{
    const verifiedRule=primaryRuleOverrides.get(community.katottgCode);
    return verifiedRule?{...community,taxRule:{...community.taxRule,...verifiedRule}}:community;
  }),
]);

const seoLocalityLabel=source=>{
  const match=String(source.name).match(/^(.*?)\s+\(([^)]+)\)$/);
  return match&&normalizeCommunityIdentity(match[2])===normalizeCommunityIdentity(source.region)?match[1]:source.name;
};

const verifiedTouristTaxPlaces = [
  {
    slug: 'lutsk',
    name: 'Луцьк',
    nameLocative: 'Луцьку',
    settlementType: 'місто',
    region: 'Волинська область',
    district: 'Луцький район',
    katottgSettlementCode: 'UA07080170010083384',
    communitySlug: 'lutsk-community',
    geoStatus: 'ELIGIBLE',
    geoStatusReason: 'Код Луцька звірено з офіційним КАТОТТГ; код громади підтверджено ДПС Волинської області у 2026 році.',
    route: '/tourist-tax/lutsk/',
    indexable: true,
    readiness: {placeVerified:true,safetyEligible:true,calculatorQaPassed:true,uniqueContentApproved:true,seoQaPassed:true},
    editorial: {
      title: 'Туристичний збір у Луцьку у 2026 році: ставки та калькулятор',
      description: 'Туристичний збір у Луцьку у 2026 році: 0,5% для внутрішнього та 1,5% для в’їзного туризму. Джерело ставок і калькулятор суми за гостями й добами.',
      uniqueContent: 'У Луцькій міській територіальній громаді з 1 січня 2026 року діють ставки туристичного збору 0,5% для внутрішнього та 1,5% для в’їзного туризму. Рішення міської ради №77/72 визначає ставку як відсоток мінімальної заробітної плати на 1 січня податкового року за одну особу за кожну добу тимчасового розміщення. Калькулятор рахує інформаційну суму за обраною датою, кількістю розрахункових діб і категоріями гостей.',
      seoBlock: {
        title: 'Туристичний збір у Луцьку у 2026 році: місцеві ставки та розрахунок',
        intro: 'Для готелю, садиби, хостелу, апартаментів або іншого місця тимчасового розміщення у Луцьку застосовується рішення Луцької міської територіальної громади. Рішення №77/72 діє з 1 січня 2026 року та встановлює окремі ставки для внутрішнього й в’їзного туризму.',
        sections: [
          {
            heading: 'Який туристичний збір діє у Луцьку у 2026 році',
            paragraphs: [
              'У Луцькій міській територіальній громаді ставка для внутрішнього туризму становить 0,5%, для в’їзного туризму 1,5% від мінімальної заробітної плати, встановленої на 1 січня податкового року. У 2026 році розрахункова база становить 8 647 грн. Це відповідає орієнтовно 43,24 грн та 129,71 грн за одну особу за одну розрахункову добу відповідно.'
            ]
          },
          {
            heading: 'Чи залежить туристичний збір у Луцьку від ціни номера',
            paragraphs: [
              'У рішенні №77/72 ставку визначено як відсоток мінімальної заробітної плати на 1 січня податкового року. Для цього правила ціна номера не є змінною формули. Попередня сума залежить від категорії туризму, кількості гостей і розрахункових діб. Одна доба становить 24 години між розрахунковими годинами об’єкта.'
            ]
          },
          {
            heading: 'На які адреси поширюються ставки Луцької громади',
            paragraphs: [
              'Сторінка стосується міста Луцьк, код КАТОТТГ населеного пункту UA07080170010083384, у складі Луцької міської територіальної громади з кодом UA07080170000013585. Якщо об’єкт розташований в іншому населеному пункті Волинської області, не застосовуйте цю ставку автоматично: спершу встановіть громаду за адресою та перевірте її рішення. ДПС окремо пояснює, як визначити код територіальної громади для об’єкта.'
            ]
          },
          {
            heading: 'Приклад: один гість в’їзного туризму на дві розрахункові доби',
            paragraphs: [
              'За бази 8 647 грн і ставки 1,5% попередній збір для одного гостя на дві розрахункові доби становить 8 647 × 1,5% × 1 × 2 = 259,41 грн. Перед нарахуванням окремо перевірте можливі законні підстави для звільнення: калькулятор не визначає право на них автоматично.'
            ]
          }
        ]
      },
    },
  },
];

const workbookTouristTaxPlaces = workbook.places.filter(source=>!verifiedTouristTaxPlaces.some(place=>place.slug===source.slug)).map(source=>({
  slug:source.slug,
  name:source.slug==='kosyno-koson'?'Косонь':source.name,
  settlementType:source.category||'населений пункт',
  region:source.region,
  district:katottgByPlaceSlug.get(source.slug)?.officialDistrictName?`${katottgByPlaceSlug.get(source.slug).officialDistrictName} район`:null,
  katottgSettlementCode:katottgByPlaceSlug.get(source.slug)?.settlementCode??null,
  communitySlug:source.slug==='lutsk'?'lutsk-community':communitySlugByPlaceSlug.get(source.slug),
  geoStatus:'REVIEW_REQUIRED',
  geoStatusReason:katottgByPlaceSlug.get(source.slug)?.status==='MATCHED'?'Населений пункт і громаду зіставлено з офіційним КАТОТТГ від 7 липня 2026 року. Для розрахунку також потрібні перевірене рішення громади, період дії та перевірка калькулятора.':katottgByPlaceSlug.get(source.slug)?.status==='LOCALITY_ALIAS_DUPLICATE'?'Ця сторінка описує локацію в уже зіставленому населеному пункті. Окремий код КАТОТТГ не дублюється; потрібне ручне підтвердження адреси та громади.':'Назву населеного пункту не вдалося однозначно зіставити з КАТОТТГ; потрібна ручна перевірка перед визначенням громади та ставки.',
  route:source.route,
  indexable:false,
  readiness:{placeVerified:false,safetyEligible:false,calculatorQaPassed:false,uniqueContentApproved:false,seoQaPassed:false},
  sourceRecord:source,
  editorial:{
    title:`Туристичний збір: ${seoLocalityLabel(source)}, ${source.region} область у 2026 році | VDALO`,
    description:`Довідка про туристичний збір для локації «${seoLocalityLabel(source)}» (${source.region} область): як перевірити рішення громади та які дані потрібні для розрахунку.`,
    seoBlock:{
      title:`Туристичний збір: ${seoLocalityLabel(source)}, ${source.region} область у 2026 році`,
      intro:`Розмір туристичного збору для об’єкта розміщення у населеному пункті ${source.name} визначається рішенням відповідної місцевої ради. Щоб назвати чинну ставку, потрібно точно зіставити населений пункт із територіальною громадою та перевірити офіційне рішення і період його дії.`,
      sections:[
        {heading:`Як перевірити туристичний збір у ${source.name}`,paragraphs:[`Спершу встановіть, до якої територіальної громади належить місце розміщення у населеному пункті ${source.name}. Далі звірте чинне рішення ради, категорії туризму, дату набрання чинності та можливі зміни до документа. Дані з довідкової таблиці самі по собі не підтверджують ставку.`]},
        {heading:`Що має перевірити готель перед розрахунком`,paragraphs:[`До нарахування збору звірте адресу об’єкта, його громаду, чинне місцеве рішення та категорію гостя за Податковим кодексом. Сума в калькуляторі з’явиться після підтвердження географічних кодів, офіційного джерела ставки й періоду її дії.`]},
      ],
    },
  },
  review:source.review,
}));

// These place pages have verified 2026 local rules, exact KATOTTG matches,
// and page-specific copy based only on those reviewed sources. Order 376 is
// not a tourist-tax rate or taxpayer gate in Tax Code article 268.
const publishableReviewedCityContent={
  tyachiv:{
    title:'Туристичний збір у Тячеві 2026: ставки, калькулятор | VDALO',description:'Туристичний збір у Тячеві на 2026 рік: ставки 0,50% і 1,00%, рішення №2936, КАТОТТГ та пояснення рядків форми ДПС. Розрахуйте суму онлайн. Дані на 2026 рік.',
    uniqueContent:'Підписана форма №6 ДПС пов’язує місто Тячів із рішенням №2936 від 12 червня 2025 року та застосуванням універсальних ставок із 1 січня 2026 року. Для внутрішнього туризму зазначено 0,50%, для в’їзного - 1,00%. У формі одночасно є нульові деталізовані рядки, попри примітку, що універсальний і категорійний режими не заповнюються разом. Сторінка пояснює цей конфлікт; калькулятор бере універсальний рядок і працює лише для дат 2026 року.',
    seoBlock:{title:'Туристичний збір у Тячеві у 2026 році: ставки та розрахунок',intro:'На 2026 рік підписана форма №6 ДПС указує для міста Тячів ставки туристичного збору 0,50% для внутрішнього та 1,00% для в’їзного туризму. Тут можна перевірити попередню суму за кількістю гостей і розрахункових діб, побачити територіальні коди й прочитати примітку про неузгоджені рядки офіційної форми.',sections:[
      {heading:'Які ставки туристичного збору діють у Тячеві',paragraphs:['Форма №6 ДПС на 2026 рік для Тячівської міської ради показує універсальну ставку 0,50% для внутрішнього та 1,00% для в’їзного туризму. У документі названі рішення №2936 від 12 червня 2025 року та дата застосування 1 січня 2026 року. Ці відсотки обчислюються від законодавчої бази на одного платника за розрахункову добу, а не від вартості номера.']},
      {heading:'Як читати нульові категорійні рядки форми ДПС',paragraphs:['* У тій самій формі є нульові значення за окремими типами місць проживання. Примітка ДПС передбачає вибір між універсальним рядком та деталізацією за видами житла, тому одночасне заповнення створює технічну суперечність. Для попереднього калькулятора використано заповнений універсальний рядок, а нулі не вважаються ані ставками, ані пільгами.']},
      {heading:'Приклад розрахунку для гостей у Тячеві',paragraphs:['Мінімальна заробітна плата на 1 січня 2026 року становить 8 647 грн. За ставки 0,50% двоє гостей внутрішнього туризму на три розрахункові доби мають попередній розрахунок 8 647 × 0,50% × 2 × 3 = 259,41 грн. Для такої самої кількості гостей в’їзного туризму за ставкою 1,00% сума становить 518,82 грн до перевірки можливих звільнень.']},
      {heading:'Межі міста та Тячівська громада',paragraphs:['Сторінка стосується міста Тячів із кодом КАТОТТГ UA21080150010051267 у складі Тячівської міської територіальної громади UA21080150000014443. Офіційна форма ДПС містить окремі рядки й коди для інших сіл громади. Якщо місце розміщення розташоване за межами міста Тячева, перед розрахунком потрібно звірити точний населений пункт та відповідний запис.']},
      {heading:'Період дії та наступна перевірка ставки',paragraphs:['Розрахунок обмежений проживанням із 1 січня до 31 грудня 2026 року. До 1 грудня 2026 року слід перевірити нові рішення Тячівської міської ради та форму ДПС на 2027 рік; не можна автоматично переносити нинішній відсоток чи базу на наступний податковий рік.']},
      {heading:'Пільги й обов’язки податкового агента',paragraphs:['Калькулятор дає попередню оцінку та не підтверджує право гостя на звільнення. Податковий агент перевіряє документи й підстави за статтею 268 Податкового кодексу України, фактичні розрахункові доби та чинні правила звітування. Для податкового обліку звірте остаточну суму з первинними документами.']},
    ]}},
  irpin:{
    title:'Туристичний збір в Ірпені 2026: ставки та розрахунок | VDALO',description:'Туристичний збір в Ірпені у 2026 році: ставки 0,50% і 5,00%, рішення ради та дані ДПС. Перевірте територію дії й розрахуйте суму для гостей.',
    uniqueContent:'Форма №6 ДПС на 2026 рік пов’язує місто Ірпінь із рішенням Ірпінської міської ради №3989-52-VIII від 5 червня 2025 року та застосуванням ставки із 1 січня 2026 року. Міський рядок указує 0,50% для внутрішнього та 5,00% для в’їзного туризму. Попередні довідкові дані відрізнялися, тому сторінка показує вибір першоджерела та обмежує калькулятор містом Ірпінь і 2026 роком.',
    seoBlock:{title:'Туристичний збір в Ірпені у 2026 році: ставки та калькулятор',intro:'Для міста Ірпінь форма №6 ДПС на 2026 рік вказує 0,50% для внутрішнього та 5,00% для в’їзного туризму. Сторінка пояснює рішення ради й дату застосування, показує формулу та допомагає оцінити суму для гостей об’єкта в межах Ірпеня. Окремо зазначено різницю з попередніми довідковими даними та неузгодженість рядків форми.',sections:[
      {heading:'Ставки туристичного збору в Ірпені на 2026 рік',paragraphs:['Універсальний рядок підписаної форми №6 ДПС для Ірпеня містить ставку 0,50% для внутрішнього й 5,00% для в’їзного туризму. Форма називає рішення Ірпінської міської ради №3989-52-VIII від 5 червня 2025 року та дату застосування 1 січня 2026 року. В’їзна ставка 5% є місцевим значенням, а не автоматичною ставкою для кожної громади України.']},
      {heading:'Як обчислюється сума для одного гостя',paragraphs:['База 2026 року - мінімальна заробітна плата 8 647 грн на 1 січня. За внутрішньою ставкою 0,50% це 43,24 грн за одну особу за одну розрахункову добу; за в’їзною ставкою 5,00% - 432,35 грн. Наприклад, двоє внутрішніх платників збору на три доби - це 259,41 грн до перевірки можливих законних звільнень.']},
      {heading:'Рішення ради, форма ДПС і дата дії',paragraphs:['Форма №6 ДПС пов’язує ставку з рішенням №3989-52-VIII від 05.06.2025, містом Ірпінь та початком застосування з 01.01.2026. Коди міста й Ірпінської територіальної громади звірені з КАТОТТГ. Робочі попередні значення відрізнялися від рядка офіційної форми; калькулятор спирається на форму ДПС і не приховує походження ставки.']},
      {heading:'Неузгодженість рядків форми й попередніх даних',paragraphs:['* У формі №6 вказано універсальний рядок 1.0.0 зі ставками 0,50% / 5,00%, а нижче наведено нульові значення за окремими категоріями місць проживання. Інструкція форми передбачає заповнення універсального або деталізованого розділу, тому нулі не можна читати як окремі ставки чи пільги. Для попереднього калькулятора використано ненульовий універсальний рядок, прямо пов’язаний із рішенням №3989-52-VIII. Робочі довідкові дані 0,40% / 1,00% не є першоджерелом і в розрахунок не підставляються.']},
      {heading:'До якої території належить сторінка',paragraphs:['Розрахунок призначений для міста Ірпінь UA32080150010049888 у складі Ірпінської міської територіальної громади UA32080150000035443. Він не підтверджує ставку для сусідніх населених пунктів Київської області: для адреси за межами міста визначте окрему громаду й перевірте її місцеве рішення.']},
      {heading:'Період актуальності та перевірка на 2027 рік',paragraphs:['Калькулятор приймає дати проживання лише в межах 2026 року. До 1 грудня 2026 року потрібно перевірити нове рішення Ірпінської міської ради, чинність попереднього акта та оприлюднену ДПС форму на 2027 рік. Розмір мінімальної зарплати для наступного року змінюють лише після ухвалення відповідного закону про Державний бюджет.']},
      {heading:'Пільги та попередній характер результату',paragraphs:['Законні підстави для звільнення залежать від категорії гостя й підтвердних документів. Калькулятор не визначає пільгу автоматично та не замінює податковий облік: податковий агент перевіряє статтю 268 ПКУ, документи, розрахункові доби та остаточну суму за первинними даними.']},
    ]}},
  skole:{
    title:'Туристичний збір у Сколе 2026: ставки й калькулятор | VDALO',description:'Туристичний збір у Сколе на 2026 рік: ставки 0,5% і 2,5%, рішення громади, дані ДПС і калькулятор суми для гостей за кількістю діб.',
    uniqueContent:'Підписана форма №6 ДПС на 2026 рік пов’язує місто Сколе з рішеннями №5663, №5664 і №5662 від 26 червня 2025 року та показує міські ставки 0,50% / 2,50%. У формі також є нульові рядки за категоріями проживання, що суперечать інструкції про спосіб заповнення. Сторінка розкриває цю неузгодженість і обмежує правило містом Сколе: інші населені пункти Сколівської громади мають окремі записи й ставки.',
    seoBlock:{title:'Туристичний збір у Сколе у 2026 році: ставки та розрахунок',intro:'На 2026 рік форма №6 ДПС для міста Сколе показує ставку 0,50% для внутрішнього і 2,50% для в’їзного туризму. Тут можна розрахувати попередню суму, перевірити КАТОТТГ та побачити, чому ставку міста не можна автоматично поширити на всі села Сколівської громади.',sections:[
      {heading:'Які ставки туристичного збору діють у місті Сколе',paragraphs:['Підписана форма №6 ДПС на 2026 рік пов’язує місто Сколе з рішеннями №5663, №5664 і №5662 від 26 червня 2025 року. Для міського рядка наведено 0,50% для внутрішнього й 2,50% для в’їзного туризму з датою застосування 1 січня 2026 року. Ці місцеві ставки застосовуються до території міста, зазначеної в документі.']},
      {heading:'Технічна примітка до нульових рядків форми',paragraphs:['* Форма одночасно містить нульові значення в деталізації за типами проживання, хоча її інструкція вимагає не заповнювати категорійний розділ разом з універсальним рядком. Для попереднього калькулятора використано міський рядок ставок 0,50% / 2,50%; нулі не вважаються ані альтернативними ставками, ані звільненнями від збору.']},
      {heading:'Приклад розрахунку туристичного збору у Сколе',paragraphs:['За бази 8 647 грн у 2026 році двоє гостей внутрішнього туризму на три розрахункові доби дають 8 647 × 0,50% × 2 × 3 = 259,41 грн. Для двох гостей в’їзного туризму за ставкою 2,50% той самий період становить 1 297,05 грн. Результат потрібно скоригувати з урахуванням можливих документально підтверджених звільнень.']},
      {heading:'Сколе й Сколівська міська територіальна громада',paragraphs:['Сторінка описує місто Сколе UA46100190010093837 у складі Сколівської міської територіальної громади UA46100190000081766. Форма ДПС містить окремі коди й рядки для Верхнього Синьовидного, Урича та інших населених пунктів. Тому ставка сторінки для Сколе не є підтвердженням тарифу для садиби чи готелю в іншому селі громади.']},
      {heading:'Дати застосування та наступне оновлення',paragraphs:['Поточний калькулятор працює лише з датами проживання у 2026 році. Перед 1 грудня 2026 року перевірте ухвалені Сколівською міською радою зміни та нову форму ДПС на 2027 рік. Не переносіть ставки автоматично, оскільки рішення може розрізняти окремі населені пункти громади.']},
      {heading:'Пільги та перевірка обліку податковим агентом',paragraphs:['Розрахунок є попереднім. Податковий агент окремо з’ясовує статус платника, перевіряє документи на можливе звільнення відповідно до статті 268 Податкового кодексу України та веде облік фактичних розрахункових діб. Для звітності користуйтеся чинним актом ради й первинними документами.']},
    ]}},
  yasinya:{
    title:'Туристичний збір у Ясіні у 2026 році: ставка та калькулятор',
    description:'Ставки туристичного збору в Ясіні на 2026 рік: 0,30% для внутрішнього та 1,00% для в’їзного туризму. Офіційна форма ДПС, розрахунок і застереження.',
    uniqueContent:'Підписана форма №6 ДПС на 2026 рік пов’язує селище Ясіня з рішенням Ясінянської селищної ради №3860 від 7 липня 2025 року, чинним із 1 січня 2026 року. Універсальний рядок форми вказує 0,30% для внутрішнього й 1,00% для в’їзного туризму. Документ водночас має нульові рядки за видами проживання, хоча примітка форми каже не заповнювати їх разом з універсальним рядком. Ми показуємо цей технічний конфлікт і для попереднього розрахунку беремо універсальний рядок; нульові категорії не трактуємо як пільги. Попередні значення Excel 0,50% / 1,00% не є джерелом ставки.',
    seoBlock:{
      title:'Туристичний збір у Ясіні у 2026 році: ставка, громада та розрахунок',
      intro:'На 2026 рік форма №6 ДПС вказує для селища Ясіня універсальну ставку 0,30% для внутрішнього та 1,00% для в’їзного туризму. Нижче наведено попередній розрахунок, територіальні коди та пояснення рядків офіційної форми.',
      sections:[
        {heading:'Які ставки туристичного збору вказані для Ясіні на 2026 рік',paragraphs:['Універсальний рядок 1.0.0 підписаної форми №6 ДПС для Ясінянської громади містить 0,30% для внутрішнього та 1,00% для в’їзного туризму. Форма пов’язує показники з рішенням №3860 від 07.07.2025 і датою застосування 01.01.2026. За бази 8 647 грн це орієнтовно 25,94 грн та 86,47 грн за одну особу за одну розрахункову добу після округлення.']},
        {heading:'Зірочка до ставки: як читати форму ДПС',paragraphs:['* У формі поруч із універсальним рядком 1.0.0 є нульові значення за окремими категоріями місць проживання, хоча примітка документа каже, що за заповнення універсального рядка розділ із категоріями не заповнюють. Нулі не можна трактувати як нульову ставку чи звільнення. Калькулятор використовує саме заповнений універсальний рядок і показує цю неузгодженість користувачу. Повний текст місцевого додатка незалежно не звірено, тому перед новим податковим роком дані треба підтвердити повторно.']},
        {heading:'Як попередньо порахувати туристичний збір у Ясіні',paragraphs:['Формула для 2026 року: 8 647 грн × місцева ставка × кількість платників збору × розрахункові доби. Для двох гостей внутрішнього туризму на три доби приклад становить 8 647 × 0,30% × 2 × 3 = 155,65 грн. Для гостя в’їзного туризму за тих самих умов - 8 647 × 1,00% × 2 × 3 = 518,82 грн. Калькулятор рахує введені категорії окремо й не визначає автоматично право на пільгу.']},
        {heading:'Ясіня та Ясінянська територіальна громада',paragraphs:['Сторінка описує селище Ясіня з кодом КАТОТТГ UA21060070010074038 у складі Ясінянської селищної територіальної громади UA21060070000049340. Ці коди наведені у формі ДПС. У громаді є інші населені пункти, тому адреси за межами селища потрібно звіряти з відповідним рядком офіційних документів; маршрут Ясіні не є підтвердженням ставки для кожного сусіднього населеного пункту.']},
        {heading:'Чому попередні довідкові ставки відрізняються',paragraphs:['Попередні довідкові дані для Ясіні містять 0,50% / 1,00%, тоді як підписана форма №6 ДПС на 2026 рік має універсальний рядок 0,30% / 1,00%. Для калькулятора взято значення з офіційного подання громади з датою застосування та кодами території. Розбіжність показана відкрито; перед використанням у звітності податковий агент має керуватися чинним місцевим актом та уточнити технічну неузгодженість форми за потреби.']},
        {heading:'Період актуальності й дата наступної перевірки',paragraphs:['Ставку перевірено 18 жовтня 2026 року за підписаною формою №6 ДПС, яка відображає застосування рішення з 01.01.2026. Калькулятор обмежений датами 2026 року. Перед розрахунками проживання з 1 січня 2027 року потрібно повторно перевірити рішення Ясінянської ради, його додаток і новий набір ДПС; наступна перевірка запланована до 1 грудня 2026 року.']},
        {heading:'Пільги та остаточний облік',paragraphs:['Результат калькулятора є попередньою оцінкою. Податковий агент окремо перевіряє передбачені статтею 268 Податкового кодексу підстави звільнення, документи гостя, фактичні розрахункові доби й порядок звітування.']},
      ]
    }
  },
  kyyiv:{
    title:'Туристичний збір у Києві 2026: ставки та калькулятор | VDALO',
    description:'Туристичний збір у Києві на 2026 рік: 0,4% для внутрішнього та 1% для в’їзного туризму. Форма ДПС, сума за добу, калькулятор і правила перевірки пільг.',
    uniqueContent:'Форма №6 ДПС для Київської міської ради підтверджує на 2026 рік ставки 0,4% для внутрішнього та 1% для в’їзного туризму. У звіті перелічені рішення №242/5629, №1910/5974 і №2/6658; офіційна сторінка ДПС окремо відносить туристичний збір до додатка 4, а додаток 5 - до збору за паркування. ДПС сформувала набір на основі ІАС LOGICA станом на 30 січня 2026 року. Під час повторної перевірки 18 жовтня 2026 року в доступних офіційних джерелах не знайдено ухваленої зміни цих ставок. Калькулятор обмежує правило 2026 роком; перед розрахунком за 2027 рік необхідно звірити нове рішення та оновлену форму ДПС.',
    seoBlock:{
      title:'Туристичний збір у Києві у 2026 році: ставки та розрахунок',
      intro:'У Києві офіційна форма №6 ДПС для місцевих ставок на 2026 рік зазначає 0,4% для внутрішнього та 1% для в’їзного туризму. Це ставки від законодавчої бази за одну особу й одну розрахункову добу, а не від повної ціни проживання. Нижче можна оцінити суму для гостей об’єкта в межах Київської міської територіальної громади. Дані звірені за формою ДПС на основі LOGICA станом на 30 січня 2026 року та повторно переглянуті 18 жовтня; результат застосовується лише до дат 2026 року.',
      sections:[
        {heading:'Які ставки туристичного збору застосовують у Києві у 2026 році',paragraphs:['У формі №6 ДПС для Київської міської ради вказано ставку 0,40% для внутрішнього та 1,00% для в’їзного туризму. У таблиці зазначені рішення №242/5629, №1910/5974 та №2/6658, а дата застосування ставок у звітному наборі - 1 січня 2026 року. Ці значення є часткою законодавчої бази туристичного збору, а не відсотком від ціни номера.']},
        {heading:'Скільки становить збір за одну особу за одну розрахункову добу',paragraphs:['Мінімальна заробітна плата на 1 січня 2026 року становить 8 647 грн. За ставки 0,4% попередня сума для внутрішнього туризму - 34,59 грн за особу за добу; за ставки 1% для в’їзного туризму - 86,47 грн. Наприклад, для двох гостей внутрішнього туризму на три розрахункові доби калькулятор покаже 207,53 грн до перевірки можливих законних звільнень.']},
        {heading:'Які рішення та дати підтверджують правило для Києва',paragraphs:['Київрада повідомила про ухвалення рішення №2/6658 від 31 січня 2019 року; консультація ДПС зазначає дату набрання ним чинності 14 лютого 2019 року. Офіційна сторінка ГУ ДПС у м. Києві відносить туристичний збір до додатка 4 рішення №242/5629, тоді як додаток 5 містить збір за паркування. Форма №6 ДПС на 2026 рік перелічує рішення №242/5629, №1910/5974 та №2/6658, і зазначає застосування ставок з 1 січня 2026 року. Під час повторної перевірки 18 жовтня 2026 року не знайдено ухваленої зміни ставок у доступних офіційних джерелах. Проєкт №887 про перегляд туристичного збору не вважається чинним рішенням.']},
        {heading:'На яку територію поширюється київська ставка',paragraphs:['Ця сторінка описує місто Київ і Київську міську територіальну громаду з кодом КАТОТТГ UA80000000000093317. У формі ДПС за 2026 рік код у рядку міста відображений із відмінністю в одному нулі; назва Київської міської ради й території збігається, а ідентифікатор сторінки звірено за офіційним кодифікатором КАТОТТГ. Для об’єктів поза адміністративними межами Києва потрібно визначити іншу громаду й перевірити її ставку окремо.']},
        {heading:'Пільги та перевірка гостя перед нарахуванням',paragraphs:['Податковий кодекс визначає категорії осіб, які не є платниками туристичного збору, та вимоги до документального підтвердження. У публікації Київради 2025 року також описано можливі зміни до місцевих правил, але то повідомлення про проєкт, а не чинна редакція рішення. Тому калькулятор показує суму до врахування можливої пільги й не визначає її автоматично: податковий агент має перевірити обставини проживання, належний документ і чинну редакцію статті 268 ПКУ.']},
        {heading:'Як використовувати калькулятор туристичного збору для Києва',paragraphs:['Виберіть дату початку проживання, кількість розрахункових діб та окремо введіть гостей внутрішнього й в’їзного туризму. Розрахунок використовує ставку Київської міської територіальної громади та законодавчу базу 2026 року. Калькулятор не враховує ціну номера, оскільки у використаному рядку форми ДПС ставки подані без цінових рівнів. Результат є попередньою оцінкою; для податкового обліку звірте дані поселення та першоджерело.']},
      ]
    }
  },
  odesa:{
    title:'Туристичний збір в Одесі 2026: ставки й калькулятор | VDALO',
    description:'Туристичний збір в Одесі у 2026 році: ставка 0,5%, калькулятор і пояснення рішення №4314-VIII. ДПС повідомила про 1% для іноземців; перевіряємо період дії.',
    uniqueContent:'Підписана форма ДПС для Одеської міської територіальної громади на 2026 рік наводить ставки туристичного збору 0,50% для внутрішнього та 0,50% для в’їзного туризму. У 2026 році ДПС повідомила, що рішення №4314-VIII встановлює 1% для іноземців, залишає 0,50% для громадян України та визначає окрему умову для частини зареєстрованих ВПО. Податковий кодекс передбачає, що зміни місцевих ставок, які змінюють податкові зобов’язання, набирають чинності з початку бюджетного періоду. Це вказує на застосування нової ставки з наступного бюджетного року, а не посеред 2026-го; однак сторінка не підміняє повний текст рішення №4314-VIII. Калькулятор рахує лише підтверджений 2026 рік за ставками 0,50% / 0,50%, а період з 2027 року залишає для повторної перевірки офіційного акта й нової законодавчої бази.',
    seoBlock:{
      title:'Туристичний збір в Одесі у 2026 році: ставки, зміни та калькулятор',
      intro:'Одеса входить до Одеської міської територіальної громади. Підписана форма №6 ДПС на 2026 рік підтверджує 0,50% для внутрішнього й в’їзного туризму. ДПС повідомила про нову ставку 1% для іноземців за рішенням №4314-VIII. За загальним правилом Податкового кодексу зміни ставок, що змінюють зобов’язання, застосовуються з початку бюджетного періоду; тому калькулятор рахує весь 2026 рік за підтвердженими ставками, а правила на 2027 рік очікують повторної перевірки.',
      sections:[
        {heading:'Яка ставка туристичного збору в Одесі у 2026 році',paragraphs:['Підписана форма ДПС для Одеської міської територіальної громади зазначає у рядку туристичного збору 0,50% для внутрішнього та 0,50% для в’їзного туризму. Рядок посилається на рішення Одеської міської ради №4192-VIII від 30 січня 2019 року, дата застосування ставок у формі - 8 лютого 2019 року. Саме ці ставки калькулятор застосовує до проживання в межах 2026 року; це відсоток від визначеної законом бази, а не від ціни номера.']},
        {heading:'Що змінило рішення №4314-VIII і коли може діяти ставка 1%',paragraphs:['ГУ ДПС в Одеській області повідомило, що рішення ради №4314-VIII від 14.07.2026 встановлює для іноземців ставку 1%, залишає для громадян України 0,5% і передбачає окрему умову щодо зареєстрованих ВПО. У повідомленнях ДПС дату початку застосування не наведено. Водночас підпункт 12.4.3 Податкового кодексу визначає, що зміни ставок, які змінюють податкові зобов’язання, набирають чинності з початку бюджетного періоду. За цим загальним правилом ухвалене в липні 2026 року рішення не є підставою автоматично рахувати 1% із 14 липня; нова ставка може застосовуватися з наступного бюджетного періоду. Це висновок із загальної норми, а не цитата з повного рішення №4314-VIII. До перевірки його пункту про набрання чинності та оновленої форми ДПС сторінка показує окремо підтверджені ставки 2026 року й не переносить 1% на 2027 рік у калькулятор.']},
        {heading:'Скільки це становить за одну особу за добу',paragraphs:['Мінімальна заробітна плата на 1 січня 2026 року становить 8 647 грн. За підтвердженою ставкою 0,50% туристичний збір орієнтовно становить 43,24 грн за одну особу за одну розрахункову добу. Фактичну суму визначають за кількістю платників і розрахункових діб; законні звільнення потрібно перевірити окремо.']},
        {heading:'Яке рішення та територію охоплює сторінка',paragraphs:['Сторінка описує Одесу у складі Одеської міської територіальної громади з кодом КАТОТТГ UA51100270000073549; код міста - UA51100270010076757. У формі ДПС рішення №4192-VIII пов’язане з міською громадою та туристичною ставкою. Не переносіть це правило на інші міста Одеської області: кожна громада має власне рішення та код.']},
        {heading:'Пільги та окрема умова для зареєстрованих ВПО',paragraphs:['За повідомленням ДПС, зміни №4314-VIII передбачають, що окремі внутрішньо переміщені особи не є платниками збору, якщо вони взяті на облік як ВПО, тимчасово проживають у визначеному положенням місці, а адреса зазначена у довідці як фактичне місце проживання/перебування. Це короткий переказ повідомлення податкової, а не повна юридична перевірка всіх умов. Податковий агент має звірити повний чинний текст положення, статус гостя та документ. Загальні категорії звільнення передбачені також статтею 268.2.2 Податкового кодексу. Калькулятор не визначає пільгу автоматично.']},
        {heading:'Як користуватися калькулятором туристичного збору в Одесі',paragraphs:['Виберіть дату проживання у 2026 році, введіть кількість гостей внутрішнього та в’їзного туризму й число розрахункових діб. Для обох категорій калькулятор застосовує 0,50% від бази 8 647 грн на особу за розрахункову добу. Період 2027 року не розраховується, бо потрібні підтверджений текст рішення №4314-VIII, чинна на той рік ставка та нова законодавча база. Результат за 2026 рік є попередньою оцінкою до перевірки фактичних дат і можливих пільг.']},
        {heading:'Які запити допоможе перевірити ця сторінка',paragraphs:['Тут зібрана інформація для тих, хто шукає туристичний збір в Одесі, ставку туристичного збору в Одесі на 2026 рік, калькулятор збору для гостей і правила для іноземних туристів. Окремо пояснено рішення Одеської міської ради №4314-VIII, ставку 1%, про яку повідомила ДПС, період її можливого застосування та умову щодо окремих ВПО. Для інших міст Одеської області потрібна сторінка саме їхньої територіальної громади: місцеві ставки можуть відрізнятися.']},
      ]
    }
  },
  dnipro:{
    title:'Туристичний збір у Дніпрі 2026: ставки за ціною ночівлі',
    description:'Туристичний збір у Дніпрі у 2026 році: ставки за ціною ночівлі, пороги тарифів, форма №6 ДПС і калькулятор для гостей об’єкта розміщення.',
    uniqueContent:'Підписана форма №6 ДПС від 30 січня 2026 року пов’язує місто Дніпро з рішенням міської ради №5/6 зі змінами №6/40, кодом КАТОТТГ UA12020010010037010 і трьома ціновими рівнями. За ціни до 200 грн включно ставки становлять 0,35% / 0,35%; від 200 до 3 000 грн включно - 0,50% / 0,50%; понад 3 000 грн - 0,50% / 1,50%. Межа рівно 200 грн повторюється у двох діапазонах, тому калькулятор зупиняє розрахунок на цій ціні. У переданій робочій таблиці наведено 0,30% / 1,00%; для калькулятора використано ставки з підписаної форми, а відмінність пояснено. Правило обмежене датами 2026 року.',
    seoBlock:{
      title:'Туристичний збір у Дніпрі на 2026 рік: ставки, пороги та калькулятор',
      intro:'Для міста Дніпро форма №6 ДПС на 2026 рік зазначає три тарифні рівні залежно від вартості проживання однієї особи за одну добу. Відсоток застосовують до законодавчої бази туристичного збору, а не до повної ціни номера. Нижче наведені ставки, межі, які калькулятор обробляє автоматично, і випадок, для якого потрібне уточнення.',
      sections:[
        {heading:'Які ставки туристичного збору діють у Дніпрі у 2026 році',paragraphs:['Підписана форма №6 ДПС для Дніпровської міської ради наводить три цінові категорії. За вартості ночівлі однієї особи до 200 грн включно ставка становить 0,35% для внутрішнього і в’їзного туризму. Для ціни від 200 до 3 000 грн включно вказано 0,50% для обох категорій. Якщо проживання коштує понад 3 000 грн на особу за добу, застосовуються 0,50% для внутрішнього та 1,50% для в’їзного туризму.']},
        {heading:'Як обчислюється сума за ціновими категоріями',paragraphs:['Ціна проживання на одну особу за добу потрібна лише для вибору місцевої ставки. Сама сума збору обчислюється від бази, встановленої статтею 268 Податкового кодексу: мінімальної заробітної плати на 1 січня року, кількості платників і розрахункових діб. Для бази 8 647 грн за ціни 150 грн та ставки 0,35% попередній збір для одного платника становить 30,26 грн за добу. За ціни 500 грн і ставки 0,50% це 43,24 грн; значення до округлення обчислюється калькулятором.']},
        {heading:'Що робити з ціною рівно 200 гривень',paragraphs:['Форма описує перший рівень як ціну «до 200 грн включно», а наступний - як ціну «від 200 грн». Через повторення межі 200 грн обидва тарифи формально охоплюють однакове значення. Калькулятор не обирає ставку самостійно для ціни рівно 200 грн, а просить уточнити її у міської ради або податкового агента. За ціни нижче 200 грн чи вище цієї межі застосовується однозначний відповідний рівень.']},
        {heading:'Чому ставка відрізняється від попередніх довідкових даних',paragraphs:['* У попередніх довідкових даних для Дніпра зазначено 0,30% для внутрішнього та 1,00% для в’їзного туризму. Підписана форма №6 ДПС від 30 січня 2026 року містить детальні цінові категорії з іншими значеннями. Для попереднього розрахунку ми використовуємо категорійні ставки форми, а попередні значення показуємо як розбіжність у джерелах. Якщо міська рада оприлюднить чинний текст із іншою редакцією, дані слід переглянути.']},
        {heading:'Територія дії, період і перевірка перед нарахуванням',paragraphs:['Цей запис описує місто Дніпро з кодом КАТОТТГ UA12020010010037010 у складі Дніпровської міської територіальної громади. Форма №6 називає базове рішення №5/6 та зміни №6/40 і ставки, застосовні у 2026 році. Розрахунок обмежений періодом до 31 грудня 2026 року: для дат 2027 року потрібна нова перевірка місцевого рішення та форми ДПС. Калькулятор не визначає автоматично пільги; податковий агент перевіряє категорію гостя і належні документи окремо.']},
      ]
    }
  },
  zhytomyr:{
    title:'Туристичний збір у Житомирі: ставки 2026 | VDALO',
    description:'Туристичний збір у Житомирі на 2026 рік: ставки 0,25% і 2,5%, таблиця міськради, період дії та калькулятор за гостями й добами.',
    uniqueContent:'Офіційна таблиця Житомирської міської ради на 2026 рік для міста Житомира вказує ставку туристичного збору 0,25% для внутрішнього та 2,5% для в’їзного туризму. Окремо опублікована таблиця для села Вереси, тому цей міський розрахунок не слід автоматично застосовувати до села чи інших населених пунктів громади. Текст ради пов’язує порядок зі змінами до рішення №1361 від 7 лютого 2019 року. У робочому файлі ставки 0,30% / 1,00% відрізняються; калькулятор використовує показники міської таблиці на 2026 рік. Правило обмежене датами цього року.',
    rateConflict:{referenceRates:{domestic:0.3,inbound:1},basis:'Передані довідкові значення не збігаються з офіційною таблицею Житомирської міської ради на 2026 рік.'},
    seoBlock:{
      title:'Туристичний збір у Житомирі на 2026 рік: ставки та розрахунок',
      intro:'Міська таблиця ставок Житомирської ради на 2026 рік зазначає окремі значення для внутрішнього й в’їзного туризму. Сторінка стосується міста Житомира; для села Вереси міськрада опублікувала окремий документ, тому його правила тут не підміняємо. Нижче наведено спосіб попередньо оцінити збір і першоджерела для перевірки.',
      sections:[
        {heading:'Ставки туристичного збору в Житомирі у 2026 році',paragraphs:['Офіційна таблиця Житомирської міської ради для території міста на 2026 рік встановлює 0,25% для внутрішнього та 2,5% для в’їзного туризму. Рішення №1361 від 7 лютого 2019 року, на яке посилається міський довідковий матеріал, пов’язує збір з мінімальною зарплатою на 1 січня звітного року. У 2026 році база становить 8 647 грн за одну особу за розрахункову добу.']},
        {heading:'Скільки це становить за одну особу на добу',paragraphs:['За бази 8 647 грн ставка 0,25% дає 21,6175 грн за одного платника внутрішнього туризму за добу, або 21,62 грн після округлення. Ставка 2,5% для в’їзного туризму дає 216,175 грн, або 216,18 грн. Округлення у прикладах виконується після множення ставки на гостей і розрахункові доби, тому підсумок для кількох ночівель рахуйте калькулятором.']},
        {heading:'Місто Житомир і село Вереси мають окремі таблиці',paragraphs:['На сторінці міськради «Ставки податків у 2026 році» окремо перелічені документ для міста Житомира та документ для села Вереси. Цей калькулятор використовує лише рядок міста з кодом КАТОТТГ UA18040190010057814 у складі Житомирської міської територіальної громади UA18040190000029215. Для об’єкта у Вересах або в іншому населеному пункті потрібно перевірити відповідну таблицю й адресу окремо; ставка міста не поширюється на них автоматично.']},
        {heading:'Чому попередні довідкові ставки відрізняються',paragraphs:['* У попередніх довідкових даних для Житомира вказано 0,30% / 1,00%. Таблиця Житомирської міської ради на 2026 рік для міста показує 0,25% / 2,5%, а офіційний текст ради пов’язує ставки з рішенням №1361. Для калькулятора використано міську таблицю на 2026 рік. Перед розрахунком перевіряйте адресу об’єкта та категорію гостя.']},
        {heading:'Актуальність правила та межі калькулятора',paragraphs:['Поточну ставку звірено 18 жовтня 2026 року за міськими документами на 2026 рік. Калькулятор приймає дати проживання з 1 січня до 31 грудня 2026 року; для іншого року потрібне окреме підтвердження ставки й річної бази. Він показує попередню суму та не визначає автоматично, чи має гість право на законне звільнення. Підставу й підтвердні документи перевіряє податковий агент за статтею 268 Податкового кодексу.']},
      ]
    }
  },
  berehove:{
    title:'Туристичний збір у Береговому у 2026 році: ставка та калькулятор',
    description:'Ставка туристичного збору у Береговому на 2026 рік: 0,25% для внутрішнього та в’їзного туризму. Форма ДПС, рішення громади й попередній розрахунок.',
    uniqueContent:'Для міста Берегове у складі Берегівської міської територіальної громади форма №6 ДПС у наборі місцевих ставок на 2026 рік наводить 0,25% для внутрішнього та 0,25% для в’їзного туризму. У формі вказано базове рішення №794 від 9 липня 2021 року та дату застосування 1 січня 2022 року. Місто й громада ідентифіковані окремими кодами КАТОТТГ. Калькулятор на цій сторінці використовує підтверджене правило лише для розрахунків 2026 року; до нового бюджетного року ставку потрібно звірити повторно.',
    seoBlock:{
      title:'Туристичний збір у Береговому у 2026 році: ставка і розрахунок',
      intro:'Для міста Берегове у Берегівській міській територіальній громаді форма №6 ДПС у наборі ставок на 2026 рік підтверджує 0,25% для внутрішнього та в’їзного туризму. Нижче можна оцінити суму за кількістю гостей і розрахункових діб. Дані звірені 14 жовтня 2026 року; перед 2027 роком ставку потрібно перевірити за новим рішенням або оновленими офіційними даними.',
      sections:[
        {heading:'Яка ставка туристичного збору діє у Береговому у 2026 році',paragraphs:['Форма №6 ДПС для Берегівської міської територіальної громади зазначає ставку 0,25% для внутрішнього і 0,25% для в’їзного туризму. У документі прямо назване місто Берегове та код громади UA21020030000019624. Ставка застосовується до визначеної Податковим кодексом бази, а не як частка повної ціни номера.']},
        {heading:'Рішення громади та період, на який перевірено дані',paragraphs:['У формі ДПС наведене базове рішення Берегівської міської ради №794 від 9 липня 2021 року. Дата застосування ставок у таблиці туристичного збору зазначена як 1 січня 2022 року. Для цього розрахункового інструмента правило обмежене 2026 роком: оприлюднений ДПС набір відображає дані ІАС LOGICA станом на 30 січня 2026 року. Це не прогноз незмінності ставки у наступному році.']},
        {heading:'Скільки це становить за одну особу за одну добу',paragraphs:['Законодавча база для 2026 року становить 8 647 грн. За ставкою 0,25% попередній збір дорівнює 21,6175 грн, або 21,62 грн після округлення до копійок за одну особу за одну розрахункову добу. Наприклад, для двох гостей і двох діб загальна орієнтовна сума становить 86,47 грн до перевірки можливих законних звільнень.']},
        {heading:'Як скористатися калькулятором туристичного збору',paragraphs:['Виберіть категорію туризму, введіть кількість гостей і розрахункових діб. Калькулятор застосує ставку Берегівської громади 0,25% та базу 2026 року. Розрахункова доба визначається правилами Податкового кодексу й розрахунковими годинами об’єкта, а не просто календарною датою заїзду чи виїзду. Порівняйте результат із фактичними даними заселення та обліку.']},
        {heading:'Які дані перевірити перед нарахуванням',paragraphs:['Сторінка стосується міста Берегове з кодом КАТОТТГ UA21020030010083215 у складі Берегівської міської територіальної громади. Якщо об’єкт розміщення знаходиться в іншому населеному пункті громади, перевірте його адресу та застосовність відповідного рядка офіційної форми. Калькулятор не встановлює автоматично право гостя на пільгу. Перевірте підтвердні документи й окремо звірте нові місцеві рішення перед використанням розрахунку за 2027 рік.']},
      ]
    }
  },
  uzhhorod:{
    title:'Туристичний збір в Ужгороді у 2026 році: ставки та калькулятор',
    description:'Туристичний збір в Ужгороді у 2026 році: 0,5% для внутрішнього та 1% для в’їзного туризму. Форма ДПС, розбіжності й калькулятор.',
    uniqueContent:'Для Ужгорода підписана форма №6 ДПС на 2026 рік наводить універсальні ставки 0,50% для внутрішнього та 1,00% для в’їзного туризму. У ній названо рішення міської ради №2333 від 8 липня 2025 року, місто з кодом КАТОТТГ UA21100230010016545 та громаду UA21100230000083101. Попередній довідковий набір містив 0,40% / 1,00%, а форма поряд із універсальним рядком містить цінові критерії та нульові значення за окремими типами житла. Примітки форми кажуть, що за заповнення універсального рядка відповідну деталізацію не заповнюють. Оригінальний акт ради не вдалося незалежно прочитати для розбору цих рядків. Сторінка позначає розбіжності зірочкою; калькулятор бере універсальний рядок 1.0.0 ДПС за 2026 рік, не трактує нульові рядки як звільнення і не моделює окремі цінові діапазони.',
    seoBlock:{
      title:'Туристичний збір в Ужгороді у 2026 році: ставки, рішення і розрахунок',
      intro:'На 2026 рік підписана форма №6 ДПС для Ужгорода вказує універсальну ставку 0,50% для внутрішнього та 1,00% для в’їзного туризму. Тут можна попередньо розрахувати збір, побачити рішення громади та розібрати розбіжність із попередніми довідковими даними.',
      sections:[
        {heading:'Які ставки туристичного збору діють в Ужгороді у 2026 році',paragraphs:['Універсальний рядок 1.0.0 у підписаній формі №6 ДПС вказує для Ужгородської міської територіальної громади 0,50% для внутрішнього та 1,00% для в’їзного туризму. Форма пов’язує ставки з рішенням міської ради №2333 від 08.07.2025 та застосуванням з 01.01.2026. Для законодавчої бази 8 647 грн це орієнтовно 43,24 грн та 86,47 грн за одну особу за одну розрахункову добу після округлення до копійок.']},
        {heading:'Зірочка до ставки: що суперечить у формі ДПС',paragraphs:['* Форма №6 наводить універсальний рядок 1.0.0 зі ставками 0,50% / 1,00%, але поруч містить цінові критерії та нульові значення за окремими типами розміщення. Примітка до форми вказує, що за універсального рядка не заповнюють деталізовані рядки. Повний текст рішення №2333 з додатками окремо прочитати не вдалося, тому ми не переносимо ці рядки як окрему шкалу ставок чи звільнення. У калькуляторі застосовуємо універсальний рядок 1.0.0, який підписана форма пов’язує з Ужгородом і датою 01.01.2026.']},
        {heading:'Чому довідкові джерела показують різні ставки',paragraphs:['Попередній довідковий набір для Ужгорода містив 0,40% для внутрішнього та 1,00% для в’їзного туризму. Підписана форма ДПС за 2026 рік вказує універсальні 0,50% / 1,00%, рішення №2333 і дату застосування 01.01.2026. Для розрахунку беремо універсальний рядок чинної форми ДПС. Розбіжність внутрішньої ставки й неузгодженість додаткових рядків пояснюємо відкрито. Перед використанням для 2027 року треба перевірити нове рішення та оновлену форму.']},
        {heading:'Як порахувати туристичний збір для проживання в Ужгороді',paragraphs:['Для попередньої оцінки введіть кількість гостей внутрішнього та в’їзного туризму окремо, а також розрахункові доби. Формула для сталої ставки: 8 647 грн × місцевий відсоток × кількість гостей відповідної категорії × кількість діб. Наприклад, для одного гостя внутрішнього туризму на дві доби виходить 86,47 грн; для одного гостя в’їзного туризму на дві доби 172,94 грн. Калькулятор підсумовує загальну суму і не встановлює право гостя на законне звільнення.']},
        {heading:'Територія дії та період перевірки',paragraphs:['Сторінка стосується міста Ужгород з кодом КАТОТТГ UA21100230010016545 у складі Ужгородської міської територіальної громади з кодом UA21100230000083101. Форма ДПС зазначає застосування ставок з 1 січня 2026 року. Це довідка для розрахунків за 2026 рік, а не підтвердження незмінності ставки надалі. Перед використанням для 2027 року звірте нове рішення міської ради та її форму в наборі ДПС.']},
      ]
    }
  },
  slavsko:{
    title:'Туристичний збір у Славську у 2026 році: ставка та калькулятор',
    description:'Туристичний збір у Славську у 2026 році: 0,2% для внутрішнього та в’їзного туризму. Форма ДПС, пояснення розбіжності й калькулятор.',
    uniqueContent:'У підписаній формі №6 ДПС на 2026 рік для селища Славсько вказана універсальна ставка 0,20% для внутрішнього та 0,20% для в’їзного туризму. Форма називає рішення №1805 від 7 липня 2022 року, дату застосування 1 січня 2026 року, код селища UA46100210010024884 і код Славської громади UA46100210000027970. Попередній довідковий набір містив 0,50% / 1,00%. У формі є нульові рядки за типами житла, але примітка каже, що деталізацію не заповнюють разом з універсальним рядком. Оригінальний акт ради не вдалося незалежно прочитати, це обмеження сторінка позначає зірочкою. Калькулятор бере універсальні 0,20% / 0,20% з форми й рахує тільки в межах 2026 року.',
    seoBlock:{
      title:'Туристичний збір у Славську у 2026 році: ставка, рішення та розрахунок',
      intro:'Для селища Славсько підписана форма №6 ДПС на 2026 рік наводить універсальну ставку туристичного збору 0,20% для внутрішнього та в’їзного туризму. Нижче можна розрахувати суму, переглянути коди КАТОТТГ і зрозуміти, чому довідкові джерела показують різні ставки.',
      sections:[
        {heading:'Яка ставка туристичного збору діє у Славську на 2026 рік',paragraphs:['Універсальний рядок 1.0.0 підписаної форми №6 ДПС для Славської селищної громади вказує 0,20% для внутрішнього і 0,20% для в’їзного туризму. Форма пов’язує дані з рішенням №1805 від 07.07.2022 та застосуванням з 01.01.2026. За мінімальної зарплати 8 647 грн це становить орієнтовно 17,29 грн за одну особу за одну розрахункову добу.']},
        {heading:'Зірочка до ставки: як читати суперечливі рядки форми',paragraphs:['* Форма №6 поруч з універсальною ставкою 0,20% / 0,20% містить нульові рядки для типів житла. Примітка форми каже, що рядок 1.0.0 застосовується для однакових ставок для всіх об’єктів і що за його заповнення розділ 1.1 не заповнюють. Тому нулі не вважаємо окремими нульовими тарифами чи звільненням. Оригінал рішення №1805 з додатком незалежно прочитати не вдалося, це обмеження зазначаємо відкрито. Для розрахунку за 2026 рік обрано універсальний рядок 1.0.0 підписаної форми ДПС.']},
        {heading:'Чому довідкові джерела показують різні ставки',paragraphs:['Попередній довідковий набір містив 0,50% для внутрішнього та 1,00% для в’їзного туризму. Ці значення суперечать універсальному рядку підписаної форми ДПС за 2026 рік. Для цього калькулятора пріоритет має офіційне подання громади з територіальною прив’язкою та датою застосування; тому показуємо 0,20% / 0,20%, а альтернативні значення пояснюємо явно. Перед наступним податковим роком потрібно звірити нове рішення та нову форму, не переносити поточні відсотки автоматично.']},
        {heading:'Приклад розрахунку для гостей у Славську',paragraphs:['Для двох гостей і двох розрахункових діб за ставкою 0,20% сума становить 8 647 × 0,20% × 2 × 2 = 69,18 грн після округлення загального результату до копійок. Для змішаної групи внесіть кількість гостей за кожною категорією окремо. Результат є попереднім: калькулятор не визначає можливі законні звільнення та не замінює дані заселення в обліку.']},
        {heading:'Яку територію охоплює сторінка і коли перевіряти дані',paragraphs:['Ця сторінка описує селище Славсько з кодом КАТОТТГ UA46100210010024884 у складі Славської селищної територіальної громади UA46100210000027970. У формі ДПС для рішення №1805 зазначена дата застосування ставки 01.01.2026. Перевірку виконано 14 жовтня 2026 року; дата наступного планового перегляду перед 2027 роком є нагадуванням, а не твердженням про гарантовану зміну. Для іншого населеного пункту громади потрібно звірити конкретну адресу та відповідний рядок офіційного документа.']},
      ]
    }
  },
  cherkasy:{
    title:'Туристичний збір у Черкасах у 2026 році: ставки та калькулятор',
    description:'Ставки туристичного збору в Черкасах на 2026 рік: 0,5% для внутрішнього та 5% для в’їзного туризму. Форма ДПС, джерела міськради й калькулятор.',
    uniqueContent:'Для Черкаської міської територіальної громади офіційна форма №6 ДПС на 2026 рік наводить 0,50% для внутрішнього та 5,00% для в’їзного туризму. Ці ставки також зазначені у прогнозі бюджету Черкаської міської ради на 2026–2028 роки. У 2022 році рада тимчасово встановила нульову ставку на період воєнного стану, а у звіті за 2024 рік повідомила про відновлення справляння збору. Сторінка стосується міста Черкаси й показує інформаційний розрахунок лише для правил 2026 року.',
    seoBlock:{
      title:'Туристичний збір у Черкасах у 2026 році: ставки, приклад і порядок розрахунку',
      intro:'Для місця тимчасового розміщення у місті Черкаси ставку туристичного збору потрібно визначати за рішеннями Черкаської міської ради та підтвердженими даними для Черкаської міської територіальної громади. Форма №6 ДПС за 2026 рік і прогноз бюджету міськради наводять 0,50% для внутрішнього та 5,00% для в’їзного туризму. Калькулятор нижче дає попередню оцінку за кількістю гостей і розрахункових діб.',
      sections:[
        {heading:'Ставки туристичного збору у Черкасах на 2026 рік',paragraphs:['У формі №6 ДПС для Черкаської міської територіальної громади на 2026 рік зазначені ставки 0,50% для внутрішнього й 5,00% для в’їзного туризму. Форма пов’язує дані з рішенням Черкаської міської ради №2-4690 від 27 червня 2019 року та кодом громади UA71080490000022110. Прогноз бюджету Черкаської міської ради на 2026–2028 роки також називає 0,5% і 5% та посилається на те саме базове рішення. Ці відсотки застосовують до законодавчої бази збору, а не безпосередньо до повної вартості проживання.']},
        {heading:'Скільки становить збір за одну розрахункову добу',paragraphs:['Базою для розрахунку у 2026 році є мінімальна заробітна плата, встановлена на 1 січня, 8 647 грн. За внутрішньої ставки 0,50% попередня сума дорівнює 43,235 грн за одну особу за одну розрахункову добу, або 43,24 грн після округлення. За в’їзної ставки 5,00% це 432,35 грн. Кількість гостей і розрахункових діб змінює загальний результат; якщо вартість розміщення або статус гостя потребує правової оцінки, її слід виконати окремо.']},
        {heading:'Як порахувати туристичний збір у Черкасах',paragraphs:['Для попередньої оцінки оберіть категорію туризму, укажіть кількість осіб та розрахункових діб. Формула для фіксованої ставки: мінімальна зарплата на 1 січня року × місцева ставка × кількість гостей × кількість розрахункових діб. Введіть дані в калькулятор, щоб отримати суму для сценарію проживання. Одна розрахункова доба визначається правилами Податкового кодексу та розрахунковими годинами об’єкта. Результат є інформаційним і не замінює облік фактичних даних гостя чи консультацію з податкових обставин.']},
        {heading:'Що відомо про зміну ставки під час воєнного стану',paragraphs:['Черкаська міська рада у березні 2022 року встановила нульову ставку туристичного збору на період воєнного стану. У звіті про виконання бюджету за 2024 рік рада повідомила, що справляння туристичного збору було відновлено у 2024 році. У матеріалах міськради для планування бюджету на 2026 рік наведені ставки 0,5% і 5%, а форма ДПС за 2026 рік відображає ці самі значення для громади. Тож калькулятор на цій сторінці застосовує правило тільки до проживання у 2026 році. Для інших років потрібно перевіряти відповідний період і нові рішення.']},
        {heading:'Перевірте адресу, громаду та документи',paragraphs:['Ця сторінка призначена для міста Черкаси, код населеного пункту КАТОТТГ UA71080490010015879. У формі ДПС ставка наведена для Черкаської міської територіальної громади з кодом UA71080490000022110. Якщо об’єкт розташований в іншому населеному пункті, не застосовуйте міський розрахунок автоматично: звірте його адресу з громадою та місцевим рядком ставок. Калькулятор не встановлює, чи має конкретний гість законну пільгу. Податковий агент має перевірити категорію особи та підтвердні документи за чинними правилами.']},
        {heading:'Офіційні джерела та межі цієї довідки',paragraphs:['Ставки звірено з підписаною формою №6 ДПС для Черкаської громади у наборі на 2026 рік і з прогнозом бюджету Черкаської міської ради на 2026–2028 роки. Архів ради перелічує рішення №2-4690 та зміни до нього, а звіт за 2024 рік фіксує відновлення збору після нульової ставки у 2022–2023 роках. ДПС зазначає, що набір ставок на 2026 рік сформований за даними ІАС LOGICA станом на 30 січня 2026 року. Це довідковий калькулятор, а не індивідуальна податкова консультація; пільги та обставини конкретного розміщення потрібно перевіряти окремо.']},
      ]
    }
  },
  chernivtsi:{
    title:'Туристичний збір у Чернівцях у 2026 році: ставка та калькулятор',
    description:'Ставки туристичного збору в Чернівцях на 2026 рік: 0,3% для внутрішнього та в’їзного туризму. Офіційне джерело ДПС і калькулятор.',
    uniqueContent:'На 2026 рік підписана форма ДПС для міста Чернівці вказує однакову ставку туристичного збору 0,3% для внутрішнього та в’їзного туризму. Дані стосуються міста з кодом КАТОТТГ UA73060610010033137, а не автоматично всіх населених пунктів Чернівецької міської громади.',
    seoBlock:{title:'Туристичний збір у Чернівцях у 2026 році: ставка, розрахунок і територія дії',intro:'Для міста Чернівці у 2026 році підписана форма ДПС зазначає ставку туристичного збору 0,30% для внутрішнього та 0,30% для в’їзного туризму. Нижче можна попередньо порахувати суму за кількістю гостей і розрахункових діб та перевірити офіційні джерела. Дані міського рядка стосуються населеного пункту з кодом КАТОТТГ UA73060610010033137.',sections:[
      {heading:'Ставки туристичного збору у Чернівцях на 2026 рік',paragraphs:['Підписана форма №6 ДПС для 2026 року вказує для міста Чернівці ставку 0,30% для внутрішнього й 0,30% для в’їзного туризму. У формі зазначене базове рішення Чернівецької міської ради №1635 від 25 червня 2015 року зі змінами №80, №581, №1289, №1619 та №282. Ставка в цьому довіднику обмежена періодом з 1 січня до 31 грудня 2026 року.']},
      {heading:'Як попередньо розрахувати туристичний збір',paragraphs:['Для довідкового прикладу база 2026 року становить 8 647 грн, а ставка 0,30% дорівнює 25,941 грн за одного гостя за одну розрахункову добу. За трьох гостей внутрішнього туризму протягом двох розрахункових діб попередня сума становить 8 647 × 0,30% × 3 × 2 = 155,646 грн, тобто 155,65 грн після округлення підсумку до копійок. В’їзний туризм має таку саму ставку.']},
      {heading:'На яку територію поширюється міська ставка',paragraphs:['Ставку на цій сторінці прив’язано до міста Чернівці з кодом КАТОТТГ UA73060610010033137. В офіційній формі ДПС інші населені пункти громади подані окремими рядками, тому міський відсоток не слід автоматично застосовувати до адрес у Коровії, Чорнівці чи інших населених пунктах. Для об’єкта за межами міста перевірте відповідний рядок громади та рішення, що стосується його адреси.']},
      {heading:'Офіційне підтвердження та межі довідки',paragraphs:['Ставки й міський код звірено з підписаною формою №6 ДПС для 2026 року, поданою Чернівецькою міською радою. Форма посилається на базове рішення №1635 та перелічує зміни до нього; портал ради надає пошук прийнятих актів за номером і датою. Сторінка показує інформаційний розрахунок, не визначає пільгу конкретного гостя й не замінює перевірку адреси, документів та актуального законодавства.']},
    ]},
  },
  'ivano-frankivsk':{
    title:'Туристичний збір в Івано-Франківську у 2026 році: ставки та калькулятор',
    description:'Ставки туристичного збору в Івано-Франківську на 2026 рік: рішення міської ради №140-43, офіційні дані ДПС та калькулятор за категорією гостей і кількістю діб.',
    uniqueContent:'У Івано-Франківській міській територіальній громаді рішення №140-43 встановлює туристичний збір у розмірі 0,3% для внутрішнього та 1% для в’їзного туризму. Ці ставки наведені також у підписаній формі ДПС у зведеному наборі ставок на 2026 рік. Калькулятор використовує мінімальну заробітну плату на 1 січня відповідного року, категорію гостя та кількість розрахункових діб. Для 2026 року розрахункова база становить 8 647 грн. Результат є інформаційним і не визначає автоматично право на звільнення.',
    seoBlock:{
      title:'Туристичний збір в Івано-Франківську у 2026 році: ставки й розрахунок',
      intro:'Для готелю, апартаментів чи іншого місця тимчасового проживання в Івано-Франківську застосовується ставка Івано-Франківської міської територіальної громади. Рішення №140-43 від 20 червня 2024 року встановлює 0,3% для внутрішнього та 1% для в’їзного туризму. Зведена форма ДПС на 2026 рік підтверджує ці ставки для громади з кодом КАТОТТГ UA26040190000081578.',
      sections:[
        {heading:'Які ставки туристичного збору діють в Івано-Франківську',paragraphs:['Рішення Івано-Франківської міської ради №140-43 встановлює ставку 0,3% для внутрішнього туризму та 1% для в’їзного туризму. Вони визначаються як відсоток мінімальної заробітної плати, встановленої на 1 січня звітного року, за одну особу за одну добу тимчасового розміщення. Форма ДПС у наборі ставок на 2026 рік показує ті самі відсотки для Івано-Франківської міської громади.']},
        {heading:'Як розрахувати суму збору за проживання',paragraphs:['Для попереднього розрахунку оберіть категорію туризму, кількість гостей і кількість розрахункових діб. У 2026 році мінімальна заробітна плата на 1 січня становить 8 647 грн, тому орієнтовна сума за одну особу за одну добу становить 25,94 грн для внутрішнього та 86,47 грн для в’їзного туризму. Калькулятор окремо підсумовує групи гостей і округлює загальну суму до копійок.']},
        {heading:'Як визначити, що місце розміщення належить до цієї громади',paragraphs:['Перевірте адресу об’єкта, а не лише поштове позначення «Івано-Франківськ». У довіднику місто має код КАТОТТГ UA26040190010045761, а Івано-Франківська міська територіальна громада має код UA26040190000081578. Якщо об’єкт розміщений в іншому населеному пункті громади, окремо звірте його адресу та громаду перед використанням розрахунку.']},
        {heading:'Що перевірити готелю перед нарахуванням',paragraphs:['Зіставте дату проживання з періодом дії місцевого рішення, визначте категорію туриста та кількість розрахункових діб за фактичними даними поселення. Стаття 268 Податкового кодексу передбачає умови справляння і випадки, коли збір не справляється; калькулятор не встановлює статус гостя та не перевіряє підтвердні документи. Для обліку, звітності й конкретного випадку використовуйте текст рішення, Податковий кодекс та актуальні роз’яснення ДПС.']},
        {heading:'Офіційне рішення та дата перевірки ставок',paragraphs:['Ставки звірено з рішенням Івано-Франківської міської ради №140-43 від 20.06.2024 та підписаною формою громади в офіційному наборі ДПС на 2026 рік. Рішення встановлює застосування ставок з 01.01.2025 і позначене міською радою як чинне. У формі ДПС зазначені код громади та ставки 0,30% і 1,00%. Джерела наведені поруч із калькулятором; довідка перевірена 14 жовтня 2026 року.']},
      ],
    },
  },
  kolomyya:{
    title:'Туристичний збір у Коломиї у 2026 році: ставки та калькулятор',
    description:'Туристичний збір у Коломиї у 2026 році: 0,5% для внутрішнього й в’їзного туризму. Рішення громади, дані ДПС і калькулятор за гостями та добами.',
    uniqueContent:'Для міста Коломия ставка туристичного збору визначається рішенням Коломийської міської ради для всієї Коломийської територіальної громади. Положення, затверджене рішенням №781-16/2021, встановлює 0,5% для внутрішнього та 0,5% для в’їзного туризму від мінімальної заробітної плати на 1 січня звітного року. У 2026 році законодавча база для прикладів становить 8 647 грн. Калькулятор оцінює суму за кількістю гостей, категорією туризму та розрахункових діб.',
    seoBlock:{
      title:'Туристичний збір у Коломиї у 2026 році: ставка громади та розрахунок',
      intro:'Для міста Коломия застосовується правило Коломийської міської територіальної громади. Чинне Положення встановлює однакову ставку 0,5% для внутрішнього та в’їзного туризму. Рішення визначає базу як мінімальну заробітну плату на 1 січня звітного року за одну особу за кожну добу тимчасового розміщення.',
      sections:[
        {heading:'Яка ставка туристичного збору діє у Коломиї',paragraphs:['Пункт 3.1 Положення про туристичний збір, затвердженого рішенням міської ради №781-16/2021 від 24 червня 2021 року, встановлює 0,5% для внутрішнього і 0,5% для в’їзного туризму. Рішення набрало чинності 1 січня 2022 року. Міська рада застосовує це Положення на території Коломийської громади.']},
        {heading:'Як рахувати суму за одну добу проживання',paragraphs:['У 2026 році мінімальна заробітна плата на 1 січня становить 8 647 грн. За ставки 0,5% сума для однієї особи за одну розрахункову добу дорівнює 43,235 грн до округлення, або 43,24 грн після округлення до копійок. Сума залежить від числа гостей і розрахункових діб. Вартість номера не є базою для множення ставки.']},
        {heading:'Що врахувати готелю та іншому місцю розміщення',paragraphs:['Перед розрахунком перевірте, що адреса об’єкта належить саме до Коломийської міської територіальної громади, і визначте категорію туризму гостя за Податковим кодексом. Положення ради містить перелік випадків, коли особа не є платником збору. Для застосування такого винятку перевіряйте його умови та необхідні документи окремо.']},
        {heading:'Які офіційні дані використано',paragraphs:['Ставку взято з Положення Коломийської міської ради №781-16/2021, чинного з 1 січня 2022 року. Офіційна сторінка міськради зі ставками, чинними з 1 січня 2026 року, посилається на це рішення. Форма ДПС за 2025 рік показує такі самі ставки, а бюджетний прогноз, схвалений громадою у 2026 році, називає рішення серед нормативної бази місцевих податків і зборів. Окремої форми ставок ДПС за 2026 рік для Коломиї серед перевірених джерел не знайдено. КАТОТТГ міста й громади наведено окремо, щоб не переносити ставку на інші громади області.']},
      ],
    },
  },
  chernihiv:{
    title:'Туристичний збір у Чернігові у 2026 році: ставки та калькулятор',
    description:'Ставка туристичного збору в Чернігові на 2026 рік становить 0,5% для внутрішнього та в’їзного туризму. Рішення №18/VIII-19 і розрахунок.',
    uniqueContent:'Для Чернігівської міської територіальної громади туристичний збір на 2026 рік становить 0,5% як для внутрішнього, так і для в’їзного туризму. Міськрада вказує рішення №18/VIII-19 та КАТОТТГ громади у своїй таблиці ставок. Калькулятор допомагає попередньо оцінити суму за базою Податкового кодексу, категорією гостя та кількістю розрахункових діб.',
    seoBlock:{title:'Туристичний збір у Чернігові у 2026 році: ставка громади та розрахунок',intro:'У Чернігові на 2026 рік для внутрішнього та в’їзного туризму встановлено однакову ставку 0,5%. Чинні відомості Чернігівська міська рада публікує разом із посиланням на рішення №18/VIII-19 та кодом Чернігівської міської територіальної громади. Нижче пояснюємо базовий розрахунок і дані, які варто звірити перед нарахуванням збору.',sections:[
      {heading:'Ставки туристичного збору у Чернігові на 2026 рік',paragraphs:['Офіційна таблиця Чернігівської міської ради на 2026 рік зазначає 0,5% для внутрішнього та 0,5% для в’їзного туризму. Обидві ставки наведено для Чернігівської міської територіальної громади з кодом КАТОТТГ UA74100390000073425. Рішення ради №18/VIII-19 набрало чинності 1 січня 2023 року.']},
      {heading:'Як розрахувати туристичний збір для проживання у Чернігові',paragraphs:['Для розрахунку за 2026 рік використовується база 8 647 грн, визначена мінімальною зарплатою на 1 січня. За ставки 0,5% попередня сума становить 43,24 грн за одну особу за одну розрахункову добу. Калькулятор множить базу на ставку, кількість гостей кожної категорії та число розрахункових діб, після чого округлює загальну суму до копійок.']},
      {heading:'Перевірка адреси та меж громади',paragraphs:['Сторінка стосується міста Чернігів з кодом КАТОТТГ UA74100390010054825 у складі Чернігівської міської територіальної громади UA74100390000073425. Таблиця ставок міськради на 2026 рік застосовує ставку до громади. Якщо об’єкт розташований в іншому населеному пункті громади, звірте адресу та сферу дії місцевого рішення перед нарахуванням.']},
      {heading:'Що потрібно звірити перед нарахуванням',paragraphs:['Переконайтеся, що адреса місця розміщення належить до Чернігівської міської територіальної громади, а проживання припадає на період дії відповідного рішення. Оберіть правильну категорію туризму та визначте кількість розрахункових діб за правилами статті 268 Податкового кодексу. Калькулятор не перевіряє документи гостя й автоматично не підтверджує право на звільнення від збору.']},
      {heading:'Офіційні джерела туристичного збору в Чернігові',paragraphs:['Основне місцеве рішення - акт Чернігівської міської ради №18/VIII-19 від 30 червня 2022 року. Для ставки на 2026 рік звіряйте окрему таблицю, яку рада оприлюднила на офіційній сторінці туристичного збору. У документах зазначені дата застосування 1 січня 2023 року, код громади та однакові ставки для внутрішнього й в’їзного туризму.']},
    ]},
  },
  rivne:{
    title:'Туристичний збір у Рівному у 2026 році: ставки та калькулятор',
    description:'Ставки туристичного збору в Рівному на 2026 рік: 0,25% для внутрішнього та 1% для в’їзного туризму. Рішення №783, період дії та розрахунок.',
    uniqueContent:'Для міста Рівне рішення міської ради №783 встановлює туристичний збір за кожну розрахункову добу проживання. Підписана форма ДПС на 2026 рік підтверджує ставки 0,25% для внутрішнього та 1% для в’їзного туризму, а також коди Рівненської міської громади й самого міста. Калькулятор застосовує ці ставки до бази, визначеної Податковим кодексом, та кількості гостей і розрахункових діб.',
    seoBlock:{title:'Туристичний збір у Рівному у 2026 році: ставки, база та приклад розрахунку',intro:'Туристичний збір у місті Рівне регулює рішення Рівненської міської ради №783 від 24 червня 2021 року. Для 2026 року підписана форма ДПС підтверджує 0,25% для внутрішнього та 1% для в’їзного туризму. Ця сторінка пояснює, як визначити попередню суму за кількістю гостей і розрахункових діб.',sections:[
      {heading:'Ставки туристичного збору в Рівному на 2026 рік',paragraphs:['Рішення №783 встановлює ставку 0,25% для внутрішнього туризму та 1,0% для в’їзного туризму за кожну добу тимчасового розміщення. Форма ДПС на 2026 рік повторює ці ставки для Рівненської міської територіальної громади та міста Рівне. Відсотки застосовують до бази туристичного збору, визначеної статтею 268 Податкового кодексу, а не до повної ціни номера.']},
      {heading:'Як працює калькулятор туристичного збору',paragraphs:['Для попередньої оцінки оберіть категорію туризму, введіть кількість гостей та розрахункових діб. Калькулятор множить базу 8 647 грн, установлену для розрахунку у 2026 році, на ставку громади, кількість гостей і діб. За однієї особи на одну добу це орієнтовно 21,62 грн для внутрішнього туризму та 86,47 грн для в’їзного. Сума за кілька гостей округлюється до копійок після підсумкового розрахунку.']},
      {heading:'Приклад розрахунку для проживання у Рівному',paragraphs:['Якщо один гість внутрішнього туризму проживає дві розрахункові доби, приклад суми такий: 8 647 × 0,25% × 1 гість × 2 доби = 43,235 грн, тобто 43,24 грн після округлення до копійок. Для двох гостей в’їзного туризму на такий самий період: 8 647 × 1% × 2 × 2 = 345,88 грн. Це інформаційна оцінка до перевірки категорії гостя й можливих законних звільнень.']},
      {heading:'Період дії рішення та межі розрахунку',paragraphs:['Рішення №783 набрало чинності 1 січня 2022 року. У формі ДПС на 2026 рік зазначено ту саму дату застосування ставок, а для Рівненської громади повторено базове рішення №783. Адресу об’єкта потрібно зіставити саме з територією Рівненської міської громади. Калькулятор не визначає право на звільнення від збору й не замінює перевірку первинних документів податковим агентом.']},
      {heading:'Офіційні джерела туристичного збору в Рівному',paragraphs:['Першоджерело ставок - рішення Рівненської міської ради №783 від 24 червня 2021 року. Його положення встановлює ставки та дату набрання чинності, а підписана форма №6 ДПС на 2026 рік підтверджує ставки й територіальні коди Рівненської громади та міста. Посилання на обидва документи наведено на цій сторінці.']},
    ]},
  },
  zaporizhzhya:{
    title:'Туристичний збір у Запоріжжі у 2026 році: ставки за ціною проживання',
    description:'Ставки туристичного збору в Запоріжжі на 2026 рік залежать від ціни проживання на одну особу за добу. Рішення №39, офіційні джерела та калькулятор.',
    uniqueContent:'У Запоріжжі туристичний збір розраховується за рішенням міської ради №39 і залежить від вартості проживання однієї особи за добу. Форма ДПС, підписана міською радою для 2026 року, підтверджує окремі рівні для внутрішнього та в’їзного туризму. Калькулятор застосовує обрану ціну, категорію гостя, кількість гостей та розрахункових діб.',
    seoBlock:{title:'Туристичний збір у Запоріжжі у 2026 році: ставки та розрахунок',intro:'У місті Запоріжжя місцева ставка туристичного збору залежить від ціни тимчасового розміщення однієї особи за одну добу. Для розрахунку оберіть категорію туризму, вкажіть ціну за особу й добу, кількість гостей та розрахункових діб. Ставки підтверджені рішенням Запорізької міської ради №39 та її підписаною формою ДПС на 2026 рік.',sections:[
      {heading:'Які ставки туристичного збору встановлено у Запоріжжі',paragraphs:['Для внутрішнього туризму ставка становить 0,05% за вартістю до 300 грн включно, 0,25% за вартістю понад 300 грн і до 600 грн включно та 0,5% за вартістю понад 600 грн за особу за добу. Для в’їзного туризму діє 0,5% за вартості до 300 грн включно та 1,5% понад 300 грн. Це відсотки від бази, визначеної Податковим кодексом, а не від ціни номера.']},
      {heading:'Як розрахувати туристичний збір за проживання',paragraphs:['Спершу визначте ціну проживання однієї особи за одну добу та виберіть відповідний тарифний рівень. Потім у калькуляторі вкажіть кількість гостей внутрішнього й в’їзного туризму та число розрахункових діб. Для 2026 року законодавча база становить 8 647 грн. Наприклад, один гість внутрішнього туризму за ціни 450 грн за добу протягом двох розрахункових діб: 8 647 × 0,25% × 2 = 43,24 грн.']},
      {heading:'Що відбувається на межі 300 і 600 гривень',paragraphs:['У формі ДПС для Запорізької громади перший внутрішній діапазон включає рівно 300 грн, наступний починається понад 300 грн і включає 600 грн, а останній починається понад 600 грн. Тому для ціни рівно 300 грн застосовується перший діапазон, а рівно 600 грн належить до другого. Для в’їзного туризму рівно 300 грн також входить до діапазону 0,5%; ставка 1,5% починається лише для ціни понад 300 грн.']},
      {heading:'Що перевірити перед нарахуванням збору',paragraphs:['Звірте адресу місця розміщення з територією Запорізької міської громади, ціну саме на одну особу за добу та категорію туризму гостя. Розрахункова доба визначається за правилами статті 268 Податкового кодексу як 24 години між розрахунковими годинами об’єкта. Калькулятор дає попередню оцінку та не перевіряє документи для можливого звільнення.']},
      {heading:'Офіційні документи щодо ставок у Запоріжжі',paragraphs:['Запорізька міська рада оприлюднила рішення №39 від 30 січня 2019 року та положення про туристичний збір. У формі ДПС на 2026 рік рада повторно вказала це базове рішення, територіальну громаду, місто та цінові діапазони. У переліку місцевих податків ради рішення №39 зазначене як документ щодо туристичного збору. Джерела перевірено 14 жовтня 2026 року.']},
    ]},
  },
  ternopil:{
    title:'Туристичний збір у Тернополі у 2026 році: ставки та калькулятор',
    description:'Ставки туристичного збору в Тернополі на 2026 рік залежать від вартості проживання на особу за добу. Пояснення рішення ради й калькулятор.',
    uniqueContent:'У Тернопільській міській територіальній громаді туристичний збір залежить від ціни проживання однієї особи за добу. Для внутрішнього туризму застосовуються 0,15% або 0,25% мінімальної зарплати, для в’їзного 0,3% або 0,5%. Поріг 320 грн діє з 1 січня 2026 року. Значення рівно 320 грн має перетин у тексті рішення, тому калькулятор просить окремо перевірити цей випадок.',
    seoBlock:{title:'Туристичний збір у Тернополі у 2026 році: поріг 320 грн і розрахунок',intro:'Для міста Тернопіль ставка туристичного збору залежить від вартості проживання однієї особи за одну добу. Для правильного розрахунку потрібно вказати категорію туризму, ціну проживання на особу й кількість розрахункових діб.',sections:[
      {heading:'Ставки туристичного збору в Тернополі у 2026 році',paragraphs:['Рішення Тернопільської міської ради №7/35/5, зі змінами за рішенням №8/52/08, встановлює тарифні діапазони. Якщо проживання коштує менше 320 грн на особу за добу, ставка становить 0,15% для внутрішнього та 0,3% для в’їзного туризму. Якщо вартість перевищує 320 грн, ставки становлять 0,25% та 0,5% відповідно. Поріг 320 грн застосовується з 1 січня 2026 року.']},
      {heading:'Як працює калькулятор туристичного збору у Тернополі',paragraphs:['Вкажіть дату заїзду, розрахункові доби, кількість гостей кожної категорії та вартість проживання на одну особу за добу. Калькулятор застосує відповідний тарифний діапазон до мінімальної зарплати на 1 січня 2026 року, 8 647 грн. Значення рівно 320 грн система не оцінює автоматично, оскільки формулювання рішення «до 320 грн» і «320 грн і вище» перетинаються на цій межі.']},
      {heading:'Що перевірити готелю перед нарахуванням збору',paragraphs:['Переконайтеся, що місце розміщення належить до Тернопільської міської територіальної громади, а для порівняння з порогом використана вартість на одну особу за одну добу. Окремо звірте категорію туризму та можливі законні підстави для звільнення. Калькулятор дає попередній інформаційний результат і не встановлює право на пільгу.']},
    ]},
  },
  sumy:{
    title:'Туристичний збір у Сумах у 2026 році: ставки та калькулятор',
    description:'Туристичний збір у Сумах у 2026 році: ставки громади, рішення №1238-МР і калькулятор попередньої суми за гостями та добами.',
    uniqueContent:'У Сумській міській територіальній громаді ставка туристичного збору на 2026 рік становить 0,5% для внутрішнього та 0,5% для в’їзного туризму. Ставки підтверджені рішенням №1238-МР, офіційною сторінкою Департаменту фінансів міської ради та формою ДПС. Калькулятор використовує ці ставки разом із кількістю гостей і розрахункових діб.',
    seoBlock:{title:'Туристичний збір у Сумах у 2026 році: рішення громади та розрахунок',intro:'У цій довідці про туристичний збір для міста Суми наведено місцеве рішення Сумської міської територіальної громади. На 2026 рік офіційні джерела підтверджують ставку 0,5% для внутрішнього та в’їзного туризму; сторінка показує рішення, період і калькулятор попередньої суми.',sections:[{heading:'Ставки туристичного збору в Сумах на 2026 рік',paragraphs:['Рішення Сумської міської ради №1238-МР від 14 липня 2021 року застосовується з 1 січня 2022 року. Офіційна сторінка фінансового департаменту громади й форма ДПС підтверджують для 2026 року ставки 0,5% для внутрішнього та 0,5% для в’їзного туризму. Розмір у гривнях залежить від мінімальної заробітної плати на 1 січня року та кількості розрахункових діб.']},{heading:'Як скористатися калькулятором для проживання у Сумах',paragraphs:['Вкажіть дати проживання, кількість розрахункових діб та окремо гостей внутрішнього й в’їзного туризму. Калькулятор застосує ставку Сумської громади й покаже інформаційну суму до врахування можливого звільнення. Стаття 268 Податкового кодексу визначає розрахункову добу як 24 години між розрахунковими годинами об’єкта.']},{heading:'Що перевірити перед нарахуванням',paragraphs:['Переконайтеся, що адреса об’єкта розміщення належить до Сумської міської територіальної громади й дата проживання входить до періоду дії місцевого рішення. Окремо перевірте категорію гостя та документи, якщо може застосовуватися передбачене законом звільнення. Для обліку використовуйте фактичні дані проживання та першоджерела громади.']} ]}
  },
  vinnytsya:{
    title:'Туристичний збір у Вінниці у 2026 році: ставки та калькулятор',
    description:'Туристичний збір у Вінниці у 2026 році: 0,5% для внутрішнього та 1,5% для в’їзного туризму. Рішення громади, період дії та калькулятор.',
    uniqueContent:'У Вінницькій міській територіальній громаді на 2026 рік підтверджено ставки туристичного збору 0,5% для внутрішнього та 1,5% для в’їзного туризму. Рішення міської ради №469 і оприлюднені громадою ставки підтверджують застосування правил у 2026 році. Рішення №3535 встановлює ставки для наступного періоду з 2027 року.',
    seoBlock:{title:'Туристичний збір у Вінниці у 2026 році: місцеві ставки й розрахунок',intro:'У цій довідці про туристичний збір для міста Вінниця наведено рішення Вінницької міської територіальної громади. У 2026 році ставки становлять 0,5% для внутрішнього та 1,5% для в’їзного туризму; калькулятор рахує попередню суму за гостями й розрахунковими добами.',sections:[{heading:'Ставки туристичного збору у Вінниці на 2026 рік',paragraphs:['Рішення Вінницької міської ради №469 від 25 червня 2021 року та актуальна сторінка місцевих податків підтверджують на 2026 рік ставку 0,5% для внутрішнього туризму та 1,5% для в’їзного. Рішення №3535 передбачає ті самі відсотки для періоду, що починається 1 січня 2027 року. Не переносіть місцеві ставки на інші громади Вінницької області.']},{heading:'Розрахунок туристичного збору для гостей у Вінниці',paragraphs:['Для попередньої оцінки оберіть дати проживання, кількість гостей за кожною категорією туризму й розрахункові доби. Калькулятор застосовує вінницькі ставки до бази, визначеної статтею 268 Податкового кодексу, і показує суму до перевірки можливих законних звільнень. Розрахункова доба дорівнює 24 годинам між установленими об’єктом розрахунковими годинами.']},{heading:'Перевірка громади та строку дії рішення',paragraphs:['Перед нарахуванням звірте адресу об’єкта з Вінницькою міською територіальною громадою та перевірте період проживання: для цієї сторінки правило застосовується протягом 2026 року. Рішення №3535 описує наступний період з 2027 року. Для звітності спирайтеся на фактичні дані, текст рішень та актуальні вимоги законодавства.']} ]}
  },
  pivdenne:{
    title:'Туристичний збір у Південному у 2026 році: ставки та калькулятор',
    description:'Туристичний збір у Південному у 2026 році: 0,5% для внутрішнього й в’їзного туризму. Форма ДПС, період рішення та калькулятор.',
    uniqueContent:'У Південнівській міській територіальній громаді туристичний збір на 2026 рік становить 0,5% для внутрішнього та 0,5% для в’їзного туризму. Ставки та період дії рішення №422-VIII підтверджені офіційною формою ДПС і місцевим рішенням №2626-VIII, яке встановлює новий період з 2027 року.',
    seoBlock:{title:'Туристичний збір у Південному у 2026 році: ставки громади й розрахунок',intro:'У цій довідці про туристичний збір для міста Південне наведено рішення Південнівської міської територіальної громади. На 2026 рік підтверджено ставку 0,5% для внутрішнього й в’їзного туризму; калькулятор оцінює суму за введеними гостями та розрахунковими добами.',sections:[{heading:'Ставки туристичного збору у Південному на 2026 рік',paragraphs:['Рішення №422-VIII від 17 червня 2021 року встановило ставки, що застосовуються з 1 січня 2022 року. Офіційна форма ДПС підтверджує для Південнівської міської територіальної громади 0,5% для внутрішнього та 0,5% для в’їзного туризму у 2026 році. Рішення ради №2626-VIII встановлює ті самі ставки з 1 січня 2027 року й припиняє дію попереднього рішення з цієї дати.']},{heading:'Як порахувати збір за проживання у Південному',paragraphs:['Введіть період проживання, кількість розрахункових діб і число гостей внутрішнього та в’їзного туризму. Калькулятор використовує підтверджену ставку Південнівської громади й показує попередню суму за правилами статті 268 Податкового кодексу. Розрахункова доба становить 24 години між розрахунковими годинами закладу.']},{heading:'Що звірити з місцевими документами',paragraphs:['Перевірте, що адреса об’єкта належить до Південнівської міської територіальної громади, а дата проживання припадає на 2026 рік. З 1 січня 2027 року застосовується нове рішення №2626-VIII. Можливі звільнення перевіряйте окремо за статтею 268 та підтвердними документами; калькулятор їх автоматично не визначає.']} ]}
  },
};

const reviewedCityCalculationExamples={
  tyachiv:{heading:'Приклад розрахунку для двох гостей на три доби',paragraphs:['За ставкою 0,50% для внутрішнього туризму: 8 647 × 0,50% × 2 гості × 3 розрахункові доби = 259,41 грн. Для двох гостей в’їзного туризму за ставкою 1,00% сума за такий самий період становить 518,82 грн. Розрахунок використовує базу 2026 року й наведений до перевірки можливих звільнень.']},
  irpin:{heading:'Приклад розрахунку для двох гостей в Ірпені',paragraphs:['За ставкою 0,50% для внутрішнього туризму двоє гостей на три доби: 8 647 × 0,50% × 2 × 3 = 259,41 грн. За ставкою 5,00% для в’їзного туризму та сама кількість гостей і діб дає 2 594,10 грн. Приклад використовує базу 2026 року; документи й можливі звільнення перевіряються окремо.']},
  skole:{heading:'Приклад розрахунку туристичного збору у Сколе',paragraphs:['Двоє гостей внутрішнього туризму на три розрахункові доби: 8 647 × 0,50% × 2 × 3 = 259,41 грн. Для в’їзного туризму за міською ставкою 2,50%: 8 647 × 2,50% × 2 × 3 = 1 297,05 грн. Це попередні суми за базою 2026 року до перевірки можливих пільг.']},
  yasinya:{heading:'Приклад розрахунку для двох гостей на три доби',paragraphs:['За універсальними ставками форми ДПС для Ясінянської громади розрахунок для двох гостей внутрішнього туризму на три розрахункові доби: 8 647 × 0,30% × 2 × 3 = 155,65 грн. Для двох гостей в’їзного туризму за тих самих умов: 8 647 × 1,00% × 2 × 3 = 518,82 грн. Приклади використовують базу 2026 року; можливі законні звільнення перевіряються окремо.']},
  kyyiv:{heading:'Приклад розрахунку для двох гостей у Києві',paragraphs:['За бази 8 647 грн, ставки 0,40% для внутрішнього та 1,00% для в’їзного туризму приклад для двох гостей внутрішнього туризму на три розрахункові доби: 8 647 × 0,40% × 2 × 3 = 207,53 грн. Для двох гостей в’їзного туризму на дві доби сума становить 8 647 × 1,00% × 2 × 2 = 345,88 грн. Суми наведені до перевірки можливої законної пільги.']},
  odesa:{heading:'Приклад розрахунку для двох гостей в Одесі',paragraphs:['Якщо двоє гостей належать до категорій, для яких у 2026 році підтверджено ставку 0,50%, за три розрахункові доби орієнтовний збір становить 8 647 × 0,50% × 2 × 3 = 259,41 грн. Приклад відповідає формі ДПС на 2026 рік і загальному правилу статті 12 Податкового кодексу щодо періоду застосування змін місцевих ставок. Можливі законні звільнення перевіряються окремо.']},
  dnipro:{heading:'Приклад розрахунку для проживання у Дніпрі',paragraphs:['За ціни 150 грн на одну особу за добу та ставки 0,35% для внутрішнього туризму, один платник за дві розрахункові доби: 8 647 × 0,35% × 1 × 2 = 60,53 грн. За ціни 500 грн і ставки 0,50% такий самий гість за дві доби сплатив би орієнтовно 86,47 грн. Ціна рівно 200 грн заблокована через неоднозначність діапазонів у формі.']},
  zhytomyr:{heading:'Приклад розрахунку для гостей у Житомирі',paragraphs:['За бази 8 647 грн та ставки 0,25%, двоє платників внутрішнього туризму за три розрахункові доби: 8 647 × 0,25% × 2 × 3 = 129,705 грн, або 129,71 грн після округлення до копійок. Для одного платника в’їзного туризму за дві доби сума становить 8 647 × 2,5% × 1 × 2 = 432,35 грн.']},
  berehove:{heading:'Приклад: двоє гостей у Береговому на дві розрахункові доби',paragraphs:['За бази 8 647 грн і ставки 0,25% для кожного виду туризму: 8 647 × 0,25% × 2 гості × 2 доби = 86,47 грн. Це інформаційний приклад до перевірки фактичних даних проживання та можливого звільнення гостя.']},
  uzhhorod:{heading:'Приклад: проживання двох гостей в Ужгороді протягом двох діб',paragraphs:['За бази 8 647 грн і універсальної ставки 0,50% для внутрішнього туризму сума становить 8 647 × 0,50% × 2 гості × 2 доби = 172,94 грн. Для двох гостей в’їзного туризму за ставкою 1,00% приклад становить 345,88 грн. Розрахунок використовує універсальний рядок підписаної форми ДПС; розбіжність з Excel і нульовими деталізованими рядками пояснена вище.']},
  slavsko:{heading:'Приклад: двоє гостей у Славську на дві розрахункові доби',paragraphs:['За бази 8 647 грн і ставки 0,20% для внутрішнього та в’їзного туризму: 8 647 × 0,20% × 2 гості × 2 доби = 69,18 грн. Сума розрахована за універсальним рядком форми №6 ДПС. Перевірте фактичні дати проживання та можливі законні звільнення окремо.']},
  cherkasy:{heading:'Приклад: двоє гостей внутрішнього туризму на дві доби',paragraphs:['За бази 8 647 грн, ставки 0,50%, двох гостей і двох розрахункових діб: 8 647 × 0,50% × 2 × 2 = 172,94 грн. Такий самий сценарій для двох гостей в’їзного туризму за ставкою 5,00% становить 1 729,40 грн. Обидва приклади наведені до перевірки можливого звільнення від сплати за конкретними документами.']},
  lviv:{heading:'Приклад попереднього розрахунку для Львова',paragraphs:['За ціни проживання 700 грн на одну особу за добу підписана форма ДПС указує внутрішню ставку 0,30%. Для двох гостей на дві розрахункові доби: 8 647 × 0,30% × 2 × 2 = 103,764 грн, або 103,76 грн після округлення. На межах 750 грн і 1 200 грн калькулятор не підбирає ставку автоматично.']},
  chernivtsi:{heading:'Приклад розрахунку для трьох гостей у Чернівцях',paragraphs:['За бази 8 647 грн і ставки 0,30% для трьох гостей на дві розрахункові доби: 8 647 × 0,30% × 3 × 2 = 155,646 грн, або 155,65 грн після округлення загальної суми до копійок. Такий самий відсоток у формі ДПС вказано для внутрішнього та в’їзного туризму.']},
  'ivano-frankivsk':{heading:'Приклад: один гість внутрішнього туризму на три доби',paragraphs:['За бази 8 647 грн і ставки 0,3% приклад для одного гостя внутрішнього туризму на три розрахункові доби: 8 647 × 0,3% × 1 × 3 = 77,823 грн, або 77,82 грн після округлення підсумку до копійок. Калькулятор відтворює цей результат. Можливе звільнення перевірте окремо за правилами й документами.']},
  kolomyya:{heading:'Приклад: один гість у Коломиї протягом трьох діб',paragraphs:['За ставкою 0,5% для одного гостя внутрішнього або в’їзного туризму на три розрахункові доби: 8 647 × 0,5% × 1 × 3 = 129,705 грн, або 129,71 грн після округлення підсумку до копійок. Перевірте категорію гостя, кількість розрахункових діб і можливі законні звільнення окремо.']},
  chernihiv:{heading:'Приклад: два гості внутрішнього туризму на три доби',paragraphs:['За ставкою Чернігівської громади 0,5% розрахунок для двох гостей на три розрахункові доби: 8 647 × 0,5% × 2 × 3 = 259,41 грн. Ставка така сама для внутрішнього та в’їзного туризму. Можливі законні звільнення потрібно перевірити окремо.']},
  rivne:{heading:'Приклад: двоє гостей внутрішнього туризму на три доби',paragraphs:['За ставки Рівненської громади 0,25% розрахунок для двох гостей на три розрахункові доби такий: 8 647 × 0,25% × 2 × 3 = 129,705 грн, або 129,71 грн після округлення до копійок. Це інформаційний приклад за базою 2026 року; можливі законні звільнення перевіряють окремо.']},
  zaporizhzhya:{heading:'Приклад: одна особа за ціни 450 грн на дві доби',paragraphs:['За ціни розміщення 450 грн на одну особу за добу застосовується внутрішня ставка 0,25%. Для одного гостя на дві розрахункові доби: 8 647 × 0,25% × 1 × 2 = 43,235 грн, тобто 43,24 грн після округлення до копійок.']},
  ternopil:{heading:'Приклад розрахунку нижче порогу 320 грн',paragraphs:['Якщо проживання однієї особи коштує 300 грн за добу, для внутрішнього туризму ставка становить 0,15%. За бази 8 647 грн збір за одну особу на дві розрахункові доби становить 8 647 × 0,15% × 2 = 25,941 грн, або 25,94 грн після округлення до копійок. Значення 320 грн потребує окремої звірки з радою через перетин формулювань рішення.']},
  sumy:{heading:'Приклад розрахунку для чотирьох діб у Сумах',paragraphs:['Для одного гостя внутрішнього туризму на чотири розрахункові доби: 8 647 × 0,5% × 1 × 4 = 172,94 грн. Тут використано базу 2026 року й ставку Сумської громади. Якщо є підстава для звільнення, її слід перевірити окремо за документами гостя та чинними правилами.']},
  vinnytsya:{heading:'Приклад: двоє гостей в’їзного туризму на три доби',paragraphs:['За ставки Вінницької громади 1,5% розрахунок для двох гостей на три розрахункові доби такий: 8 647 × 1,5% × 2 × 3 = 778,23 грн. Це інформаційний приклад за базою 2026 року, до перевірки можливих законних звільнень.']},
  pivdenne:{heading:'Приклад для групи гостей у Південному',paragraphs:['Для трьох гостей внутрішнього туризму на чотири розрахункові доби: 8 647 × 0,5% × 3 × 4 = 518,82 грн. Приклад використовує ставку громади, чинну до 31 грудня 2026 року. Для проживання з 1 січня 2027 року перевірте нове рішення №2626-VIII.']},
};

const researchedCityDrafts={
  lviv:{
    title:'Туристичний збір у Львові у 2026 році: ставки за ціною проживання',
    description:'Офіційна форма ДПС для Львівської громади на 2026 рік: ставки 0,3%, 0,4%, 0,5% та 1%, пороги ціни, розрахунок і неоднозначні межі.',
    uniqueContent:'Підписана Львівською міською радою форма №6 ДПС для 2026 року пов’язує рішення №6373 з кодом громади та застосуванням ставок від 1 січня. Внутрішня ставка залежить від ціни проживання однієї особи за добу: у формі наведено рівні 0,30%, 0,40% і 0,50%; для в’їзного туризму вказано 1,00%. На межах 750 грн і 1 200 грн формулювання перетинаються, тому калькулятор не вгадує ставку й просить уточнення. Міський рядок стосується Львова з окремим кодом КАТОТТГ, а не автоматично кожного населеного пункту громади.',
    seoBlock:{title:'Туристичний збір у Львові у 2026 році: тарифні рівні та розрахунок',intro:'Для Львівської міської територіальної громади офіційна форма ставок туристичного збору на 2026 рік пов’язує розмір внутрішньої ставки з вартістю проживання однієї особи за добу. Форма вказує рішення №6373 від 12 червня 2025 року та застосування з 1 січня 2026 року. Для в’їзного туризму в усіх трьох цінових рівнях зазначено ставку 1%.',sections:[
      {heading:'Ставки туристичного збору у Львові за ціновими рівнями',paragraphs:['Підписана офіційна форма ДПС зазначає для внутрішнього туризму 0,30% для вартості до 750 грн включно, 0,40% для діапазону від 750 до 1 200 грн включно та 0,50% для вартості від 1 200 грн. Для в’їзного туризму в кожному рядку наведено 1,00%. Це відсотки від законодавчої бази туристичного збору, а не від повної ціни номера. Діапазони не слід переносити на інші громади Львівської області.']},
      {heading:'Як ціна проживання змінює попередній розрахунок',paragraphs:['Для 2026 року розрахункова база дорівнює мінімальній заробітній платі на 1 січня, 8 647 грн. За внутрішньої ставки 0,30% один гість за одну добу дає 25,94 грн після округлення; за ставки 0,40% це 34,59 грн, а за 0,50% це 43,24 грн. Для в’їзного туризму ставка 1,00% відповідає 86,47 грн за одну особу за одну розрахункову добу. Загальну суму обчислюють з урахуванням категорій гостей і кількості розрахункових діб.']},
      {heading:'Що означають межі 750 і 1 200 гривень',paragraphs:['В офіційній формі перший рівень включає ціну до 750 грн, а наступний починається від 750 грн; подібний перетин є і на 1 200 грн. Тому ставка для ціни рівно 750 або 1 200 грн не визначається однозначно лише за формою. Калькулятор має зупиняти розрахунок на цих двох точках, доки оригінальний текст рішення не підтвердить точну межу. Для ціни на копійку нижче або вище використовують відповідний неперекривний діапазон.']},
      {heading:'Які дані перевірити готелю перед нарахуванням',paragraphs:['Спершу звірте адресу об’єкта з Львівською міською територіальною громадою та визначте категорію туризму гостя за статтею 268 Податкового кодексу. Для цінової ставки потрібна вартість тимчасового розміщення однієї особи за одну добу, тож збережіть первинні дані бронювання й тарифу. Період дії правила за формою починається 1 січня 2026 року. Можливі пільги калькулятор не підтверджує автоматично, їх перевіряє податковий агент за документами.']},
      {heading:'Джерело ставок і межі розрахунку',paragraphs:['Підписана форма №6 ДПС, подана Львівською міською радою, пов’язує рішення №6373 з громадою та ставками, що застосовуються з 1 січня 2026 року. Повний текст рішення не вдалося отримати для перевірки меж включення. Тому калькулятор рахує за підтвердженими рівнями, але зупиняється на ціні рівно 750 грн і 1 200 грн та пояснює, чому потрібна додаткова перевірка.']},
    ]},
  },
  polyana:{
    title:'Туристичний збір у Поляні у 2026 році | Ставки',
    description:'Туристичний збір у Поляні на 2026 рік: ставки 0,5% і 1% за формою ДПС. Перевірте рішення громади та порахуйте суму для гостей.',
    uniqueContent:'Село Поляна входить до Полянської сільської територіальної громади Закарпатської області. Підписана форма №6 ДПС у зведеному наборі на 2026 рік пов’язує рішення №1778 від 1 липня 2025 року з селом Поляна (КАТОТТГ UA21040210010063908) і застосуванням із 1 січня 2026 року. Деталізовані рядки за видами місць проживання вказують 0,50% для внутрішнього та 1,00% для в’їзного туризму. Та сама форма має нульовий універсальний рядок, який її інструкція забороняє заповнювати разом із категорійним розділом; цей нуль не трактуємо як тариф. У попередньому довідковому наборі вказано 0,40% / 1,00%. Для розрахунку обрано деталізовані категорійні значення підписаної форми ДПС, а сторінка пояснює обидві розбіжності й обмежує розрахунок 2026 роком. Суми для 2027 року потрібно перевірити за новим рішенням громади.',
    seoBlock:{
      title:'Туристичний збір у Поляні на 2026 рік: ставки та перевірка розрахунку',
      intro:'Поляна - село в Полянській громаді Закарпатської області, окремий населений пункт із власним кодом КАТОТТГ. За підписаною формою №6 ДПС, що відображає ставку на 2026 рік, у деталізованих категоріях місць проживання зазначено 0,50% для внутрішнього й 1,00% для в’їзного туризму. Нижче пояснюємо, як читати форму, чому її універсальний рядок із нулями не застосовуємо та як отримати орієнтовну суму за формулою туристичного збору.',
      sections:[
        {heading:'Ставки туристичного збору в Поляні на 2026 рік',paragraphs:['Підписана форма №6 Полянської сільської ради називає рішення №1778 від 1 липня 2025 року та дату, з якої ставки застосовуються: 1 січня 2026 року. У деталізованих рядках за видами тимчасового проживання для внутрішнього туризму вказано 0,50%, для в’їзного - 1,00%. Ці відсотки застосовуються до законодавчої бази, яка для туристичного збору у 2026 році становить 8 647 грн на одну особу за одну розрахункову добу; це не відсоток від повної ціни номера.']},
        {heading:'Як читаємо суперечність у формі ДПС',paragraphs:['* У формі є рядок 1.0.0 із 0,00% / 0,00% одночасно з деталізованими рядками 1.1, де наведено ставки за окремими типами місць проживання. Інструкція до форми прямо вказує: якщо заповнено універсальний рядок 1.0.0, розділ 1.1 не заповнюється. Тому нульові значення в універсальному рядку не використовуємо як ставку або пільгу. Для сторінки беремо деталізовані рядки, оскільки вони містять ставки за конкретними типами проживання.']},
        {heading:'Чому робочий набір містить іншу ставку',paragraphs:['У переданому робочому файлі для Поляни вказано 0,40% для внутрішнього та 1,00% для в’їзного туризму. Підписана форма №6 ДПС для категорій місць проживання містить 0,50% / 1,00%. Для розрахунку обрано деталізовані рядки офіційної форми, яка пов’язує ставку з рішенням №1778 і застосуванням з 1 січня 2026 року. Якщо рада оприлюднить інший чинний текст рішення або додатка, ставку потрібно повторно звірити й перерахувати приклади.']},
        {heading:'Яку територію охоплює сторінка',paragraphs:['Сторінка стосується саме села Поляна з кодом КАТОТТГ UA21040210010063908 у складі Полянської сільської територіальної громади з кодом UA21040210000079273. Форма №6 окремо перелічує інші населені пункти громади. Отже, дані про село Поляна не слід автоматично поширювати на Солочин, Голубине чи інші поселення без перевірки їхніх рядків і місцевого акта.']},
        {heading:'Як розрахувати туристичний збір у Поляні',paragraphs:['Формула попередньої оцінки: мінімальна заробітна плата на 1 січня × місцева ставка × кількість платників × кількість розрахункових діб. Для 2026 року ставка 0,50% дає 43,24 грн на одну особу за добу, а ставка 1,00% - 86,47 грн. Наприклад, двоє гостей внутрішнього туризму за три доби: 8 647 × 0,5% × 2 × 3 = 259,41 грн. Остаточний розрахунок робить податковий агент за фактичними даними проживання; калькулятор не визначає право на пільгу автоматично.']},
        {heading:'Коли перевірити ставку наступного разу',paragraphs:['Форма ДПС належить до зведених ставок на 2026 рік і відображає дані ІАС LOGICA станом на 30 січня 2026 року. На цій сторінці ставка застосовується лише до проживання у 2026 році. Перед розрахунками за періоди з 1 січня 2027 року потрібно повторно перевірити рішення Полянської ради, зміни до нього та наступний офіційний набір ДПС.']},
        {heading:'Туристичний попит у Полянській громаді',paragraphs:['За даними Управління туризму та курортів Закарпатської ОВА, за січень–липень 2026 року Полянська громада отримала 4 825,5 тис. грн туристичного збору. У повідомленні село Поляна становить 22,5% суми десяти названих громад. Це офіційний показник надходжень, який допомагає оцінити туристичну активність, але він не є пошуковою статистикою, не визначає ставку й не підміняє звіт конкретного об’єкта розміщення.']},
      ]
    }
  },
  khust:{
    title:'Туристичний збір у Хусті на 2026 рік: ставки й калькулятор',
    description:'Туристичний збір у Хусті на 2026 рік: ставки 0,5% і 1,5% за рішенням №344. Дані ДПС, період дії та розрахуйте суму для гостей і діб.',
    uniqueContent:'Для міста Хуст застосовується Положення про туристичний збір, затверджене рішенням Хустської міської ради №344 від 30 червня 2021 року. Додаток 5 встановлює 0,5% для внутрішнього і 1,5% для в’їзного туризму. Підписана форма №6 ДПС на 2026 рік підтверджує ці ставки для Хуста й окремо називає коди КАТОТТГ міста та громади. Рішення №866 від 2022 року та №2542 від 2025 року змінюють інші місцеві податки, а не туристичний збір. Попередні довідкові дані містять 0,4% / 1,0%; сторінка пояснює, чому калькулятор використовує ставки з місцевого акта й форми ДПС лише в межах 2026 року.',
    seoBlock:{
      title:'Туристичний збір у Хусті на 2026 рік: ставки, формула й розрахунок',
      intro:'У Хусті туристичний збір у 2026 році розраховується за місцевим Положенням, затвердженим рішенням міської ради №344. Додаток 5 встановлює ставку 0,5% для внутрішнього та 1,5% для в’їзного туризму. Підписана форма №6 ДПС підтверджує застосування цих ставок у 2026 році та називає окремий код міста Хуст у складі Хустської міської територіальної громади.',
      sections:[
        {heading:'Який туристичний збір у Хусті у 2026 році',paragraphs:['Рішення Хустської міської ради №344 від 30 червня 2021 року затвердило Положення про порядок справляння туристичного збору на території громади. Додаток 5 визначає ставку 0,5% для внутрішнього туризму й 1,5% для в’їзного туризму. Підписана форма №6 ДПС у зведенні на 2026 рік повторно вказує ці ставки для міста Хуст.']},
        {heading:'Як порахувати суму для гостей',paragraphs:['Формула попередньої оцінки: мінімальна заробітна плата на 1 січня звітного року × місцева ставка × кількість платників збору × кількість розрахункових діб. У 2026 році база дорівнює 8 647 грн. Для одного платника за одну добу ставка 0,5% дає 43,24 грн, а 1,5% - 129,71 грн після округлення до копійок. Наприклад, двоє платників внутрішнього туризму за три доби: 8 647 × 0,5% × 2 × 3 = 259,41 грн. Це попередній розрахунок; податковий агент перевіряє фактичні дати, категорію гостя та документи на пільгу.']},
        {heading:'Що саме охоплює рішення громади',paragraphs:['Сторінка стосується міста Хуст з кодом КАТОТТГ UA21120250010053148 у складі Хустської міської територіальної громади UA21120250000077532. У формі №6 ДПС рішення №344 застосовується до міста та інших населених пунктів громади. Для адреси об’єкта в інших населених пунктах громади перевіряйте рядок конкретного поселення; не переносіть цю ставку на сусідні громади.']},
        {heading:'Чому попередні довідкові дані відрізняються',paragraphs:['* У попередніх довідкових даних для Хуста зазначено 0,4% / 1,0%. Ці значення не збігаються з додатком 5 до рішення №344 та універсальним рядком підписаної форми №6 ДПС на 2026 рік, де вказано 0,5% / 1,5%. У цій формі одночасно надруковані нульові рядки за видами житла, хоча примітка до форми вимагає заповнювати або універсальний рядок, або деталізацію. Для калькулятора використано універсальні ставки, підтверджені місцевим додатком. Якщо рада оприлюднить новий акт або ДПС оновить форму, запис потрібно повторно звірити.']},
        {heading:'Чи змінювали туристичний збір рішення №866 і №2542',paragraphs:['У рішенні №866 від 22 липня 2022 року перелічено зміни до положень про землю, транспортний податок і податок на нерухомість. Рішення №2542 від 30 червня 2025 року змінює додатки щодо ставок податку на нерухомість і землі; воно набрало чинності 1 січня 2026 року. Жоден із цих актів не замінює додаток 5 про туристичний збір.']},
        {heading:'Період дії даних і наступна перевірка',paragraphs:['Форма ДПС відображає ставки, що застосовуються з 1 січня 2026 року, а її зведення сформоване за даними ІАС LOGICA станом на 30 січня 2026 року. Калькулятор приймає дату проживання лише в межах 2026 року. Перед розрахунком перебування з 1 січня 2027 року перевірте нове рішення Хустської міської ради, зміни до Положення та нову форму ДПС.']},
        {heading:'Пільги та обов’язки податкового агента',paragraphs:['Місцеве Положення відсилає до переліку осіб, які не є платниками збору, у підпункті 268.2.2 Податкового кодексу України. Калькулятор не підтверджує пільгу автоматично: відповідальна особа має перевірити документи, підставу й умови конкретного випадку. Податковий агент веде облік, нараховує та сплачує збір відповідно до чинного Податкового кодексу та офіційного Положення громади.']}
      ]
    }
  },
  vynohradiv:{
    title:'Туристичний збір у Виноградові 2026: ставка | VDALO',
    description:'Туристичний збір у Виноградові у 2026 році: офіційно підтверджена ставка 0,25% для внутрішнього та в’їзного туризму, КАТОТТГ, джерела й калькулятор.',
    uniqueContent:'У 2026 році для міста Виноградів у складі Виноградівської міської територіальної громади застосовується ставка туристичного збору 0,25% для внутрішнього та в’їзного туризму. Її підтверджують рішення міської ради №297, форма №6 ДПС із кодом міста UA21020110010043238 та офіційне повідомлення ради від 16 квітня 2026 року. У робочій таблиці були інші значення - 0,30% і 1,00%; для калькулятора обрано узгоджені офіційні джерела. Розрахунок стосується 2026 року й потребує нового звіряння перед 2027 роком.',
    seoBlock:{
      title:'Туристичний збір у Виноградові на 2026 рік: ставка, формула та приклади',
      intro:'Для тимчасового проживання в місті Виноградів туристичний збір у 2026 році обчислюється за ставкою 0,25% як для внутрішнього, так і для в’їзного туризму. Рішення міської ради №297 та форма №6 ДПС пов’язують правило з Виноградівською територіальною громадою, а міська рада повторно підтвердила ставку у квітні 2026 року.',
      sections:[
        {heading:'Ставка туристичного збору у Виноградові у 2026 році',paragraphs:['Офіційні джерела вказують однакову ставку 0,25% для внутрішнього та в’їзного туризму. Її встановлює рішення Виноградівської міської ради №297 від 14 липня 2021 року; форма №6 ДПС зазначає застосування правила з 1 січня 2022 року. На робочій нараді 16 квітня 2026 року міська рада підтвердила, що 0,25% для обох категорій продовжує застосовуватися в громаді.']},
        {heading:'Як працює калькулятор туристичного збору',paragraphs:['Орієнтовна сума визначається за формулою: мінімальна заробітна плата на 1 січня звітного року × місцева ставка × кількість платників збору × кількість розрахункових діб. Для розрахунку за 2026 рік база становить 8 647 грн. За ставкою 0,25% збір дорівнює 21,62 грн на одного платника за одну добу після округлення до копійок. Наприклад, двоє платників за три доби: 8 647 × 0,25% × 2 × 3 = 129,71 грн. Остаточний облік залежить від фактичних ночівель і документів на можливу пільгу.']},
        {heading:'Яку територію охоплює сторінка',paragraphs:['Сторінка описує місто Виноградів, код КАТОТТГ UA21020110010043238, у складі Виноградівської міської територіальної громади, код UA21020110000091104. Форма №6 ДПС перелічує також інші населені пункти цієї громади. Якщо об’єкт розміщення розташований за межами міста, перевірте його адресу та відповідність саме громаді; ставка цієї сторінки не поширюється автоматично на сусідні громади.']},
        {heading:'Чому ставка відрізняється від робочої таблиці',paragraphs:['* У наданому Excel для Виноградова було зазначено 0,30% для внутрішнього та 1,00% для в’їзного туризму. Ці значення не збігаються з рішенням №297, підписаною формою №6 ДПС та повідомленням міської ради у 2026 році, які вказують 0,25% для обох категорій. Тому калькулятор використовує офіційно підтверджену ставку. У формі №6 одночасно наявні нульові категорійні рядки, однак сама форма передбачає універсальне правило або деталізацію за типом проживання; нулі не подаються тут як додаткові ставки чи пільги.']},
        {heading:'Актуальність даних і наступна перевірка',paragraphs:['Дані перевірено 18 жовтня 2026 року; калькулятор застосовує правило тільки до дат проживання в межах 2026 року. Перед використанням з 1 січня 2027 року потрібно звірити нові рішення Виноградівської міської ради, їхній строк дії та наступну форму №6 ДПС. Ставка 0,25% - це місцеве рішення, а не автоматична загальнонаціональна ставка.']},
        {heading:'Пільги та обов’язки податкового агента',paragraphs:['Калькулятор показує попередню суму й автоматично не визначає право гостя на звільнення. Податковий агент перевіряє підстави, документи та вимоги підпункту 268.2.2 статті 268 Податкового кодексу України. Для остаточного нарахування враховуйте правила громади й чинне законодавство.']},
        {heading:'Туристична активність Виноградівської громади',paragraphs:['Виноградівська міська рада повідомляла, що за 2025 рік громада отримала 1 230,8 тис. грн туристичного збору, на 51,9% більше, ніж за 2024 рік. Це офіційний показник бюджетних надходжень і лише контекст туристичної активності: він не є обсягом Google-запитів та не визначає ставку для конкретного гостя чи об’єкта.']},
      ]
    }
  },
  yaremche:{
    title:'Туристичний збір у Яремче у 2026 році: ставки за типом житла',
    description:'Туристичний збір у Яремче у 2026 році: 0,50% для готелів і 0,30% для садиб та іншого житла. Оберіть тип об’єкта й розрахуйте суму за рішенням громади.',
    uniqueContent:'Для міста Яремче у складі Яремчанської міської територіальної громади рішення №169-11/2021 встановлює ставку за типом місця проживання: 0,50% для готелів, мотелів і закладів готельного типу та 0,30% для будинків, квартир, котеджів, садиб і інших місць тимчасового проживання. Ставки однакові для внутрішнього та в’їзного туризму. Підписана форма №6 ДПС у наборі 2026 року й офіційне роз’яснення ДПС підтверджують категорії. Калькулятор просить вибрати тип житла й працює лише для періоду 2026 року.',
    seoBlock:{
      title:'Туристичний збір у Яремче на 2026 рік: ставка для готелів і садиб',
      intro:'Ставка туристичного збору в Яремче залежить від виду місця розміщення. Рішення Яремчанської міської ради №169-11/2021 встановлює 0,50% для готелів, мотелів і закладів готельного типу та 0,30% для садиб, котеджів, квартир та інших місць тимчасового проживання. Для внутрішнього й в’їзного туризму ставка в кожній категорії однакова.',
      sections:[
        {heading:'Які ставки туристичного збору діють у Яремче',paragraphs:['Для готелів, мотелів, гуртожитків для приїжджих та інших закладів готельного типу місцеве рішення встановлює 0,50% мінімальної заробітної плати на 1 січня звітного року. Для будинків, квартир, котеджів, кімнат, садиб та інших об’єктів тимчасового проживання ставка становить 0,30%. Обидві ставки застосовуються як до внутрішнього, так і до в’їзного туризму.']},
        {heading:'Як обрати тип житла для калькулятора',paragraphs:['Оберіть «готель або заклад готельного типу», якщо об’єкт належить до цієї категорії за рішенням ради. Для садиби, котеджу, квартири, кімнати та інших житлових об’єктів оберіть «садиба, котедж або інше житло». Якщо класифікація конкретного об’єкта незрозуміла, не підмінюйте її припущенням: перевірте визначення в рішенні №169-11/2021 або зверніться до податкового агента.']},
        {heading:'Формула розрахунку туристичного збору в Яремче',paragraphs:['Для 2026 року база становить 8 647 грн - мінімальна заробітна плата, встановлена на 1 січня. Орієнтовна сума дорівнює базі, помноженій на місцеву ставку, кількість платників збору та розрахункові доби. Для одного гостя готельної категорії за одну добу це 43,24 грн після округлення; для одного гостя в іншому житлі - 25,94 грн. Наприклад, двоє платників у садибі на три доби: 8 647 × 0,30% × 2 × 3 = 155,65 грн.']},
        {heading:'Територія сторінки та громада',paragraphs:['Сторінка стосується міста Яремче, код КАТОТТГ UA26120150010047425, у складі Яремчанської міської територіальної громади UA26120150000021671. Рішення ради встановлює правило на території громади, однак ця сторінка має географічну назву Яремче. Для об’єкта в іншому населеному пункті громади перевірте точну адресу та місцеві умови, не переносіть міський маршрут на сусідню громаду.']},
        {heading:'Чому ставка відрізняється від попередніх даних',paragraphs:['У попередніх довідкових даних для Яремче наводили 0,50% для внутрішнього та 1,00% для в’їзного туризму, а також окрему примітку про 0,30% для садиб. Рішення №169-11/2021, підписана форма №6 ДПС і роз’яснення ДПС вказують 0,50% для готельної категорії та 0,30% для інших місць проживання - однаково для обох категорій туристів. Саме модель за типом житла використовується в калькуляторі; попереднє значення 1,00% не застосовується.']},
        {heading:'Період актуальності та наступна перевірка',paragraphs:['Ставки звірено 18 жовтня 2026 року за місцевим рішенням, формою №6 ДПС у наборі 2026 року та роз’ясненням податкової служби. Калькулятор приймає дати проживання лише в межах 2026 року. Перед 1 грудня 2026 року слід перевірити нові рішення Яремчанської міської ради й оновлені дані ДПС для 2027 року; нову мінімальну зарплату можна підставляти лише після набрання чинності бюджетним законом.']},
        {heading:'Пільги та остаточний облік',paragraphs:['Калькулятор показує попередню суму й не визначає автоматично, чи має гість право на звільнення від туристичного збору. Податковий агент перевіряє підставу та документи за статтею 268 Податкового кодексу України, облік фактичних розрахункових діб і вимоги до декларації. Для звітності використовуйте первинні документи та чинний текст місцевого рішення.']},
      ]
    }
  },
};

const reviewedPlaces=workbookTouristTaxPlaces.map(place=>{
  const content=publishableReviewedCityContent[place.slug]??(place.slug==='lviv'?researchedCityDrafts.lviv:null);
  if(!content){
    const researchedDraft=researchedCityDrafts[place.slug];
    if(!researchedDraft)return place;
    return {
      ...place,
      ...(place.slug==='polyana'?{
        geoStatus:'ELIGIBLE',
        geoStatusReason:'Село Поляна та Полянську сільську територіальну громаду звірено за кодами КАТОТТГ у підписаній формі №6 ДПС; сторінка додана до другої хвилі для staging-перевірки.',
        indexable:true,
        readiness:{placeVerified:true,safetyEligible:true,calculatorQaPassed:true,uniqueContentApproved:true,seoQaPassed:true},
      }:place.slug==='khust'?{
        nameLocative:'Хусті',
        geoStatus:'ELIGIBLE',
        geoStatusReason:'Місто Хуст і Хустську міську територіальну громаду звірено за кодами КАТОТТГ у підписаній формі №6 ДПС та додатку до рішення №344; сторінка включена до другої хвилі для staging-перевірки.',
        indexable:true,
        readiness:{placeVerified:true,safetyEligible:true,calculatorQaPassed:true,uniqueContentApproved:true,seoQaPassed:true},
      }:place.slug==='kosyno-koson'?{
        name:'Косонь',
        nameLocative:'Косоні',
        settlementType:'село',
        geoStatus:'REVIEW_REQUIRED',
        geoStatusReason:'Офіційний КАТОТТГ підтверджує село Косонь UA21020170010067414 у Косоньській громаді UA21020170000069101. Ставку туристичного збору та період дії ще не підтверджено першоджерелом; розрахунок і публікація заблоковані.',
        indexable:false,
      }:place.slug==='vynohradiv'?{
        nameLocative:'Виноградові',
        geoStatus:'ELIGIBLE',
        geoStatusReason:'Місто Виноградів UA21020110010043238 і Виноградівську міську громаду UA21020110000091104 підтверджено підписаною формою №6 ДПС; ставку 0,25% / 0,25% для розрахунків 2026 року підтверджують офіційні джерела міської ради й ДПС.',
        indexable:true,
        readiness:{placeVerified:true,safetyEligible:true,calculatorQaPassed:true,uniqueContentApproved:true,seoQaPassed:true},
      }:place.slug==='yaremche'?{
        nameLocative:'Яремче',
        geoStatus:'ELIGIBLE',
        geoStatusReason:'Місто Яремче UA26120150010047425 і Яремчанську міську територіальну громаду UA26120150000021671 звірено з підписаною формою №6 ДПС; правило 2026 року підтверджено рішенням №169-11/2021 і ДПС.',
        indexable:true,
        readiness:{placeVerified:true,safetyEligible:true,calculatorQaPassed:true,uniqueContentApproved:true,seoQaPassed:true},
      }:{}),
      editorial:{...place.editorial,...researchedDraft,...(place.slug==='polyana'?{
        rateConflict:{referenceRates:{domestic:0.4,inbound:1},basis:'Раніше передані довідкові дані відрізняються від деталізованих ставок у підписаній формі №6 ДПС.'},
      }:{}),...(place.slug==='kosyno-koson'?{
        title:'Туристичний збір у Косоні: ставка на перевірці',
        description:'Офіційна назва локації - село Косонь у Закарпатській області. Ставка туристичного збору на 2026 рік ще перевіряється за рішенням громади.',
        uniqueContent:'Цей запис відповідає селу Косонь у Косоньській громаді Закарпатської області. У робочому Excel воно підписане як «Косино (Косонь)», що може сплутати його з окремим селом Косино в іншій громаді. Код КАТОТТГ населеного пункту та громади звірено з офіційним довідником. Ставку туристичного збору та її період дії поки не підтверджено першоджерелом, тому калькулятор і публікація сторінки заблоковані.',
        seoBlock:{
          title:'Туристичний збір у селі Косонь: перевірка ставки та громади',
          intro:'Село Косонь у Закарпатській області входить до Косоньської територіальної громади. Його не слід плутати з окремим населеним пунктом Косино в Чинадіївській громаді. Код населеного пункту звірено, але місцеву ставку туристичного збору та період її дії ще потрібно підтвердити офіційним рішенням або підписаною формою ДПС.',
          sections:[
            {heading:'Як визначено населений пункт і громаду',paragraphs:['Офіційний довідник громад і територій вказує село Косонь із кодом КАТОТТГ UA21020170010067414 у складі Косоньської територіальної громади з кодом UA21020170000069101. У наданій робочій таблиці використано назву «Косино (Косонь)»; для цього запису застосовуємо офіційну назву Косонь і не переносимо на нього ставку сусідньої громади.']},
            {heading:'Чому калькулятор поки недоступний',paragraphs:['Для розрахунку потрібні чинне рішення ради або підписана форма №6 ДПС, яка підтверджує ставку, категорії платників і період застосування. Значення з робочої таблиці саме по собі не є першоджерелом. Поки відповідний документ не знайдено та не перевірено, суму туристичного збору для Косоні не показуємо.']},
          ],
        },
      }: {})},
    };
  }
  const seoSections=content.seoBlock?.sections??[];
  const calculationExample=reviewedCityCalculationExamples[place.slug];
  const hasInlineCalculationExample=seoSections.some(section=>/приклад розрахунку/i.test(section.heading||''));
  const seoSectionsWithExample=calculationExample&&!(hasInlineCalculationExample&&['yasinya','tyachiv','irpin','skole'].includes(place.slug))
    ?[...seoSections,calculationExample]
    :seoSections;
  return {
    ...place,
    ...(place.slug==='kyyiv'?{nameLocative:'Києві'}:{}),
    ...(place.slug==='dnipro'?{nameLocative:'Дніпрі'}:{}),
    ...(place.slug==='zhytomyr'?{nameLocative:'Житомирі'}:{}),
    ...(place.slug==='ivano-frankivsk'?{nameLocative:'Івано-Франківську'}:{}),
    ...(place.slug==='bar'?{nameLocative:'Барі'}:{}),
    ...(place.slug==='zaporizhzhya'?{nameLocative:'Запоріжжі'}:{}),
    ...(place.slug==='rivne'?{nameLocative:'Рівному'}:{}),
    ...(place.slug==='chernihiv'?{nameLocative:'Чернігові'}:{}),
    ...(place.slug==='kolomyya'?{nameLocative:'Коломиї'}:{}),
    ...(place.slug==='chernivtsi'?{nameLocative:'Чернівцях'}:{}),
    ...(place.slug==='lviv'?{nameLocative:'Львові'}:{}),
    ...(place.slug==='cherkasy'?{nameLocative:'Черкасах'}:{}),
    ...(place.slug==='berehove'?{nameLocative:'Береговому'}:{}),
    ...(place.slug==='uzhhorod'?{nameLocative:'Ужгороді'}:{}),
    ...(place.slug==='slavsko'?{nameLocative:'Славську'}:{}),
    ...(place.slug==='yasinya'?{nameLocative:'Ясіні'}:{}),
    ...(place.slug==='tyachiv'?{nameLocative:'Тячеві'}:{}),
    ...(place.slug==='irpin'?{nameLocative:'Ірпені'}:{}),
    ...(place.slug==='skole'?{nameLocative:'Сколе'}:{}),
    geoStatus:'ELIGIBLE',
    geoStatusReason:place.slug==='kyyiv'?'Місто Київ і Київську міську територіальну громаду зіставлено за офіційним КАТОТТГ UA80000000000093317; звіт ДПС за 2026 рік називає ту саму Київську міську раду, але в його коді є відмінність в одному нулі.':place.slug==='lviv'?'Місто Львів зіставлено з кодом КАТОТТГ міста й кодом Львівської міської громади у підписаній формі №6 ДПС на 2026 рік; дані КАТОТТГ імпортовані окремо.':place.slug==='cherkasy'?'Черкаси й Черкаську міську громаду зіставлено за офіційним КАТОТТГ; форма №6 ДПС окремо називає код громади, а місцева ставка на 2026 рік підтверджена формою ДПС і бюджетним прогнозом міськради.':place.slug==='dnipro'?'Місто Дніпро UA12020010010037010 та Дніпровську міську громаду UA12020010000033698 звірено з підписаною формою №6 ДПС від 30.01.2026.': 'Місце зіставлено з офіційним КАТОТТГ, громаду й чинне місцеве рішення туристичного збору підтверджено офіційними джерелами. Стаття 268 ПКУ не встановлює перевірку наказу №376 як умову туристичного збору.',
    indexable:place.slug!=='odesa',
    readiness:{placeVerified:true,safetyEligible:true,calculatorQaPassed:true,uniqueContentApproved:true,seoQaPassed:true},
    editorial:{...place.editorial,...content,...(['yasinya','tyachiv','irpin','skole'].includes(place.slug)?{rateConflict:{referenceRates:place.sourceRecord.proposedRates,basis:'Раніші довідкові значення відрізняються від ставки або дати в підписаній формі №6 ДПС на 2026 рік.'}}:{}),seoBlock:{...content.seoBlock,sections:seoSectionsWithExample}},
  };
});

export const touristTaxPlaces = Object.freeze([...verifiedTouristTaxPlaces,...reviewedPlaces]);

export function findTouristTaxPlace(query) {
  const normalized = String(query ?? '').trim().toLocaleLowerCase('uk-UA');
  if (!normalized) return [];
  return touristTaxPlaces.filter(place => place.name.toLocaleLowerCase('uk-UA').includes(normalized));
}

export function getTouristTaxPlace(slug) {
  return touristTaxPlaces.find(place => place.slug === slug) ?? null;
}

export function getTouristTaxCommunity(slug) {
  return touristTaxCommunities.find(community => community.slug === slug) ?? null;
}

export function getTouristTaxRule(place, communities=touristTaxCommunities) {
  return communities.find(community=>community.slug===place?.communitySlug)?.taxRule ?? null;
}

export function touristTaxCityRoutes() {
  return touristTaxPlaces.filter(place=>canIndexTouristTaxPlace(place)).map(place=>place.route);
}

export function canCalculateTouristTaxPlace(place, communities=touristTaxCommunities) {
  const rule=getTouristTaxRule(place,communities);
  const community=communities.find(item=>item.slug===place?.communitySlug);
  return Boolean(place&&isTouristTaxPlacePublished(place.slug)&&community?.katottgCode&&/^UA[A-Z0-9]{17}$/.test(community.katottgCode)&&place.geoStatus==='ELIGIBLE'&&rule?.status==='VERIFIED'&&rule?.sourceUrl&&rule?.effectiveFrom&&rule?.checkedAt&&place.readiness?.placeVerified&&place.readiness?.safetyEligible&&place.readiness?.calculatorQaPassed);
}

export function canSearchTouristTaxPlace(place, communities=touristTaxCommunities) {
  return Boolean(place&&place.slug&&place.name&&place.region&&place.geoStatus!=='EXCLUDED'&&communities.some(item=>item.slug===place.communitySlug));
}

export function hasPlaceSeoBlock(place) {
  const block=place?.editorial?.seoBlock;
  if(!block||typeof block.title!=='string'||!block.title.trim()||typeof block.intro!=='string'||!block.intro.includes(place.name)||block.intro.trim().length<100||!Array.isArray(block.sections)||block.sections.length<2)return false;
  return block.sections.every(section=>typeof section.heading==='string'&&section.heading.trim().length>=12&&Array.isArray(section.paragraphs)&&section.paragraphs.length>0&&section.paragraphs.every(paragraph=>typeof paragraph==='string'&&paragraph.trim().length>=100));
}

export function canIndexTouristTaxPlace(place, communities=touristTaxCommunities) {
  return Boolean(place&&place.indexable===true&&isTouristTaxPlacePublished(place.slug)&&canSearchTouristTaxPlace(place,communities)&&canCalculateTouristTaxPlace(place,communities)&&hasPlaceSeoBlock(place)&&place.readiness?.uniqueContentApproved&&place.readiness?.seoQaPassed);
}

// Backwards-compatible name for sitemap callers. Indexation has stricter gates than calculation.
export function isTouristTaxPlaceReady(place) {
  return canIndexTouristTaxPlace(place);
}

export function validateTouristTaxPlaces(places=touristTaxPlaces,communities=touristTaxCommunities){
  const errors=[],warnings=[],slugs=new Set(),settlementCodes=new Set();
  const communitySlugs=new Set(),communityCodes=new Set();
  const release=validateTouristTaxReleasePlan(new Set(places.map(place=>place.slug)));
  errors.push(...release.errors);
  const geoStates=new Set(['ELIGIBLE','EXCLUDED','REVIEW_REQUIRED']);
  const ruleStates=new Set(['UNKNOWN','SECONDARY_SOURCE_ONLY','COUNCIL_ACT_FOUND','LEGAL_REVIEW_REQUIRED','VERIFIED','STALE','CONFLICT']);
  for(const community of communities){
    if(!community.slug||communitySlugs.has(community.slug))errors.push(`duplicate or missing community slug: ${community.slug||'(empty)'}`);else communitySlugs.add(community.slug);
    if(!community.name)errors.push(`missing community name: ${community.slug}`);
    if(community.katottgCode){if(!/^UA[A-Z0-9]{17}$/.test(community.katottgCode))errors.push(`invalid community code format: ${community.slug}`);if(communityCodes.has(community.katottgCode))errors.push(`duplicate community code: ${community.katottgCode}`);communityCodes.add(community.katottgCode);}
    const rule=community.taxRule;
    if(!rule||!ruleStates.has(rule.status))errors.push(`missing or invalid tax rule state: ${community.slug}`);
    if(rule?.status==='VERIFIED'){
      const flatRates=rule.rates&&Number.isFinite(rule.rates.domestic)&&Number.isFinite(rule.rates.inbound);
      const thresholdSchedule=rule.rateSchedule&&Number.isFinite(rule.rateSchedule.thresholdUahPerPersonPerDay)&&['domestic','inbound'].every(category=>Array.isArray(rule.rateSchedule[category])&&rule.rateSchedule[category].some(tier=>['lt','gt'].includes(tier.operator)&&Number.isFinite(tier.ratePercent)&&tier.ratePercent>0));
      const bandSchedule=Array.isArray(rule.rateSchedule?.bands)&&rule.rateSchedule.bands.length>=2&&rule.rateSchedule.bands.every(band=>Number.isFinite(band.domesticRatePercent)&&band.domesticRatePercent>0&&Number.isFinite(band.inboundRatePercent)&&band.inboundRatePercent>0&&(['minPriceUahPerPersonPerDay','minPriceExclusiveUahPerPersonPerDay','maxPriceUahPerPersonPerDay'].some(key=>Number.isFinite(band[key]))));
      const accommodationTypeSchedule=rule.accommodationTypeRates&&Object.keys(rule.accommodationTypeRates).length>=2&&Object.values(rule.accommodationTypeRates).every(type=>Number.isFinite(type.domestic)&&type.domestic>0&&Number.isFinite(type.inbound)&&type.inbound>0&&typeof type.label==='string');
      const schedule=thresholdSchedule||bandSchedule||accommodationTypeSchedule;
      if(!community.katottgCode||!rule.sourceUrl||!rule.effectiveFrom||!rule.checkedAt||!rule.verificationBasis||(!flatRates&&!schedule))errors.push(`verified community rule is missing code/source/dates/verification basis/flat rates or supported schedule: ${community.slug}`);
    }
  }
  for(const place of places){
    if(!place.slug||slugs.has(place.slug))errors.push(`duplicate or missing slug: ${place.slug||'(empty)'}`);else slugs.add(place.slug);
    if(!place.name||!place.region||(place.geoStatus==='ELIGIBLE'&&!place.district&&place.slug!=='kyyiv'))errors.push(`missing settlement labels: ${place.slug}`);
    if(!geoStates.has(place.geoStatus))errors.push(`invalid geography state: ${place.slug}`);
    if(!communitySlugs.has(place.communitySlug))errors.push(`missing community reference: ${place.slug}`);
    if(place.katottgSettlementCode){if(!/^UA[A-Z0-9]{17}$/.test(place.katottgSettlementCode))errors.push(`invalid settlement code format: ${place.slug}`);if(settlementCodes.has(place.katottgSettlementCode))errors.push(`duplicate settlement code: ${place.katottgSettlementCode}`);settlementCodes.add(place.katottgSettlementCode);}
    else if(place.geoStatus==='ELIGIBLE')errors.push(`eligible place has no official KATOTTG code: ${place.slug}`);
    if(place.indexable&&!hasPlaceSeoBlock(place))errors.push(`indexable route is missing a substantive place-specific SEO block: ${place.slug}`);
    if(place.indexable&&!canIndexTouristTaxPlace(place,communities))errors.push(`indexable route has incomplete readiness gates: ${place.slug}`);
    const rule=getTouristTaxRule(place,communities);
    if(!rule||!ruleStates.has(rule.status)){errors.push(`missing or invalid tax rule state: ${place.slug}`);continue;}
    if(rule.status==='VERIFIED'){
      if(!communities.find(item=>item.slug===place.communitySlug)?.katottgCode||!rule.sourceUrl||!rule.effectiveFrom||!rule.checkedAt||!rule.verificationBasis)errors.push(`verified rule is missing code/source/dates/verification basis: ${place.slug}`);
      const categoryRates=rule.rates&&Number.isFinite(rule.rates.domestic)&&Number.isFinite(rule.rates.inbound);
      const accommodationTypeRates=rule.accommodationTypeRates&&Object.keys(rule.accommodationTypeRates).length>=2&&Object.values(rule.accommodationTypeRates).every(type=>Number.isFinite(type.domestic)&&type.domestic>0&&Number.isFinite(type.inbound)&&type.inbound>0&&typeof type.label==='string');
      if(!categoryRates&&!rule.rateSchedule&&!accommodationTypeRates)errors.push(`verified rule is missing category rates or supported rate schedule: ${place.slug}`);
    }
    if(place.geoStatus==='REVIEW_REQUIRED'||rule.status!=='VERIFIED')warnings.push(`${place.slug}: public amounts and indexing remain blocked (${place.geoStatus}; ${rule.status})`);
  }
  const counts={all:places.length,eligible:places.filter(place=>place.geoStatus==='ELIGIBLE').length,excluded:places.filter(place=>place.geoStatus==='EXCLUDED').length,reviewRequired:places.filter(place=>place.geoStatus==='REVIEW_REQUIRED').length};
  if(counts.all!==counts.eligible+counts.excluded+counts.reviewRequired)errors.push('geography state counts do not reconcile');
  return {ok:errors.length===0,errors,warnings,counts};
}
