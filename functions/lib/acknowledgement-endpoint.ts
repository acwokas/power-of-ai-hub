import {acknowledgementDigest,validateAcknowledgement} from './delivery-receipt';
export async function handleDeliveryAcknowledgement(
 request: Request,
 consume: (id:string,digest:string,now:number)=>Promise<boolean>,
 now: number = Math.floor(Date.now()/1000),
): Promise<Response> {
 const empty=(status:number)=>new Response(null,{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return empty(405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return empty(403);
 if(request.headers.get('Content-Type')?.split(';')[0].trim()!=='application/json')return empty(415);
 if(!Number.isSafeInteger(now)||now<0)return empty(503);
 const reader=request.body?.getReader();if(!reader)return empty(400);
 let size=0,text='';const decoder=new TextDecoder('utf-8',{fatal:true});
 try {
  while(true){
   const part=await reader.read();if(part.done)break;
   size+=part.value.byteLength;
   if(size>256){await reader.cancel();return empty(413);}
   text+=decoder.decode(part.value,{stream:true});
  }
  text+=decoder.decode();
 }catch{return empty(400);}
 finally{reader.releaseLock();}
 let body;try{body=validateAcknowledgement(JSON.parse(text));}catch{return empty(400);}
 try {
  const accepted=await consume(body.id,await acknowledgementDigest(body.token),now);
  return empty(accepted===true?204:409);
 }catch{return empty(503);}
}
