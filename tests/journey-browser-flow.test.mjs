import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

test('suggestion review gates new targets, avoids empty-field conflict prompts and preserves undo', async () => {
 const elements=new Map();
 function element(tag='div') {
  return {tag,children:[],value:'',dataset:{},attributes:{},textContent:'',
   set id(value){this._id=value;elements.set(value,this)},get id(){return this._id},
   append(...items){for(const item of items){item.parent=this;this.children.push(item)}},
   replaceChildren(...items){this.children=[];this.append(...items)},
   setAttribute(k,v){this.attributes[k]=v},focus(){},
   closest(){return this.parent},
   querySelector(selector){return descend(this).find(e=>selector==='input'?e.tag==='input':e.className===selector.slice(1))}
  };
 }
 function descend(e){return e.children.flatMap(c=>[c,...descend(c)])}
 const get=id=>{if(!elements.has(id)){const e=element();e.id=id}return elements.get(id)};
 const nav=element();let conflicts=0;
 const context={URLSearchParams,document:{getElementById:get,querySelector:()=>nav,querySelectorAll:()=>[],createElement:element,createTextNode:t=>Object.assign(element('text'),{textContent:t})},sessionStorage:{getItem:()=>null,removeItem(){}},AbortController,
  window:{location:{hash:''},addEventListener(){},confirm:()=>{conflicts++;return true}},fetch:async()=>({ok:true,json:async()=>({suggestions:{situation:'Try a one-week photography routine.'},requiresConfirmation:{situation:true},questions:[],note:'Review the timing.'})})};
 vm.runInNewContext(fs.readFileSync('public/journey/journey.js','utf8'),context);
 await get('suggest').onclick();
 const nodes=descend(get('suggestions'));
 const checkbox=nodes.find(e=>e.tag==='input');
 const use=nodes.find(e=>e.textContent==='Use this draft');
 const undo=nodes.find(e=>e.textContent==='Undo');
 assert.equal(use.disabled,true);
 use.onclick();assert.equal(get('situation').value,'');
 checkbox.checked=true;checkbox.onchange();assert.equal(use.disabled,false);
 use.onclick();assert.equal(conflicts,0);assert.equal(get('situation').value,'Try a one-week photography routine.');
 checkbox.checked=false;checkbox.onchange();checkbox.checked=true;checkbox.onchange();
 assert.equal(use.disabled,true);
 use.onclick();undo.onclick();assert.equal(get('situation').value,'');
 assert.equal(undo.hidden,true);assert.equal(use.disabled,false);
 assert.match(checkbox.attributes['aria-label'],/What are you deciding/);
});
