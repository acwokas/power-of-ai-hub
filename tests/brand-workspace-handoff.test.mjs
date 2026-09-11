import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const {parseBrandContentHandoff:parse}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync('src/lib/brand-workspace-handoff.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const now=10000000;
const payload=fields=>JSON.stringify({savedAt:now,fields});
test('handoff keeps only explicitly supplied fields without filling missing private context',()=>{
 const result=parse(payload({audience:'Student organisers'}),now);
 assert.deepEqual(result.fields,{audience:'Student organisers'});
 assert.equal(result.fields.proof,undefined);
});
test('handoff rejects expired, future, malformed and oversized content',()=>{
 for(const raw of [null,'{',JSON.stringify({savedAt:now-7200000,fields:{audience:'x'}}),JSON.stringify({savedAt:now+1,fields:{audience:'x'}}),payload({unknown:'x'}),payload({audience:[]}),payload({evidence:'a'.repeat(4000),proof:'b'.repeat(4000)}),payload({})])assert.equal(parse(raw,now),null);
});
