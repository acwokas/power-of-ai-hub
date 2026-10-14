import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const code=ts.transpile(fs.readFileSync('src/lib/delivery-acknowledgement.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const {acknowledgeCommittedResponse}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const id='12345678-1234-4123-8123-123456789abc',token='b'.repeat(64);
const response=(headers={},status=200)=>new Response('PRIVATE MODEL OUTPUT',{status,headers:{'X-Edge-Receipt-Id':id,'X-Edge-Receipt-Token':token,...headers}});
test('client sends only exact receipt to same-origin endpoint, never response content',async()=>{
 const r=response();let calls=0;
 assert.equal(await acknowledgeCommittedResponse(r,async(url,options)=>{
  calls++;assert.equal(url,'/api/delivery-receipt');assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{id,token});
  assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.equal(options.referrerPolicy,'no-referrer');assert.ok(options.signal);
  assert.ok(!JSON.stringify(options).includes('PRIVATE'));return new Response(null,{status:204});
 }),true);
 assert.equal(calls,1);assert.equal(r.bodyUsed,false);
});
for(const [name,r] of [['no receipt',new Response('PRIVATE')],['failed API',response({},500)],['forged ID',response({'X-Edge-Receipt-Id':'PRIVATE'})],['bad token',response({'X-Edge-Receipt-Token':'PRIVATE'})]])test(name+' never sends',async()=>{
 let calls=0;assert.equal(await acknowledgeCommittedResponse(r,async()=>{calls++;}),false);assert.equal(calls,0);
});
for(const status of [200,400,403,409,410,500])test('non-ack status '+status+' stays unknown and is not retried',async()=>{
 let calls=0;assert.equal(await acknowledgeCommittedResponse(response(),async()=>{calls++;return new Response(null,{status});}),false);assert.equal(calls,1);
});
test('network error does not retry or change the result displayed to the user',async()=>{
 const r=response();let calls=0;assert.equal(await acknowledgeCommittedResponse(r,async()=>{calls++;throw Error('PRIVATE network error');}),false);assert.equal(calls,1);assert.equal(r.bodyUsed,false);
});
