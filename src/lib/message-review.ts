export type Draft = {message: string; intent: string; audiences: {name: string; perspective: string}[]};
export const DRAFT_KEY = 'edge-before-you-send-draft-v2';
export const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000;
export function restoreDraft(raw: string | null, now = Date.now()): Draft | null {
  try {
    const d = JSON.parse(raw || 'null');
    if (!d || typeof d.savedAt !== 'number' || now - d.savedAt > DRAFT_TTL || d.savedAt > now || !d.draft) return null;
    const v=d.draft;
    if (typeof v.message !== 'string' || v.message.length > 12000 || typeof v.intent !== 'string' || v.intent.length > 500 || !Array.isArray(v.audiences) || v.audiences.length < 1 || v.audiences.length > 4) return null;
    if (!v.audiences.every((a: any) => a && typeof a.name === 'string' && a.name.length <= 120 && typeof a.perspective === 'string' && a.perspective.length <= 1000)) return null;
    return v;
  } catch { return null; }
}
export function parseSuggestion(raw: string) {
  const normal=raw.replace(/\r\n/g,'\n');
  const section=(name: string)=>normal.match(new RegExp('^## '+name+'\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))','m'))?.[1].trim() || '';
  return {message: section('Overall rewrite'), rationale: section('What changed and why').split('\n').filter(x=>/^[-*] /.test(x)).map(x=>x.slice(2))};
}
export async function streamReview(url: string, body: unknown, signal: AbortSignal, onText: (text: string)=>void) {
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
  if (!response.ok) { const error=await response.json().catch(()=>({})) as {error?:string}; throw new Error(error.error || 'The request could not complete. Please retry.'); }
  if (!response.body) throw new Error('No response arrived. Please retry.');
  const reader=response.body.getReader(),decoder=new TextDecoder(); let buffer='',text='',complete=false;
  const line=(line: string)=>{
    if (!line.startsWith('data:')) return;
    const data=line.slice(5).trim(); if(data==='[DONE]'){complete=true;return;}
    const parsed=JSON.parse(data);
    if(parsed.error) throw new Error('The response could not complete. Please retry.');
    const delta=parsed.choices?.[0]?.delta?.content;
    if(typeof delta==='string'){text+=delta;onText(text);}
  };
  try {
    while(!complete){const {done,value}=await reader.read();if(done){buffer+=decoder.decode();if(buffer.trim())line(buffer);break;}buffer+=decoder.decode(value,{stream:true});let end;while((end=buffer.indexOf('\n'))>=0){line(buffer.slice(0,end).replace(/\r$/,''));buffer=buffer.slice(end+1);if(complete)break;}}
    if(!complete || !text.trim()) throw new Error('The response was interrupted. Your message is still available. Please retry.');
    return text;
  } finally { await reader.cancel().catch(()=>{});reader.releaseLock(); }
}
export function wordChanges(original:string, revised:string) {
  const a=original.match(/\s+|[^\s]+/g)||[],b=revised.match(/\s+|[^\s]+/g)||[];
  if(a.length*b.length>1000000)return null;
  const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const left:{text:string;changed:boolean}[]=[],right:{text:string;changed:boolean}[]=[];let i=0,j=0;
  while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){left.push({text:a[i++],changed:false});right.push({text:b[j++],changed:false});}else if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))left.push({text:a[i++],changed:true});else right.push({text:b[j++],changed:true});}return {left,right};
}
