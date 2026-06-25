// POST /api/member-intake — Member Profile Intake submission handler.
// - Honeypot ("company_url") silently drops bots.
// - Sends an office notification + applicant confirmation via Resend.
// - On ANY failure, posts an alert to the Slack incoming webhook (FORM_ALERT_SLACK_URL).
// Env (set in Vercel, Production + Preview): RESEND_API_KEY, FORM_ALERT_SLACK_URL.
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { EMAIL_CONFIG } from '~/lib/email.config';

export const prerender = false;

const env = import.meta.env as Record<string, string | undefined>;
const RESEND_KEY = env.RESEND_API_KEY || (globalThis as any).process?.env?.RESEND_API_KEY;
const SLACK_URL  = env.FORM_ALERT_SLACK_URL || (globalThis as any).process?.env?.FORM_ALERT_SLACK_URL;

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function alertSlack(firm: string, err: unknown) {
  if (!SLACK_URL) return;
  const text =
    `:rotating_light: *Member profile intake failed to send*\n` +
    `Firm: ${firm || '(unknown)'}\n` +
    `Error: ${err instanceof Error ? err.message : String(err)}\n` +
    `Time: ${new Date().toISOString()}`;
  try {
    await fetch(SLACK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    /* swallow — never mask the original failure */
  }
}

export const POST: APIRoute = async ({ request }) => {
  let firmName = '';
  try {
    const form = await request.formData();

    // 1) Honeypot — real users never fill this; bots do. Accept silently, drop.
    if (String(form.get('company_url') || '').trim()) {
      return json({ ok: true });
    }

    const get = (k: string) => String(form.get(k) || '').trim();
    const getAll = (k: string) => form.getAll(k).map((v) => String(v).trim()).filter(Boolean);
    firmName = get('firm_name');

    // 2) Server-side required check (mirrors the ★ fields)
    const required = ['firm_name', 'hq', 'contact_name', 'contact_role', 'contact_email', 'contact_phone', 'states'];
    const missing = required.filter((k) => !get(k));
    if (missing.length) return json({ ok: false, error: 'missing_fields', missing }, 400);

    // Repeatable communities → array of objects
    const cN = form.getAll('comm_name').map(String);
    const cC = form.getAll('comm_city').map(String);
    const cD = form.getAll('comm_doors').map(String);
    const cT = form.getAll('comm_type').map(String);
    const communities = cN
      .map((n, i) => ({ name: (n || '').trim(), city: (cC[i] || '').trim(), doors: (cD[i] || '').trim(), type: (cT[i] || '').trim() }))
      .filter((c) => c.name || c.city || c.doors || c.type);

    const row = (label: string, val: string) =>
      val ? `<tr><td style="padding:4px 14px 4px 0;color:#6B7785;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:4px 0">${esc(val)}</td></tr>` : '';

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#18335E">
      <h2 style="margin:0 0 12px">New member profile intake</h2>
      <table style="font-size:14px;border-collapse:collapse">
        ${row('Firm', get('firm_name'))}
        ${row('HQ', get('hq'))}
        ${row('Established', get('established'))}
        ${row('Member since', get('member_since'))}
        ${row('Team size', get('team_size'))}
        ${row('Website', get('website'))}
        ${row('Contact', [get('contact_name'), get('contact_role')].filter(Boolean).join(' — '))}
        ${row('Email', get('contact_email'))}
        ${row('Phone', get('contact_phone'))}
        ${row('Brand color', get('brand_color'))}
        ${row('Tagline', get('tagline'))}
        ${row('Communities (count)', get('communities'))}
        ${row('Doors', get('doors'))}
        ${row('Google rating', get('google_rating'))}
        ${row('Google URL', get('google_url'))}
        ${row('Co-op programs', getAll('coop_prog').join(', '))}
        ${row('Vendor savings', get('vendor_savings'))}
        ${row('Dollars saved', get('dollars_saved'))}
        ${row('Co-op impact', get('coop_impact'))}
        ${row('States', get('states'))}
        ${row('Region', get('region'))}
        ${row('Cities', get('cities'))}
        ${row('Founder', [get('founder_name'), get('founder_role')].filter(Boolean).join(' — '))}
        ${row('Credentials', getAll('cred').join(', '))}
        ${row('Founder board', get('founder_board'))}
        ${row('Co-op role', get('founder_coop_role'))}
        ${row('Accreditations', getAll('accred').join(', '))}
        ${row('Accreditation detail', get('accred_detail'))}
        ${row('Why joined', get('why_joined'))}
        ${row('Why love', get('why_love'))}
        ${row('Video status', get('video_status'))}
        ${row('Spokesperson', get('spokesperson'))}
      </table>
      ${communities.length
        ? `<h3 style="margin:18px 0 8px">Communities (${communities.length})</h3>
           <ul style="font-size:14px;margin:0;padding-left:18px">${communities
             .map((c) => `<li>${esc(c.name)}${c.city ? ' — ' + esc(c.city) : ''}${c.doors ? ' · ' + esc(c.doors) + ' doors' : ''}${c.type ? ' · ' + esc(c.type) : ''}</li>`)
             .join('')}</ul>`
        : ''}
      </div>`;

    if (!RESEND_KEY) throw new Error('RESEND_API_KEY not configured');
    const resend = new Resend(RESEND_KEY);

    // Notify the co-op office
    await resend.emails.send({
      from: EMAIL_CONFIG.from.notifications,
      to: EMAIL_CONFIG.notify,
      replyTo: get('contact_email'),
      subject: `New member profile intake — ${get('firm_name')}`,
      html,
    });

    // Confirm to the applicant
    const first = (get('contact_name').split(/\s+/)[0] || '').trim();
    await resend.emails.send({
      from: EMAIL_CONFIG.from.hello,
      to: get('contact_email'),
      subject: 'We received your Innovia member profile',
      html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#18335E">
        <p>Hi ${esc(first) || 'there'},</p>
        <p>Thanks for completing your Innovia member profile. The cooperative office has it, and we'll be in touch to schedule your 30-minute call.</p>
        <p>— Innovia Co-op</p></div>`,
    });

    return json({ ok: true });
  } catch (err) {
    await alertSlack(firmName, err);
    return json({ ok: false, error: 'send_failed' }, 500);
  }
};
