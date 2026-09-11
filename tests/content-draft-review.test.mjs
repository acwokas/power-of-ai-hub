import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const {contentReviewPrompts:review,replaceContentPost:edit}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(fs.readFileSync('src/lib/content-draft-review.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const post=(day,platform,value)=>`## Day ${day}\n\n### ${platform}\n\n**Post**:\n${value}\n\n**Why this works**:\nRationale\n`;
test('editing targets one day and channel while preserving literal replacement text',()=>{
 const input=post(1,'LinkedIn','Old')+'\n### X (Twitter)\n\n**Post**:\nOther\n\n**Why this works**:\nReason\n'+post(3,'LinkedIn','Later');
 const output=edit(input,1,'LinkedIn','Exploring an idea. $& stays literal.');
 assert.match(output,/Exploring an idea\. \$& stays literal/);assert.match(output,/Other/);assert.match(output,/Later/);assert.doesNotMatch(output,/\nOld\n/);
 assert.throws(()=>edit(input,1,'LinkedIn','## Day 7\nInjected structure'));
});
test('observed unsupported launch and retrospective patterns prompt a human check',()=>{
 assert.equal(review('As we prepare to launch our workshops.').length,1);
 assert.equal(review('As we wrap up our week of discussions.').length,1);
 assert.equal(review('We are exploring possible workshop formats.').length,0);
});
