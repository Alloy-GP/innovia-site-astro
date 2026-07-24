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
    // Voice per the Innovia master brief: trusted peer, not a vendor. Independence
    // is core — the cooperative empowers, it doesn't absorb. Clear over clever.
    contact: {
      confirmSubject: 'Thanks for reaching out',
      confirmBody: (name: string, _siteUrl: string) =>
        `<p>Hi ${name},</p>
        <p>Thanks for reaching out &mdash; your message is with the cooperative office, and someone from our team will get back to you within one business day.</p>
        <p>&mdash; Innovia Co-op</p>`,
    },
    // CAM-owner leads (Request an Introduction, Schedule a Conversation, Summit).
    lead: {
      confirmSubject: 'Thanks for reaching out',
      confirmBody: (name: string, company: string, _siteUrl: string) =>
        `<p>Hi ${name},</p>
        <p>Thanks for reaching out. Your note is with the cooperative office, and someone from our team &mdash; an operator who runs a firm like yours &mdash; will follow up personally to talk through what the cooperative could mean for ${company || 'your company'}.</p>
        <p>Independence backed by the power of a nationwide network.</p>
        <p>&mdash; Innovia Co-op</p>`,
    },
    // HOA / condo board inquiries (Find a Management Company). Service-oriented —
    // the board engages with the matched member firm, not with Innovia.
    board: {
      confirmSubject: 'We have your inquiry',
      confirmBody: (name: string, company: string, _siteUrl: string) =>
        `<p>Hi ${name},</p>
        <p>Thanks &mdash; we have your inquiry${company ? ` for ${company}` : ''}. We&rsquo;ll match your community with the Innovia member firm best positioned to serve it, and they&rsquo;ll reach out within two business days.</p>
        <p>One introduction. No call lists.</p>
        <p>&mdash; Innovia Co-op</p>`,
    },
    subscribe: {
      confirmSubject: "You're on the list",
      confirmBody: (name: string) =>
        `<p>Hi${name ? ` ${name}` : ''},</p>
        <p>You&rsquo;re in. When we&rsquo;ve got something genuinely useful for independent operators &mdash; practical guidance, what&rsquo;s working across the network, member insights worth borrowing &mdash; it&rsquo;ll come from us. No filler.</p>
        <p>&mdash; Innovia Co-op</p>`,
    },
  },
};
