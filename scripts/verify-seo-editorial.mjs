// Check the current rendered site, not the historical October snapshot. This
// deliberately performs no submissions, network calls or tax calculations.
import {pathToFileURL} from 'node:url';
import {renderRouteForReview} from './review-render.mjs';

const origin='https://www.vdalo.tech';
const practiceChecks=[
  ['/blog/yak-gotelyu-prodavaty-dodatkovi-poslugy','заповнений-приклад-картки-й-воронки',/вигадані для навчання/u,/Сніданок на терасі/u],
  ['/blog/pryami-bronyuvannya-ta-vidzhet-gotelyu','однакова-сума-бронювання-різні-витрати',/навчальному прикладі/u,/6 000 грн/u],
  ['/blog/perehid-na-pms-bez-vtraty-danyh','заповнений-приклад-відповідності-полів',/вигадані технічні значення/u,/DEMO-104/u],
  ['/blog/shakhmatka-bronyuvan-gotelyu','приклад-шахматки-на-сім-ночей',/навчальна таблиця з вигаданими бронюваннями/u,/Бронь A/u],
  ['/blog/channel-manager-ical-gotelyu','навчальний-журнал-затримки-обміну',/вигадані події одного тесту/u,/DEMO-01/u],
  ['/blog/pidhotovka-zaselennya-gostya','три-шаблони-повідомлень-перед-заїздом',/Замініть поля в квадратних дужках/u,/\[номер\]/u],
  ['/blog/shcho-avtomatyzuvaty-v-goteli-pershym','додаткова-матриця-для-обговорення-пріоритету',/значення шкал нижче суб’єктивні/iu,/повторюваність/u],
  ['/blog/status-gotovnosti-nomera-housekeeping','приклад-передачі-номера',/операційна модель/u,/Потрібне прибирання/u],
];
const decode=value=>String(value).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const ids=html=>[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>decode(m[1]));
const content=html=>html.match(/<main\b[\s\S]*?<\/main>/i)?.[0]??'';

export function checkPracticeSection(html,route,id,context,example){
  const body=content(html);
  const sections=[...body.matchAll(/<section\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi)];
  const section=sections.find(match=>decode(match[1])===id)?.[2]??'';
  const contents=[...body.matchAll(/<nav\b[^>]*aria-label="Зміст матеріалу"[^>]*>[\s\S]*?<\/nav>/gi)];
  const notes=[];
  if(!section||!/<h2\b/i.test(section))notes.push(`${route}: missing visible practice section ${id}`);
  if(!contents.length||contents.some(nav=>!nav[0].includes(`href="#${id}"`)))notes.push(`${route}: missing contents link to ${id}`);
  if(!context.test(section))notes.push(`${route}: missing explanation of practice data`);
  if(!example.test(section))notes.push(`${route}: missing practice example`);
  // Preserve the former public anchor even when the rewritten contents links to
  // the new section instead. A hidden alias alone is not a visible example.
  if(!ids(body).includes('practice'))notes.push(`${route}: missing legacy practice anchor`);
  return notes;
}

