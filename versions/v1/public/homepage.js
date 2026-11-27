(() => {
 const page=document.querySelector('.homepage-2026');
 if(!page)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const slider=page.querySelector('[data-home-properties]');
 if(slider){
  const slides=JSON.parse(slider.querySelector('[data-property-slides]').textContent);
  const frame=slider.querySelector('[data-property-frame]');
  const link=slider.querySelector('[data-property-link]');
  const label=slider.querySelector('[data-property-label]');
  const counter=slider.querySelector('[data-property-position]');
  const announcement=slider.querySelector('[data-property-announcement]');
  const toggle=slider.querySelector('[data-property-toggle]');
  const toggleIcon=toggle.querySelector('span');
  const sizes=frame.querySelector('img').sizes;
  let current=0;
  let requested=0;
  let timer;
  let pending=0;
  let paused=reduce.matches;
  let visible=!('IntersectionObserver' in window);
  let hovered=matchMedia('(hover: hover)').matches&&slider.matches(':hover');

  const canRotate=()=>!paused&&!reduce.matches&&visible&&!hovered&&!document.hidden&&!slider.contains(document.activeElement);
  const schedule=()=>{
   clearTimeout(timer);
   if(canRotate())timer=setTimeout(()=>show((current+1)%slides.length,false),4500);
  };
  const updateToggle=()=>{
   const text=paused?'Відновити автоматичне гортання':'Призупинити автоматичне гортання';
   toggle.setAttribute('aria-label',text);
   toggle.title=text;
   toggleIcon.textContent=paused?'▶':'Ⅱ';
   toggle.hidden=reduce.matches;
  };

  async function show(index,manual){
   const request=++pending;
   const slide=slides[index];
   const image=new Image(1200,800);
   image.alt=slide.alt;
   image.decoding='async';
   image.sizes=sizes;
   image.srcset=slide.srcset;
   image.src=slide.src;
   try{
    await image.decode();
    if(request!==pending||(!manual&&!canRotate()))return;
    frame.replaceChildren(image);
    link.hidden=!slide.href;
    label.hidden=Boolean(slide.href);
    if(slide.href){
     link.href=slide.href;
     link.querySelector('span').textContent=slide.label;
    }else{
     link.removeAttribute('href');
     label.textContent=slide.label;
    }
    current=index;
    requested=index;
    counter.textContent=`${index+1} / ${slides.length}`;
    if(manual)announcement.textContent=`${slide.label}, ${index+1} із ${slides.length}`;
   }catch{
    if(request===pending&&manual)announcement.textContent='Ілюстрація тимчасово недоступна. Спробуйте інший тип об’єкта.';
   }finally{
    if(request===pending)schedule();
   }
  }

  function step(direction){
   paused=true;
   updateToggle();
   clearTimeout(timer);
   requested=(requested+direction+slides.length)%slides.length;
   void show(requested,true);
  }

  slider.querySelectorAll('[data-property-step]').forEach(button=>button.addEventListener('click',()=>step(Number(button.dataset.propertyStep))));
  slider.addEventListener('keydown',event=>{
   if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
   event.preventDefault();
   step(event.key==='ArrowLeft'?-1:1);
  });
  toggle.addEventListener('click',()=>{
   paused=!paused;
   updateToggle();
   schedule();
  });
  slider.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;schedule();}});
  slider.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){hovered=false;schedule();}});
  slider.addEventListener('focusin',schedule);
  slider.addEventListener('focusout',()=>queueMicrotask(schedule));
  document.addEventListener('visibilitychange',schedule);
  reduce.addEventListener('change',()=>{
   if(reduce.matches)paused=true;
   updateToggle();
   schedule();
  });
  if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    schedule();
   },{threshold:.15});
   observer.observe(slider);
  }
  slider.querySelector('[data-property-controls]').hidden=false;
  updateToggle();
  schedule();
 }

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
  reduce.addEventListener('change',()=>{if(reduce.matches){page.getAnimations({subtree:true}).forEach(a=>a.cancel());observer.disconnect();}});
 }
})();
