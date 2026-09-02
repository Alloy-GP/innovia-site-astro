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
        // Member highlight pages: real content, but Avalon still carries
        // "confirm" figures and placeholder review cards. Drop this line to
        // list them once a member has signed off on their page.
        !page.includes('/members/') &&
        !page.includes('/member-spotlights/mariner-and-vail') &&
        !page.includes('/find-a-management-company/texas') &&
        !page.includes('/find-a-management-company/phoenix') &&
        !page.includes('/charter-offer') &&
        !page.includes('/resident-savings/') &&
        !page.includes('/case-studies'),
    }),
  ],

  prefetch: { prefetchAll: true },

  // TEMP: dev toolbar hidden for presentation — remove to re-enable.
  devToolbar: { enabled: false },

  // MUST stay false: Astro's checkOrigin is incompatible with the Vercel
  // serverless adapter — it 403s EVERY form POST, even legitimate same-origin
  // ones (the adapter's internal request URL never matches the public Origin).
  // Verified 2026-07-24: enabling it breaks all forms. For abuse protection use
  // honeypots / rate limiting in the API routes instead, not Origin checking.
  security: { checkOrigin: false },

  build: {
    // Embeds all CSS as inline <style> tags — eliminates render-blocking stylesheet request
    inlineStylesheets: 'always',
  },

  // 301 map from the old WordPress site (Screaming Frog crawl, 44 pages).
  // Keys use trailing slashes to match the old WP URL convention + trailingSlash:'always'.
  // NOTE: /privacy-policy/ is intentionally NOT redirected — a real privacy page must be
  // created before launch (see launch readiness). Homepage '/' needs no redirect (same path).
  redirects: {
    // ── Member highlight pages ─────────────────────────────────
    // /members/landmarc/ was the demo build of this template; the first
    // real member page replaced it. Drop this once Landmarc has its own.
    '/members/landmarc/': '/members/avalon-management-group/',

    // ── Core / structural ──────────────────────────────────────
    '/contact-us/': '/contact/',
    '/our-services/': '/hoa-management-services/',
    '/industry-insight/': '/board-education/',
    '/join-innovia/': '/for-cams/why-innovia/',
    '/find-management/': '/find-a-management-company/',
    '/find-community-management/': '/find-a-management-company/',
    '/property-management-germantown-maryland/': '/find-a-management-company/',
    '/blog/': '/board-education/',
    '/category/new-members/': '/board-education/',
    '/category/industry-insights/': '/board-education/',
    '/smartproperty-ultimate-guide-to-asset-management38/': '/board-education/',
    '/lead-generation-form/': '/schedule-a-conversation/',
    '/pages/home-b/': '/',

    // ── Member / company posts → Member Spotlights ─────────────
    '/honoring-excellence-innovation-nova-association-management-partners-core-value-awards/': '/member-spotlights/',
    '/innovia-co-op-welcomes-new-member-peacock-properties/': '/member-spotlights/',
    '/innovia-co-op-welcomes-new-team-member-ryan-hayes/': '/member-spotlights/',
    '/innovia-co-op-welcomes-new-member-scalzo-property-management/': '/member-spotlights/',
    '/great-north-property-management-inc-stands-out-as-a-remarkable-example-of-leadership/': '/member-spotlights/',
    '/amgs-commitment-to-excellence-putting-customer-satisfaction-first/': '/member-spotlights/',
    '/cpes-commitment-to-clear-communication-and-proactive-planning/': '/member-spotlights/',
    '/silvercreek-association-management-transforming-hoas-with-ai-strategies/': '/member-spotlights/',
    '/wise-property-solutions-12-performance-measures-for-hoa-annual-checkup/': '/member-spotlights/',
    '/cfm-gives-back-making-a-meaningful-impact-through-community-and-philanthropy/': '/member-spotlights/',

    // ── Blog posts with a direct new equivalent ────────────────
    '/helping-hoas-transition-away-from-a-developer-controlled-board-of-directors/': '/board-education/hoa-transition-from-developer/',

    // ── Remaining blog posts → Board Education hub ─────────────
    '/7-strategies-to-engage-volunteers-for-your-homeowners-association-in-your-community/': '/board-education/',
    '/a-cybersecurity-strategy-for-protecting-hoa-community-data/': '/board-education/',
    '/creating-a-fun-and-safe-july-4th-weekend-community-management-companies-can-make-a-difference/': '/board-education/',
    '/5-types-of-hoa-meetings-and-how-to-run-them/': '/board-education/',
    '/summer-event-ideas-for-your-hoa/': '/board-education/',
    '/guest-blog-neighborhood-mailboxes-a-comprehensive-guide-for-hoa-and-property-managers/': '/board-education/hoa-cluster-mailbox-responsibility/',
    '/analyzing-the-evolution-of-hoas-a-look-at-the-changing-legal-power/': '/board-education/',
    '/how-stan-helps-increase-community-association-managers-salaries/': '/board-education/',
    '/best-ways-to-handle-hoa-board-member-turnover/': '/board-education/',
    '/guest-partner-blog-flock-safety-solvedstories-st-augustine-florida/': '/board-education/',
    '/hosting-a-clean-out-event-for-your-community/': '/board-education/',
    '/8-strategies-to-prevent-crime-and-bolster-safety-in-your-neighborhood/': '/board-education/hoa-crime-prevention-safety/',
    '/starting-a-community-garden/': '/board-education/',
    '/how-community-management-companies-can-prepare-hoas-for-fall-winter/': '/board-education/',
    '/addressing-hoa-rentals-the-pros-and-cons-of-allowing-rentals/': '/board-education/',
    '/guest-partner-blog-managing-board-conflict/': '/board-education/',
    '/5-ways-to-strengthen-your-role-in-the-communities-you-serve/': '/board-education/',
    '/making-july-4th-celebrations-safe/': '/board-education/',
    '/partner-case-study-increase-profitability-addressing-the-burning-issue-of-hoa-management-companies/': '/board-education/',
    '/acri-tips-to-help-you-choose-the-right-community-management-company/': '/board-education/',
    '/guest-partner-blog-budget-mailboxes-who-is-responsible-for-cluster-mailboxes/': '/board-education/hoa-cluster-mailbox-responsibility/',
    '/partner-insight-the-ultimate-guide-to-better-managed-community-associations/': '/board-education/',
  },
});