export function checkResearchEvidence(html){
  const text=decode(content(html).replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ');
  const notes=[];
  if(!/не містить повної первинної таблиці/u.test(text))notes.push('Research case: missing disclosure about primary data');
  // The revised case may quote the author's percentages only while clearly
  // explaining why this subgroup result cannot yet be verified.
  if(/87%/u.test(text)&&!/13%[^.]*87%[^.]*\.\s*Але[^.]*не звірено[^.]*\.\s*Без знаменника[^.]*не можна перевірити/u.test(text)){
    notes.push('Research case: 87% appears without the verification caveat');
  }
  return notes;
}

export async function auditEditorialSite(request=renderRouteForReview){
  const cache=new Map();
  const get=async route=>{
    if(!cache.has(route))cache.set(route,await request(route));
    return cache.get(route);
  };
  const errors=[];
  const sitemap=await get('/sitemap.xml');
  if(sitemap.status!==200)throw new Error(`sitemap HTTP ${sitemap.status}`);
  const paths=[...sitemap.html.matchAll(/<loc>https:\/\/www\.vdalo\.tech([^<]*)<\/loc>/g)].map(m=>decode(m[1]));
  if(!paths.length)throw new Error('No local sitemap routes found');
  if(new Set(paths).size!==paths.length)errors.push('Duplicate sitemap routes');
  const pages=paths.filter(route=>!/^\/(?:hotel-|solutions$|integrations$|pricing$|sign-up$|guest-communication$|q|go\/|funnel|\d|k3|tourist-tax\/start)/.test(route)&&route!=='/');
  const assets=new Set();
  let anchors=0,links=0;
  for(const route of pages){
    const page=await get(route);
    if(page.status!==200){errors.push(`${route}: HTTP ${page.status}`);continue;}
    const html=page.html;
    const ogImages=[...html.matchAll(/<meta property="og:image" content="([^"]*)"/g)];
    if(ogImages.length!==1)errors.push(`${route}: ${ogImages.length} OG images`);
    const pageIds=ids(html);
    const duplicates=pageIds.filter((id,i)=>pageIds.indexOf(id)!==i);
    if(duplicates.length)errors.push(`${route}: duplicate IDs ${[...new Set(duplicates)].join(', ')}`);
    const main=content(html);
    if(!main){errors.push(`${route}: missing main content`);continue;}
    for(const match of main.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)){
      const href=decode(match[1]);
      let url;
      try {url=new URL(href,origin+route);}catch{errors.push(`${route}: invalid link ${href}`);continue;}
      if(url.origin!==origin)continue;
      const targetRoute=url.pathname+url.search;
      let target=targetRoute===route?page:await get(targetRoute);
      if(target.status>=300&&target.status<400){
        const location=target.headers.Location??target.headers.location;
        if(!location){errors.push(`${route}: redirect without Location ${href}`);continue;}
        const redirected=new URL(location,origin+targetRoute);
        if(redirected.origin!==origin)continue;
        target=await get(redirected.pathname+redirected.search);
      }
      links++;
      if(target.status!==200){errors.push(`${route}: link ${href} HTTP ${target.status}`);continue;}
      if(url.hash){
        anchors++;
        let id;
        try{id=decodeURIComponent(url.hash.slice(1));}catch{errors.push(`${route}: malformed anchor ${href}`);continue;}
        if(!ids(target.html).includes(id))errors.push(`${route}: missing anchor ${href}`);
      }
    }
    for(const match of html.matchAll(/<(?:img|link)\b[^>]*(?:src|href)="(\/(?:v1\/)?(?:assets\/[^"?]*|editorial-seo\.css))[^"\s]*"/g))assets.add(match[1]);
  }
  for(const route of assets){const response=await get(route);if(response.status!==200)errors.push(`${route}: asset HTTP ${response.status}`);}
  for(const [route,id,context,example] of practiceChecks){
    if(!paths.includes(route))errors.push(`${route}: practice page missing from sitemap`);
    const page=await get(route);
    if(page.status!==200)errors.push(`${route}: practice page HTTP ${page.status}`);
    else errors.push(...checkPracticeSection(page.html,route,id,context,example));
  }
  const research=(await get('/cases/booking-widget-study-2118')).html;
  errors.push(...checkResearchEvidence(research));
  const odesa=await get('/tourist-tax/odesa/');
  if(odesa.status!==200||!/<meta name="robots" content="index,follow"/.test(odesa.html)||!paths.includes('/tourist-tax/odesa/'))errors.push('Odesa: route, indexation or sitemap entry is incorrect');
  const contact=(await get('/contact')).html;
  if(!/href="tel:\+380939082254"/.test(contact)||!/href="https:\/\/t.me\/tripailo_ads"/.test(contact))errors.push('Contact links are missing');
  if(/1238-mr\.zip/.test((await get('/tourist-tax/sumy/')).html))errors.push('Sumy: outdated source link');
  const stylesheet=await get('/v1/editorial-seo.css');
  const type=stylesheet.headers['Content-Type']??stylesheet.headers['content-type']??'';
  if(stylesheet.status!==200||!/text\/css/.test(type))errors.push('Editorial stylesheet is unavailable or has the wrong type');
  const redirects=[];
  for(const slug of ['qr-kody-dlya-goteliv','qr-wifi-dlya-gotelyu','qr-kartka-v-nomer-gotelyu']){
    const path=`/blog/${slug}/?utm_source=seo-qa`,response=await get(path);
    const location=response.headers.Location??response.headers.location;
    if(![301,302,307,308].includes(response.status)||location!==`/blog/${slug}?utm_source=seo-qa`)errors.push(`${path}: redirect does not preserve UTM`);
    redirects.push(path);
  }
  return {sitemapRoutes:paths.length,pages:pages.length,anchors,internalLinks:links,assets:assets.size,practiceArticles:practiceChecks.length,redirects,errors};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const report=await auditEditorialSite();
  console.log(JSON.stringify(report,null,2));
  if(report.errors.length)process.exitCode=1;
}
