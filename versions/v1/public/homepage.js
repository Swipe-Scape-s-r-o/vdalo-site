(() => {
 const page=document.querySelector('.homepage-2026');
 if(!page)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const sticky=page.querySelector('.home-mobile-action');
 const hero=page.querySelector('.home-hero');
 const close=page.querySelector('.home-close');
 const footer=document.querySelector('footer');
 const actionZones=[hero,close,footer,page.querySelector('.home-demo-copy'),page.querySelector('.home-guide-end'),page.querySelector('#living-hotel'),page.querySelector('#living-hotel-m')].filter(Boolean);
 const visibleZones=new Set([hero]);
 function syncSticky(){sticky.hidden=visibleZones.size>0||!!document.querySelector('dialog[open],#navigation.open')||!!document.querySelector('.modal.open,.modal.is-open');}
 if('IntersectionObserver' in window){
  const visibility=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)visibleZones.add(entry.target);else visibleZones.delete(entry.target);});syncSticky();},{threshold:0});
  actionZones.forEach(zone=>visibility.observe(zone));
  new MutationObserver(syncSticky).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','class']});
 }
 // Visible HTML is the baseline. WAAPI decorates once; failure never hides copy.
 if(!reduce.matches&&'IntersectionObserver' in window&&Element.prototype.animate){
  const ease='cubic-bezier(.23,1,.32,1)';
  const targets=page.querySelectorAll('.home-start-steps li,.home-price-figure');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(!entry.isIntersecting)return;observer.unobserve(entry.target);
   const step=entry.target.matches('li');
   const price=entry.target.matches('.home-price-figure');
   const from=step?{opacity:.4,transform:'translateX(16px)'}:price?{opacity:.6,transform:'scale(.98)'}:{opacity:.4};
   const to=step?{opacity:1,transform:'translateX(0)'}:price?{opacity:1,transform:'scale(1)'}:{opacity:1};
   entry.target.animate([from,to],{duration:step?360:420,easing:ease,delay:step?Math.min([...entry.target.parentElement.children].indexOf(entry.target),3)*60:0});
  }),{threshold:.15});
  targets.forEach(target=>observer.observe(target));
  const mark=page.querySelector('.home-v-art');
  const entrance=mark?.animate([
   {opacity:.8,transform:'translateY(14px) rotate(-9deg)'},
   {opacity:1,transform:'translateY(0) rotate(-7deg)'}
  ],{duration:1100,easing:ease,iterations:1});
  const pause=()=>{if(!entrance||entrance.playState==='finished')return;if(document.hidden||reduce.matches)entrance.pause();else entrance.play();};
  document.addEventListener('visibilitychange',pause);pause();
  reduce.addEventListener('change',()=>{if(reduce.matches){page.getAnimations({subtree:true}).forEach(a=>a.cancel());observer.disconnect();}});
 }
})();
