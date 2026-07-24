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
  // Sending happens on the mail.innoviaco-op.com subdomain (isolates sending
  // reputation from the root domain, whose real mail runs on Microsoft 365).
  from: {
    notifications: 'Innovia Co-op <notifications@mail.innoviaco-op.com>',
    hello:         'Innovia Co-op <hello@mail.innoviaco-op.com>',
  },

  // Everyone here gets a copy of every form submission
  notify: [
    'notifications@innoviaco-op.com',
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
