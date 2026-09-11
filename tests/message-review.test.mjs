import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
const load=async path=>import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync(path,'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const {validateMessageInput,readMessageInput}=await load('functions/_shared/message-input.ts');
const {restoreDraft,DRAFT_TTL,parseSuggestion,wordChanges,streamReview}=await load('src/lib/message-review.ts');
const draft={message:'A factual message to review.',intent:'Explain the change.',audiences:[{name:'Team',perspective:'Needs timing.'}]};
test('one audience accepted; malformed types, duplicate audiences and oversized inputs rejected',()=>{
 assert.equal(validateMessageInput(draft).audiences.length,1);
 for(const change of [{message:42},{audiences:'team'},{audiences:[null]},{message:'x'.repeat(12001)},{audiences:[draft.audiences[0],draft.audiences[0]]},{audiences:[]}])assert.throws(()=>validateMessageInput({...draft,...change}));
 assert.throws(()=>validateMessageInput(draft,true));
});
test('oversized body rejected before parsing',async()=>{await assert.rejects(()=>readMessageInput(new Request('https://local/api',{method:'POST',body:'x'.repeat(160001)})),/too large/)});
test('draft round trip preserves edited audience; invalid and expired data ignored',()=>{
 assert.deepEqual(restoreDraft(JSON.stringify({savedAt:100,draft}),101),draft);
 assert.equal(restoreDraft(JSON.stringify({savedAt:100,draft}),101+DRAFT_TTL),null);
 assert.equal(restoreDraft('{'),null);
 assert.equal(restoreDraft(JSON.stringify({savedAt:100,draft:{...draft,audiences:'bad'}}),101),null);
});
test('rewrite parser retains full message and rationale across nested headings',()=>{
 const p=parseSuggestion('## Per audience rewrites\n### Team\nHello\n\n## Overall rewrite\nHello everyone.\n\nHere is the update.\n\n## What changed and why\n- Clarified timing.\n- Preserved facts.');
 assert.equal(p.message,'Hello everyone.\n\nHere is the update.');assert.equal(p.rationale.length,2);
});
test('diff preserves both inputs, including markup as plain text',()=>{
 const original='Hi <team>, old text.',revised='Hi <team>, new text.';const d=wordChanges(original,revised);
 assert.equal(d.left.map(x=>x.text).join(''),original);assert.equal(d.right.map(x=>x.text).join(''),revised);assert(d.right.some(x=>x.changed));
});
test('stream handles split data and rejects truncated or errored responses',async()=>{
 const originalFetch=globalThis.fetch;
 try{const chunks=['data: {"choices":[{"delta":{"content":"Hi',' there"}}]}\n\ndata: [DONE]\n'];globalThis.fetch=async()=>new Response(new ReadableStream({start(c){for(const s of chunks)c.enqueue(new TextEncoder().encode(s));c.close()}}));
 assert.equal(await streamReview('/api',{},new AbortController().signal,()=>{}),'Hi there');
 globalThis.fetch=async()=>new Response('data: {"choices":[{"delta":{"content":"Partial"}}]}\n');await assert.rejects(()=>streamReview('/api',{},new AbortController().signal,()=>{}),/interrupted/);
 globalThis.fetch=async()=>new Response('data: {"error":{"message":"failed"}}\n');await assert.rejects(()=>streamReview('/api',{},new AbortController().signal,()=>{}),/retry/);
 }finally{globalThis.fetch=originalFetch}
});
test('both API handlers validate one audience and preserve prompt safety constraints',async()=>{
 const shared=ts.transpile(fs.readFileSync('functions/_shared/message-input.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
 const sharedUrl='data:text/javascript;base64,'+Buffer.from(shared).toString('base64');
 const originalFetch=globalThis.fetch;
 try{for(const suffix of ['', '-rewrite']){
  let source=fs.readFileSync('functions/api/before-you-send'+suffix+'.ts','utf8').replace("'../_shared/message-input'",JSON.stringify(sharedUrl));
  const module=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(source,{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
  let requestBody;globalThis.fetch=async(url,init)=>{requestBody=JSON.parse(init.body);return new Response('data: [DONE]\n',{headers:{'Content-Type':'text/event-stream'}})};
  const body={...draft,...(suffix?{analysis:'The message is clear.'}:{})};
  const response=await module.onRequestPost({request:new Request('https://example.test/api',{method:'POST',body:JSON.stringify(body)}),env:{OPENAI_API_KEY:'test-only'}});
  assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/no-store/);assert.match(requestBody.messages[0].content,/Never add reassurance|Do not invent assurances/);
  const invalid=await module.onRequestPost({request:new Request('https://example.test/api',{method:'POST',body:JSON.stringify({...body,message:42})}),env:{OPENAI_API_KEY:'test-only'}});assert.equal(invalid.status,400);
 }}finally{globalThis.fetch=originalFetch}
});
