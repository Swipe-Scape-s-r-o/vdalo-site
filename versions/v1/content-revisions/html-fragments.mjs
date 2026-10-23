// Source offsets for the site's owned, server-rendered HTML. No DOM execution or
// serialization: replacing a copy block preserves surrounding controls verbatim.
const voidTags = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
export const decodeText = value => String(value).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
export const textOf = html => decodeText(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function elements(html) {
  const nodes = [], stack = [];
  const tags = /<!--[\s\S]*?-->|<![^>]*>|<(\/?)([a-zA-Z][\w:-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let token;
  while ((token = tags.exec(html))) {
    if (!token[2]) continue;
    const tag = token[2].toLowerCase();
    if (token[1]) {
      const index = stack.findLastIndex(node => node.tag === tag);
      if (index >= 0) {
        const node = stack[index];
        node.closeStart = token.index;
        node.end = tags.lastIndex;
        stack.splice(index);
      }
      continue;
    }
    const attrs = {};
    for (const match of token[3].matchAll(/([^\s=/'"]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[match[1].toLowerCase()] = decodeText(match[2] ?? match[3] ?? match[4] ?? '');
    }
    const node = {tag, attrs, start:token.index, openEnd:tags.lastIndex, closeStart:tags.lastIndex, end:tags.lastIndex, parent:stack.at(-1) ?? null};
    nodes.push(node);
    if (voidTags.has(tag) || /\/\s*$/.test(token[3])) continue;
    if (['script','style','textarea','title'].includes(tag)) {
      const closing = new RegExp(`</${tag}\\s*>`, 'ig');
      closing.lastIndex = tags.lastIndex;
      const match = closing.exec(html);
      if (match) { node.closeStart=match.index; node.end=closing.lastIndex; tags.lastIndex=closing.lastIndex; }
      continue;
    }
    stack.push(node);
  }
  return nodes;
}
export const hasClass = (node, name) => (node.attrs.class ?? '').split(/\s+/).includes(name);
export const inner = (html, node) => html.slice(node.openEnd, node.closeStart);
export const outer = (html, node) => html.slice(node.start, node.end);
export const replaceInner = (html, node, value) => html.slice(0,node.openEnd)+value+html.slice(node.closeStart);
export const replaceOuter = (html, node, value) => html.slice(0,node.start)+value+html.slice(node.end);
export function editElements(html, predicate, render) {
  const selected = elements(html).filter(predicate);
  // Callers select independent blocks; source offsets remain valid backwards.
  for (const node of selected.reverse()) html=replaceOuter(html,node,render(outer(html,node),node));
  return html;
}
