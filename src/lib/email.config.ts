// src/lib/email.config.ts
// The only file you edit per client for email setup.
// All API routes (contact.ts, lead.ts, subscribe.ts) read from here.

export const EMAIL_CONFIG = {

  brand: {
    name: 'Innovia Co-op',
    url:  'https://innoviaco-op.com',
    team: 'Skyler',
  },

  // Both addresses must be from a domain verified in Resend.
  // NOTE: root innoviaco-op.com is the verified/authorized Resend sender.
  // mail.innoviaco-op.com has DNS published but 403s (not added/verified in
  // Resend / send-key not scoped to it) — verified 2026-07-24. Keep root.
  from: {
    notifications: 'Innovia Co-op <notifications@innoviaco-op.com>',
    hello:         'Innovia Co-op <hello@innoviaco-op.com>',
  },

  // Everyone here gets a copy of every form submission
  notify: [
    // TEMP: route member-intake notifications to Alloy inboxes for now
    'admin@alloygp.co',
    'cameron@alloygp.co',
    'nzuccala@ccaglobal.com', // interim — until the client confirms final routing
  ],

  mailchimp: {
    enabled:     true,      // set false if client has no Mailchimp
    defaultTags: ['website-lead'],
  },

  copy: {
    contact: {
      confirmSubject: 'We received your message',
      confirmBody: (name: string, _siteUrl: string) =>
        `<p>Hi ${name},</p>
        <p>Thanks for reaching out. We typically respond within 1 business day.</p>
        <p>— Skyler</p>`,
    },
    lead: {
      confirmSubject: "Thanks — we'll be in touch",
      confirmBody: (name: string, company: string, siteUrl: string) =>
        `<p>Hi ${name},</p>
        <p>We received your info and someone will reach out shortly to discuss what ${company || 'your business'} needs.</p>
        <p>— Skyler</p>`,
    },
    subscribe: {
      confirmSubject: "You're on the list",
      confirmBody: (name: string) =>
        `<p>Hi${name ? ` ${name}` : ''},</p>
        <p>Thanks for subscribing. We'll be in touch soon.</p>
        <p>— Skyler</p>`,
    },
  },
};
