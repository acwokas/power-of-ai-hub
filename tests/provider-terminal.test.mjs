import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const load = async name => (await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync(`${process.env.PROVIDER_SOURCE_ROOT||'.'}/functions/api/${name}.ts`,'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'))).onRequestPost;
const cases = [
 ['edge-journey',{stage:0,values:{situation:'Should we run a limited pilot before launch?'},context:[]},JSON.stringify({suggestions:{situation:'A PRIVATE proposed pilot',facts:'',options:'',unknowns:''},questions:[],note:'Review the draft.'})],
 ['edge-practice',{action:'reply',mode:'negotiation',role:'Supplier',context:'Discuss the scope of a reporting pilot.',messages:[{role:'user',content:'Could we begin with a limited pilot?'}]},'PRIVATE plausible response'],
 ['edge-practice',{action:'coach',mode:'negotiation',role:'Supplier',context:'Discuss a reporting pilot.',messages:[{role:'user',content:'Could we begin with a pilot?'},{role:'assistant',content:'What scope?'},{role:'user',content:'One report.'}]},JSON.stringify({observations:[],nextAttempt:'PRIVATE proposed question',limits:'Practice only.'})],
];
for(const [name,input,content] of cases) for(const reason of ['stop','length','content_filter','tool_calls',null,undefined]) {
 test(`${name}/${input.action||'suggest'} accepts only explicit stop (${reason})`,async()=>{
  const handler=await load(name),old=globalThis.fetch;
  try {
   globalThis.fetch=async()=>Response.json({choices:[{finish_reason:reason,message:{content}}]});
   const response=await handler({request:new Request('https://local/api/'+name,{method:'POST',body:JSON.stringify(input)}),env:{OPENAI_API_KEY:'test'}});
   assert.equal(response.status,reason==='stop'?200:502);
   if(reason!=='stop')assert.doesNotMatch(await response.text(),/PRIVATE/);
  }finally {globalThis.fetch=old;}
 });
}
