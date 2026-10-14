import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile=path=>'data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync(path,'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64');
const dep=compile('functions/lib/delivery-receipt.ts');
const source=fs.readFileSync('functions/lib/acknowledgement-endpoint.ts','utf8').replace("'./delivery-receipt'",JSON.stringify(dep));
const {handleDeliveryAcknowledgement}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(source,{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const body={id:'12345678-1234-4123-8123-123456789abc',token:'b'.repeat(64)};
function request(opts={}){return new Request('https://example.com/api/delivery-receipt',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify(body),...opts});}
for(const [name,req,status] of [['wrong method',request({method:'GET',body:undefined}),405],['cross origin',request({headers:{Origin:'https://attacker.example','Content-Type':'application/json'}}),403],['no origin',request({headers:{'Content-Type':'application/json'}}),403],['wrong media',request({headers:{Origin:'https://example.com','Content-Type':'text/plain'}}),415],['extra content',request({body:JSON.stringify({...body,content:'PRIVATE'})}),400],['oversized',request({body:'x'.repeat(257)}),413],['invalid JSON',request({body:'{'}),400]])test(name+' is rejected before store access',async()=>{
 let calls=0;const r=await handleDeliveryAcknowledgement(req,async()=>{calls++;return true;},1000);assert.equal(r.status,status);assert.equal(calls,0);assert.equal(await r.text(),'');
});
test('valid endpoint sends only fixed metadata and hashed token to store once',async()=>{
 let calls=0;const r=await handleDeliveryAcknowledgement(request(),async(id,digest,now)=>{
  calls++;assert.equal(id,body.id);assert.match(digest,/^[a-f0-9]{64}$/);assert.notEqual(digest,body.token);assert.equal(now,1000);return true;
 },1000);assert.equal(r.status,204);assert.equal(calls,1);assert.equal(r.headers.get('cache-control'),'no-store');
});
test('missing, expired, incomplete and reused receipts share an empty conflict response',async()=>{
 let calls=0;const r=await handleDeliveryAcknowledgement(request(),async()=>{calls++;return false;},1000);assert.equal(r.status,409);assert.equal(calls,1);assert.equal(await r.text(),'');
});
test('store error is unknown, with no retry or leaked text',async()=>{
 let calls=0;const r=await handleDeliveryAcknowledgement(request(),async()=>{calls++;throw Error('PRIVATE');},1000);assert.equal(r.status,503);assert.equal(calls,1);assert.equal(await r.text(),'');
});

for(const value of [undefined,null,'unknown',1,{}])test('nonboolean store response never certifies acknowledgement '+JSON.stringify(value),async()=>{
 const r=await handleDeliveryAcknowledgement(request(),async()=>value,1000);assert.equal(r.status,409);
});
