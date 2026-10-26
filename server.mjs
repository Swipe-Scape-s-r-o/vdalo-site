import http from 'node:http';
import {offers} from './microlandings/content.mjs';
import {renderMicrolanding,renderDirectory,renderFunnelPrivacy} from './microlandings/render.mjs';
import {renderSmsGo} from './microlandings/sms-go.mjs';
import {renderQuizPage} from './microlandings/quiz.mjs';
import {renderSmsTrial} from './microlandings/sms-trial.mjs';
import {handleFunnelLead} from './microlandings/leads.mjs';
import {renderVideoLanding,renderCalculator,assetNames} from './microlandings/top5.mjs';
import {handleTop5Lead} from './microlandings/top5-leads.mjs';
import {renderRobotFunnel,robotFunnelRoutes,robotFunnelLegacyRoutes,robotFunnelAssetRoot} from './microlandings/robot-funnels.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderPage as firstPage} from './versions/v1/render.mjs';
import {server as leadServer,privacyPage} from './versions/v1/server.mjs';
import {renderCaseList,renderCase,caseSlugs,caseLastUpdated} from './versions/v1/cases.mjs';
import {renderBlogPage} from './versions/v1/blog.mjs';
import {renderEditorialArticle,editorialArticles,articleDates} from './versions/v1/article-library.mjs';
import {renderSecondPassArticle,secondPassArticles,modifiedAt as secondPassModifiedAt} from './versions/v1/article-second-pass.mjs';
import {renderPmsArticle,pmsArticle} from './versions/v1/article-pms.mjs';
import {renderPmsChoiceArticle,pmsChoiceArticle} from './versions/v1/article-pms-choice.mjs';
import {renderToolsIndex,renderPmsChecklist,renderHotelProfitabilityCalculator,renderDirectBookingCostCalculator,renderHotelRoomCostCalculator,renderHousekeepingChecklist} from './versions/v1/tools.mjs';
import {handlePmsReport} from './versions/v1/pms-report.mjs';
import {renderSeoPage,seoRoutes} from './versions/v1/seo-pages.mjs';
import {homeCssBundle,siteCssBundle,assetVersion} from './versions/v1/assets.mjs';
import {withSiteTrialOffer} from './versions/v1/trial-offer.mjs';
import {renderOfferPage,renderRefundPage} from './versions/v1/legal.mjs';
import {renderAuthorPage,renderKostiantynAuthorPage,renderAuthorsDirectory} from './versions/v1/author-page.mjs';
import {handleWayForPay} from './payments/wayforpay.mjs';
import {applySitewideSchema} from './versions/v1/schema.mjs';
import {getPublicSitemapRoutes,serializeSitemapXml} from './versions/v1/sitemap.mjs';
import {renderResourceLibrary,getPublicResource} from './versions/v1/resource-library.mjs';
import {renderAdminTimeCalculator,renderWebsiteChecklist,renderGuestMessageBuilder,renderHousekeepingWorkloadCalculator,renderCancellationCalculator,renderReviewReplyTemplates} from './versions/v1/advanced-tools.mjs';
import {renderTouristTaxHub,renderTouristTaxCity,renderTouristTaxRates,handleTouristTaxCalculation} from './versions/v1/tourist-tax.mjs';
import {normalizeNonproductMetadata} from './versions/v1/nonproduct-seo.mjs';
import {applyPreparedContent,revisionRoutes,revisionDate} from './versions/v1/content-revisions/content.mjs';
import {renderTouristTaxFunnel} from './microlandings/tourist-tax-funnel.mjs';
import {touristTaxCityRoutes,touristTaxPlaces,getTouristTaxPlace,getTouristTaxRule} from './versions/v1/tourist-tax-data.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
if(!process.env.VERCEL && existsSync(path.join(root,'.env')) && process.loadEnvFile)process.loadEnvFile(path.join(root,'.env'));
const types={'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp4':'video/mp4','.webm':'video/webm','.json':'application/json; charset=utf-8','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.woff2':'font/woff2'};
const gtmHead=`<script>(function(w,d,s,l,i){w.__vdaloLoadGoogleTags=function(){if(w.__vdaloGoogleTagsLoaded)return;w.__vdaloGoogleTagsLoaded=true;w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;d.head.appendChild(j);};if(w.vdaloConsent&&w.vdaloConsent.getPreferences().analytics)w.__vdaloLoadGoogleTags();})(window,document,'script','dataLayer','GTM-PKDT7MMT');</script>`;
const calloAttributionPrelude=`<script>(function(){try{var url=new URL(window.location.href),tag=url.searchParams.get('t');if(tag){window.__vdaloCalloTag=tag;url.searchParams.delete('t');history.replaceState(history.state,'',url.pathname+(url.search?url.search:'')+url.hash);}}catch(_){}})();</script>`;
const faviconLink='<link rel="icon" href="/v1/assets/favicon.svg" type="image/svg+xml">';
const touristTaxRoutes=['/tourist-tax/','/tourist-tax/rates/','/tourist-tax/start',...touristTaxCityRoutes()];
const publicSitemapRoutes=getPublicSitemapRoutes({seoRoutes:seoRoutes(),caseSlugs,pmsArticle,pmsChoiceArticle,editorialArticles,secondPassArticles,touristTaxRoutes});
const indexableSchemaRoutes=new Set(publicSitemapRoutes);
// Ordinary published pages opt in. Campaign /q*, /k*, /go*, numeric video,
// Advertising funnels stay outside this set. /tourist-tax/start is an indexable guide page.
const trialOfferRoutes=new Set([...publicSitemapRoutes.filter(route=>route!=='/tourist-tax/start'),...touristTaxPlaces.map(place=>place.route),'/v1/','/v1/privacy','/tools/qr-studio/index.html']);
const sitemapLastModifiedByRoute=new Map([
 ['/authors/kostiantyn-tripailo','2026-10-23'],
 ['/partners','2026-10-24'],
 [pmsArticle.slug,pmsArticle.dateModified],
 [pmsChoiceArticle.slug,pmsChoiceArticle.dateModified],
 ...editorialArticles.map(article=>[article.slug,articleDates[article.slug]?.modified]),
 ...secondPassArticles.map(article=>[article.slug,article.modifiedDate??secondPassModifiedAt]),
 ...caseSlugs.map(route=>[route,caseLastUpdated]),
 ...revisionRoutes.map(route=>[route,revisionDate]),
]);
function sitemapXml(){
 const lastModified=new Map(sitemapLastModifiedByRoute);
 for(const route of publicSitemapRoutes){
  const citySlug=route.match(/^\/tourist-tax\/([a-z0-9-]+)\/$/)?.[1];
  const place=citySlug?getTouristTaxPlace(citySlug):null;
  const checkedAt=place?getTouristTaxRule(place)?.checkedAt:null;
  if(checkedAt)lastModified.set(route,checkedAt);
 }
 return serializeSitemapXml(publicSitemapRoutes,lastModified);
}
function withSocialMetadata(html){
 const title=html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim()||'VDALO';
 const description=html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1]?.trim()||'';
 const canonical=html.match(/<link\s+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)?.[1]||`https://www.vdalo.tech${html.match(/<body[^>]*data-route=["']([^"']+)["']/i)?.[1]||''}`;
 const shorten=(value,max)=>value.length>max?`${value.slice(0,max-1).replace(/\s+\S*$/,'')}…`:value;
 const defaults=[
  ['property','og:type','website'],['property','og:site_name','VDALO'],['property','og:locale','uk_UA'],
  ['property','og:title',shorten(title,70)],['property','og:description',shorten(description,200)],['property','og:url',canonical],
  ['property','og:image','https://www.vdalo.tech/v1/assets/og-1200x630.png'],['property','og:image:alt','VDALO для власників і команд готелів'],
  ['name','twitter:card','summary_large_image'],['name','twitter:title',shorten(title,70)],
  ['name','twitter:description',shorten(description,200)],['name','twitter:image','https://www.vdalo.tech/v1/assets/og-1200x630.png'],
 ];
 const missing=defaults.filter(([attribute,name])=>!new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${name}["'])`,'i').test(html))
  .map(([attribute,name,value])=>`<meta ${attribute}="${name}" content="${value}">`).join('');
 return missing?html.replace(/<\/head>/i,`${missing}</head>`):html;
}
function withTagManager(html){
 const withSocial=withSocialMetadata(html);
 const withFavicon=withSocial.replace(/<head(?:\s[^>]*)?>/i,opening=>opening+(/<link\b[^>]*\brel=["'][^"']*\bicon\b[^"']*["'][^>]*>/i.test(withSocial)?'':faviconLink));
 const consentAssets=`<link rel="stylesheet" href="/v1/clarity-consent.css?v=${assetVersion('clarity-consent.css')}"><script src="/v1/clarity-consent.js?v=${assetVersion('clarity-consent.js')}"></script>`;
 const calloPrelude=/<body[^>]*\bdata-code=/i.test(withFavicon)?calloAttributionPrelude:'';
 return withFavicon.replace(/<head(?:\s[^>]*)?>/i,opening=>opening+calloPrelude+consentAssets+gtmHead);
}
function send(res,status,text,type='text/html; charset=utf-8',method='GET'){
 const body=type.toLowerCase().startsWith('text/html')?withSiteTrialOffer(withTagManager(applySitewideSchema(normalizeNonproductMetadata(applyPreparedContent(text,res._schemaPath||''),res._schemaPath||''),res._schemaPath||'',indexableSchemaRoutes)),status===200&&trialOfferRoutes.has(res._schemaPath)):text;
 const publicHtml=type.toLowerCase().startsWith('text/html')&&res._allowPublicCache&&indexableSchemaRoutes.has(res._schemaPath);
 res.writeHead(status,{'Content-Type':type,'Cache-Control':publicHtml?'public, max-age=0, s-maxage=300, stale-while-revalidate=86400':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'});res.end(method==='HEAD'?undefined:body);
}
function sendCompressed(req,res,status,data,type,cache='no-store'){
 const isHtml=type.toLowerCase().startsWith('text/html');
 const source=isHtml?withSiteTrialOffer(withTagManager(applySitewideSchema(normalizeNonproductMetadata(applyPreparedContent(Buffer.isBuffer(data)?data.toString('utf8'):data,res._schemaPath||''),res._schemaPath||''),res._schemaPath||'',indexableSchemaRoutes)),status===200&&trialOfferRoutes.has(res._schemaPath)):data;
 if(isHtml&&res._allowPublicCache&&indexableSchemaRoutes.has(res._schemaPath))cache='public, max-age=0, s-maxage=300, stale-while-revalidate=86400';
 const body=Buffer.isBuffer(source)?source:Buffer.from(source);
 const compressed=body.length>=1024&&/\bgzip\b/.test(req.headers['accept-encoding']||'');
 res.writeHead(status,{'Content-Type':type,'Cache-Control':cache,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Vary':'Accept-Encoding',...(compressed?{'Content-Encoding':'gzip'}:{})});
 if(req.method==='HEAD')return res.end();
 res.end(compressed?gzipSync(body,{level:6}):body);
}
function sendVideo(req,res,data){
 const size=data.length,range=req.headers.range;
 let status=200,start=0,end=size-1;
 if(range){
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${size}`,'Accept-Ranges':'bytes'});return res.end();}
  if(!match[1]){const suffix=Number(match[2]);start=Math.max(0,size-suffix);}
  else start=Number(match[1]);
  if(match[1]&&match[2])end=Math.min(Number(match[2]),size-1);
  if(start>=size||end<start){res.writeHead(416,{'Content-Range':`bytes */${size}`,'Accept-Ranges':'bytes'});return res.end();}
  status=206;
 }
 const body=status===206?data.subarray(start,end+1):data;
 res.writeHead(status,{'Content-Type':'video/mp4','Content-Length':body.length,'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes',...(status===206?{'Content-Range':`bytes ${start}-${end}/${size}`}:{})});
 res.end(req.method==='HEAD'?undefined:body);
}
function prefix(html,version){return html.replace(/\b(src|href|action|poster)="\/([^\"]*)"/g,(match,attribute,path)=>{if(path.startsWith('/')||path.startsWith('v1/')||path.startsWith('v2/')||path.startsWith('v3/'))return match;if(attribute==='href'&&(/^(?:$|#|privacy(?:\/|$)|offer(?:\/|$)|refunds?(?:\/|$)|cases(?:\/|$)|blog(?:\/|$)|authors(?:\/|$)|tools(?:\/|$)|resources(?:\/|$)|downloads\/hotel\/|solutions(?:\/|$)|integrations(?:\/|$)|pricing(?:\/|$)|hotel-[a-z0-9-]+(?:\/|$)|guest-communication(?:\/|$)|hotel-automation(?:\/|$)|about(?:\/|$)|partners(?:\/|$)|contact(?:\/|$)|tourist-tax(?:\/|$)|sign-up(?:\/|$)|registration(?:\/|$))/.test(path)))return match;return `${attribute}="/${version}/${path}"`;});}
function renderNotFound(){
 return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Сторінку не знайдено | VDALO</title><meta name="robots" content="noindex,follow"><link rel="stylesheet" href="/v1/site.css"></head><body><header class="site-header"><a href="/" aria-label="VDALO, на головну"><img src="/v1/assets/vdalo-canonical-496.png" width="124" height="41" alt="VDALO"></a></header><main id="main" class="wrap" style="min-height:65vh;display:grid;align-content:center;gap:1rem"><p class="eyebrow">VDALO · 404</p><h1>Сторінку не знайдено</h1><p>Можливо, адресу змінено. Перейдіть на головну або відкрийте довідник туристичного збору.</p><p><a class="button primary" href="/">На головну</a> <a class="button outline" href="/tourist-tax/">Туристичний збір</a></p></main></body></html>`;
}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const shortlinkPrefix=url.pathname==='/r'||url.pathname.startsWith('/r/')||url.pathname==='/q/r'||url.pathname.startsWith('/q/r/');
  if(shortlinkPrefix){
   const match=/^\/(?:q\/)?r\/([A-Za-z0-9]{4,16})$/.exec(url.pathname);
   if(!match)return send(res,404,'Не знайдено.','text/plain; charset=utf-8');
   res.writeHead(302,{'Location':`https://app.vdalo.tech/r/${match[1]}`,'Cache-Control':'no-store'});
   return res.end();
  }
  const pathname=decodeURIComponent(url.pathname);
  res._schemaPath=pathname;
  res._allowPublicCache=req.method==='GET'&&!url.search;
  // Keep the original payment endpoint working for pages opened under /v1.
  // Some checkout links still submit to /v1/api/payments/* instead of /api/payments/*.
  const paymentPath=pathname.startsWith('/v1/api/payments/')?pathname.slice(3):pathname;
  if(paymentPath.startsWith('/api/payments/'))return await handleWayForPay(req,res,paymentPath);
  if(pathname==='/api/tourist-tax/calculate')return await handleTouristTaxCalculation(req,res);
  if(pathname==='/api/funnel/leads')return await handleFunnelLead(req,res);
  if(pathname==='/api/funnels/top5')return await handleTop5Lead(req,res);
  if(pathname==='/api/tools/pms-report')return await handlePmsReport(req,res);
  if(req.method==='POST' && /^\/api\/leads\/(trial|audit)$/.test(pathname))return leadServer.emit('request',req,res);
  if(!['GET','HEAD'].includes(req.method))return send(res,405,'Метод недоступний.','text/plain; charset=utf-8');
  if(pathname==='/tourist-tax'){res.writeHead(308,{Location:'/tourist-tax/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tourist-tax/start/') {res.writeHead(308,{Location:'/tourist-tax/start'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tourist-tax/start')return send(res,200,renderTouristTaxFunnel());
  if(pathname==='/tourist-tax/rates/')return send(res,200,renderTouristTaxRates(),'text/html; charset=utf-8',req.method);
  if(pathname==='/tourist-tax/')return send(res,200,renderTouristTaxHub(),'text/html; charset=utf-8',req.method);
  if(/^\/tourist-tax\/[^/]+$/.test(pathname)){res.writeHead(308,{Location:pathname+'/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  const touristTaxCity=pathname.match(/^\/tourist-tax\/([a-z0-9-]+)\/$/);
  if(touristTaxCity){const page=renderTouristTaxCity(touristTaxCity[1]);if(page)return send(res,200,page,'text/html; charset=utf-8',req.method);}
  if(/^\/tourist-tax-assets\/tourist-tax(?:-interactions|-rates)?\.(?:css|js)$/.test(pathname)){
   const filename=path.join(root,'versions','v1','public',path.basename(pathname));const data=await readFile(filename);
   res.writeHead(200,{'Content-Type':types[path.extname(filename)],'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:data);
  }
  if(/^\/k[1-5]$/.test(pathname))return send(res,200,await renderCalculator(url.searchParams,pathname));
  if(/^\/k[1-5]\/$/.test(pathname)){res.writeHead(308,{Location:pathname.slice(0,-1)+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/k'||pathname==='/k/')return send(res,200,await renderCalculator(url.searchParams,'/k1'));
  if(/^\/(?:go\/)?(?:[1-9]|[1-5]\d)\/?$/.test(pathname))return send(res,200,await renderVideoLanding(url.searchParams,pathname));
  if(pathname==='/go/index.html')return send(res,200,await renderVideoLanding(url.searchParams,'/53'));
  if(pathname==='/k/index.html')return send(res,200,await renderCalculator(url.searchParams,'/k1'));
  if(pathname==='/cases/hotel-ai-reception'||pathname==='/cases/hotel-ai-reception/') {res.writeHead(308,{Location:`/cases/night-self-checkin-germany${url.search}`,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/cases/' || caseSlugs.some(slug=>pathname===`${slug}/`)) {res.writeHead(308,{Location:pathname.slice(0,-1)+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/cases')return send(res,200,prefix(renderCaseList(),'v1'));
  if(caseSlugs.includes(pathname))return send(res,200,prefix(renderCase(pathname.slice('/cases/'.length)),'v1'));
  if(pathname==='/blog')return send(res,200,prefix(renderBlogPage({origin:'https://www.vdalo.tech'}),'v1'));
  if(pathname==='/authors/'){res.writeHead(308,{Location:'/authors'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/authors')return send(res,200,prefix(renderAuthorsDirectory(),'v1'));
  if(pathname==='/authors/oleh-stepeniev/'){res.writeHead(308,{Location:'/authors/oleh-stepeniev'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/authors/oleh-stepeniev')return send(res,200,prefix(renderAuthorPage(),'v1'));
  if(pathname==='/authors/kostiantyn-tripailo/'){res.writeHead(308,{Location:'/authors/kostiantyn-tripailo'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/authors/kostiantyn-tripailo')return send(res,200,prefix(renderKostiantynAuthorPage(),'v1'));
  if(pathname==='/tools/qr-studio'){res.writeHead(308,{Location:`/tools/qr-studio/${url.search}`,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname.startsWith('/tools/qr-studio/')){
   const qrDist=path.resolve(root,'qr-lab','dist');
   const relativePath=pathname.slice('/tools/qr-studio/'.length)||'index.html';
   const filename=path.resolve(qrDist,relativePath);
   if(!filename.startsWith(`${qrDist}${path.sep}`))return send(res,404,'Не знайдено.');
   try{
    const data=await readFile(filename);
    if(filename===path.join(qrDist,'index.html'))return sendCompressed(req,res,200,data,'text/html; charset=utf-8');
    const extension=path.extname(filename).toLowerCase();
    const cache=/\.[a-f0-9]{8,}\./i.test(filename)?'public, max-age=31536000, immutable':'public, max-age=604800';
    res.writeHead(200,{'Content-Type':types[extension]||'application/octet-stream','Cache-Control':cache,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});
    return res.end(req.method==='HEAD'?undefined:data);
   }catch(error){if(error.code!=='ENOENT')throw error;return send(res,404,'Не знайдено.');}
  }
  if(pathname==='/tools'){res.writeHead(308,{Location:'/tools/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/')return send(res,200,prefix(renderToolsIndex(),'v1'));
  if(pathname==='/tools/pms-checklist'){res.writeHead(308,{Location:'/tools/pms-checklist/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/pms-checklist/')return send(res,200,prefix(renderPmsChecklist(),'v1'));
  if(pathname==='/tools/hotel-profitability-calculator'){res.writeHead(308,{Location:'/tools/hotel-profitability-calculator/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/hotel-profitability-calculator/')return send(res,200,prefix(renderHotelProfitabilityCalculator(),'v1'));
  if(pathname==='/tools/direct-booking-cost-calculator'){res.writeHead(308,{Location:'/tools/direct-booking-cost-calculator/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/direct-booking-cost-calculator/')return send(res,200,prefix(renderDirectBookingCostCalculator(),'v1'));
  if(pathname==='/tools/hotel-room-cost-calculator'){res.writeHead(308,{Location:'/tools/hotel-room-cost-calculator/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/hotel-room-cost-calculator/')return send(res,200,prefix(renderHotelRoomCostCalculator(),'v1'));
  if(pathname==='/tools/housekeeping-checklist'){res.writeHead(308,{Location:'/tools/housekeeping-checklist/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/housekeeping-checklist/')return send(res,200,prefix(renderHousekeepingChecklist(),'v1'));
  if(pathname==='/tools/hotel-admin-time-calculator'){res.writeHead(308,{Location:'/tools/hotel-admin-time-calculator/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/hotel-admin-time-calculator/')return send(res,200,prefix(renderAdminTimeCalculator(),'v1'));
  if(pathname==='/tools/hotel-website-checklist'){res.writeHead(308,{Location:'/tools/hotel-website-checklist/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/hotel-website-checklist/')return send(res,200,prefix(renderWebsiteChecklist(),'v1'));
  if(pathname==='/tools/guest-message-builder'){res.writeHead(308,{Location:'/tools/guest-message-builder/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/guest-message-builder/')return send(res,200,prefix(renderGuestMessageBuilder(),'v1'));
  if(pathname==='/tools/housekeeping-workload-calculator'){res.writeHead(308,{Location:'/tools/housekeeping-workload-calculator/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/housekeeping-workload-calculator/')return send(res,200,prefix(renderHousekeepingWorkloadCalculator(),'v1'));
  if(pathname==='/tools/hotel-cancellation-cost-calculator'){res.writeHead(308,{Location:'/tools/hotel-cancellation-cost-calculator/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/hotel-cancellation-cost-calculator/')return send(res,200,prefix(renderCancellationCalculator(),'v1'));
  if(pathname==='/tools/hotel-review-response'){res.writeHead(308,{Location:'/tools/hotel-review-response/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/hotel-review-response/')return send(res,200,prefix(renderReviewReplyTemplates(),'v1'));
  if(pathname==='/resources/'){res.writeHead(308,{Location:'/resources'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/resources')return send(res,200,prefix(renderResourceLibrary(),'v1'));
  const publicResourceMatch=pathname.match(/^\/downloads\/hotel\/([A-Za-z0-9_.-]+)$/);
  if(publicResourceMatch){const resource=await getPublicResource(publicResourceMatch[1]);if(!resource)return send(res,404,'Не знайдено.','text/plain; charset=utf-8');res.writeHead(200,{'Content-Type':resource.type,'Content-Length':resource.data.length,'Content-Disposition':`attachment; filename="${resource.filename}"`,'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:resource.data);}
  if(pathname===pmsChoiceArticle.slug+'/'){res.writeHead(308,{Location:pmsChoiceArticle.slug+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname===pmsChoiceArticle.slug)return send(res,200,prefix(renderPmsChoiceArticle(),'v1'));
  if(pathname==='/blog/' ){res.writeHead(308,{Location:'/blog'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname===pmsArticle.slug+'/'){res.writeHead(308,{Location:pmsArticle.slug+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname===pmsArticle.slug)return send(res,200,prefix(renderPmsArticle(),'v1'));
  if(editorialArticles.some(article=>pathname===`${article.slug}/`)){res.writeHead(308,{Location:pathname.slice(0,-1)+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(editorialArticles.some(article=>article.slug===pathname))return send(res,200,prefix(renderEditorialArticle(pathname),'v1'));
  if(secondPassArticles.some(article=>pathname===`${article.slug}/`)){res.writeHead(308,{Location:pathname.slice(0,-1)+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(secondPassArticles.some(article=>article.slug===pathname))return send(res,200,prefix(renderSecondPassArticle(pathname),'v1'));
  if(pathname==='/registration'||pathname==='/registration/'){res.writeHead(308,{Location:'/sign-up'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(seoRoutes().includes(pathname))return send(res,200,prefix(renderSeoPage(pathname),'v1'));
  if(seoRoutes().includes(pathname.slice(0,-1))&&pathname.endsWith('/')){res.writeHead(308,{Location:pathname.slice(0,-1)+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/privacy')return send(res,200,prefix(privacyPage(),'v1'));
  if(pathname==='/offer')return send(res,200,prefix(renderOfferPage(),'v1'));
  if(pathname==='/refunds')return send(res,200,prefix(renderRefundPage(),'v1'));
  if(pathname==='/')return sendCompressed(req,res,200,prefix(firstPage({origin:'https://www.vdalo.tech',full:true,homepage:true}),'v1'),'text/html; charset=utf-8');
  if(pathname==='/robots.txt')return send(res,200,'User-agent: *\nAllow: /\nSitemap: https://www.vdalo.tech/sitemap.xml\n','text/plain; charset=utf-8');
  if(pathname==='/sitemap.xml')return send(res,200,sitemapXml(),'application/xml; charset=utf-8');
  if(pathname==='/llms.txt')return send(res,200,`# VDALO\n\n> Українська платформа для керування готельними бронюваннями та щоденними процесами.\n\n## Основні сторінки\n\n${publicSitemapRoutes.map(route=>`- https://www.vdalo.tech${route}`).join('\n')}\n\n## Дані про сайт\n\n- Мова основного сайту: українська.\n- Довідник туристичного збору містить лише опубліковані сторінки з перевіреними ставками.\n- Перед застосуванням ставки звіряйте місцеве рішення та офіційні джерела на відповідній сторінці.\n- XML sitemap: https://www.vdalo.tech/sitemap.xml\n`,'text/plain; charset=utf-8');
  if(pathname==='/funnel')return send(res,200,renderDirectory());
  if(pathname==='/funnel/privacy')return send(res,200,renderFunnelPrivacy());
  if(pathname==='/q/') {res.writeHead(308,{Location:'/q'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/q')return send(res,200,renderQuizPage(url.searchParams));
  if(pathname.startsWith('/q')&&pathname.endsWith('/')){const slug=pathname.slice(1,-1),canonical=robotFunnelLegacyRoutes.get(slug)||slug;if(robotFunnelRoutes.has(canonical)){res.writeHead(308,{Location:`/${canonical}${url.search}`,'Cache-Control':'public, max-age=300'});return res.end();}}
  if(pathname.startsWith('/q')&&robotFunnelLegacyRoutes.has(pathname.slice(1))){res.writeHead(308,{Location:`/${robotFunnelLegacyRoutes.get(pathname.slice(1))}${url.search}`,'Cache-Control':'public, max-age=300'});return res.end();}
  const funnelCode=robotFunnelRoutes.get(pathname.slice(1));
  if(funnelCode)return send(res,200,await renderRobotFunnel(funnelCode,url.searchParams));
  if(pathname.startsWith('/lp-assets/video/')){
   const filename=path.basename(pathname),assetPath=path.join(robotFunnelAssetRoot,filename);
   if(!/^[a-zA-Z0-9_.-]+$/.test(filename)||path.dirname(assetPath)!==robotFunnelAssetRoot)return send(res,404,'Не знайдено.','text/plain; charset=utf-8');
   try{const data=await readFile(assetPath);if(filename.endsWith('.mp4'))return sendVideo(req,res,data);res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:data);}catch(error){if(error.code!=='ENOENT')throw error;return send(res,404,'Не знайдено.','text/plain; charset=utf-8');}
  }
  if(/^\/robot-funnel-assets\/robot-funnels\.(?:css|js)$/.test(pathname)){
   const filename=path.join(root,'microlandings','public',path.basename(pathname)),data=await readFile(filename);res.writeHead(200,{'Content-Type':types[path.extname(filename)],'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:data);
  }
  if(pathname==='/go/') {res.writeHead(308,{Location:'/go'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/go')return send(res,200,renderSmsGo(url.searchParams));
  if(pathname==='/go/trial')return send(res,200,renderSmsTrial(url.searchParams));
  const top5Asset=pathname.match(/^\/sms-trial-assets\/top5\/([a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)?)$/);
  if(top5Asset&&assetNames.has(top5Asset[1])){
   const filename=path.join(root,'microlandings','public','top5',top5Asset[1]),data=await readFile(filename);
   if(pathname.endsWith('.mp4'))return sendVideo(req,res,data);
   res.writeHead(200,{'Content-Type':types[path.extname(filename)],'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:data);
  }
  if(pathname==='/sms-trial-assets/sms-documents-tourist-levy.mp4'){
   const data=await readFile(path.join(root,'microlandings','public','sms-documents-tourist-levy.mp4'));return sendVideo(req,res,data);
  }
  if(/^\/sms-trial-assets\/(sms-trial\.(?:css|js)|sms-go\.js)$/.test(pathname)){
   const filename=path.join(root,'microlandings','public',path.basename(pathname));
   const data=await readFile(filename);res.writeHead(200,{'Content-Type':types[path.extname(filename)],'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:data);
  }
  const offer=offers.find(o=>o.route===pathname||o.route+'/'===pathname);
  if(offer){if(pathname.endsWith('/')){res.writeHead(307,{Location:offer.route+url.search});return res.end();}return send(res,200,renderMicrolanding(offer));}
  if(/^\/funnel-assets\/(funnel\.css|funnel\.js)$/.test(pathname)){
   const filename=path.join(root,'microlandings','public',path.basename(pathname));
   const data=await readFile(filename);res.writeHead(200,{'Content-Type':types[path.extname(filename)],'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:data);
  }
  if(/^\/quiz-assets\/(?:quiz\.(?:css|js)|hotel-reception\.webp|quiz-manual-checkin\.jpg)$/.test(pathname)){
   const filename=path.join(root,'microlandings','public',path.basename(pathname));
   const data=await readFile(filename);res.writeHead(200,{'Content-Type':types[path.extname(filename)],'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:data);
  }
  const route=pathname.match(/^\/(v1|v2|v3)(\/.*)?$/);
  if(!route)return send(res,404,renderNotFound());
  const version=route[1],relative=route[2]||'/';
  if(!route[2]){res.writeHead(307,{Location:`/${version}/`});return res.end();}
  if(version!=='v1' && !(version==='v3' && (/^\/assets\/[a-zA-Z0-9_.-]+$/.test(relative)||relative==='/editorial.css')))return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');
  if(version==='v1' && relative==='/')return sendCompressed(req,res,200,prefix(firstPage({origin:'',full:true,homepage:true}),'v1'),'text/html; charset=utf-8');
  if(version==='v1' && relative==='/privacy')return send(res,200,prefix(privacyPage(),'v1'));
  if(!/^\/(assets\/[a-zA-Z0-9_.-]+|author-page\.css|blog\.css|editorial-seo\.css|reading-layout\.css|prepared-content\.css|partners\.(?:css|js)|homepage\.(?:css|js)|trial-offer\.(?:css|js)|tools\.(?:css|js)|seo-pages\.css|integration-channels\.css|pricing\.(?:css|js)|pricing-core\.js|site-config\.js|styles\.css|site\.css|home\.css|design-system-2\.css|dark-edition\.css|polish\.css|refinement\.css|cases\.css|editorial\.css|experience\.css|experience\.js|app\.js|clarity-consent\.(?:css|js)|living-hotel(?:-mobile|-dispatch)?\.(?:css|js))$/.test(relative))return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');
  const file=path.join(root,'versions',version,'public',relative.slice(1));
  const bundle=version==='v1'&&relative==='/home.css'?homeCssBundle:version==='v1'&&relative==='/site.css'?siteCssBundle:null;
  const data=bundle?Buffer.from(bundle.css):await readFile(file);
  const requestedVersion=url.searchParams.get('v')||'';
  const currentVersion=bundle?.version||createHash('sha256').update(data).digest('hex').slice(0,12);
  const cache=requestedVersion===currentVersion?'public, max-age=31536000, immutable':relative.startsWith('/assets/')?'public, max-age=86400, stale-while-revalidate=604800':'public, max-age=300';
  sendCompressed(req,res,200,data,types[path.extname(file)]||'application/octet-stream',cache);
 }catch(error){if(error instanceof URIError)return send(res,400,'Некоректна адреса запиту.','text/plain; charset=utf-8');if(error?.code==='ENOENT')return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');console.error('VDALO request failed:',error);return send(res,500,'Внутрішня помилка сервера.','text/plain; charset=utf-8');}
});
// Vercel captures this standard Node.js HTTP server entrypoint.
if(!process.env.VERCEL)server.listen(Number(process.env.PORT||4185),process.env.HOST||'127.0.0.1',()=>console.log('VDALO comparison server started'));


export default server;

