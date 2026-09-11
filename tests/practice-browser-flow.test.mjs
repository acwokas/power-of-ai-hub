import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
test('practice send, coaching and export handlers keep private notes out of roleplay and download',async()=>{
 const elements=new Map();const element=()=>({value:'',textContent:'',children:[],append(...x){this.children.push(...x)},replaceChildren(...x){this.children=x},setAttribute(){},click(){}});
 const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
 const requests=[];let downloaded;
 const context={URLSearchParams,window:{location:{search:""}},document:{getElementById:get,querySelectorAll:()=>[],createElement:element},sessionStorage:{getItem:()=>null,removeItem(){}},AbortController,Blob,URL:{createObjectURL:b=>{downloaded=b;return 'blob:test'},revokeObjectURL(){}},setTimeout(){},confirm:()=>true,fetch:async(_,opts)=>{const p=JSON.parse(opts.body);requests.push(p);return {ok:true,json:async()=>p.action==='coach'?{observations:[{quote:'A limited pilot',feedback:'Specifies scope.'}],nextAttempt:'Check the scope.',limits:'Rehearsal only.'}:{reply:'What scope would you propose?'}}}};
 vm.runInNewContext(fs.readFileSync('public/journey/practice.js','utf8'),context);
 get('context').value='Discuss a limited reporting pilot.';get('role').value='Supplier';get('goal').value='PRIVATE-SENTINEL-DO-NOT-EXPORT';get('line').value='A limited pilot would help.';
 await get('send').onclick();assert.equal(get('line').value,'');assert.equal(requests[0].goal,undefined);
 get('line').value='One report before further commitments.';await get('send').onclick();await get('coach').onclick();
 assert.equal(requests[2].goal,'PRIVATE-SENTINEL-DO-NOT-EXPORT');
 get('download').onclick();const output=await downloaded.text();assert.match(output,/A limited pilot would help/);assert.match(output,/Check the scope/);assert.doesNotMatch(output,/PRIVATE-SENTINEL/);
});
