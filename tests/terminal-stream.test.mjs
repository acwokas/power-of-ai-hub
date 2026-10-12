import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const transpile = code => ts.transpile(code, { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 });
const {readTerminalStream, INCOMPLETE_RESPONSE} = await import('data:text/javascript;base64,' + Buffer.from(transpile(fs.readFileSync('src/lib/terminal-stream.ts','utf8'))).toString('base64'));
const chunk = text => `data: ${JSON.stringify({choices:[{delta:{content:text}}]})}\n\n`;
const valid = chunk('Useful draft') + 'data: [DONE]\n\n';
const response = text => new Response(text);
for (const [name, wire] of Object.entries({empty:'', truncated:chunk('partial'), whitespace:chunk('  ')+'data: [DONE]\n', markerOnly:'data: [DONE]\n', malformed:'data: {bad}\n'+valid, providerError:'data: {"error":{"message":"private"}}\n'+valid, limited:chunk('partial')+'data: {"choices":[{"finish_reason":"length"}]}\n'+ 'data: [DONE]\n'})) {
  test(`rejects ${name} without success`,async()=>{
    await assert.rejects(readTerminalStream(response(wire),()=>{}),new RegExp(INCOMPLETE_RESPONSE.replaceAll('.','\\.')));
  });
}
test('split UTF8 and terminal marker, CRLF and comments preserve text',async()=>{
  const bytes=new TextEncoder().encode(': comment\r\n'+chunk('Café 中文').replaceAll('\n','\r\n')+'data:[DONE]');
  let i=0;const r=new Response(new ReadableStream({pull(c){if(i===bytes.length)c.close();else c.enqueue(bytes.slice(i,i+=1));}}));
  const deltas=[];assert.equal(await readTerminalStream(r,d=>deltas.push(d)), 'Café 中文');assert.equal(deltas.join(''),'Café 中文');
});
test('terminal marker completes and cancels without waiting for EOF',async()=>{
  let cancelled=false;const r=new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(valid));},cancel(){cancelled=true;}}));
  assert.equal(await readTerminalStream(r,()=>{}),'Useful draft');assert.equal(cancelled,true);assert.equal(r.body.locked,false);
});
test('read error and cancellation never succeed and release the reader',async()=>{
  const r=new Response(new ReadableStream({pull(c){c.error(new Error('disconnected'));}}));
  await assert.rejects(readTerminalStream(r,()=>{}));assert.equal(r.body.locked,false);
  const ctrl=new AbortController();let cancelled=false;
  const pending=new Response(new ReadableStream({cancel(){cancelled=true;}}));
  const result=readTerminalStream(pending,()=>{},ctrl.signal);ctrl.abort();
  await assert.rejects(result,{name:'AbortError'});assert.equal(cancelled,true);assert.equal(pending.body.locked,false);
});
// Execute the real client functions with synthetic fetch and state/storage sinks.
function clientFunction(component,name,scope){
  const file=ts.createSourceFile(component,fs.readFileSync((process.env.CLIENT_SOURCE_ROOT || '.')+'/'+component,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let found;const walk=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(file)===name)found=node.initializer;
    if(ts.isFunctionDeclaration(node)&&node.name?.text===name)found=node;ts.forEachChild(node,walk);};walk(file);assert.ok(found,name);
  if(ts.isCallExpression(found)) found=found.arguments[0];
  const code=ts.isFunctionDeclaration(found)?found.getText(file)+`\nreturn ${name};`:`const run = ${found.getText(file)};\nreturn run;`;
  return new Function('scope',`with(scope){${transpile(code)}}`)(scope);
}
function setup(wire){
  const saved=[],phases=[],notices=[]; const state={profileText:'Previous profile',sprintText:'Previous sprint'};
  const scope={readTerminalStream,INCOMPLETE_RESPONSE,API_URL:'/synthetic',fetch:async()=>response(wire),
    profileText:state.profileText,sprintText:state.sprintText,formData:{},abortRef:{},loadingPhases:['A','B'],
    PROFILE_STORAGE_KEY:'profile',SPRINT_STORAGE_KEY:'sprint',generatedAt:'old',duration:7,ideaCount:3,objective:'',evidence:'',selectedPlatforms:[],selectedThemes:[],events:'',toneSlider:50,profileData:null,inlineProfile:{},
    buildRequestProfileData:()=>({}),setInterval:()=>1,clearInterval:()=>{},
    setProfileText:v=>state.profileText=v,setSprintText:v=>state.sprintText=v,
    setPhase:p=>phases.push(p),toast:v=>notices.push(v),draftStorage:{setItem:(...args)=>saved.push(args)},
  };
  for(const name of ['setIsRegenerating','setRegeneratingKey','setLoadingPhase','setLoadingProgress','setGeneratedAt','setLoadingPhaseIdx','setIsOptimising'])scope[name]=()=>{};
  return {scope,state,saved,phases,notices};
}
for (const [component,fn,args] of [
 ['BrandProfileGenerator','streamGenerate',[]],['BrandProfileGenerator','streamGenerate',['Voice']],
 ['ContentSprintGenerator','streamGenerate',[]],['ContentSprintGenerator','handleOptimise',['LinkedIn','Previous sprint',1]],
]) {
 test(`${component}/${args.length?args[0]:'full'} only commits complete responses`,async()=>{
  for(const wire of ['',chunk('partial'),valid]){
   const s=setup(wire);await clientFunction(`src/components/tools/${component}.tsx`,fn,s.scope)(...args);
   if(wire===valid){assert.equal(s.saved.length,1);}
   else {assert.equal(s.saved.length,0);assert.equal(s.state.profileText,'Previous profile');assert.equal(s.state.sprintText,'Previous sprint');assert.equal(s.notices.length,1);assert.match(s.notices[0].description,/incomplete/i);}
  }
 });
}
for(const mode of ['scenario','chat','reflection']) test(`Ethics ${mode} never calls onDone for incomplete response`,async()=>{
 for(const wire of ['',chunk('SIMULATION COMPLETE'),valid]){
  const s=setup(wire);let complete=0,failed=0;
  await clientFunction('src/components/tools/EthicalDilemma.tsx','streamChat',s.scope)({mode},()=>{},()=>complete++,()=>failed++);
  assert.equal(complete,wire===valid?1:0);assert.equal(failed,wire===valid?0:1);
 }
});

