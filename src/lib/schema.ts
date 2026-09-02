// src/lib/schema.ts
// ─────────────────────────────────────────────────────────────────────────────
// Reusable JSON-LD schema builder functions.
//
// Usage in a .astro page:
//
//   import { breadcrumbSchema, faqSchema, serviceSchema } from '~/lib/schema';
//   import { SITE } from '~/config/site';
//
//   const breadcrumb = breadcrumbSchema([
//     { name: 'Home',     url: SITE.url + '/' },
//     { name: 'Services', url: SITE.url + '/services' },
//     { name: 'SEO',      url: SITE.url + '/services/seo' },
//   ]);
//
//   const faq = faqSchema([
//     { q: 'What do you do?', a: 'We do great things.' },
//   ]);
//
//   Then pass to BaseLayout:
//   <BaseLayout pageSchema={[breadcrumb, faq]} ...>
// ─────────────────────────────────────────────────────────────────────────────

import { SITE } from '~/config/site';

// ── Organization ─────────────────────────────────────────────────────────────
// Already rendered by BaseLayout on every page. Import this only if you need
// to reference the org object inside another schema (e.g. Article publisher).

export function orgSchema() {
  const o = SITE.org as typeof SITE.org & {
    sameAs?: readonly string[];
    alternateName?: readonly string[];
  };
  // Blank fields are omitted rather than shipped as placeholders.
  return {
    '@context': 'https://schema.org',
    '@type': o.type,
    name: SITE.name,
    ...(o.alternateName?.length ? { alternateName: [...o.alternateName] } : {}),
    url: SITE.url,
    logo: o.logo,
    ...(o.telephone ? { telephone: o.telephone } : {}),
    ...(o.email ? { email: o.email } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: o.addressLocality,
      addressRegion: o.addressRegion,
      addressCountry: o.addressCountry,
    },
    ...(o.areaServed ? { areaServed: o.areaServed } : {}),
    ...(o.priceRange ? { priceRange: o.priceRange } : {}),
    ...(o.sameAs?.length ? { sameAs: [...o.sameAs] } : {}),
  };
}

// ── BreadcrumbList ────────────────────────────────────────────────────────────
// items: ordered array from Home → current page.

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ── FAQPage ───────────────────────────────────────────────────────────────────
// faqs: array of question/answer pairs.
// Keep answers identical to the on-page text — Google penalises mismatches.

export function faqSchema(faqs: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

export function serviceSchema(opts: {
  name: string;
  description: string;
  url: string;
  image?: string;
  areaServed?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    provider: {
      '@type': SITE.org.type,
      name: SITE.name,
      url: SITE.url,
    },
    areaServed: opts.areaServed ?? SITE.org.areaServed,
    ...(opts.image ? { image: opts.image } : {}),
  };
}

// ── Article ───────────────────────────────────────────────────────────────────
// Use for blog posts, resource articles, guides. ogType="article" on the route.

export function articleSchema(opts: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;   // ISO 8601: '2026-05-13'
  dateModified?: string;
  image?: string;
  about?: string[];        // topic names
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: { '@type': 'ImageObject', url: SITE.org.logo },
    },
    mainEntityOfPage: opts.url,
    inLanguage: 'en-US',
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.about
      ? { about: opts.about.map((name) => ({ '@type': 'Thing', name })) }
      : {}),
  };
}

// ── Course ────────────────────────────────────────────────────────────────────

export function courseSchema(opts: {
  name: string;
  description: string;
  url: string;
  free?: boolean;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    isAccessibleForFree: opts.free ?? true,
    inLanguage: 'en-US',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };
}

// ── LocalBusiness ─────────────────────────────────────────────────────────────
// Use on the Contact or About page when you want the full local business card.

/**
 * Person — for founder / leadership bios.
 */
export function personSchema(opts: {
  name: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  worksFor?: string;
  award?: string[];
  sameAs?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: opts.name,
    ...(opts.jobTitle ? { jobTitle: opts.jobTitle } : {}),
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.image ? { image: opts.image.startsWith('http') ? opts.image : `${SITE.url}${opts.image}` } : {}),
    ...(opts.worksFor ? { worksFor: { '@type': 'Organization', name: opts.worksFor } } : {}),
    ...(opts.award?.length ? { award: opts.award } : {}),
    ...(opts.sameAs?.length ? { sameAs: opts.sameAs } : {}),
  };
}

export function localBusinessSchema(opts?: { description?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE.name,
    url: SITE.url,
    logo: SITE.org.logo,
    telephone: SITE.org.telephone,
    email: SITE.org.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.org.addressLocality,
      addressRegion: SITE.org.addressRegion,
      addressCountry: SITE.org.addressCountry,
    },
    areaServed: SITE.org.areaServed,
    priceRange: SITE.org.priceRange,
    ...(opts?.description ? { description: opts.description } : {}),
  };
}

