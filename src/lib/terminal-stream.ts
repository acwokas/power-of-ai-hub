// A transport completion marker is required before callers save or advance.
export const INCOMPLETE_RESPONSE = 'The response is incomplete. Your inputs and previous saved draft are still available. Please retry.';

export async function readTerminalStream(
  response: Response,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (!response.body) throw new Error(INCOMPLETE_RESPONSE);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', text = '', complete = false;
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  const line = (value: string) => {
    if (!value.startsWith('data:')) return;
    const data = value.slice(5).trim();
    if (data === '[DONE]') { complete = true; return; }
    let parsed;
    try { parsed = JSON.parse(data); } catch { throw new Error(INCOMPLETE_RESPONSE); }
    if (!parsed || parsed.error) throw new Error(INCOMPLETE_RESPONSE);
    const choice = parsed.choices?.[0];
    if (choice?.finish_reason && choice.finish_reason !== 'stop') throw new Error(INCOMPLETE_RESPONSE);
    const delta = choice?.delta?.content;
    if (delta != null && typeof delta !== 'string') throw new Error(INCOMPLETE_RESPONSE);
    if (typeof delta === 'string') { text += delta; onDelta(delta); }
  };
  try {
    signal?.throwIfAborted();
    while (!complete) {
      const { done, value } = await reader.read();
      signal?.throwIfAborted();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let end;
      while ((end = buffer.indexOf('\n')) >= 0) {
        line(buffer.slice(0, end).replace(/\r$/, ''));
        buffer = buffer.slice(end + 1);
        if (complete) break;
      }
      if (done) {
        if (!complete && buffer.trim()) line(buffer.replace(/\r$/, ''));
        break;
      }
    }
    signal?.throwIfAborted();
    if (!complete || !text.trim()) throw new Error(INCOMPLETE_RESPONSE);
    return text;
  } finally {
    signal?.removeEventListener('abort', abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
