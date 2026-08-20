/**
 * The figures democratising.ai quotes for the four Singapore data
 * utilities, fetched from each site at build time.
 *
 * WHY THIS IS A FETCH AND NOT A LIST
 * ----------------------------------
 * These four numbers used to be string constants in this file, edited by
 * hand, with the read date typed in beside them. What that produced,
 * measured live on 2026-08-21 against each site's own database:
 *
 *   DueDate       hub  2,000      site 620,062     wrong by a factor of 310
 *   PayLine       hub  103,479    site 121,701     15 per cent low
 *   COEwatch      hub  1,965      site 394         a different UNIT, not stale
 *   TradeChecked  hub  24,014     site 24,014      correct
 *
 * The DueDate line also carried "this archive currently holds a fixed
 * subset", which was true while the ACRA backfill was capped at 1,000
 * rows and had not been true for days.
 *
 * Nothing on this site could see any of that. There is no ingest here,
 * nothing fails, and a constant that has stopped being true looks
 * exactly like one that is. The hub was the least reliable page in a
 * family whose entire argument is that its figures are checkable.
 *
 * Each site now publishes /data/coverage.json, built from the same
 * loader its own homepage renders from, so the two cannot disagree.
 * This module reads those four routes at build time.
 *
 * THE BUILD FAILS RATHER THAN FALLING BACK. There is deliberately no
 * cached copy and no default: a stale figure served confidently is the
 * exact failure being removed, and reintroducing it as a fallback would
 * bring it back with the added disadvantage of looking automated. A
 * broken build is loud. A quietly stale number is not.
 *
 * The counts move hourly, so this page is only as current as its last
 * deploy. `verifiedDate` is the source's own read date out of the
 * payload, never today's date, so the page states its own age honestly
 * rather than implying it was checked at the moment you loaded it.
 *
 * ai-factory's `pnpm gate:hub-figures` reads this page and those four
 * routes and fails when they disagree, which is what will notice if the
 * hub stops being rebuilt.
 */

export interface DataUtility {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  logo: string;
  stat: string;
  statLabel: string;
  sourceName: string;
  sourceUrl: string;
  verifiedDate: string;
  coverageNote?: string;
}

interface CoveragePayload {
  brand: string;
  name: string;
  url: string;
  headline: { value: number; label: string };
  figures: Record<string, unknown>;
  source: { name: string; url: string; publisher?: string; readAt: string | null };
  secondarySource?: { name: string; url: string; publisher?: string; readAt: string | null };
}

/**
 * Editorial copy stays here; every figure comes from the site.
 *
 * The split is the point. Prose is written once and is still true a month
 * later. A count is not, and the two have no business living in the same
 * literal where editing one looks like editing the other.
 */
const CARDS = [
  {
    slug: 'payline',
    coverage: 'https://payline.sg/data/coverage.json',
    logo: '/brand/payline-mark.svg',
    tagline: 'Singapore salary and hiring data',
    description:
      'Advertised salary ranges and hiring activity from live Singapore job postings, refreshed daily rather than archived once and left to age.',
  },
  {
    slug: 'coewatch',
    coverage: 'https://coewatch.sg/data/coverage.json',
    logo: '/brand/coewatch-mark.svg',
    tagline: 'COE premiums and bidding results',
    description:
      'Every Singapore COE bidding result since January 2010, across all five categories, with quota, bids received and the resulting premium.',
  },
  {
    slug: 'duedate',
    coverage: 'https://duedate.sg/data/coverage.json',
    logo: '/brand/duedate-mark.svg',
    tagline: 'Singapore business deadlines and entity records',
    description:
      'Statutory ACRA and IRAS deadlines for Singapore SMEs, each dated and linked to the agency page it was checked against, alongside an archived slice of the ACRA entity register.',
  },
] as const;

/**
 * The TradeChecked card, which sits in "Tools and platforms" rather than
 * in the data utility layer because it answers a lookup instead of
 * presenting a dataset to browse. Same treatment, same route, different
 * band on the page.
 */
export const TRADECHECKED_COVERAGE = 'https://tradechecked.sg/data/coverage.json';

async function fetchCoverage(url: string): Promise<CoveragePayload> {
  const res = await fetch(url, { headers: { 'user-agent': 'democratising.ai build' } });
  if (!res.ok) {
    throw new Error(
      `${url} returned HTTP ${res.status}. The build stops here on purpose: `
      + 'publishing this page with a figure it could not confirm is the defect this '
      + 'route was added to remove.',
    );
  }
  const payload = (await res.json()) as CoveragePayload;
  if (typeof payload?.headline?.value !== 'number' || !payload.headline.label) {
    throw new Error(`${url} answered without a usable headline figure: ${JSON.stringify(payload).slice(0, 300)}`);
  }
  if (!payload.source?.readAt) {
    throw new Error(
      `${url} answered without a source read date. A figure with no date beside it is `
      + 'a claim nobody can check later, which is the one thing this family does not publish.',
    );
  }
  return payload;
}

export function formatStat(value: number): string {
  return value.toLocaleString('en-SG');
}

/**
 * The three data-utility-layer cards, in the order they appear.
 *
 * Fetched in parallel and awaited together: one unreachable site should
 * fail the build in the same second as three, not after three round trips.
 */
export async function loadDataUtilities(): Promise<DataUtility[]> {
  const payloads = await Promise.all(CARDS.map((c) => fetchCoverage(c.coverage)));

  return CARDS.map((card, i) => {
    const p = payloads[i];
    return {
      slug: card.slug,
      name: p.name,
      tagline: card.tagline,
      description: card.description,
      url: p.url,
      logo: card.logo,
      stat: formatStat(p.headline.value),
      statLabel: p.headline.label,
      sourceName: p.source.name,
      sourceUrl: p.source.url,
      verifiedDate: p.source.readAt as string,
      /*
       * DueDate's card carried a hand-written coverage note claiming the
       * archive held "a fixed subset" of the register. That was written
       * when the backfill was capped and outlived the cap. The note is now
       * arithmetic on the register size the site itself publishes, so it
       * describes the archive as it is rather than as it once was.
       */
      coverageNote:
        card.slug === 'duedate'
          ? `The full ACRA register runs to roughly 2.1 million records, most of them struck off `
            + `or dissolved. ${formatStat(
              (p.figures.liveEntities as number) ?? p.headline.value,
            )} of the entities held are ones the register currently lists as live.`
          : undefined,
    };
  });
}

/** The TradeChecked card, shaped the same way for the tools rail. */
export async function loadTradeChecked(): Promise<{
  stat: string;
  statLabel: string;
  sourceName: string;
  sourceUrl: string;
  verifiedDate: string;
}> {
  const p = await fetchCoverage(TRADECHECKED_COVERAGE);
  const nea = p.figures.neaVectorControlOperators as number | undefined;
  return {
    stat: formatStat(p.headline.value),
    // The register's own unit, plus the NEA count, because the card has
    // always carried both and a reader comparing it against the site
    // should find the same two numbers there.
    statLabel: nea
      ? `${p.headline.label}, plus ${formatStat(nea)} NEA-registered pest control operators`
      : p.headline.label,
    sourceName: 'data.gov.sg (BCA and NEA public registers)',
    sourceUrl: 'https://data.gov.sg',
    verifiedDate: p.source.readAt as string,
  };
}
