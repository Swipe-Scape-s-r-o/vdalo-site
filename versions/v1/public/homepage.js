(() => {
 const page=document.querySelector('.homepage-2026');
 if(!page)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const productTabs=page.querySelector('.product-tabs');
 if(productTabs){
  const horizontal=matchMedia('(max-width:900px)');
  const orient=()=>productTabs.setAttribute('aria-orientation',horizontal.matches?'horizontal':'vertical');
  orient();horizontal.addEventListener('change',orient);
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
  const image=page.querySelector('.home-room-cut img');
  const entrance=image?.animate([
   {opacity:.85,transform:'scale(1.02)'},
   {opacity:1,transform:'scale(1)'}
  ],{duration:720,easing:ease,iterations:1});
  const pause=()=>{if(!entrance||entrance.playState==='finished')return;if(document.hidden||reduce.matches)entrance.pause();else entrance.play();};
  document.addEventListener('visibilitychange',pause);pause();
  reduce.addEventListener('change',()=>{if(reduce.matches){page.getAnimations({subtree:true}).forEach(a=>a.cancel());observer.disconnect();}});
 }
})();
