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

// Figures verified directly against each live site on 2026-08-17. PayLine's
// count changes daily (its own spine); the other three are the row counts
// live on the site as of the same date. Do not round these up for effect.
export const dataUtilities: DataUtility[] = [
  {
    slug: 'payline',
    name: 'PayLine',
    tagline: 'Singapore salary and hiring data',
    description:
      'Advertised salary ranges and hiring activity from live Singapore job postings, refreshed daily rather than archived once and left to age.',
    url: 'https://payline.sg',
    logo: '/brand/payline-mark.svg',
    stat: '103,479',
    statLabel: 'postings archived, updated daily',
    sourceName: 'MyCareersFuture (Workforce Singapore)',
    sourceUrl: 'https://www.mycareersfuture.gov.sg',
    verifiedDate: '2026-08-17',
  },
  {
    slug: 'coewatch',
    name: 'COEwatch',
    tagline: 'COE premiums and bidding results',
    description:
      'Every Singapore COE bidding result since January 2010, across all five categories, with quota, bids received and the resulting premium.',
    url: 'https://coewatch.sg',
    logo: '/brand/coewatch-mark.svg',
    stat: '1,965',
    statLabel: 'bidding results, the full published LTA series',
    sourceName: 'data.gov.sg (LTA COE bidding results)',
    sourceUrl: 'https://data.gov.sg',
    verifiedDate: '2026-08-07',
  },
  {
    slug: 'tradechecked',
    name: 'TradeChecked',
    tagline: 'Check the licence before you pay the deposit',
    description:
      'Singapore trade and contractor registrations from the BCA and NEA public registers, so you can check whether a firm holds a current licence before you pay it.',
    url: 'https://tradechecked.sg',
    logo: '/brand/tradechecked-mark.svg',
    stat: '24,014',
    statLabel: 'BCA registrations, plus 290 NEA-registered pest control operators',
    sourceName: 'data.gov.sg (BCA and NEA public registers)',
    sourceUrl: 'https://data.gov.sg',
    verifiedDate: '2026-08-07',
  },
  {
    slug: 'duedate',
    name: 'DueDate',
    tagline: 'Singapore business deadlines and entity records',
    description:
      'Statutory ACRA and IRAS deadlines for Singapore SMEs, each dated and linked to the agency page it was checked against, alongside an archived slice of the ACRA entity register.',
    url: 'https://duedate.sg',
    logo: '/brand/duedate-mark.svg',
    stat: '1,000',
    statLabel: 'ACRA entities archived so far',
    sourceName: 'data.gov.sg (ACRA entity register)',
    sourceUrl: 'https://data.gov.sg',
    verifiedDate: '2026-08-07',
    coverageNote:
      "That's an archived slice, not the register: the full ACRA entity list runs to roughly 2.1 million and loads over successive runs. DueDate says so on its own sectors page rather than implying full coverage.",
  },
];
