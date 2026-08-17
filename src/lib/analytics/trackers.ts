// Passive analytics for democratising.ai, ported from the shape of
// packages/site-utils/src/analytics/trackers.ts in the ai-factory monorepo
// (initBaseTrackers) so the event names/params read the same way across the
// estate. This site is a single long routing page, so pageviews and time on
// page say little; what matters is who lands, how far they scroll, which
// rails they actually see, and which property they leave for. Call
// initEcosystemTrackers() once, client-side, from BaseLayout.astro.
import { trackEvent } from './trackEvent';
import { propertyNameFor, OWN_HOSTNAMES } from './ecosystemProperties';

export function initEcosystemTrackers(): void {
  if (typeof window === 'undefined') return;

  // 1. Outbound clicks, labelled by destination property rather than raw URL.
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('http')) return;
      try {
        const url = new URL(href);
        if (OWN_HOSTNAMES.includes(url.hostname)) return;
        trackEvent('outbound_click', {
          link_property: propertyNameFor(url.hostname),
          link_url: href.slice(0, 300),
          link_text: (a.textContent || '').trim().slice(0, 100),
          page_path: window.location.pathname,
        });
      } catch (_) {}
    },
    { capture: true, passive: true },
  );

  // 2. Scroll depth (25 / 50 / 75 / 100), rAF-throttled.
  const firedScroll = new Set<number>();
  let scrollTicking = false;
  function checkScroll() {
    const scrolled = window.scrollY + window.innerHeight;
    const total = document.documentElement.scrollHeight;
    if (total <= window.innerHeight) return;
    const pct = Math.round((scrolled / total) * 100);
    for (const m of [25, 50, 75, 100]) {
      if (!firedScroll.has(m) && pct >= m) {
        firedScroll.add(m);
        trackEvent('scroll_depth', { scroll_percent: m, page_path: window.location.pathname });
      }
    }
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          checkScroll();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    },
    { passive: true },
  );
  checkScroll();

  // 3. Section visibility: fires once per [data-section] element the first
  // time at least half of it has been on screen. Lets "seen" be compared
  // against "clicked" per rail, rather than only measuring clicks.
  const sections = document.querySelectorAll<HTMLElement>('[data-section]');
  if (sections.length && 'IntersectionObserver' in window) {
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const name = entry.target.getAttribute('data-section') || '';
          if (!name || seen.has(name)) continue;
          seen.add(name);
          trackEvent('section_view', { section_name: name, page_path: window.location.pathname });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 },
    );
    sections.forEach((el) => observer.observe(el));
  }
}
