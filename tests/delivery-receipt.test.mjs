import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {spawnSync} from 'node:child_process';
const code=ts.transpile(fs.readFileSync('functions/lib/delivery-receipt.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const m=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const release='a'.repeat(40),token='b'.repeat(64),id='12345678-1234-4123-8123-123456789abc';
test('new receipt has only fixed metadata and keeps the raw token out of stored row',async()=>{
 const a=await m.createDeliveryReceipt('edge-journey',release,1000),b=await m.createDeliveryReceipt('edge-journey',release,1000);
 assert.deepEqual(Object.keys(a.row).sort(),['created_minute','expires_at','id','release','token_digest','tool']);
 assert.notEqual(a.client.token,b.client.token);assert.notEqual(a.client.id,b.client.id);
 assert.equal(a.row.created_minute,960);assert.equal(a.row.expires_at,1900);
 assert.equal(a.row.token_digest,await m.acknowledgementDigest(a.client.token));
 assert.ok(!JSON.stringify(a.row).includes(a.client.token));
 assert.deepEqual(m.validateAcknowledgement(a.client),a.client);
});
for(const [name,args] of [['unknown tool',['PRIVATE TOOL',release,1000]],['bad release',['edge-journey','main',1000]],['bad clock',['edge-journey',release,NaN]]])test(name,async()=>assert.rejects(()=>m.createDeliveryReceipt(...args)));
for(const body of [null,[],{}, {id,token,output:'PRIVATE'}, {id,token,tool:'edge-journey'}, {id:'wrong',token},{id,token:'x'}])test('reject malformed or extra acknowledgement '+JSON.stringify(body),()=>assert.throws(()=>m.validateAcknowledgement(body)));
function sqlite(actions){
 const payload={schema:m.RECEIPT_SCHEMA,terminal:m.RECORD_TERMINAL_SQL,ack:m.CONSUME_ACK_SQL,expire:m.EXPIRE_RECEIPTS_SQL,actions};
 const run=spawnSync('python3',['-c',`import sqlite3,json,sys
p=json.load(sys.stdin);c=sqlite3.connect(':memory:');c.execute(p['schema'])
c.execute("insert into terminal_receipts(id,tool,release,token_digest,created_minute,expires_at) values('id','edge-journey','release','digest',960,1900)")
out=[]
for a in p['actions']:out.append(c.execute(p[a[0]],a[1]).fetchall())
print(json.dumps(out))`],{input:JSON.stringify(payload),encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);return JSON.parse(run.stdout);
}
test('actual SQL blocks early, forged, expired and duplicate acknowledgements',()=>{
 assert.deepEqual(sqlite([['ack',['id','digest',1000]],['terminal',['id','complete',1100]],['ack',['id','wrong',1200]],['ack',['id','digest',1200]],['ack',['id','digest',1200]]]),[[],[['id']],[],[['edge-journey','release',960]],[]]);
 assert.deepEqual(sqlite([['terminal',['id','complete',1000]],['ack',['id','digest',1900]]]),[[['id']],[]]);
});
for(const state of ['error','incomplete','cancelled'])test(state+' cannot be rewritten as complete or acknowledged',()=>{
 assert.deepEqual(sqlite([['terminal',['id',state,1000]],['terminal',['id','complete',1100]],['ack',['id','digest',1200]]]),[[['id']],[],[]]);
});
test('expired pending state and unknown terminal labels cannot become complete',()=>{
 assert.deepEqual(sqlite([['terminal',['id','PRIVATE',1000]],['terminal',['id','complete',1900]],['ack',['id','digest',1900]]]),[[],[],[]]);
});
test('expiry deletes pending receipt and leaves no token to consume',()=>{
 assert.deepEqual(sqlite([['expire',[1900]],['terminal',['id','complete',1000]],['ack',['id','digest',1000]]]),[[],[],[]]);
});
