import test from 'node:test';import assert from 'node:assert/strict';import ts from 'typescript';import fs from 'node:fs';
const {validateRedTeam,onRequestPost}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync('functions/api/redteam-analysis.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
test('Red Team validates every request mode and forwards original synthesis context',async()=>{
 assert.throws(()=>validateRedTeam({mode:'invalid'}));assert.throws(()=>validateRedTeam({mode:'mitigation',concern:42}));assert.throws(()=>validateRedTeam({mode:'synthesis',analysisText:[]}));
 const body={mode:'synthesis',analysisText:'An unverified generated challenge requiring more investigation.',ideaContext:'The pilot has a fixed scope and no external participants.'};assert.equal(validateRedTeam(body).mode,'synthesis');
 const old=globalThis.fetch;try{globalThis.fetch=async(_,opts)=>{const sent=JSON.parse(opts.body);assert.match(sent.messages[1].content,/fixed scope/);return new Response('data: [DONE]\n\n');};const r=await onRequestPost({request:new Request('https://local/api',{method:'POST',body:JSON.stringify(body)}),env:{OPENAI_API_KEY:'test'}});assert.equal(r.status,200);}finally{globalThis.fetch=old;}
});
