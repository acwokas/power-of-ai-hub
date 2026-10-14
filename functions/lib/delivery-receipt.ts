/** Receipt contract, integrated behind the default-off middleware flag.
 * Tokens link a browser acknowledgement to a completed server request. They do
 * not establish human readership, request content or provider billing.
 */
export const RECEIPT_TOOLS = new Set(['before-you-send','before-you-send-rewrite','edge-journey','edge-practice','brand-profile-generator','content-sprint-generator','ethical-dilemma']);
const HEX = /^[a-f0-9]{64}$/;
const RELEASE = /^[a-f0-9]{40}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export const RECEIPT_LIFETIME_SECONDS = 900;
const hex = (bytes: Uint8Array) => Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export async function acknowledgementDigest(token: string): Promise<string> {
 if (!HEX.test(token)) throw Error('Invalid receipt token');
 return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))));
}
export async function createDeliveryReceipt(tool: string, release: string, now: number) {
 if (!RECEIPT_TOOLS.has(tool) || !RELEASE.test(release) || !Number.isSafeInteger(now) || now < 0) throw Error('Invalid receipt context');
 const token=hex(crypto.getRandomValues(new Uint8Array(32)));
 const id=crypto.randomUUID();
 return {client:{id,token},row:{id,tool,release,token_digest:await acknowledgementDigest(token),created_minute:Math.floor(now/60)*60,expires_at:now+RECEIPT_LIFETIME_SECONDS}};
}
export function validateAcknowledgement(value: unknown): {id:string;token:string} {
 if (!value || typeof value!=='object' || Array.isArray(value)) throw Error('Invalid acknowledgement');
 const body=value as Record<string,unknown>;
 if(Object.keys(body).sort().join('|')!=='id|token' || typeof body.id!=='string' || !UUID.test(body.id) || typeof body.token!=='string' || !HEX.test(body.token)) throw Error('Invalid acknowledgement');
 return {id:body.id,token:body.token};
}
// Every transition is conditional in SQL. A read followed by an unconditional
// update would let concurrent acknowledgements count the same effect twice.
export const RECEIPT_SCHEMA = `CREATE TABLE terminal_receipts (
 id TEXT PRIMARY KEY, tool TEXT NOT NULL, release TEXT NOT NULL,
 token_digest TEXT NOT NULL, created_minute INTEGER NOT NULL,
 expires_at INTEGER NOT NULL, acknowledged_minute INTEGER, disposition TEXT NOT NULL DEFAULT 'pending'
 CHECK(disposition IN ('pending','complete','incomplete','error','cancelled'))
)`;
export const RECORD_TERMINAL_SQL = `UPDATE terminal_receipts SET disposition=?2
 WHERE id=?1 AND disposition='pending' AND expires_at>?3
 AND ?2 IN ('complete','incomplete','error','cancelled') RETURNING id`;
// The trigger and one-use transition commit together. If aggregate persistence
// fails, SQLite rolls the statement back and does not consume the token.
export const DELIVERY_AGGREGATE_SCHEMA = `CREATE TABLE daily_delivery_receipts (
 day INTEGER NOT NULL, tool TEXT NOT NULL, release TEXT NOT NULL,
 delivered_count INTEGER NOT NULL, PRIMARY KEY(day,tool,release)
);
CREATE TRIGGER record_client_ack AFTER UPDATE OF acknowledged_minute ON terminal_receipts
 WHEN OLD.acknowledged_minute IS NULL AND NEW.acknowledged_minute IS NOT NULL
 AND OLD.disposition='complete'
 BEGIN
 INSERT INTO daily_delivery_receipts(day,tool,release,delivered_count)
 VALUES(NEW.acknowledged_minute-NEW.acknowledged_minute%86400,NEW.tool,NEW.release,1)
 ON CONFLICT(day,tool,release) DO UPDATE SET delivered_count=delivered_count+1;
 END`;
export const CONSUME_ACK_SQL = `UPDATE terminal_receipts
 SET acknowledged_minute=?3-?3%60,token_digest=''
 WHERE id=?1 AND token_digest=?2 AND disposition='complete' AND expires_at>?3
 AND acknowledged_minute IS NULL
 RETURNING tool,release,created_minute`;
export const EXPIRE_RECEIPTS_SQL = 'DELETE FROM terminal_receipts WHERE expires_at<=?1';
