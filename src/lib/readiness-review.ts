export const readinessAreas = [
 {id:'purpose',pillar:'Evaluate',title:'Purpose and the people affected',prompt:'What useful outcome is intended? Who benefits, who may be affected, and what alternatives have you considered?'},
 {id:'evidence',pillar:'Evaluate',title:'Evidence of usefulness and limits',prompt:'What have you tested? What can the system reliably do in this setting, and what remains an assumption?'},
 {id:'ownership',pillar:'Define / Govern',title:'Ownership and decision boundaries',prompt:'Who is accountable for this use case? What can people decide themselves, and what needs another person to review it?'},
 {id:'information',pillar:'Govern',title:'Information and permissions',prompt:'What data is used, where does it go, and who can access it? Which permissions, contracts or obligations need to be checked by an accountable person?'},
 {id:'oversight',pillar:'Govern',title:'Human review and a way to pause',prompt:'How will people notice an unsuitable output, raise a concern or pause the activity? Match oversight to the consequences of an error.'},
 {id:'learning',pillar:'Elevate',title:'Results, changes and continued learning',prompt:'Who reviews actual outcomes and feedback? How will changes in the system or its use trigger another review?'}
];
export type ReadinessNotes = Record<string,{status?:string;evidence?:string;action?:string}>;
export function readinessStatus(note:ReadinessNotes[string]={}):string {
 if(note.status==='evidence') return note.evidence?.trim()?'Evidence recorded, not independently verified':'Evidence still to record';
 if(note.status==='attention') return 'Needs attention';
 if(note.status==='na') return note.evidence?.trim()?'Marked not applicable, reason recorded':'Scope reason still to record';
 return 'Not yet established';
}
export function readinessReport(scope:string,notes:ReadinessNotes):string {
 const sections=['EDGE AI readiness review','Scope: '+(scope.trim()||'Not yet defined.'),'User-authored discussion brief. No readiness score, certification or deployment approval. Evidence and proposed actions require review.'];
 for(const area of readinessAreas){const note=notes[area.id]||{};sections.push(area.pillar+' / '+area.title,readinessStatus(note),'Evidence or scope reason: '+(note.evidence?.trim()||'Not recorded.'),'Next action, owner and review point: '+(note.action?.trim()||'Not yet agreed.'));}
 sections.push('Next step: resolve the important unknowns with the relevant people, agree proportionate actions and revisit after observing results.');
 return sections.join('\n\n');
}
