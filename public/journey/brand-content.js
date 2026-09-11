const fields=[...document.querySelectorAll('textarea[data-stage]')];
const status=document.getElementById('bc-status');
let edited=false;
for(const field of fields)field.addEventListener('input',()=>{edited=true;const count=fields.filter(f=>f.value.trim()).length;document.getElementById('bc-progress').textContent=count+' of '+fields.length+' prompts have working notes. This is progress, not a score.'});
function brief(){let stage='';const lines=['EDGE Brand and Content working brief','User-authored working notes. Claims and interpretations require review.'];for(const field of fields){if(!field.value.trim())continue;if(field.dataset.stage!==stage){stage=field.dataset.stage;lines.push('\n'+stage)}lines.push(field.dataset.label+'\n'+field.value)}return lines.join('\n\n')}
document.getElementById('bc-copy').onclick=async()=>{try{await navigator.clipboard.writeText(brief());status.textContent='Working brief copied. Keep it somewhere safe before leaving.'}catch{status.textContent='Clipboard unavailable. Download the brief instead.'}};
document.getElementById('bc-download').onclick=()=>{const url=URL.createObjectURL(new Blob([brief()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='EDGE-brand-content-brief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Download requested. Check the file before leaving.'};
window.addEventListener('beforeunload',e=>{if(edited){e.preventDefault();e.returnValue=''}});

const returnKey='edge-brand-workspace-return-v1',handoffKey='edge-brand-content-handoff-v1';
try {
 const raw=sessionStorage.getItem(returnKey);sessionStorage.removeItem(returnKey);
 if(raw&&raw.length<90000){const state=JSON.parse(raw);if(state&&typeof state.savedAt==='number'&&state.savedAt<=Date.now()&&Date.now()-state.savedAt<7200000&&state.fields){for(const field of fields){const value=state.fields[field.id];if(typeof value==='string'&&value.length<=6000)field.value=value;}edited=fields.some(f=>f.value.trim());document.getElementById('bc-progress').textContent=fields.filter(f=>f.value.trim()).length+' of '+fields.length+' prompts have working notes. This is progress, not a score.';status.textContent='Your working brief is restored from the content handoff.';}}
}catch{status.textContent='The temporary brief could not be restored. Use your downloaded copy.'}
const allowed=new Set(['audience','evidence','need','offer','proof','voice','ideas','checks','plan']);
let destination='content';
function openHandoff(target){destination=target;document.getElementById('bc-handoff-title').textContent=target==='profile'?'Choose what the brand profile needs.':'Choose what the planner needs.';document.getElementById('bc-handoff-confirm').textContent=target==='profile'?'Continue to brand profile':'Continue to content planner';
 const list=document.getElementById('bc-handoff-items');list.replaceChildren();
 for(const field of fields){const key=field.id.replace('bc-','');if(!allowed.has(key)||!field.value.trim())continue;const label=document.createElement('label');label.className='handoff-item';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.dataset.key=key;const span=document.createElement('span');const title=document.createElement('strong');title.textContent=field.dataset.label;span.append(title,document.createTextNode(field.value));label.append(checkbox,span);list.append(label);}
 document.getElementById('bc-handoff-status').textContent=list.children.length?'':'Add useful context to your brief first.';
 document.getElementById('bc-handoff').showModal();
};
document.getElementById('bc-plan-content').onclick=()=>openHandoff('content');
document.getElementById('bc-plan-profile').onclick=()=>openHandoff('profile');
document.getElementById('bc-handoff-confirm').onclick=()=>{
 const selected={};for(const check of document.querySelectorAll('#bc-handoff-items input:checked'))selected[check.dataset.key]=document.getElementById('bc-'+check.dataset.key).value;
 const notice=document.getElementById('bc-handoff-status');
 if(!Object.keys(selected).length){notice.textContent='Select at least one item.';return}
 if(Object.entries(selected).filter(([k])=>['evidence','proof','checks','ideas','plan'].includes(k)).map(([k,v])=>k+': '+v).join('\n\n').length>6000){notice.textContent='Shorten the selected evidence and planning notes to 6,000 characters combined.';return}
 if(Object.values(selected).join('').length>12000){notice.textContent='Select less context or shorten your notes. This handoff allows 12,000 characters.';return}
 try{const savedAt=Date.now();sessionStorage.setItem(returnKey,JSON.stringify({savedAt,fields:Object.fromEntries(fields.map(f=>[f.id,f.value]))}));sessionStorage.setItem(destination==='profile'?'edge-brand-profile-handoff-v1':handoffKey,JSON.stringify({savedAt,fields:selected}));edited=false;window.location.href=destination==='profile'?'/tools/brand-profile-generator':'/tools/content-sprint-generator';}catch{notice.textContent='Temporary storage is unavailable. Copy or download your brief instead.'}
};
