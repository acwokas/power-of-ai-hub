interface Env { EDGE_USAGE?: D1Database; OPENAI_API_KEY?: string }
const live=new Set(['before-you-send','before-you-send-rewrite','edge-journey','edge-practice','brand-profile-generator','content-sprint-generator','ethical-dilemma']);
const error=(status:number,message:string,retry?:number)=>Response.json({error:message},{status,headers:{'Cache-Control':'no-store',...(retry?{'Retry-After':String(retry)}:{})}});
export const onRequest: PagesFunction<Env> = async context => {
 const url=new URL(context.request.url);
 let response:Response;
 if(url.pathname.startsWith('/api/')){
  const route=url.pathname.slice(5);
  if(!live.has(route))response=error(410,'This tool has moved. Open the EDGE toolkit for the current version.');
  else if(context.request.method!=='POST')response=error(405,'Use POST for this tool.');
  else if(!context.env.EDGE_USAGE)response=error(503,'AI assistance is temporarily unavailable. Your draft remains editable.');
  else {
   const origin=context.request.headers.get('Origin');
   if(origin&&origin!==url.origin)response=error(403,'Open the tool on this site before requesting assistance.');
   else {
    let size=0;const reader=context.request.clone().body?.getReader();
    try{if(reader){while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>60000){void reader.cancel();void context.request.body?.cancel();break;}}}}finally{reader?.releaseLock()}
    if(size>60000)response=error(413,'Shorten this request to 60,000 bytes or fewer. Your draft is unchanged.');
    else try {
     const now=Math.floor(Date.now()/1000),day=now-now%86400;
     // A daily rotating HMAC avoids retaining raw IP addresses or brief content.
     const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(context.env.OPENAI_API_KEY||'no-provider-configured'),{name:'HMAC',hash:'SHA-256'},false,['sign']);
     const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(day+':'+(context.request.headers.get('CF-Connecting-IP')||'unknown')));
     const fingerprint=Array.from(new Uint8Array(signature),b=>b.toString(16).padStart(2,'0')).join('');
     // One atomic INSERT...SELECT enforces concurrency-safe limits before any provider call.
     const result=await context.env.EDGE_USAGE.prepare(`INSERT INTO usage_reservations(id,ts,fingerprint)
      SELECT ?1,?2,?3 WHERE
      (SELECT count(*) FROM usage_reservations WHERE ts>=?4)<100 AND
      (SELECT count(*) FROM usage_reservations WHERE fingerprint=?3 AND ts>=?5)<20 AND
      (SELECT count(*) FROM usage_reservations WHERE fingerprint=?3 AND ts>=?6)<4`).bind(crypto.randomUUID(),now,fingerprint,day,now-3600,now-60).run();
     if(result.meta.changes!==1)response=error(429,'The AI usage limit has been reached. Try again later, or continue editing without AI.',3600);
     else {context.waitUntil(context.env.EDGE_USAGE.prepare('DELETE FROM usage_reservations WHERE ts < ?1').bind(now-172800).run());response=await context.next();}
    }catch{response=error(503,'AI assistance is temporarily unavailable. Your draft remains editable.');}
   }
  }
 }else response=await context.next();
 const guarded=new Response(response.body,response);
 if(url.hostname.endsWith('.pages.dev'))guarded.headers.set('X-Robots-Tag','noindex, nofollow');
 if(url.pathname.startsWith('/api/'))guarded.headers.set('Cache-Control','no-store');
 return guarded;
};
