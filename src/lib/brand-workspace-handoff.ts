export const BRAND_CONTENT_HANDOFF_KEY = 'edge-brand-content-handoff-v1';
export interface BrandContentHandoff { savedAt: number; fields: Record<string, string> }
const allowed = new Set(['audience','evidence','need','offer','proof','voice','ideas','checks','plan']);
export function parseBrandContentHandoff(raw: string | null, now = Date.now()): BrandContentHandoff | null {
  if (!raw || raw.length > 65000) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data.savedAt !== 'number' || data.savedAt > now || now-data.savedAt >= 7200000 || !data.fields || typeof data.fields !== 'object' || Array.isArray(data.fields)) return null;
    const fields: Record<string,string> = {};
    for (const [key,value] of Object.entries(data.fields)) {
      if (!allowed.has(key) || typeof value !== 'string' || value.length > 6000) return null;
      if (value.trim()) fields[key] = value;
    }
    if (!Object.keys(fields).length || Object.values(fields).join('').length > 12000) return null;
    if (Object.entries(fields).filter(([k])=>['evidence','proof','checks','ideas','plan'].includes(k)).map(([k,v])=>k+': '+v).join('\n\n').length > 6000) return null;
    return {savedAt:data.savedAt,fields};
  } catch { return null; }
}
