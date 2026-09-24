export interface ConsumerSite {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  logo: string;
}

// Descriptions matched to each site's own live title/meta description,
// checked 2026-08-17.
export const consumerSites: ConsumerSite[] = [
  {
    slug: 'urbandogowner',
    name: 'Urban Dog Owner',
    tagline: 'Singapore dog ownership guide',
    description:
      'HDB-approved breeds, dog-friendly places, vetted clinics, the paperwork, and weekend itineraries. A publication for dog people, not a directory.',
    url: 'https://urbandogowner.com',
    // Restored from the unmerged sites-own-favicons branch, not re-sourced.
    // See the comment in Ecosystem.astro for the full story.
    logo: '/brand/sites/urbandogowner.png',
  },
  {
    slug: 'urbancatowner',
    name: 'UrbanCatOwner',
    tagline: "City life, on your cat's terms",
    description:
      "Singapore's practical guide to life with a cat: HDB licensing rules, cat-friendly venues, vetted clinics, and honest costs.",
    url: 'https://urbancatowner.com',
    logo: '/brand/urbancatowner-mark.png',
  },
  {
    slug: 'urbanpetpartners',
    name: 'Urban Pet Partners',
    tagline: 'Better lives for pets. Built together.',
    description:
      'The partnership home for UrbanDogOwner and UrbanCatOwner: community collaboration, pet expertise and thoughtful commercial partnerships.',
    url: 'https://urbanpetpartners.com',
    logo: '/brand/urbanpetpartners-mark.svg',
  },
];
