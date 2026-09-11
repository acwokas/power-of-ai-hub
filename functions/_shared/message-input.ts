export interface MessageInput {
  message: string;
  intent: string;
  messageType: string;
  audiences: { name: string; perspective: string }[];
  analysis?: string;
}
export function validateMessageInput(value: unknown, rewrite = false): MessageInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Provide a message, intent and audience.');
  const b = value as Record<string, unknown>;
  const field = (value: unknown, name: string, min: number, max: number): string => {
    if (typeof value !== 'string') throw new Error(`${name} must be text.`);
    const text = value.trim();
    if (text.length < min || text.length > max) throw new Error(`${name} must contain ${min} to ${max} characters.`);
    return text;
  };
  const message = field(b.message, 'Message', 10, 12000);
  const intent = field(b.intent, 'Intent', 1, 500);
  const messageType = field(b.messageType ?? '', 'Message type', 0, 80);
  if (!Array.isArray(b.audiences) || b.audiences.length < 1 || b.audiences.length > 4) throw new Error('Provide one to four audiences.');
  const audiences = b.audiences.map(a => {
    if (!a || typeof a !== 'object' || Array.isArray(a)) throw new Error('Each audience needs a name.');
    return {name: field(a.name, 'Audience name', 1, 120), perspective: field(a.perspective ?? '', 'Audience context', 0, 1000)};
  });
  if (new Set(audiences.map(a => a.name.toLowerCase())).size !== audiences.length) throw new Error('Give each audience a different name.');
  return {message, intent, messageType, audiences, ...(rewrite ? {analysis: field(b.analysis, 'Analysis', 1, 24000)} : {})};
}
export async function readMessageInput(request: Request, rewrite = false) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Provide a request body.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 160000) { await reader.cancel(); throw new Error('This request is too large. Shorten the message or context.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error('Provide a valid message request.'); }
  return validateMessageInput(parsed, rewrite);
}
