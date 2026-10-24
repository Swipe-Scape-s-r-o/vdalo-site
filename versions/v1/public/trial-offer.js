(() => {
 const offer=document.querySelector('#home-trial-offer');
 if(!offer||typeof offer.showModal!=='function')return;
 const sessionKey='vdalo-home-trial-offer-v1',elapsedKey='vdalo-site-trial-active-ms-v1',delay=50000;
 const seen=()=>{try{return sessionStorage.getItem(sessionKey)==='seen';}catch{return false;}};
 const savedTime=()=>{try{const n=Number(sessionStorage.getItem(elapsedKey));return Number.isFinite(n)?Math.max(0,Math.min(delay,n)):0;}catch{return 0;}};
 let finished=seen(),elapsed=savedTime(),activeFrom=document.hidden?null:performance.now(),timer;
 const activeTime=()=>Math.min(delay,elapsed+(activeFrom===null?0:performance.now()-activeFrom));
 const checkpoint=()=>{
  elapsed=activeTime();activeFrom=null;
  if(!finished)try{sessionStorage.setItem(elapsedKey,String(elapsed));}catch{}
 };
 const stop=()=>{finished=true;clearTimeout(timer);try{sessionStorage.setItem(sessionKey,'seen');}catch{}};
 const dismiss=()=>{stop();if(offer.open)offer.close();};
 const attempt=()=>{
  if(finished||document.hidden)return;
  if(seen()){stop();return;}
  const editing=document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
  const blocked=document.querySelector('dialog[open],#navigation.open,#navigation details[open],.modal.open,.modal.is-open,.cookie-consent:not([hidden])');
  if(editing||blocked){timer=setTimeout(attempt,1000);return;}
  stop();offer.showModal();
 };
 const arm=()=>{clearTimeout(timer);if(!finished&&!document.hidden)timer=setTimeout(attempt,Math.max(0,delay-activeTime()));};
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){checkpoint();clearTimeout(timer);}
  else{activeFrom=performance.now();arm();}
 });
 // Keep active time between ordinary pages. Marketing pages load no controller
 // and contribute no time. Respect session dismissal after back/forward restore.
 addEventListener('pagehide',()=>{checkpoint();clearTimeout(timer);});
 addEventListener('pageshow',event=>{
  if(!event.persisted)return;
  if(seen()){stop();if(offer.open)offer.close();return;}
  elapsed=Math.max(elapsed,savedTime());activeFrom=document.hidden?null:performance.now();arm();
 });
 document.addEventListener('click',event=>{if(event.target.closest('[data-open],[data-contact-dialog-trigger]'))stop();},{capture:true});
 for(const type of ['input','submit'])document.addEventListener(type,event=>{
  if(event.target.closest('form[data-kind],form[data-partner-request]'))stop();
 },{capture:true});
 offer.querySelectorAll('[data-home-offer-dismiss]').forEach(control=>control.addEventListener('click',dismiss));
 // Close before app.js opens the established short request form.
 offer.querySelector('[data-home-offer-start]').addEventListener('click',dismiss,{capture:true});
 offer.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
 offer.addEventListener('click',event=>{
  if(event.target!==offer)return;
  const rect=offer.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dismiss();
 });
 arm();
})();
