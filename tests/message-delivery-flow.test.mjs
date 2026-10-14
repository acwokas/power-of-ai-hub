import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const source=ts.createSourceFile('BeforeYouSend.tsx',fs.readFileSync('src/components/tools/BeforeYouSend.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let target;const visit=n=>{if(ts.isFunctionDeclaration(n)&&n.name?.text==='run')target=n;ts.forEachChild(n,visit)};visit(source);assert.ok(target);
const body=ts.transpile(target.getText(source)+'\nreturn run;',{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
for(const kind of ['analysis','rewrite'])for(const mode of ['complete','invalid','cancelled','incomplete'])test(`message ${kind} ${mode} only acknowledges validated completion`,async()=>{
 const events=[],controller={current:null};const scope={controller,AbortController,original:{message:'original'},draft:{message:'draft'},analysis:'analysis',structuredClone,
  parseSuggestion:text=>({message:mode==='invalid'?'':text,rationale:[]}),
  streamReview:async(url,data,signal,onText,onComplete)=>{if(mode==='incomplete')throw Error('incomplete');if(mode==='cancelled')controller.current.abort();onComplete(new Response('answer'));return 'answer'},
  acknowledgeCommittedResponse:()=>{events.push('ack');return Promise.resolve(true)},
 };
 for(const name of ['setBusy','setError','setNotice','setOriginal','setAnalysis','setSuggestion','setRationale','setComplete','setPhase','setHighlight'])scope[name]=()=>events.push(name);
 const run=new Function('scope',`with(scope){${body}}`)(scope);await run(kind);
 const valid=mode==='complete'||(mode==='invalid'&&kind==='analysis');assert.equal(events.includes('ack'),valid);
 if(valid)assert.ok(events.indexOf('ack')>events.lastIndexOf(kind==='analysis'?'setComplete':'setSuggestion'));
});
