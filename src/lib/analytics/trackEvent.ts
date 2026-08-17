// Estate convention (packages/site-utils/src/analytics/trackEvent.ts in the
// ai-factory monorepo): dual-write to window.dataLayer (GTM-compatible) and
// window.gtag (direct GA4), both no-ops when absent. Ported here because
// this site sits outside that monorepo and can't import the shared package.
// GTM owns GA4 configuration on this site (container GTM-KV37H5CZ); this
// never calls gtag('config', ...), only ('event', ...).

export type EventParams = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: string, params?: EventParams): void {
  if (typeof window === 'undefined') return;
  const p = params || {};
  try {
    const dl = (window as unknown as Record<string, unknown>).dataLayer;
    if (Array.isArray(dl)) (dl as unknown[]).push({ event: name, ...p });
  } catch (_) {}
  try {
    const gtag = (window as unknown as Record<string, unknown>).gtag;
    if (typeof gtag === 'function') {
      (gtag as (cmd: string, name: string, params: EventParams) => void)('event', name, p);
    }
  } catch (_) {}
}
