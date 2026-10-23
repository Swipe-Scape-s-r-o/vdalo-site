// Keep the existing acknowledged audit delivery channel. Only prepare its
// supported plain-text context; no contact information enters analytics.
document.querySelectorAll('form[data-partner-request]').forEach(form=>{
 const prepare=()=>{
  const joining=form.dataset.partnerRequest==='join';
  const context=(form.elements.request_context?.value||'').trim();
  const region=(form.elements.work_region?.value||'').trim();
  form.elements.pain.value=[joining?'Пропозиція партнерства VDALO.':'Потрібен інтегратор VDALO.',region&&`Регіони роботи: ${region}`,context&&`${joining?'Досвід і послуги':'Задача об’єкта'}: ${context}`].filter(Boolean).join('\n').slice(0,1000);
 };
 prepare();
 form.addEventListener('submit',prepare,{capture:true});
 if(form.dataset.leadReady==='true')form.querySelector('[type="submit"]').disabled=false;
});
