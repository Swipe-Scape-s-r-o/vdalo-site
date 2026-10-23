import {randomUUID} from 'node:crypto';
const mode=process.argv[2];
if(!['legacy','robot','contact'].includes(mode)||!process.argv.includes('--send')||!process.env.VDALO_QA_CONTACT){
 console.error('Requires legacy|robot|contact --send and the authorized VDALO_QA_CONTACT environment value.');
 process.exit(2);
}
const id=randomUUID(),phone=process.env.VDALO_QA_CONTACT;
const name='ТЕСТ VDALO — перевірка форм',property='ТЕСТ VDALO — відновлення заявок';
const note='Технічна перевірка власником. Не підключати об’єкт і не запускати розсилки.';
const utm={utm_source:'qa_forms',utm_medium:'manual',utm_campaign:'restore_existing_intake_20261023'};
const bodies={
 legacy:{offer_id:'audit',submission_id:id,name,property,contact:phone,consent:true,note,selected_process:'other',attribution:{last_touch:utm}},
 robot:{submission_id:id,name,hotel:property,email:'qa-forms@example.com',phone,consent:true,contact_method:'telegram',funnel:'staff',source:'website',code:'q9',page_format:'questions',submission_stage:'details_complete',entry_page:'/q9',answers:{preferred_time:'today'},...utm},
 contact:{name,contact:phone,consent:true,form_kind:'contact',pain:note,utm},
};
const routes={legacy:'/api/funnel/leads',robot:'/api/funnels/top5',contact:'/api/leads/audit'};
try{
 const response=await fetch('https://www.vdalo.tech'+routes[mode],{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://www.vdalo.tech'},body:JSON.stringify(bodies[mode]),signal:AbortSignal.timeout(20000)});
 const result=await response.json();
 console.log(JSON.stringify({mode,status:response.status,ok:result.ok,message:result.message,errors:result.errors,hasLeadId:Boolean(result.leadId),submissionId:id}));
}catch(error){console.error(JSON.stringify({mode,submissionId:id,error:error.name,message:error.message}));process.exitCode=1;}
