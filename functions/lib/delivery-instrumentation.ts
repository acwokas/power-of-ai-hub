import {createDeliveryReceipt,RECEIPT_TOOLS,RECORD_TERMINAL_SQL,CONSUME_ACK_SQL,EXPIRE_RECEIPTS_SQL} from './delivery-receipt';
import {observeTerminalStream,TerminalDisposition} from './terminal-observation';
import {handleDeliveryAcknowledgement} from './acknowledgement-endpoint';
export interface ReceiptStore {
 insert(row:Awaited<ReturnType<typeof createDeliveryReceipt>>['row']):Promise<void>;
 terminal(id:string,disposition:TerminalDisposition,now:number):Promise<void>;
 consume(id:string,digest:string,now:number):Promise<boolean>;
}
const jsonTools=new Set(['edge-journey','edge-practice']);
async function bounded<T>(work:Promise<T>):Promise<T> {
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([work,new Promise<T>((_,reject)=>{timer=setTimeout(()=>reject(Error('Receipt unavailable')),500)})]);}
 finally{if(timer)clearTimeout(timer);}
}
/** Observes existing successful output without retaining its content. JSON routes
 * already enforce provider stop plus their complete output schema before 200.
 * A receipt failure preserves the response and cannot create delivery evidence.
 */
export async function instrumentDeliveryResponse(response:Response,tool:string,release:string,store:ReceiptStore,now:()=>number=()=>Math.floor(Date.now()/1000)):Promise<Response>{
 if(!response.ok||!RECEIPT_TOOLS.has(tool)||!response.body||!/^[a-f0-9]{40}$/.test(release))return response;
 const media=response.headers.get('Content-Type')?.split(';')[0].trim();
 const json=jsonTools.has(tool)&&media==='application/json';
 const stream=!jsonTools.has(tool)&&media==='text/event-stream';
 if(!json&&!stream)return response;
 let receipt;
 try{receipt=await createDeliveryReceipt(tool,release,now());await bounded(store.insert(receipt.row));
  if(json)await bounded(store.terminal(receipt.row.id,'complete',now()));
 }catch{return response;}
 const headers=new Headers(response.headers);
 headers.set('X-Edge-Receipt-Id',receipt.client.id);headers.set('X-Edge-Receipt-Token',receipt.client.token);headers.set('Cache-Control','no-store');
 const body=stream?observeTerminalStream(response.body,observation=>store.terminal(receipt.row.id,observation.disposition,now())):response.body;
 return new Response(body,{status:response.status,statusText:response.statusText,headers});
}
export function d1ReceiptStore(db:D1Database):ReceiptStore{
 return {
  async insert(row){const r=await db.prepare('INSERT INTO terminal_receipts(id,tool,release,token_digest,created_minute,expires_at) VALUES(?1,?2,?3,?4,?5,?6)').bind(row.id,row.tool,row.release,row.token_digest,row.created_minute,row.expires_at).run();if(r.meta.changes!==1)throw Error('Receipt not recorded');},
  async terminal(id,disposition,now){const r=await db.prepare(RECORD_TERMINAL_SQL).bind(id,disposition,now).run();if(r.meta.changes!==1)throw Error('Terminal receipt not recorded');},
  async consume(id,digest,now){const r=await db.prepare(CONSUME_ACK_SQL).bind(id,digest,now).all();return r.results.length===1;},
 };
}
export const acknowledgeDelivery=(request:Request,store:ReceiptStore)=>handleDeliveryAcknowledgement(request,(id,digest,now)=>bounded(store.consume(id,digest,now)));
// Invoked by existing request cleanup. Daily owner cleanup must be installed
// before activation; request cleanup alone does not guarantee a physical TTL.
export async function cleanupDeliveryReceipts(db:D1Database,now:number){
 await db.batch([db.prepare(EXPIRE_RECEIPTS_SQL).bind(now),db.prepare('DELETE FROM daily_delivery_receipts WHERE day<?1').bind(now-30*86400)]);
}
