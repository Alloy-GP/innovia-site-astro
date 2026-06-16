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
    sitemap(), // auto-generates /sitemap-index.xml on every build — no manual sitemap.xml needed
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