// ── Event ─────────────────────────────────────────────────────────────────────
// Use for the annual Summit and any other dated, physical gathering.
// startDate/endDate are ISO 8601 dates ('2027-02-09'). Google wants a real
// venue with a postal address — don't emit this until the venue is public.
// Members-only events should pass `audience` and leave `offers` off: claiming
// a free public offer for an invite-only event is a rich-result mismatch.

export function eventSchema(opts: {
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate?: string;
  image?: string;
  /** Venue name, e.g. 'The Tampa EDITION'. */
  locationName: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  addressCountry?: string;
  /** Who may attend, e.g. 'Innovia Co-op member companies'. */
  audience?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    startDate: opts.startDate,
    ...(opts.endDate ? { endDate: opts.endDate } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: opts.locationName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: opts.streetAddress,
        addressLocality: opts.addressLocality,
        addressRegion: opts.addressRegion,
        ...(opts.postalCode ? { postalCode: opts.postalCode } : {}),
        addressCountry: opts.addressCountry ?? 'US',
      },
    },
    organizer: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    ...(opts.image
      ? { image: opts.image.startsWith('http') ? opts.image : `${SITE.url}${opts.image}` }
      : {}),
    ...(opts.audience
      ? { audience: { '@type': 'Audience', audienceType: opts.audience } }
      : {}),
    inLanguage: 'en-US',
  };
}

// ── Member firm (LocalBusiness) ───────────────────────────────────────────────
// For the /members/<slug>/ highlight pages. Each member is an independent
// company that belongs to the co-op, so it gets its own LocalBusiness node with
// Innovia as parentOrganization — not a branch of Innovia.
//
// aggregateRating is emitted ONLY when a review count is supplied: Google
// requires both a value and a count, and a rating with no count is a structured
// -data error rather than a rich result.

/** Normalise a US phone number to E.164 for structured data. */
function e164(raw: string) {
  const d = raw.replace(/[^0-9]/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  return raw;
}

export function memberFirmSchema(opts: {
  name: string;
  /** Registered entity name, when it differs from the trading name. */
  legalName?: string;
  description: string;
  /** The firm's own website, when known — otherwise the profile page. */
  url: string;
  /** The page this markup lives on, when it differs from `url`. */
  mainEntityOfPage?: string;
  /** Must match the hours shown on the page. */
  openingHours?: Array<{ days: string[]; opens: string; closes: string }>;
  foundingDate?: string;
  image?: string;
  telephone?: string;
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  /** Head-office coordinates. Emitted as GeoCoordinates when both are present. */
  latitude?: number;
  longitude?: number;
  /** City / county names the firm serves. */
  areaServed?: string[];
  rating?: { value: number; count: number } | null;
  sameAs?: string[];
}) {
  const addr = {
    ...(opts.streetAddress ? { streetAddress: opts.streetAddress } : {}),
    ...(opts.addressLocality ? { addressLocality: opts.addressLocality } : {}),
    ...(opts.addressRegion ? { addressRegion: opts.addressRegion } : {}),
    ...(opts.postalCode ? { postalCode: opts.postalCode } : {}),
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: opts.name,
    ...(opts.legalName && opts.legalName !== opts.name
      ? { legalName: opts.legalName, alternateName: opts.legalName }
      : {}),
    description: opts.description,
    url: opts.url,
    ...(opts.mainEntityOfPage && opts.mainEntityOfPage !== opts.url
      ? { mainEntityOfPage: opts.mainEntityOfPage }
      : {}),
    ...(opts.foundingDate ? { foundingDate: opts.foundingDate } : {}),
    ...(opts.openingHours?.length
      ? {
          openingHoursSpecification: opts.openingHours.map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: h.days,
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
    ...(opts.image
      ? { image: opts.image.startsWith('http') ? opts.image : `${SITE.url}${opts.image}` }
      : {}),
    ...(opts.telephone ? { telephone: e164(opts.telephone) } : {}),
    ...(Object.keys(addr).length
      ? { address: { '@type': 'PostalAddress', addressCountry: 'US', ...addr } }
      : {}),
    ...(typeof opts.latitude === 'number' && typeof opts.longitude === 'number'
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: opts.latitude,
            longitude: opts.longitude,
          },
        }
      : {}),
    ...(opts.areaServed?.length
      ? { areaServed: opts.areaServed.map((name) => ({ '@type': 'Place', name })) }
      : {}),
    ...(opts.rating && opts.rating.count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: opts.rating.value,
            reviewCount: opts.rating.count,
          },
        }
      : {}),
    parentOrganization: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    ...(opts.sameAs?.length ? { sameAs: opts.sameAs } : {}),
  };
}
