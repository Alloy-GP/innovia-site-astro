// src/data/member-highlights.ts
// ─────────────────────────────────────────────────────────────────────────────
// Member firm records that drive the Member Highlight pages (/members/<slug>/).
//
// One record per member company (~30 planned). The page template is
// components/MemberHighlight.astro — it reads only from this file, so adding a
// member is a data change, not a markup change.
//
// Fields marked `confirm: true` render with an amber "confirm" flag on the page
// so unverified figures are visibly provisional. Clear the flag once the member
// has signed off on the number.
// ─────────────────────────────────────────────────────────────────────────────

/** A figure that may still be awaiting member sign-off. */
export interface Claim {
  text: string;
  /** true → renders inside a visible "confirm" marker. */
  confirm?: boolean;
}

export interface MemberCity {
  name: string;
  lat: number;
  lng: number;
}

export interface MemberProfile {
  slug: string;
  name: string;
  /** Short display name for tight spaces (footer badge, breadcrumb). */
  shortName?: string;
  /** Registered entity name, when it differs from the trading name. */
  legalName?: string;

  /** Per-member accent. Must read against both navy and cream backgrounds. */
  accent: string;
  accentDeep: string;

  /** <title> and meta description for the page. */
  seoTitle: string;
  seoDescription: string;

  /** Hero */
  memberSince: string;
  tagline: string;

  /** Interview video. Leave `videoId` null until the file is delivered. */
  video: {
    posterSrc: string | null;
    posterAlt: string;
    title: string;
    subtitle: string;
    /** Only rendered once `vimeoId` is set — a duration with no video to
     *  play is a claim we can't back. Keep in sync with `durationIso`. */
    runtime: string | null;
    /** Where it was shot. Leave blank unless confirmed. */
    filmedAt: string;
    /** Vimeo id — when set, the poster becomes a real play surface. */
    vimeoId: string | null;
    /** ISO 8601 duration + upload date, for VideoObject schema. */
    durationIso?: string;
    uploadDate?: string;
  };

  /** Four-up stat strip under the hero. */
  stats: Array<{ value: string; label: string }>;

  /** "The story" — long-form editorial. */
  story: {
    heading: string;
    /** First paragraph renders with a drop cap. */
    paragraphs: string[];
    pullQuote: string;
  };

  /** "Why boards trust <member>" */
  benefits: {
    heading: string;
    items: Array<{ icon: BenefitIcon; title: string; body: Claim }>;
  };

  /** The Innovia-backing block inside the benefits section. */
  coop: {
    heading: string;
    sub: string;
    points: Array<{ label: string; body: Claim }>;
    takeaway: string;
  };

  /** Leadership */
  leader: {
    /** Square headshot. Falls back to `initials` when absent. */
    photo?: string;
    initials: string;
    name: string;
    role: string;
    credentials: string[];
    heading: string;
    paragraphs: string[];
  };

  /** Firm-level credentials. */
  accreditations: Array<{ seal: SealIcon; abbr: string; full: string; isInnovia?: boolean }>;

  /** "Track record" case studies. */
  caseStudies: {
    heading: string;
    items: Array<{ meta: string; title: string; body: Claim }>;
  };

  /** Google reputation, transcribed from the firm's Google Business Profile. */
  reviews: {
    rating: number | null;
    /** Required before aggregateRating schema can be emitted. */
    reviewCount: number | null;
    placeUrl: string | null;
    /**
     * Google surfaces these as review *excerpts* without a full reviewer name,
     * so they render attributed to Google rather than to a named person.
     * Verbatim only — never paraphrase or invent one.
     */
    quotes: Array<{ text: string; stars: number }>;
    /**
     * Emit aggregateRating into LocalBusiness schema. Off by default: Google's
     * review-snippet guidance says ratings should come from reviews the site
     * itself collected, not re-published from another platform.
     */
    emitAggregateRating: boolean;
  };

