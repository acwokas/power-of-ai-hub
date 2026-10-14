import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const code=ts.transpile(fs.readFileSync('functions/lib/terminal-observation.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const {TerminalObserver,observeTerminalStream}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const enc=new TextEncoder(),delta='data: '+JSON.stringify({choices:[{delta:{content:'PRIVATE sample output'},finish_reason:null}]})+'\n\n';
for(const [name,tail,expected] of [
 ['complete','data: [DONE]\n\n','complete'],['EOF','','incomplete'],
 ['invalid JSON','data: {bad}\n\n','error'],['provider error','data: {"error":{"message":"PRIVATE provider error"}}\n\n','error'],
 ['length','data: {"choices":[{"finish_reason":"length"}]}\n\ndata: [DONE]\n\n','error'],
 ['content filter','data: {"choices":[{"finish_reason":"content_filter"}]}\n\ndata: [DONE]\n\n','error'],
 ['tool calls','data: {"choices":[{"finish_reason":"tool_calls"}]}\n\ndata: [DONE]\n\n','error'],
 ['invalid delta','data: {"choices":[{"delta":{"content":7}}]}\n\ndata: [DONE]\n\n','error'],
]) for(const fragmented of [false,true]) test(`${name}, fragmented=${fragmented}`,()=>{
 const o=new TerminalObserver(),bytes=enc.encode(delta+tail);
 if(fragmented)for(const b of bytes)o.push(new Uint8Array([b]));else o.push(bytes);
 const result=o.finish();assert.equal(result.disposition,expected);assert.doesNotMatch(JSON.stringify(result),/PRIVATE|sample|provider error/);
 assert.deepEqual(Object.keys(result).sort(),['disposition','nonempty','providerTerminal']);
 assert.deepEqual(o.finish('cancelled'),result);
});
test('empty terminal and whitespace output are incomplete',()=>{
 for(const data of ['data: [DONE]\n','data: {"choices":[{"delta":{"content":"  "}}]}\ndata: [DONE]\n']){
 const o=new TerminalObserver();o.push(enc.encode(data));assert.equal(o.finish().disposition,'incomplete');}
});
test('unterminated last DONE line and CRLF are parsed',()=>{
 const o=new TerminalObserver();o.push(enc.encode(delta.replaceAll('\n','\r\n')+'data: [DONE]'));assert.equal(o.finish().disposition,'complete');
});
test('oversized frame fails closed without retaining or processing more data',()=>{
 const o=new TerminalObserver();o.push(enc.encode('data: '+ 'x'.repeat(65537)));o.push(enc.encode(delta+'data: [DONE]\n'));assert.equal(o.finish().disposition,'error');
});
test('stream adapter forwards exact bytes and records no output content',async()=>{
 const bytes=enc.encode(delta+'data: [DONE]\n\n');let observations=[];
 const source=new ReadableStream({start(c){c.enqueue(bytes.slice(0,9));c.enqueue(bytes.slice(9));c.close();}});
 const wrapped=observeTerminalStream(source,async o=>observations.push(o));
 assert.equal(await new Response(wrapped).text(),new TextDecoder().decode(bytes));
 assert.deepEqual(observations,[{disposition:'complete',providerTerminal:true,nonempty:true}]);
});
test('consumer cancellation before terminal stays cancelled',async()=>{
 let cancellation=false;const observations=[];
 const source=new ReadableStream({pull(c){c.enqueue(enc.encode(delta));},cancel(){cancellation=true;}});
 const reader=observeTerminalStream(source,async o=>observations.push(o)).getReader();await reader.read();await reader.cancel();assert.equal(cancellation,true);assert.equal(observations.length,1);assert.equal(observations[0].disposition,'cancelled');
});
test('consumer closing a completed stream proves only server terminal',async()=>{
 const observations=[];const source=new ReadableStream({pull(c){c.enqueue(enc.encode(delta+'data: [DONE]\n'));}});
 const reader=observeTerminalStream(source,async o=>observations.push(o)).getReader();await reader.read();await reader.cancel();assert.deepEqual(observations,[{disposition:'complete',providerTerminal:true,nonempty:true}]);assert.equal('delivered' in observations[0],false);
});
test('upstream failure and receipt-store failure cannot manufacture delivery',async()=>{
 const observations=[];const source=new ReadableStream({pull(c){c.error(new Error('PRIVATE upstream'));}});
 const reader=observeTerminalStream(source,async o=>{observations.push(o);throw Error('store unavailable');}).getReader();await assert.rejects(reader.read());assert.equal(observations[0].disposition,'error');assert.equal('delivered' in observations[0],false);
});
test('a receipt-store failure does not discard completed output',async()=>{
 const bytes=enc.encode(delta+'data: [DONE]\n');const source=new ReadableStream({start(c){c.enqueue(bytes);c.close();}});
 assert.equal(await new Response(observeTerminalStream(source,async()=>{throw Error('unavailable');})).text(),new TextDecoder().decode(bytes));
});
test('cancellation of a pending read records cancellation exactly once',async()=>{
 let upstreamCancelled=false;const observations=[];
 const source=new ReadableStream({pull(){return new Promise(()=>{});},cancel(){upstreamCancelled=true;}});
 const reader=observeTerminalStream(source,async o=>observations.push(o)).getReader();
 const pending=reader.read();await new Promise(r=>setTimeout(r,0));await reader.cancel();await pending;
 assert.equal(upstreamCancelled,true);assert.deepEqual(observations,[{disposition:'cancelled',providerTerminal:false,nonempty:false}]);
});
test('an unavailable receipt store has a bounded effect on response completion',async()=>{
 const source=new ReadableStream({start(c){c.enqueue(enc.encode(delta+'data: [DONE]\n'));c.close();}});
 const result=new Response(observeTerminalStream(source,async()=>new Promise(()=>{}))).text();
 const value=await Promise.race([result,new Promise(resolve=>setTimeout(()=>resolve('deadline-exceeded'),1000))]);
 assert.notEqual(value,'deadline-exceeded');
});
