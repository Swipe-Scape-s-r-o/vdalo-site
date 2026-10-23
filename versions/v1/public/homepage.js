(() => {
 const page=document.querySelector('.homepage-2026');
 if(!page)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const tabs=[...page.querySelectorAll('[data-home-tab]')];
 const select=tab=>{
  tabs.forEach(item=>{const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;document.getElementById(`home-panel-${item.dataset.homeTab}`).hidden=!active;});
  // This is an interaction, not a lead. No contact data enters analytics.
  document.dispatchEvent(new CustomEvent('vdalo:home-scenario',{detail:{scenario:tab.dataset.homeTab}}));
 };
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>select(tab));
  tab.addEventListener('keydown',event=>{
   const target=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:-1;
   if(target<0)return;event.preventDefault();select(tabs[target]);tabs[target].focus();
  });
 });
 // Published homepage anchors now point to their nearest concise replacement.
 const aliases={solutions:'features',roles:'features',journey:'features',unique:'features','next-step':'audit','living-hotel':'pms'};
 function followAlias(){const id=aliases[location.hash.slice(1)];if(id)document.getElementById(id)?.scrollIntoView({behavior:'instant',block:'start'});}
 addEventListener('hashchange',followAlias);followAlias();
 const sticky=page.querySelector('.home-mobile-action');
 const hero=page.querySelector('.home-hero');
 const close=page.querySelector('.home-close');
 const footer=document.querySelector('footer');
 let heroVisible=true,closeVisible=false,footerVisible=false;
 function syncSticky(){sticky.hidden=heroVisible||closeVisible||footerVisible||!!document.querySelector('dialog[open],#navigation.open')||!!document.querySelector('.modal.open,.modal.is-open');}
 if('IntersectionObserver' in window){
  const visibility=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.target===hero)heroVisible=entry.isIntersecting;else if(entry.target===close)closeVisible=entry.isIntersecting;else footerVisible=entry.isIntersecting;});syncSticky();},{threshold:0});
  visibility.observe(hero);visibility.observe(close);
  if(footer)visibility.observe(footer);
  new MutationObserver(syncSticky).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','class']});
 }
 // Visible HTML is the baseline. WAAPI decorates once; failure never hides copy.
 if(!reduce.matches&&'IntersectionObserver' in window&&Element.prototype.animate){
  const ease='cubic-bezier(.23,1,.32,1)';
  const targets=page.querySelectorAll('.home-section h2,.home-start-steps li,.home-price-figure');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(!entry.isIntersecting)return;observer.unobserve(entry.target);
   const step=entry.target.matches('li');
   const price=entry.target.matches('.home-price-figure');
   const from=step?{opacity:.4,transform:'translateX(16px)'}:price?{opacity:.6,transform:'scale(.98)'}:{opacity:.4};
   const to=step?{opacity:1,transform:'translateX(0)'}:price?{opacity:1,transform:'scale(1)'}:{opacity:1};
   entry.target.animate([from,to],{duration:step?360:420,easing:ease,delay:step?Math.min([...entry.target.parentElement.children].indexOf(entry.target),3)*60:0});
  }),{threshold:.15});
  targets.forEach(target=>observer.observe(target));
  const arrival=page.querySelector('.home-arrival');
  arrival.animate([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:ease,delay:180});
  const image=page.querySelector('.home-hero-media img');
  const drift=image.animate([{transform:'scale(1.025)'},{transform:'scale(1)'}],{duration:12000,easing:'linear',iterations:1});
  const pause=()=>{if(drift.playState==='finished')return;if(document.hidden||reduce.matches)drift.pause();else drift.play();};
  document.addEventListener('visibilitychange',pause);
  reduce.addEventListener('change',()=>{if(reduce.matches){page.getAnimations({subtree:true}).forEach(a=>a.cancel());observer.disconnect();}});
 }
})();
