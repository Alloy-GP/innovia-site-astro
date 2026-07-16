export const PASTEL_BASE = 'https://usepastel.com/link/opjkd9ro/#';
export const TICKET_ID   = '10361';

export interface ReviewItem {
  label: string;
  path: string;
  review: boolean;
}

export const REVIEW_ITEMS: ReviewItem[] = [
  { label: 'Homepage', path: '/', review: true },
  { label: 'About', path: '/about/', review: true },
  { label: 'Founders', path: '/about/founders/', review: true },
  { label: 'CCA Global Partners', path: '/about/cca-global-partners/', review: true },
  { label: 'Why Innovia', path: '/for-cams/why-innovia/', review: true },
  { label: 'Three Pillars', path: '/for-cams/three-pillars/', review: true },
  { label: 'Business Growth', path: '/for-cams/three-pillars/business-growth/', review: true },
  { label: 'Elite Community', path: '/for-cams/three-pillars/elite-community/', review: true },
  { label: 'Preferred Vendor Program', path: '/for-cams/three-pillars/vendor-program/', review: true },
  { label: 'Partners', path: '/partners/', review: true },
  { label: 'Find a Management Company', path: '/find-a-management-company/', review: true },
  { label: 'Phoenix', path: '/find-a-management-company/phoenix/', review: true },
  { label: 'HOA Management Services', path: '/hoa-management-services/', review: true },
  { label: 'Switching HOA Management', path: '/solutions/switching-hoa-management/', review: true },
  { label: 'Board Education', path: '/board-education/', review: true },
  { label: 'How HOA Management Works', path: '/board-education/how-hoa-management-works/', review: true },
  { label: 'What Is HOA Management', path: '/board-education/what-is-hoa-management/', review: true },
  { label: 'HOA Reserve Study', path: '/board-education/hoa-reserve-study/', review: true },
  { label: 'HOA Transition from Developer', path: '/board-education/hoa-transition-from-developer/', review: true },
  { label: 'Testimonials', path: '/testimonials/', review: true },
  { label: 'Summit', path: '/summit/', review: true },
  { label: 'Summit 2026', path: '/summit/2026/', review: true },
  { label: 'Schedule a Conversation', path: '/schedule-a-conversation/', review: true },
  { label: 'Contact', path: '/contact/', review: true },
  { label: 'Charter Offer', path: '/charter-offer/', review: true },
];
