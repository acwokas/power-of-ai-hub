import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

const SITE_URL = process.env.SITE_URL || 'https://power-of-ai-hub-astro.pages.dev';

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
