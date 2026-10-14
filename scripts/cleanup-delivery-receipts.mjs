/** Existing daily owner invokes this after installation. No new scheduler.
 * Removes expired random receipts and aggregate days older than 30 days.
 * This does not run migrations, inspect content or invoke an AI provider.
 */
import {spawnSync} from 'node:child_process';
const now=Math.floor(Date.now()/1000);
const sql=`DELETE FROM terminal_receipts WHERE expires_at<=${now}; DELETE FROM daily_delivery_receipts WHERE day<${now-30*86400};`;
const result=spawnSync('npx',['--no-install','wrangler','d1','execute','EDGE_USAGE','--remote','--env','production','--command',sql],{stdio:'inherit',shell:false,timeout:60000});
if(result.error||result.status!==0)process.exit(1);
