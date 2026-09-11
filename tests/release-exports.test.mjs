import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const load=async path=>import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync(path,'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const {csvRows}=await load('src/lib/csv.ts');
const {contentReviewPrompts}=await load('src/lib/content-draft-review.ts');
test('CSV quotes every field, preserves multiline text, and neutralises formula prefixes',()=>{assert.equal(csvRows([['Theme, with comma','He said "yes"','one\ntwo','=SUM(A1)',' @value']]),'"Theme, with comma","He said ""yes""","one\ntwo","\'=SUM(A1)","\' @value"');});
test('numerical claim review catches percentages before punctuation or end of text',()=>{for(const s of ['Growth of 46%.','Growth 46%','9 participants'])assert.ok(contentReviewPrompts(s).some(p=>p.includes('numerical')));});
