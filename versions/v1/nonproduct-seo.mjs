// A strict allowlist keeps product pages and campaign funnels byte-for-byte intact.
export function normalizeNonproductMetadata(html,route){
 if(!/^\/(?:blog(?:\/|$)|cases(?:\/|$)|authors(?:\/|$)|about$|contact$|tools\/|tourist-tax\/(?!start(?:\/|$))|privacy(?:\/|$)|terms(?:\/|$)|cookies(?:\/|$))/.test(route))return html;
 const images=[...html.matchAll(/<meta property="og:image" content="([^"]*)"\s*\/?>/g)];
 if(images.length<2)return html;
 const image=images.at(-1)[1],alts=[...html.matchAll(/<meta property="og:image:alt" content="([^"]*)"\s*\/?>/g)];
 const title=html.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'';
 const description=html.match(/<meta name="description" content="([^"]*)"/)?.[1]||'';
 html=html.replace(/<meta property="og:image(?::(?:alt|width|height))?"[^>]*>/g,'').replace(/<meta name="twitter:(?:card|image|title|description)"[^>]*>/g,'');
 return html.replace('</head>',`<meta property="og:image" content="${image}"><meta property="og:image:alt" content="${alts.at(-1)?.[1]||title}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${image}"></head>`);
}
