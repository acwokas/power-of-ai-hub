import test from 'node:test';import assert from 'node:assert/strict';import {loadModule} from './module-loader.mjs';
const {onRequest}=await loadModule('functions/_middleware.ts');
function fixture(enabled=true) {
 const calls=[],pending=[]; let downstream=0;
 const db={
  prepare(sql) { return {
   bind(...values){calls.push({sql,values});return this;},
   async run(){return {meta:{changes:1}};},
   async all(){return {results:[{tool:'edge-journey'}]};},
  }; },
  async batch(){return [];},
 };
 const env={OPENAI_API_KEY:'test-only',EDGE_RECEIPT_RELEASE:'a'.repeat(40),EDGE_DELIVERY_RECEIPTS:enabled?'enabled':'disabled',EDGE_USAGE:db};
 return {
  calls,pending,env,get downstream(){return downstream;},
  context(path='/api/edge-journey',body={}) { return {
   env,request:new Request('https://example.com'+path,{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify(body)}),
   waitUntil(p){pending.push(p);},
   async next(){downstream++;return Response.json({suggestions:{situation:'PRIVATE'}});},
  }; },
 };
}

test('opted-in middleware preserves provider output and records only metadata after existing quota',async()=>{const f=fixture();const r=await onRequest(f.context());await Promise.all(f.pending);assert.deepEqual(await r.json(),{suggestions:{situation:'PRIVATE'}});assert.equal(f.downstream,1);assert.ok(r.headers.get('X-Edge-Receipt-Token'));assert.ok(f.calls[0].sql.includes('usage_reservations'));const receipt=f.calls.find(x=>x.sql.startsWith('INSERT INTO terminal_receipts'));assert.ok(receipt);assert.doesNotMatch(JSON.stringify(f.calls),/PRIVATE/);});
test('disabled feature creates no receipts and keeps original output',async()=>{const f=fixture(false);const r=await onRequest(f.context());await Promise.all(f.pending);assert.equal(r.headers.has('X-Edge-Receipt-Id'),false);assert.equal(f.calls.some(x=>x.sql.includes('terminal_receipts')),false);});
test('receipt acknowledgement never invokes provider, reserves quota or enters tool analytics',async()=>{const f=fixture();const r=await onRequest(f.context('/api/delivery-receipt',{id:'12345678-1234-4123-8123-123456789abc',token:'b'.repeat(64)}));await Promise.all(f.pending);assert.equal(r.status,204);assert.equal(f.downstream,0);assert.equal(f.calls.length,1);assert.match(f.calls[0].sql,/UPDATE terminal_receipts/);assert.doesNotMatch(f.calls[0].sql,/usage_reservations|daily_outcomes/);});
test('cross-origin acknowledgement rejected without database or provider access',async()=>{const f=fixture();const c=f.context('/api/delivery-receipt');c.request=new Request(c.request,{headers:{Origin:'https://attacker.example','Content-Type':'application/json'}});assert.equal((await onRequest(c)).status,403);assert.equal(f.calls.length,0);assert.equal(f.downstream,0);});
test('receipt insert failure does not replace a successful user response',async()=>{const f=fixture();const old=f.env.EDGE_USAGE.prepare;f.env.EDGE_USAGE.prepare=sql=>{const q=old(sql);if(sql.startsWith('INSERT INTO terminal_receipts'))q.run=async()=>{throw Error('private database error')};return q};const r=await onRequest(f.context());await Promise.all(f.pending);assert.equal(r.status,200);assert.equal(r.headers.has('X-Edge-Receipt-Id'),false);assert.deepEqual(await r.json(),{suggestions:{situation:'PRIVATE'}});});
