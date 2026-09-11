import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { readinessAreas, readinessReport, readinessStatus, type ReadinessNotes } from '@/lib/readiness-review';

export default function ReadinessReview() {
 const [scope,setScope]=useState('');
 const [notes,setNotes]=useState<ReadinessNotes>({});
 const [summary,setSummary]=useState(false);
 const [notice,setNotice]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);
 const [selected,setSelected]=useState<string[]>([]);
 useEffect(()=>{try{const raw=sessionStorage.getItem('edge-readiness-return-v1');sessionStorage.removeItem('edge-readiness-return-v1');if(!raw||raw.length>65000)return;const saved=JSON.parse(raw);if(saved.savedAt>Date.now()||Date.now()-saved.savedAt>=7200000||typeof saved.scope!=='string'||saved.scope.length>3000)return;const clean:ReadinessNotes={};for(const area of readinessAreas){const n=saved.notes?.[area.id];if(n&&['status','evidence','action'].every(k=>n[k]===undefined||typeof n[k]==='string'&&n[k].length<=4000))clean[area.id]=n;}setScope(saved.scope);setNotes(clean);setNotice('Your readiness notes have been restored.');}catch{setNotice('Temporary notes could not be restored.');}},[]);
 const handoff=()=>{const chosen:ReadinessNotes={};for(const id of selected)chosen[id]=notes[id]||{};const context=['Readiness review: user-authored, evidence not independently verified.',...(selected.includes('scope')?['Scope: '+scope]:[]),...readinessAreas.filter(a=>selected.includes(a.id)).map(a=>a.title+'\nStatus: '+readinessStatus(chosen[a.id])+'\nEvidence: '+(chosen[a.id]?.evidence||'Not recorded.')+'\nNext action: '+(chosen[a.id]?.action||'Not yet agreed.'))].join('\n\n');if(!selected.length){setNotice('Select at least one area to carry forward.');return;}if(context.length>6000){setNotice('Select fewer areas or shorten your notes to 6,000 characters.');return;}try{const savedAt=Date.now();sessionStorage.setItem('edge-readiness-return-v1',JSON.stringify({savedAt,scope,notes}));sessionStorage.setItem('edge-readiness-handoff-v1',JSON.stringify({savedAt,context}));window.location.href='/tools/edge-journey#govern';}catch{setNotice('Temporary storage unavailable. Download your report instead.');}};
 const update=(id:string,field:string,value:string)=>setNotes(previous=>({...previous,[id]:{...previous[id],[field]:value}}));
 const report=readinessReport(scope,notes);
 const download=()=>{const url=URL.createObjectURL(new Blob([report],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='EDGE-AI-readiness-review.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('Report download requested. It includes your scope, evidence notes and next actions.');};
 return <div className="readiness-review space-y-7">
  <style>{`@media print { @page{margin:18mm} body{background:white!important;color:#111!important} body> :not(main),main>section:first-child,.readiness-controls,.readiness-form{display:none!important} main,main>section,main>section>div,astro-island,.readiness-review{display:block!important;padding:0!important;margin:0!important;width:100%!important;max-width:none!important} .readiness-report{display:block!important;color:#111!important;background:white!important} .readiness-report h2{font: bold 20pt/1.3 Arial,sans-serif}.readiness-report p{font:11pt/1.4 Arial,sans-serif;color:#333!important}.readiness-report pre{font:11pt/1.5 Arial,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere;orphans:3;widows:3}}`}</style>
  <div className="readiness-controls border border-border/40 p-5 space-y-3">
   <p>Choose one AI use case, team or service. Describe the evidence you have and where you need to learn more. A small team can use this without creating committees or elaborate processes.</p>
   <p className="text-sm text-muted-foreground">Your notes stay in this page until it is refreshed or closed. No AI requests or automatic saving. Download a copy to continue later.</p>
  </div>
  {!summary && <div className="readiness-form space-y-8">
   <div className="space-y-2"><label htmlFor="ready-scope" className="font-medium">What are you reviewing?</label><Textarea id="ready-scope" maxLength={3000} value={scope} onChange={e=>setScope(e.target.value)} placeholder="The use case, people affected, intended benefit and what is outside this review."/></div>
   {readinessAreas.map((area,index)=>{const note=notes[area.id]||{};return <section key={area.id} className="border-t border-border/40 pt-6 space-y-3" aria-labelledby={'ready-title-'+area.id}>
    <p className="text-xs uppercase tracking-widest text-muted-foreground">{index+1} / {area.pillar}</p>
    <h2 id={'ready-title-'+area.id} className="text-xl font-semibold">{area.title}</h2><p className="text-sm text-muted-foreground">{area.prompt}</p>
    <label className="block text-sm" htmlFor={'ready-state-'+area.id}>Where does this stand?</label>
    <select id={'ready-state-'+area.id} className="w-full border border-border rounded p-3 bg-background" value={note.status||'unknown'} onChange={e=>update(area.id,'status',e.target.value)}>
     <option value="unknown">Not yet established</option><option value="evidence">Evidence available to review</option><option value="attention">Needs attention</option><option value="na">Not applicable to this scope</option>
    </select>
    <label className="block text-sm" htmlFor={'ready-evidence-'+area.id}>{note.status==='na'?'Why is this outside the scope?':'What supports this view?'}</label>
    <Textarea id={'ready-evidence-'+area.id} maxLength={4000} value={note.evidence||''} onChange={e=>update(area.id,'evidence',e.target.value)} placeholder={note.status==='na'?'Give a reason others can review.':'Record the source, what it shows, when it was checked and any uncertainty. Avoid confidential details.'}/>
    <label className="block text-sm" htmlFor={'ready-action-'+area.id}>Next action, owner and review point</label>
    <Textarea id={'ready-action-'+area.id} maxLength={3000} value={note.action||''} onChange={e=>update(area.id,'action',e.target.value)} placeholder="For example: ask the service owner to confirm who reviews outputs before the trial begins. Names and timing remain proposals until agreed."/>
   </section>})}
  </div>}
  <section className="readiness-report space-y-4" hidden={!summary} aria-labelledby="readiness-summary-title"><h2 id="readiness-summary-title" tabIndex={-1} className="text-2xl font-semibold">Your readiness discussion brief</h2>
   <p className="text-sm text-muted-foreground">This records your review. It does not certify readiness, verify evidence or approve deployment.</p>
   <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{report}</pre>
  </section>
  <div className="readiness-controls space-y-4">
   <div className="flex flex-wrap gap-3"><Button onClick={()=>{setSummary(!summary);requestAnimationFrame(()=>document.getElementById(summary?'ready-scope':'readiness-summary-title')?.focus());}}>{summary?'Edit notes':'Review the brief'}</Button><Button variant="outline" data-edge-event="edge_export_requested" onClick={download}>Download report</Button><Button variant="outline" data-edge-event="edge_export_requested" onClick={async()=>{try{const {downloadReadinessPdf}=await import('@/lib/readiness-pdf');await downloadReadinessPdf(report);setNotice('PDF download requested.');}catch(e){setNotice(e instanceof Error?e.message:'PDF could not be created. Use the text download.');}}}>Download PDF</Button><Button variant="outline" data-edge-event="edge_export_requested" onClick={()=>window.print()}>Print / save as PDF</Button></div>
   <p role="status" className="text-sm">{notice}</p>
   <p className="text-sm text-muted-foreground">Use the unknowns and next actions to plan a proportionate next step. Return after testing and update the evidence.</p>
   <Button variant="outline" onClick={()=>{setSelected([]);dialog.current?.showModal();}}>Choose findings for an EDGE action plan</Button><p className="text-xs text-muted-foreground">Choose what to share, then review it in your working brief. This tab keeps your review for up to two hours so you can return. No AI request is made by the handoff.</p>
   <dialog ref={dialog} aria-labelledby="readiness-handoff-title" className="p-6 max-w-xl w-full bg-background text-foreground rounded border">
    <h2 id="readiness-handoff-title" className="text-xl">Choose useful context</h2><p>Only selected notes are carried forward. The full review is kept separately for your return.</p>
    {[{id:'scope',title:'Review scope'},...readinessAreas].map(area=><label key={area.id} className="flex gap-3 py-3"><input type="checkbox" checked={selected.includes(area.id)} onChange={e=>setSelected(v=>e.target.checked?[...v,area.id]:v.filter(id=>id!==area.id))}/>{area.title}</label>)}
    <p role="status">{notice}</p><div className="flex gap-3"><Button onClick={handoff}>Continue with selected findings</Button><Button variant="outline" onClick={()=>dialog.current?.close()}>Cancel</Button></div>
   </dialog>
  </div>
 </div>;
}
