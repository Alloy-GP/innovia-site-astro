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
  // Sending runs on the mail.innoviaco-op.com subdomain (isolates sending
  // reputation from the root, whose real mail is Microsoft 365). Verified &
  // authorized in Resend 2026-07-24 — live send + delivery confirmed.
  from: {
    notifications: 'Innovia Co-op <notifications@mail.innoviaco-op.com>',
    hello:         'Innovia Co-op <hello@mail.innoviaco-op.com>',
  },

  // Everyone here gets a copy of every form submission
  notify: [
    'notifications@innoviaco-op.com',
    'nzuccala@ccaglobal.com', // interim — until the client confirms final routing
  ],

  // CC'd on every internal notification (the office copy) — not customer confirmations
  notifyCc: ['admin@alloygp.co'],

  // Reply-To on all outbound mail (interim — until the client confirms final routing)
  replyTo: 'nzuccala@ccaglobal.com',

  mailchimp: {
    enabled:     true,      // set false if client has no Mailchimp
    defaultTags: ['website-lead'],
  },

  copy: {
    // Plain, clear, no marketing flourishes. No em dashes.
    contact: {
      confirmSubject: 'Thanks for reaching out',
      confirmBody: (name: string, _siteUrl: string) =>
        `<p>Hi ${name},</p>
        <p>Thanks for reaching out. We received your message and someone from the Innovia team will get back to you within one business day.</p>
        <p>Innovia Co-op</p>`,
    },
    // CAM-owner leads (CAM inquiry, Schedule a Conversation, Summit).
    lead: {
      confirmSubject: 'Thanks for reaching out',
      confirmBody: (name: string, company: string, _siteUrl: string) =>
        `<p>Hi ${name},</p>
        <p>Thanks for reaching out. We received your message and someone from the Innovia team will follow up with you within one business day to talk through how the cooperative can help ${company || 'your company'}.</p>
        <p>Innovia Co-op</p>`,
    },
    // HOA / condo board inquiries (Find a Management Company).
    board: {
      confirmSubject: 'We received your inquiry',
      confirmBody: (name: string, company: string, _siteUrl: string) =>
        `<p>Hi ${name},</p>
        <p>Thanks for your inquiry${company ? ` for ${company}` : ''}. We will match your community with the Innovia member company best suited to serve it, and they will reach out to you within two business days.</p>
        <p>Innovia Co-op</p>`,
    },
    subscribe: {
      confirmSubject: "You're on the list",
      confirmBody: (name: string) =>
        `<p>Hi${name ? ` ${name}` : ''},</p>
        <p>You're subscribed. We will send occasional updates and useful resources for independent community management companies.</p>
        <p>Innovia Co-op</p>`,
    },
  },
};
