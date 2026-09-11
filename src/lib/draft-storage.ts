const TTL=7*24*60*60*1000;
const preference='edge-remember-drafts-v1';
export const draftStorage={
 getItem(key:string):string|null{if(typeof window==='undefined')return null;try{const persistent=localStorage.getItem(preference)==='yes';const raw=(persistent?localStorage.getItem('edge-v2:'+key):null)||sessionStorage.getItem('edge-v2:'+key);if(!raw)return null;const value=JSON.parse(raw);if(typeof value.savedAt!=='number'||value.savedAt>Date.now()||Date.now()-value.savedAt>=TTL||typeof value.text!=='string')return null;return value.text;}catch{return null;}},
 setItem(key:string,text:string){if(typeof window==='undefined')return;const value=JSON.stringify({savedAt:Date.now(),text});sessionStorage.setItem('edge-v2:'+key,value);if(localStorage.getItem(preference)==='yes')localStorage.setItem('edge-v2:'+key,value);},
 removeItem(key:string){if(typeof window==='undefined')return;sessionStorage.removeItem('edge-v2:'+key);localStorage.removeItem('edge-v2:'+key);localStorage.removeItem(key);}
};