  /** Service area — drives both the copy and the Leaflet map. */
  area: {
    heading: string;
    blurb: string;
    /** Map viewport. */
    center: { lat: number; lng: number };
    zoom: number;
    cities: MemberCity[];
  };

  /** Closing CTA. */
  cta: {
    heading: string;
    body: string;
    /** Where "Request a Proposal" points. */
    href: string;
  };

  /**
   * Office hours. `display` is what renders; `spec` feeds
   * openingHoursSpecification. Keep the two in sync — a mismatch between
   * visible hours and marked-up hours is a structured-data violation.
   * null when the member hasn't confirmed them.
   */
  hours: {
    display: string;
    spec: Array<{ days: string[]; opens: string; closes: string }>;
  } | null;

  /** Head office. Leave a field blank rather than shipping placeholder NAP —
   *  the schema builder omits blanks. lat/lng also place the HQ pin on the map. */
  nap: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    telephone: string;
    url: string;
    latitude?: number;
    longitude?: number;
  };
}

export type BenefitIcon = 'dollar' | 'clock' | 'message' | 'check';
export type SealIcon = 'award' | 'shield' | 'file' | 'badge';

// ── Avalon Management Group ──────────────────────────────────────────────────

const avalon: MemberProfile = {
  slug: 'avalon-management-group',
  name: 'Avalon Management Group',
  shortName: 'Avalon',
  legalName: 'The Avalon Management Group, Inc.',

  // Paired for contrast, not just for looks: `accent` must clear AA on the
  // navy surfaces, `accentDeep` on the cream ones. No single value does both.
  accent: '#4FBACB',
  accentDeep: '#1F6F79',

  seoTitle:
    'Avalon Management Group · HOA Management for San Diego & Riverside Counties | Innovia Member',
  seoDescription:
    'Avalon Management Group has managed community associations across San Diego and Riverside Counties since 1983 — roughly 98 communities and 48,000 doors. Independently owned, AAMC-accredited, and an Innovia Co-op member since 2013.',

  memberSince: '2013',
  tagline:
    'Independent community management for San Diego &amp; Riverside Counties since 1983 — local, hands-on service backed by the resources of a national cooperative.',

  video: {
    // Frame pulled from the interview at 25.2s — the one point where he's
    // looking at camera with his mouth closed. An honest thumbnail: it's
    // actually in the video, unlike a building exterior.
    posterSrc: '/assets/photos/members/avalon-interview-poster.webp',
    posterAlt:
      'Mark Jones, President and Owner of Avalon Management Group, during his member interview',
    title: 'Meet Avalon Management Group',
    subtitle: 'In Mark&rsquo;s own words',
    // Real length from Vimeo's oEmbed (31s), not the handoff's placeholder 1:20.
    runtime: '0:31',
    // Blank: the upload is titled "innovia-member-page_avalon-management" and
    // dated 2026-09-02, which doesn't establish it was shot at Summit 2026.
    filmedAt: '',
    vimeoId: '1223449346',
    durationIso: 'PT31S',
    uploadDate: '2026-09-02',
  },

  stats: [
    { value: '1983', label: 'Established' },
    { value: '48,000', label: 'Doors managed' },
    { value: '~98', label: 'Communities' },
    { value: '2013', label: 'Innovia member since' },
  ],

  story: {
    heading: 'Built on doing it right.',
    paragraphs: [
      'Avalon Management Group started in 1983 and grew from a single distressed association into a firm managing roughly 98 communities and 48,000 doors across San Diego and Riverside Counties &mdash; while staying deliberately independent in an industry racing toward consolidation.',
      'The difference is a service-first operating philosophy. Where national consolidators are driven primarily by the bottom line, Avalon is built around personal customer service and a discipline of continuous improvement &mdash; down to monthly one-on-one meetings with every staff member to find and fix the small things before they become big ones.',
      'That patience shows up in the numbers that matter most: Avalon hasn&rsquo;t lost a client to termination in more than 12 years. They take on the right communities, serve them exceptionally, and keep them.',
    ],
    pullQuote:
      'It&rsquo;s not one thing we do. It&rsquo;s <em>thousands of little things</em> we&rsquo;ve learned over 40 years.',
  },

  benefits: {
    heading: 'The problems boards worry about &mdash; <em>solved.</em>',
    items: [
      {
        icon: 'dollar',
        title: 'Your board keeps control of its own money',
        body: {
          text: 'Unlike most firms, Avalon requires each community to maintain control over its own funds &mdash; the board signs, not the manager. Financial safety by design.',
        },
      },
      {
        icon: 'clock',
        title: 'Problems caught before they cost you',
        body: {
          text: 'Avalon has tracked utility usage meter-by-meter for 30+ years, flagging underground leaks and water overages that a static report would miss.',
        },
      },
      {
        icon: 'message',
        title: 'Service that de-escalates, not inflames',
        body: {
          text: 'Staff are trained in formal de-escalation, so homeowner friction gets resolved instead of amplified &mdash; a calmer community and a lighter load on your board.',
        },
      },
      {
        icon: 'check',
        title: 'Clients that don&rsquo;t leave',
        body: {
          text: 'No client has terminated Avalon in over 12 years, with quarterly board surveys averaging ~4.7/5 across departments.',
          confirm: true,
        },
      },
    ],
  },

  coop: {
    heading: 'Backed by Innovia &mdash; local firm, national muscle',
    sub: 'Avalon stayed independent &mdash; but never alone. As a member of the Innovia cooperative, they pair the personal service of a local, owner-operated firm with the scale of a national network.',
    points: [
      {
        label: 'Buying power for your community',
        body: {
          text: 'Through the cooperative, Avalon negotiates vendor rates a regional firm never could alone &mdash; savings that flow through to the communities they serve.',
          confirm: true,
        },
      },
      {
        label: 'National-scale leverage',
        body: {
          text: 'Banking, insurance, and vendor terms negotiated on the strength of a cooperative managing over a billion in combined scale &mdash; not one firm&rsquo;s volume.',
        },
      },
      {
        label: 'The best minds, on call',
        body: {
          text: 'Membership connects Avalon to dozens of the country&rsquo;s top independent management CEOs for shared solutions and benchmarking.',
        },
      },
    ],
    takeaway:
      'For your community, that means the attentiveness of a local firm and the resources of a national one &mdash; <b>without the risk of being absorbed into a faceless corporate rollup.</b>',
  },

  leader: {
    photo: '/assets/photos/members/mark-jones.jpg',
    initials: 'MJ',
    name: 'Mark Jones',
    role: 'President &amp; Owner',
    credentials: ['AMS', 'PCAM'],
    heading: 'The person behind the firm.',
    paragraphs: [
      'Mark Jones has spent 40+ years in community management and still personally drives Avalon&rsquo;s continuous-improvement culture. He&rsquo;s known across the industry as an operator other owners turn to for guidance.',
      'He serves on local CAI chapter boards and the CAI National Research Foundation Board &mdash; contributing to the standards the whole industry is measured against.',
    ],
  },

  accreditations: [
    {
      seal: 'award',
      abbr: 'AAMC',
      full: 'Accredited Association Management Company &mdash; CAI&rsquo;s highest firm-level designation',
    },
    {
      seal: 'shield',
      abbr: 'CAI Member',
      full: 'Greater Inland Empire &amp; San Diego Chapters',
    },
    {
      seal: 'file',
      abbr: 'Licensed &amp; Insured',
      full: 'Fully insured California operator',
    },
    {
      seal: 'badge',
      abbr: 'Innovia Verified',
      full: 'Member in good standing of the Innovia co-op since 2013',
      isInnovia: true,
    },
  ],

  caseStudies: {
    heading: 'Problems other managers wouldn&rsquo;t think to solve.',
    items: [
      {
        meta: 'Redhawk &middot; Temecula &middot; 3,257 doors',
        title: 'An annexation the mayor vouched for',
        body: {
          text: 'Avalon led Redhawk&rsquo;s annexation into the city &mdash; upgrading police, fire, and public services &mdash; with the mayor publicly crediting Avalon&rsquo;s involvement on the record. A later conversion of a county-run services district saved the community ~$650K/yr in perpetuity.',
          confirm: true,
        },
      },
      {
        meta: 'Trade Winds &middot; ~200 homes',
        title: 'A half-million-dollar permit, erased',
        body: {
          text: 'Avalon secured a county transfer of a natural-watercourse maintenance obligation &mdash; saving the community a one-time ~$500K permitting cost and the ongoing maintenance burden entirely.',
          confirm: true,
        },
      },
    ],
  },

  reviews: {
    rating: 4.7,
    reviewCount: 221,
    placeUrl:
      'https://www.google.com/maps/search/?api=1&query=The+Avalon+Management+Group%2C+Inc.%2C+43529+Ridge+Park+Dr%2C+Temecula%2C+CA+92590',
    quotes: [
      { text: 'Very happy with the service in today&rsquo;s environment.', stars: 5 },
      { text: 'Allison at the Wolf Park HOA office is the bomb!', stars: 5 },
      { text: 'She is an astute good listener that makes you feel valued and respected.', stars: 5 },
    ],
    emitAggregateRating: false,
  },

  area: {
    heading: 'San Diego &amp; Riverside Counties',
    blurb:
      'Avalon serves master and planned communities across two Southern California counties, with a focus on the communities they can serve exceptionally rather than the most they can sign.',
    center: { lat: 33.28, lng: -117.15 },
    zoom: 9,
    cities: [
      { name: 'Temecula', lat: 33.4936, lng: -117.1484 },
      { name: 'Murrieta', lat: 33.5539, lng: -117.2139 },
      { name: 'Menifee', lat: 33.6971, lng: -117.185 },
      { name: 'Lake Elsinore', lat: 33.6681, lng: -117.3273 },
      { name: 'Corona', lat: 33.8753, lng: -117.5664 },
      { name: 'Wildomar', lat: 33.5989, lng: -117.28 },
      { name: 'Perris', lat: 33.7825, lng: -117.2286 },
      { name: 'Oceanside', lat: 33.1959, lng: -117.3795 },
      { name: 'San Marcos', lat: 33.1434, lng: -117.1661 },
      { name: 'San Diego', lat: 32.7157, lng: -117.1611 },
      { name: 'Vista', lat: 33.2, lng: -117.2425 },
      { name: 'Carlsbad', lat: 33.1581, lng: -117.3506 },
      { name: 'Encinitas', lat: 33.037, lng: -117.292 },
      { name: 'Solana Beach', lat: 32.9912, lng: -117.2712 },
      { name: 'Escondido', lat: 33.1192, lng: -117.0864 },
      { name: 'Rancho Bernardo', lat: 33.0203, lng: -117.0725 },
    ],
  },

  cta: {
    heading: 'Considering a <em>management partner?</em>',
    body: 'A proposal starts with a conversation &mdash; about your community, your board&rsquo;s priorities, and whether Avalon is the right fit. No hard sell.',
    href: '/schedule-a-conversation/',
  },

  hours: {
    display: 'Mon&ndash;Fri &middot; 8:30am&ndash;5pm &middot; Closed weekends',
    spec: [
      {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:30',
        closes: '17:00',
      },
    ],
  },

  // Confirmed by the member. Coordinates geocoded from the street address
  // (OpenStreetMap/Nominatim) — they drive the HQ pin on the service-area map.
  nap: {
    streetAddress: '43529 Ridge Park Drive',
    addressLocality: 'Temecula',
    addressRegion: 'CA',
    postalCode: '92590',
    telephone: '(951) 699-2918',
    url: 'https://www.avalonweb.com',
    latitude: 33.4945052,
    longitude: -117.1582665,
  },
};

export const MEMBER_PROFILES: MemberProfile[] = [avalon];

export function getMemberProfile(slug: string): MemberProfile | undefined {
  return MEMBER_PROFILES.find((m) => m.slug === slug);
}
