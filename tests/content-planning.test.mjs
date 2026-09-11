import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
const {onRequestPost}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync('functions/api/content-sprint-generator.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const req=sprintConfig=>({request:new Request('https://local/api',{method:'POST',body:JSON.stringify({sprintConfig})}),env:{OPENAI_API_KEY:'test'}});
test('content planning carries the chosen outcome, evidence and bounded cadence to generation',async()=>{
 const old=globalThis.fetch;let sent;
 try{
  globalThis.fetch=async(_,options)=>{sent=JSON.parse(options.body);return new Response('data: '+JSON.stringify({choices:[{delta:{content:'## Day 1\n\nDraft'}}]})+'\n\ndata: [DONE]\n\n')};
  const result=await onRequestPost(req({duration:14,ideaCount:1,platforms:['LinkedIn'],objective:'Help organisers choose a format',evidence:'The author supplied workshop attendance notes.'}));
  assert.equal(result.status,200);
  const prompt=sent.messages[0].content;
  assert.match(prompt,/exactly 1 distinct editorial ideas/);
  assert.match(prompt,/Help organisers choose a format/);
  assert.match(prompt,/author supplied workshop attendance notes/);
  assert.match(prompt,/not independently verified/);
  assert.match(prompt,/Skip other days entirely/);
 }finally{globalThis.fetch=old}
});
test('invalid idea counts and evidence shapes are rejected before generation',async()=>{
 for(const change of [{ideaCount:0},{ideaCount:8},{ideaCount:2.5},{evidence:[]},{objective:'x'.repeat(6001)}]){
  assert.equal((await onRequestPost(req({duration:7,platforms:['LinkedIn'],...change}))).status,400);
 }
});

test('generator rejects an incorrect number of ideas instead of displaying excess output',async()=>{
 const old=globalThis.fetch;
 try{globalThis.fetch=async()=>new Response('data: '+JSON.stringify({choices:[{delta:{content:'## Day 1\nDraft\n## Day 3\nExtra'}}]})+'\n\ndata: [DONE]\n\n');
 const response=await onRequestPost(req({duration:7,ideaCount:1,platforms:['LinkedIn']}));assert.equal(response.status,502);
 }finally{globalThis.fetch=old}
});
