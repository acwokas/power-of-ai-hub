// Single source for copy that was previously repeated verbatim across
// Hero.astro, BaseLayout.astro's JSON-LD, and index.astro's title/description
// props (drifted independently before this). llms.txt still carries its own
// copy of STRAPLINE by hand: it's a static text file, not an Astro component,
// so there's nothing to import it into.
export const STRAPLINE = 'An ecosystem of editorial, data and applied AI';

export const SITE_TITLE = `DEMOCRATISING.AI - ${STRAPLINE}`;

export const SITE_DESCRIPTION =
  `${STRAPLINE}, helping people think clearly, act deliberately, and execute with confidence.`;
