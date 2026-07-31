/**
 * src/config/site.ts
 * Single source of truth for site-wide SEO defaults.
 * Edit this file for each client — never hardcode these values elsewhere.
 */

export const SITE = {
  /** Canonical base URL — no trailing slash. Must match astro.config.mjs site: */
  url: 'https://innoviaco-op.com',

  /** Display name — used in og:site_name, JSON-LD, email footer */
  name: 'Innovia Co-op',

  /** Twitter/X handle — include the @ */
  twitterHandle: '@innoviacoop',

  /** og:locale */
  locale: 'en_US',

  /** Fallback <title> if a page doesn't pass its own */
  defaultTitle: 'Innovia Co-op — Short tagline here',

  /** Fallback meta description */
  defaultDescription: 'Innovia is a national cooperative of independent HOA and condo association management companies. HOA boards find better management; member CAM companies build something bigger together.',

  /**
   * Default OG image — place the file at public/assets/og.png
   * Dimensions: 1200×630px PNG, under 300KB
   */
  defaultOgImage: '/assets/og/option-1-type-led.png',
  ogImageWidth:  '1200',
  ogImageHeight: '630',

  /** Organization JSON-LD — emitted on every page.
   *  Empty strings are omitted from the output (see orgSchema in lib/schema.ts),
   *  so leave a field blank rather than shipping a placeholder — fake NAP data
   *  weakens the brand entity in search. */
  org: {
    // National member-owned cooperative, not a storefront serving a locale.
    type: 'Organization',
    telephone: '',                 // no public phone number on the site yet
    email: '',                     // no monitored public inbox confirmed yet
    addressLocality: 'Manchester',
    addressRegion: 'NH',
    addressCountry: 'US',
    areaServed: 'United States',
    priceRange: '',                // n/a for a cooperative
    logo: 'https://innoviaco-op.com/assets/logos/innovia-primary.png',
    /** Brand-entity signals — helps Google disambiguate "Innovia" (there are
     *  other companies by that name) and own the brand SERP. */
    sameAs: [
      'https://www.linkedin.com/company/innovia-community-management-cooperative/',
      'https://x.com/innoviacoop',
      'https://www.facebook.com/InnoviaCoOp/',
    ],
    alternateName: [
      'Innovia',
      'Innovia Cooperative',
      'Innovia Community Management Cooperative',
    ],
  },
} as const;
