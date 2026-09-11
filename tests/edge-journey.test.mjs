import test from 'node:test';import assert from 'node:assert/strict';import ts from 'typescript';import fs from 'node:fs';
const {validateJourney,onRequestPost}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync('functions/api/edge-journey.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const base={stage:0,values:{situation:'Should we run a limited pilot before launch?'},context:[]};
test('journey requires usable context and observed evidence for review',()=>{
 assert.equal(validateJourney(base).stage,0);
 for(const v of [{...base,stage:5},{...base,values:{situation:42}},{stage:1,values:{}},{stage:3,values:{learning:'It must have worked really well.'}},{...base,context:[{label:'x',value:8,source:'draft'}]}])assert.throws(()=>validateJourney(v));
 assert.equal(validateJourney({stage:1,values:{},context:[{label:'Choice',value:'Run a small pilot before expanding.',source:'AI suggestion'}]}).context.length,1);
});
test('journey preserves observations even if provider rewrites them',async()=>{
 const old=globalThis.fetch;
 try{globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({suggestions:{observations:'Invented success',difference:'The expected response level was not met.',learning:'Evidence is limited.',nexttest:'Gather feedback.'},questions:[],note:'Consider the evidence.'})}}]}));
 const observation='Three participants attended; feedback has not yet been collected.';
 const r=await onRequestPost({request:new Request('https://local/api',{method:'POST',body:JSON.stringify({stage:3,values:{observations:observation}})}),env:{OPENAI_API_KEY:'test'}});
 assert.equal(r.status,200);const body=await r.json();assert.equal(body.suggestions.observations,observation);assert.match(body.suggestions.difference,/No expectation/);assert.doesNotMatch(body.suggestions.difference,/was not met/);assert.match(body.suggestions.learning,/Possible interpretation/);
 }finally{globalThis.fetch=old;}
});
test('journey rejects malformed provider structure without exposing it',async()=>{
 const old=globalThis.fetch;
 try{globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:'private malformed response'}}]}));
 const r=await onRequestPost({request:new Request('https://local/api',{method:'POST',body:JSON.stringify(base)}),env:{OPENAI_API_KEY:'test'}});assert.equal(r.status,502);assert.doesNotMatch(await r.text(),/private malformed/);
 }finally{globalThis.fetch=old;}
});
test('an unconfirmed source cannot overwrite the suggested direction as a confirmed decision',async()=>{
 const old=globalThis.fetch;
 try{globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({suggestions:{outcome:'A useful draft',direction:'A proposed pilot',success:'',scope:''},questions:[],note:'Confirm your direction.'})}}]}));
 const run=async source=>{const r=await onRequestPost({request:new Request('https://local/api',{method:'POST',body:JSON.stringify({stage:1,values:{},context:[{label:'Direction',value:'Roll out to everyone immediately.',source}]})}),env:{OPENAI_API_KEY:'test'}});return (await r.json()).suggestions.direction};
 assert.equal(await run('unconfirmed direction'),'A proposed pilot');
 assert.equal(await run('User-confirmed direction'),'Roll out to everyone immediately.');
 }finally{globalThis.fetch=old;}
});
test('numeric and timing drafts require review unless already supplied verbatim',async()=>{
 const {needsDetailConfirmation}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync('functions/api/edge-journey.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
 for(const s of ['Complete four self-directed learning sessions.','Confirm availability at least one week before the workshop.','Achieve 50% participation.','Spend £200 on materials.','Review next Friday.'])assert.equal(needsDetailConfirmation(s,['Run a small pilot.']),true,s);
 assert.equal(needsDetailConfirmation('Run a pilot with two customers.',['Run a pilot with two customers.']),false);
 assert.equal(needsDetailConfirmation('Record production effort and gather customer feedback.',['Run a small pilot.']),false);
 assert.equal(needsDetailConfirmation('1. Gather feedback.\n2. Record effort.',['Run a small pilot.']),false);
});
test('challenge mode is explicit and invalid modes are rejected',()=>{
 assert.equal(validateJourney({...base,approach:'challenge'}).approach,'challenge');
 assert.equal(validateJourney(base).approach,'compare');
 assert.throws(()=>validateJourney({...base,approach:'decide-for-me'}));
});
