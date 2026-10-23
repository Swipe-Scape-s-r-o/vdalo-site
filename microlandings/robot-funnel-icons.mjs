// Small decorative line icons, rendered inline: no font or third-party request.
const drawings={
 calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
 channels:'<rect x="9" y="9" width="6" height="6" rx="2"/><path d="M12 9V5m0 10v4M9 12H5m10 0h4"/><circle cx="12" cy="3" r="2"/><circle cx="12" cy="21" r="2"/><circle cx="3" cy="12" r="2"/><circle cx="21" cy="12" r="2"/>',
 phone:'<path d="m6 3 3 4-2 3a14 14 0 0 0 7 7l3-2 4 3c-1 4-4 4-7 3A20 20 0 0 1 3 10C2 7 2 4 6 3Z"/>',
 mobile:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-3 14h2"/>',
 form:'<rect x="5" y="3" width="14" height="19" rx="2"/><path d="M9 3v3h6V3M9 11h6m-6 4h6m-6 4h3"/>',
 documents:'<path d="M8 3h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 0v5h4M3 7v11a4 4 0 0 0 4 4m3-10h6m-6 4h6"/>',
 settings:'<path d="M3 6h8m4 0h6M3 12h2m4 0h12M3 18h12m4 0h2"/><circle cx="13" cy="6" r="2"/><circle cx="7" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
 pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 receipt:'<path d="M5 3h14v19l-3-2-4 2-4-2-3 2V3Zm4 5h6m-6 4h6m-6 4h3"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 book:'<path d="M12 5v16M3 4c4-1 6 0 9 1 3-1 5-2 9-1v15c-4-1-6 0-9 2-3-2-5-3-9-2V4Z"/>',
 chat:'<path d="M6 4h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-6 4v-4a3 3 0 0 1-2-3V7a3 3 0 0 1 3-3Zm1 5h10M7 13h6"/>',
 route:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
 users:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m2 11v-3a6 6 0 0 0-2-4"/>',
 browser:'<rect x="2" y="3" width="20" height="18" rx="3"/><path d="M2 9h20M6 6h.01M10 6h.01M9 15h6m-2-2 2 2-2 2"/>',
 chart:'<path d="M4 3v18h17M8 16v-5m5 5V7m5 9v-8"/>',
 key:'<circle cx="8" cy="9" r="5"/><path d="m12 13 8 8m-4-4 3-3m-6 0 3-3"/>',
 screen:'<rect x="2" y="3" width="20" height="14" rx="3"/><path d="M12 17v4m-4 0h8M6 7h5m-5 4h9"/>',
 sparkle:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
 help:'<path d="M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 4h.01"/><circle cx="12" cy="12" r="10"/>',
};

export const benefitIcons={
 q1:['channels','phone','mobile'], q1b:['calendar','phone','check'],
 q2:['form','documents','settings'], q3:['pin','receipt','check'],
 q4:['book','chat','settings'], q4b:['book','chat','channels'],
 q5:['key','book','users'], q6:['calendar','chat','route'],
 q7:['browser','channels','chart'], q7b:['route','chat','browser'],
 q8:['sparkle','clock','users'], q9:['users','screen','check'],
 q10:['documents','clock','key'],
};

export function renderFunnelIcon(name){
 if(!drawings[name])throw new Error(`Unknown funnel icon: ${name}`);
 return `<svg class="funnel-icon" data-icon="${name}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${drawings[name]}</svg>`;
}
