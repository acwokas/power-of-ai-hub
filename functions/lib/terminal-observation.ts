/** Content-free observations only. This module does not store or transmit receipts.
 * A complete server stream is never a client delivery acknowledgement.
 */
export type TerminalDisposition = 'complete' | 'incomplete' | 'error' | 'cancelled';
export interface TerminalObservation { disposition: TerminalDisposition; providerTerminal: boolean; nonempty: boolean }
export class TerminalObserver {
 private decoder = new TextDecoder();
 private pending = '';
 private marker = false;
 private content = false;
 private invalid = false;
 private ended = false;
 private result: TerminalObservation | null = null;
 private line(value: string) {
  if (this.invalid || this.marker || !value.startsWith('data:')) return;
  const data = value.slice(5).trim();
  if (data === '[DONE]') { this.marker = true; return; }
  try {
   const item = JSON.parse(data);
   if (!item || typeof item !== 'object' || Array.isArray(item) || item.error) { this.invalid = true; return; }
   const choice = item.choices?.[0];
   if (choice?.finish_reason && choice.finish_reason !== 'stop') this.invalid = true;
   const delta = choice?.delta?.content;
   if (delta != null && typeof delta !== 'string') this.invalid = true;
   if (typeof delta === 'string' && delta.trim()) this.content = true;
  } catch { this.invalid = true; }
 }
 push(bytes: Uint8Array) {
  if (this.ended || this.invalid || this.marker) return;
  // Never retain an unbounded partial frame or the complete model output.
  const text = this.decoder.decode(bytes, {stream:true});
  let start = 0;
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') {
   if (this.pending.length + i - start > 65536) { this.invalid = true; break; }
   this.line((this.pending + text.slice(start,i)).replace(/\r$/,''));
   this.pending = ''; start = i + 1;
   if (this.marker || this.invalid) break;
  }
  if (!this.marker && !this.invalid) {
   if (this.pending.length + text.length - start > 65536) this.invalid = true;
   else this.pending += text.slice(start);
  }
  if (this.invalid || this.marker) this.pending = '';
 }
 finish(reason: 'eof' | 'error' | 'cancelled' = 'eof'): TerminalObservation {
  if (this.result) return {...this.result};
  if (reason === 'eof' && !this.invalid && !this.marker) {
   const last = this.pending + this.decoder.decode();
   if (last.length > 65536) this.invalid = true;
   else if (last.trim()) this.line(last.replace(/\r$/,''));
  }
  this.pending = ''; this.ended = true;
  // A complete marker observed before a consumer cancels its completed reader
  // remains a server-terminal result. The separate client commit is still unknown.
  const complete = this.marker && this.content && !this.invalid;
  const disposition: TerminalDisposition = complete ? 'complete' : this.invalid || reason === 'error' ? 'error' : reason === 'cancelled' ? 'cancelled' : 'incomplete';
  this.result = {disposition, providerTerminal:this.marker, nonempty:this.content};
  return {...this.result};
 }
}

export function observeTerminalStream(
 body: ReadableStream<Uint8Array>,
 record: (observation: TerminalObservation) => Promise<void>,
): ReadableStream<Uint8Array> {
 const reader = body.getReader(), observer = new TerminalObserver();
 let settled = false, cancelled = false, released = false;
 const release = () => { if (!released) { released = true; reader.releaseLock(); } };
 const settle = async (reason: 'eof' | 'error' | 'cancelled') => {
  if (settled) return;
  settled = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
   await Promise.race([record(observer.finish(reason)),new Promise<void>(resolve=>{timer=setTimeout(resolve,500);})]);
  } catch { /* Missing evidence never becomes success. */ }
  finally { if (timer) clearTimeout(timer); }
 };
 return new ReadableStream<Uint8Array>({
  async pull(controller) {
   try {
    const part = await reader.read();
    if (part.done) { await settle(cancelled?'cancelled':'eof'); if (!cancelled) controller.close(); release(); return; }
    observer.push(part.value); controller.enqueue(part.value);
   } catch (error) { await settle(cancelled?'cancelled':'error'); if (!cancelled) controller.error(error); release(); }
  },
  async cancel(reason) {
   cancelled = true;
   try { await reader.cancel(reason); } finally { await settle('cancelled'); release(); }
  },
 }, {highWaterMark:0});
}
