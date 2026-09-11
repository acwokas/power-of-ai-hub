import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
const {validateDecisionInput,onRequestPost}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync('functions/api/decision-analysis.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const input={decision:'Run a small paid pilot or commit to a full rollout.',stakes:'Protect delivery capacity.',timeHorizon:'6months'};
test('decision input rejects malformed values and excessive context',()=>{
 assert.equal(validateDecisionInput(input).constraints,'');
 for(const change of [{decision:42},{stakes:[]},{constraints:'a'.repeat(501)},{timeHorizon:'tomorrow'}])assert.throws(()=>validateDecisionInput({...input,...change}));
});
test('handler bounds request body and conceals upstream error detail',async()=>{
 const req=body=>new Request('https://local/api',{method:'POST',body});
 assert.equal((await onRequestPost({request:req('x'.repeat(20001)),env:{OPENAI_API_KEY:'test'}})).status,400);
 const old=globalThis.fetch;
 try {
  globalThis.fetch=async()=>new Response('private provider detail',{status:429});
  const r=await onRequestPost({request:req(JSON.stringify(input)),env:{OPENAI_API_KEY:'test'}});
  assert.equal(r.status,429);assert.doesNotMatch(await r.text(),/private provider detail/);
 }finally{globalThis.fetch=old;}
});
