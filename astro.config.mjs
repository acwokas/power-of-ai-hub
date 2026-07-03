import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// Production domain. Used for canonical, OG, sitemap. Defaults to the live
// domain so canonical/OG never leak the *.pages.dev preview URL even when the
// SITE_URL env var is unset on the build. Override SITE_URL for preview builds.
const SITE_URL = process.env.SITE_URL || 'https://democratising.ai';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    react(),
    sitemap(),
  ],
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
