export const glyphs={
 calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3"/>',
 channels:'<path d="M7 7h10M7 17h10m-5-5V7m0 5v5"/><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><rect x="16" y="16" width="5" height="5" rx="1"/>',
 website:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 7h.01m3 0h.01m-3 6h6m-6 3h10"/>',
 chart:'<path d="M4 4v16h16M8 15l4-5 4 2 4-7m-5 0h5v5"/>',
 key:'<circle cx="8" cy="9" r="5"/><path d="m12 13 8 8m-3-3 3-3m-6 0 3-3"/>',
 'room-ready':'<path d="M4 21V3h13v7M3 21h8M8 12h.01"/><path d="m12 17 3 3 6-7"/>',
 handoff:'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M2 15v-2a4 4 0 0 1 8 0v2m4-10h7m-3-3 3 3-3 3M3 19h7m-4-3-3 3 3 3"/>',
 message:'<path d="M21 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 0 1-1-4V9a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6zM7 8h10m-10 4h7"/>',
 housekeeping:'<path d="m4 20 7-7m0-10v7l8 8M6 18l3 3 4-4m-1-7 5-5m-1-1 5 5m-6 5 5 5"/>',
 receipt:'<path d="M5 3h14v18l-3-2-4 2-4-2-3 2zM8 7h8m-8 4h8m-8 4h4"/>',
 energy:'<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
 globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
 guest:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',
 team:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v1"/>',
 building:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-3h4v3"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',
 settings:'<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 document:'<path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8m-8 4h6"/>',
 home:'<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z"/>'
};
export function icon(name,extra=''){return `<svg class="ui-icon ${extra}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${glyphs[name]||glyphs.building}</svg>`;}
export function channelMark(name){
 if(name==='Booking.com')return '<img class="channel-logo booking-logo" src="/assets/booking-logo.svg" alt="Booking.com" width="150" height="30" loading="lazy">';
 if(name==='Airbnb')return '<img class="channel-logo airbnb-logo" src="/assets/airbnb-logo.svg" alt="Airbnb" width="125" height="39" loading="lazy">';
 const logoFiles={'Hotels24':'hotels24-logo.svg','Expedia':'expedia-logo.svg','Agoda':'agoda-logo.svg','Dobovo':'dobovo-logo.svg'};
 if(logoFiles[name])return `<img class="channel-logo ${name.toLowerCase()}-logo" src="/assets/${logoFiles[name]}" alt="${name}" width="150" height="42" loading="lazy">`;
 return `${icon(name==='Ваш сайт'?'website':'globe')}<span>${name}</span>`;
}
export const productIcons={calendar:'calendar',channels:'channels',engine:'website',rms:'chart',checkin:'key',communication:'message',housekeeping:'housekeeping',ukraine:'receipt',smart:'energy'};
