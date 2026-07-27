// src/lib/spam.ts
// Shared spam guard for the public form endpoints (lead, contact, subscribe).
//
// Layered on purpose — any single check can be evaded, but together they stop
// the form-scraping bots that hit this site (random alphanumeric strings in
// every text field, real values picked out of the <select> options).
//
// Callers should treat a positive result as "silently accept and discard":
// return a 200 success so the bot can't tell it was filtered.

/** Gmail treats dots in the local part as insignificant. Normalize so a single
 *  blocked address can't be re-used as e.e.d.g.e.l.o.w@, ee.dgelow@, etc. */
export function normalizeEmail(email: string): string {
  const [local = '', domain = ''] = email.toLowerCase().trim().split('@');
  const d = domain === 'googlemail.com' ? 'gmail.com' : domain;
  const l = d === 'gmail.com' ? local.replace(/\./g, '').split('+')[0] : local;
  return `${l}@${d}`;
}

/** Known abusive senders (normalized). */
const BLOCKED_EMAILS = new Set([
  'eedgelow@gmail.com', // form-scraping bot, hit every form 2026-07-27
]);

/** Long mixed-case strings with no word structure — e.g. "GZwCCNqmUlNKUtMWpdAbtZ".
 *  Deliberately conservative: needs to be long AND heavily mixed-case, so real
 *  names/companies ("CCA Global Partners", "JPMorgan", "McDonald") don't trip it. */
function isGibberishToken(token: string): boolean {
  if (token.length < 14) return false;
  if (!/^[A-Za-z]+$/.test(token)) return false;
  const upper = (token.match(/[A-Z]/g) || []).length;
  const lower = (token.match(/[a-z]/g) || []).length;
  if (upper < 6 || lower < 4) return false; // not ALLCAPS, not normal casing
  // Real words alternate vowels; gibberish runs consonants together.
  return !/[aeiou]{1}[a-z]*[aeiou]/i.test(token) || upper / token.length > 0.35;
}

function looksGibberish(value: string): boolean {
  return value.split(/\s+/).some(isGibberishToken);
}

export interface SpamCheckInput {
  honeypot?: string;      // company_url — hidden field, must stay empty
  elapsedMs?: number;     // ms between form render and submit (from form_started)
  email?: string;
  /** Free-text fields to screen for gibberish / injected URLs. */
  text?: (string | undefined)[];
}

export interface SpamVerdict {
  spam: boolean;
  reason?: string;
}

const MIN_SUBMIT_MS = 2500; // humans don't complete a multi-field form faster

export function checkSpam(input: SpamCheckInput): SpamVerdict {
  if (input.honeypot && input.honeypot.trim()) {
    return { spam: true, reason: 'honeypot' };
  }

  if (typeof input.elapsedMs === 'number' && input.elapsedMs >= 0 && input.elapsedMs < MIN_SUBMIT_MS) {
    return { spam: true, reason: `too-fast:${input.elapsedMs}ms` };
  }

  if (input.email) {
    const norm = normalizeEmail(input.email);
    if (BLOCKED_EMAILS.has(norm)) return { spam: true, reason: `blocked-email:${norm}` };
  }

  const fields = (input.text || []).filter(Boolean) as string[];
  // Links in name/company/message fields are a reliable spam signal.
  if (fields.some((f) => /https?:\/\/|\[url=|<a\s/i.test(f))) {
    return { spam: true, reason: 'link-in-text' };
  }
  // Two or more gibberish fields — one alone could be a weird-but-real value.
  const gibberish = fields.filter(looksGibberish).length;
  if (gibberish >= 2) return { spam: true, reason: `gibberish:${gibberish}` };

  return { spam: false };
}
