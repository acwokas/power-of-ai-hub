import test from 'node:test';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {bindDeliveryConfig} from '../scripts/prepare-delivery-config.mjs';
// The owner prepares the working configuration before prebuild runs these tests.
// Check the committed baseline, independently of that authorized activation.
const base=JSON.parse(execFileSync('git',['show','HEAD:wrangler.jsonc'],{cwd:new URL('..',import.meta.url),encoding:'utf8'}));
test('binds exact deployment source only in production and preserves models and database identities',()=>{const before=structuredClone(base),r=bindDeliveryConfig(base,'a'.repeat(40));assert.deepEqual(base,before);assert.equal(r.env.production.vars.EDGE_RECEIPT_RELEASE,'a'.repeat(40));assert.equal(r.env.production.vars.EDGE_DELIVERY_RECEIPTS,'enabled');assert.equal(r.env.production.vars.OPENAI_MODEL,base.env.production.vars.OPENAI_MODEL);assert.deepEqual(r.env.production.d1_databases,base.env.production.d1_databases);assert.deepEqual(r.env.preview.d1_databases,base.env.preview.d1_databases);assert.equal(r.env.preview.vars.EDGE_DELIVERY_RECEIPTS,'disabled');assert.equal(r.vars.EDGE_DELIVERY_RECEIPTS,'disabled');});
for(const rev of ['main','a'.repeat(39),'a'.repeat(41),'A'.repeat(40),''])test('rejects non-exact release '+rev,()=>assert.throws(()=>bindDeliveryConfig(base,rev)));
test('wrong production database cannot be enabled',()=>{const b=structuredClone(base);b.env.production.d1_databases[0].database_id='preview';assert.throws(()=>bindDeliveryConfig(b,'a'.repeat(40)));});
test('committed configuration stays disabled until explicit existing-owner activation',()=>{assert.notEqual(base.env.production.vars.EDGE_DELIVERY_RECEIPTS,'enabled');assert.notEqual(base.env.preview.vars?.EDGE_DELIVERY_RECEIPTS,'enabled');});
