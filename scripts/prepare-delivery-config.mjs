import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
/** Deployment-time identity only. This never claims independent review or live acceptance. */
export function bindDeliveryConfig(config, release) {
 if(!/^[a-f0-9]{40}$/.test(release))throw new Error('exact Hub commit required');
 if(config?.env?.production?.d1_databases?.find(x=>x.binding==='EDGE_USAGE')?.database_id!=='b36d910f-b599-468d-b2d1-c4831d8456c5')throw new Error('production database binding mismatch');
 const next=structuredClone(config);
 next.env.production.vars={...next.env.production.vars,EDGE_DELIVERY_RECEIPTS:'enabled',EDGE_RECEIPT_RELEASE:release};
 next.env.preview={...next.env.preview,vars:{...next.env.preview?.vars,EDGE_DELIVERY_RECEIPTS:'disabled',EDGE_RECEIPT_RELEASE:''}};
 // Top-level/default configurations must never collect production receipts.
 next.vars={...next.vars,EDGE_DELIVERY_RECEIPTS:'disabled',EDGE_RECEIPT_RELEASE:''};
 return next;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const path='wrangler.jsonc';
 const result=bindDeliveryConfig(JSON.parse(fs.readFileSync(path,'utf8')),process.argv[2]||'');
 fs.writeFileSync(path,JSON.stringify(result,null,2)+'\n');
}
