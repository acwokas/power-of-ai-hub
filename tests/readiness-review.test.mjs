import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const {readinessReport:report,readinessStatus:status}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync('src/lib/readiness-review.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
test('status does not promote unsupported selections to evidence or accepted exclusions',()=>{
 assert.equal(status({status:'evidence'}),'Evidence still to record');
 assert.equal(status({status:'na'}),'Scope reason still to record');
 assert.equal(status({status:'evidence',evidence:'Trial notes'}),'Evidence recorded, not independently verified');
 assert.equal(status({status:'na',evidence:'Outside the selected internal use case.'}),'Marked not applicable, reason recorded');
});
test('report preserves scope and actions, leaves unanswered areas visible and never computes a score',()=>{
 const output=report('Internal workshop suggestions',{purpose:{status:'attention',evidence:'No audience input yet.',action:'Organiser to ask students before the trial.'}});
 assert.match(output,/Internal workshop suggestions/);assert.match(output,/No audience input yet/);assert.match(output,/Organiser to ask students/);assert.match(output,/Not yet established/);assert.doesNotMatch(output,/\d+%|Level \d|out of 5/);
});
