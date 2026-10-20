import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const publicUrl = new URL('./public/', import.meta.url);
const digest = value => createHash('sha256').update(value).digest('hex').slice(0, 12);

export function assetVersion(name) {
 return digest(readFileSync(new URL(name, publicUrl)));
}

export function assetUrl(name) {
 return `/assets/${name}?v=${assetVersion(`assets/${name}`)}`;
}

const sharedStyles = [
 'fonts.css',
 'styles.css',
 'design-system-2.css',
 'polish.css',
 'refinement.css',
 'integration-channels.css',
 'pricing.css',
];

function bundle(files) {
 const contents = files.map(name => {
  let css = readFileSync(new URL(name, publicUrl), 'utf8');
  if(name==='fonts.css')for(const font of ['inter-cyrillic.woff2','inter-latin.woff2','inter-tight-cyrillic.woff2','inter-tight-latin.woff2'])css=css.replaceAll(`/assets/${font}`,assetUrl(font));
  return css;
 });
 const css = contents.join('\n');
 return { css, version: digest(css) };
}

export const siteCssBundle = bundle(sharedStyles);
export const homeCssBundle = bundle([...sharedStyles, 'living-hotel.css', 'living-hotel-mobile.css']);

const criticalClasses = [
 'wrap','skip-link',
 'header','header-inner','header-actions','brand','menu-toggle',
 'site-nav','nav-disclosure','nav-submenu','nav-item',
 'hero-v2','hero-v3','hero-v2-grid','hero-v2-copy','hero-v2-conversion',
 'hero-v2-actions','hero-v2-description','hero-v2-note','hero-product-link',
 'hero-v2-photo','hero-video','hero-reassurance','pink-word',
];
const criticalElements = new Set([':root','*','html','body','body.ds2','button','a','img','h1','h2','h3','figure','[hidden]']);

function findCssBlockEnd(css, open) {
 let depth=1,quote='',comment=false,escape=false;
 for(let i=open+1;i<css.length;i++){
  const char=css[i],next=css[i+1];
  if(comment){if(char==='*'&&next==='/'){comment=false;i++;}continue;}
  if(quote){if(escape){escape=false;continue;}if(char==='\\'){escape=true;continue;}if(char===quote)quote='';continue;}
  if(char==='/'&&next==='*'){comment=true;i++;continue;}
  if(char==='"'||char==="'"){quote=char;continue;}
  if(char==='{')depth++;
  else if(char==='}'&&!--depth)return i;
 }
 return css.length;
}

function isCriticalSelector(prelude) {
 const selectors=prelude.replace(/\/\*[\s\S]*?\*\//g,'').split(',').map(value=>value.trim());
 return selectors.some(selector=>{
  if(criticalElements.has(selector)||selector==='.button'||selector==='.button.compact'||selector==='.hero-v3 .eyebrow')return true;
  return criticalClasses.some(name=>new RegExp(`(^|[^\\w-])\\.${name}(?=$|[^\\w-])`).test(selector));
 });
}

function extractCriticalCss(css) {
 let result='',cursor=0;
 while(cursor<css.length){
  while(cursor<css.length&&/\s/.test(css[cursor]))cursor++;
  if(cursor>=css.length)break;
  if(css.startsWith('/*',cursor)){
   const commentEnd=css.indexOf('*/',cursor+2);
   cursor=commentEnd<0?css.length:commentEnd+2;
   continue;
  }
  const open=css.indexOf('{',cursor);
  if(open<0)break;
  const prelude=css.slice(cursor,open).trim();
  const end=findCssBlockEnd(css,open);
  const contents=css.slice(open+1,end);
  if(/^@(media|supports|container|layer)\b/i.test(prelude)){
   const nested=extractCriticalCss(contents);
   if(nested)result+=`${prelude}{${nested}}`;
  }else if(/^@(?:-webkit-)?keyframes\s+ds2-architecture-in\b/i.test(prelude)){
   result+=`${prelude}{${contents}}`;
  }else if(!prelude.startsWith('@')&&isCriticalSelector(prelude)){
   result+=`${prelude}{${contents}}`;
  }
  cursor=end+1;
 }
 return result;
}

export const homeCriticalCss = extractCriticalCss(homeCssBundle.css);
