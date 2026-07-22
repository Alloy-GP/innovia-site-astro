// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // ── STEP 1: update to client's live domain ────────────────────
  site: 'https://innoviaco-op.com',

  output: 'server',
  adapter: vercel(),
  // Canonical URLs carry a trailing slash (matches the ported site's target URLs).
  trailingSlash: 'always',

  integrations: [
    react(),
    sitemap({
      // De-listed pages: kept in the build for later use, but excluded from the
      // sitemap so they aren't surfaced to search engines (also carry noindex).
      filter: (page) =>
        !page.includes('/members/landmarc') &&
        !page.includes('/member-spotlights/mariner-and-vail') &&
        !page.includes('/find-a-management-company/texas') &&
        !page.includes('/resident-savings/') &&
        !page.includes('/case-studies'),
    }),
  ],

  prefetch: { prefetchAll: true },

  // TEMP: dev toolbar hidden for presentation — remove to re-enable.
  devToolbar: { enabled: false },

  // Prevents CSRF errors when testing on vercel.app before custom domain is live
  security: { checkOrigin: false },

  build: {
    // Embeds all CSS as inline <style> tags — eliminates render-blocking stylesheet request
    inlineStylesheets: 'always',
  },

  redirects: {
    // Planned legacy → new path (per handoff doc)
    '/join-innovia/': '/for-cams/why-innovia/',
    // Static-build internal path → homepage
    '/pages/home-b/': '/',
  },
});
