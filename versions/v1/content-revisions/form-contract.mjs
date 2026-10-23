import {createHash} from 'node:crypto';
import {elements} from './html-fragments.mjs';
export function formContract(html){
 const nodes=elements(html);
 return nodes.filter(node=>node.tag==='form').map(form=>{
  const controls=nodes.filter(node=>node.start>form.openEnd&&node.end<=form.closeStart&&['input','select','textarea','button'].includes(node.tag));
  const structure={form:form.attrs,controls:controls.map(node=>({tag:node.tag,attrs:node.attrs}))};
  return {id:form.attrs.id??form.attrs['data-kind']??form.attrs.action,count:controls.length,sha256:createHash('sha256').update(JSON.stringify(structure)).digest('hex')};
 });
}