test('Ethics completion phrase in a truncated chat cannot finish or advance the simulation',async()=>{
 for(const wire of [chunk('SIMULATION COMPLETE'),chunk('SIMULATION COMPLETE')+'data: [DONE]\n']) {
  const s=setup(wire),pending=[],finished=[],points=[],assistant=[],errors=[],decisions=[];
  Object.assign(s.scope,{useCallback:fn=>fn,selectedOption:'A',reasoning:'My reason',setup:{},currentDecisionPoint:1,DECISION_TOPICS:['First'],messages:[],
   setDecisions:fn=>decisions.push(...fn([])),setMessages:fn=>{if(typeof fn==='function')assistant.push(...fn([]));},
   setSelectedOption:()=>{},setReasoning:()=>{},setAwaitingReasoning:()=>{},setResponseRaw:()=>{},setIsStreaming:()=>{},
   setSimulationComplete:v=>finished.push(v),setCurrentDecisionPoint:fn=>points.push(fn(1)),setStreamError:e=>errors.push(e)});
  const chat=clientFunction('src/components/tools/EthicalDilemma.tsx','streamChat',s.scope);
  s.scope.streamChat=(...args)=>{const p=chat(...args);pending.push(p);return p;};
  clientFunction('src/components/tools/EthicalDilemma.tsx','handleSubmitDecision',s.scope)();
  await Promise.all(pending);
  assert.equal(decisions[0].reasoning,'My reason');
  if(wire.endsWith('[DONE]\n')) {assert.deepEqual(finished,[true]);assert.deepEqual(points,[2]);assert.equal(assistant.length,1);}
  else {assert.deepEqual(finished,[]);assert.deepEqual(points,[]);assert.equal(assistant.length,0);assert.equal(errors.length,1);}
 }
});

test('cancellation during a chunk containing DONE cannot commit',async()=>{
 const ctrl=new AbortController();await assert.rejects(readTerminalStream(response(valid),()=>ctrl.abort(),ctrl.signal),{name:'AbortError'});
});
test('Ethics reset cancellation does not invoke callbacks in the replacement screen',async()=>{
 const s=setup('');const ctrl=new AbortController();let completed=0,failed=0,cancelled=false;
 s.scope.fetch=async()=>new Response(new ReadableStream({cancel(){cancelled=true;}}));
 const pending=clientFunction('src/components/tools/EthicalDilemma.tsx','streamChat',s.scope)({},()=>{},()=>completed++,()=>failed++,ctrl.signal);
 await new Promise(resolve=>setImmediate(resolve));ctrl.abort();await pending;
 assert.equal(cancelled,true);assert.equal(completed,0);assert.equal(failed,0);
});
