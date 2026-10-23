// Read-only baseline for live browser QA; uses the real server renderer.
import {writeFileSync} from 'node:fs';
import {preparedPages} from '../versions/v1/content-revisions/content.mjs';
import {renderRouteForReview} from './review-render.mjs';
import {elements,inner,textOf} from '../versions/v1/content-revisions/html-fragments.mjs';
const expectations=[];
for(const page of preparedPages){
 const {html,status}=await renderRouteForReview(page.route),nodes=elements(html);
 const forms=nodes.filter(n=>n.tag==='form').map(form=>({
  id:form.attrs.id??'',action:form.attrs.action??'',method:form.attrs.method??'get',
  fields:nodes.filter(n=>n.start>=form.openEnd&&n.end<=form.closeStart&&['input','select','textarea'].includes(n.tag)).map(n=>({tag:n.tag,name:n.attrs.name??'',type:n.attrs.type??(n.tag==='input'?'text':''),required:'required' in n.attrs,min:n.attrs.min??'',max:n.attrs.max??''}))
 }));
 expectations.push({route:page.route,status,title:page.title,description:page.description,robots:page.robots,canonical:page.canonical,ogTitle:page.ogTitle,ogDescription:page.ogDescription,h1:nodes.filter(n=>n.tag==='h1').map(n=>textOf(inner(html,n))),forms});
}
writeFileSync(new URL('../docs/content-package-2026-10-23/release-review/expectations.json',import.meta.url),JSON.stringify(expectations,null,2)+'\n');
console.log(`Saved ${expectations.length} route expectations without listening on a port or submitting forms.`);
