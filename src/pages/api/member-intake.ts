// POST /api/member-intake — Member Profile Intake submission handler.
// - Appends every submission to the Google Sheet FIRST (SHEETS_WEBHOOK_URL) so the
//   sheet is the durable record even when email fails. Best-effort: never blocks.
// - Sends an office notification + applicant confirmation via Resend.
// - Posts to Slack (FORM_ALERT_SLACK_URL) on EVERY outcome — received, rejected
//   (missing fields), quarantined (honeypot tripped), or failed — so a submission
//   can never disappear without a trace.
// - Honeypot ("hp_token"): a filled value is quarantined to Slack with a summary,
//   NOT silently dropped. The field used to be "company_url", which Chrome's autofill
//   classifies as a company field and fills for real users. Those intakes returned
//   ok, the client wiped the draft, and nothing was recorded anywhere.
// Env (set in Vercel, Production + Preview): RESEND_API_KEY, FORM_ALERT_SLACK_URL,
// SHEETS_WEBHOOK_URL.
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { EMAIL_CONFIG } from '~/lib/email.config';

export const prerender = false;

const env = import.meta.env as Record<string, string | undefined>;
const RESEND_KEY = env.RESEND_API_KEY || (globalThis as any).process?.env?.RESEND_API_KEY;
const SLACK_URL  = env.FORM_ALERT_SLACK_URL || (globalThis as any).process?.env?.FORM_ALERT_SLACK_URL;
const SHEETS_URL = env.SHEETS_WEBHOOK_URL || (globalThis as any).process?.env?.SHEETS_WEBHOOK_URL;

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Slack mrkdwn reserves only these three characters.
const slackEsc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Post one message to the Slack incoming webhook. Best-effort: never throws,
 *  but a failed post is logged so it shows up in Vercel runtime logs. */
async function postSlack(text: string) {
  if (!SLACK_URL) {
    console.warn('FORM_ALERT_SLACK_URL not set; Slack post skipped');
    return;
  }
  try {
    const res = await fetch(SLACK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) console.error('Slack post failed:', res.status, await res.text().catch(() => ''));
  } catch (err) {
    console.error('Slack post failed:', err);
  }
}

/** Append one row to the Google Sheet. Keys must match the sheet's header row.
 *  Best-effort by design: a sheet outage must never cost us the submission. */
async function appendToSheet(row: Record<string, string>) {
  if (!SHEETS_URL) return;
  try {
    const res = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(row),
    });
    if (!res.ok) console.error('Sheet append failed:', res.status);
  } catch (err) {
    console.error('Sheet append failed:', err);
  }
}

export const POST: APIRoute = async ({ request }) => {
  let firmName = '';
  let stage = 'parse';
  const submittedAt = new Date().toISOString();
  try {
    const form = await request.formData();

    const get = (k: string) => String(form.get(k) || '').trim();
    const getAll = (k: string) => form.getAll(k).map((v) => String(v).trim()).filter(Boolean);
    firmName = get('firm_name');

    // Repeatable communities → array of objects
    const cN = form.getAll('comm_name').map(String);
    const cC = form.getAll('comm_city').map(String);
    const cD = form.getAll('comm_doors').map(String);
    const cT = form.getAll('comm_type').map(String);
    const communities = cN
      .map((n, i) => ({ name: (n || '').trim(), city: (cC[i] || '').trim(), doors: (cD[i] || '').trim(), type: (cT[i] || '').trim() }))
      .filter((c) => c.name || c.city || c.doors || c.type);

    // Compact summary for Slack. Enough to identify and follow up with the firm.
    const summary = () =>
      [
        `Firm: ${slackEsc(firmName || '(blank)')}`,
        `HQ: ${slackEsc(get('hq') || '-')} · States: ${slackEsc(get('states') || '-')}`,
        `Contact: ${slackEsc([get('contact_name'), get('contact_role')].filter(Boolean).join(', ') || '-')}`,
        `Email: ${slackEsc(get('contact_email') || '-')} · Phone: ${slackEsc(get('contact_phone') || '-')}`,
        `Communities: ${slackEsc(get('communities') || (communities.length ? String(communities.length) : '-'))} · Doors: ${slackEsc(get('doors') || '-')}`,
        `Time: ${submittedAt}`,
      ].join('\n');

    // 1) Honeypot. Real users never fill this; bots do. Quarantine to Slack instead
    //    of dropping, so a false positive (browser autofill) is recoverable. Still
    //    answer ok so a bot learns nothing.
    const hp = String(form.get('hp_token') || '').trim();
    if (hp) {
      await postSlack(
        `:warning: *Member profile intake quarantined (honeypot tripped)*\n` +
          `Hidden field was filled with: "${slackEsc(hp.slice(0, 80))}"\n` +
          `If this is a real firm, autofill likely did it. Ask them to resubmit.\n` +
          summary(),
      );
      return json({ ok: true });
    }

    // 2) Server-side required check (mirrors the ★ fields)
    const required = ['firm_name', 'hq', 'contact_name', 'contact_role', 'contact_email', 'contact_phone', 'states'];
    const missing = required.filter((k) => !get(k));
    if (missing.length) {
      await postSlack(
        `:no_entry: *Member profile intake rejected (missing required fields)*\n` +
          `Missing: ${missing.join(', ')}\n` +
          summary(),
      );
      return json({ ok: false, error: 'missing_fields', missing }, 400);
    }

    // 3) Persist to the Google Sheet first so it is the durable record even if
    //    Resend is down. Full ISO timestamp so the sheet shows when, not just the day.
    stage = 'sheet';
    await appendToSheet({
      'Submitted': submittedAt,
      'Firm': get('firm_name'),
      'HQ': get('hq'),
      'Established': get('established'),
      'Member since': get('member_since'),
      'Team size': get('team_size'),
      'Website': get('website'),
      'Contact name': get('contact_name'),
      'Contact role': get('contact_role'),
      'Contact email': get('contact_email'),
      'Contact phone': get('contact_phone'),
      'Brand color': get('brand_color'),
      'Tagline': get('tagline'),
      'Communities (count)': get('communities'),
      'Doors': get('doors'),
      'Google rating': get('google_rating'),
      'Google URL': get('google_url'),
      'Co-op programs': getAll('coop_prog').join(', '),
      'Vendor savings': get('vendor_savings'),
      'Dollars saved': get('dollars_saved'),
      'Co-op impact': get('coop_impact'),
      'States': get('states'),
      'Region': get('region'),
      'Cities': get('cities'),
      'Founder name': get('founder_name'),
      'Founder role': get('founder_role'),
      'Credentials': getAll('cred').join(', '),
      'Founder board': get('founder_board'),
      'Co-op role': get('founder_coop_role'),
      'Accreditations': getAll('accred').join(', '),
      'Accreditation detail': get('accred_detail'),
      'Why joined': get('why_joined'),
      'Why love': get('why_love'),
      'Video status': get('video_status'),
      'Spokesperson': get('spokesperson'),
      'Communities detail': communities
        .map((c) => [c.name, c.city, c.doors, c.type].filter(Boolean).join(' · '))
        .join(' | '),
    });

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

    // 4) Notify the co-op office (CC admin@; Reply-To the applicant so the office
    //    can respond to the firm directly)
    stage = 'office_email';
    await resend.emails.send({
      from: EMAIL_CONFIG.from.notifications,
      to: EMAIL_CONFIG.notify,
      cc: EMAIL_CONFIG.notifyCc,
      replyTo: get('contact_email'),
      subject: `New member profile intake — ${get('firm_name')}`,
      html,
    });

    // 5) Slack: the submission is now recorded (sheet + office email).
    await postSlack(`:white_check_mark: *New member profile intake received*\n` + summary());

    // 6) Confirm to the applicant
    stage = 'confirmation_email';
    const first = (get('contact_name').split(/\s+/)[0] || '').trim();
    await resend.emails.send({
      from: EMAIL_CONFIG.from.hello,
      to: get('contact_email'),
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'We received your Innovia member profile',
      html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#18335E">
        <p>Hi ${esc(first) || 'there'},</p>
        <p>Thanks for completing your Innovia member profile. We received it and will be in touch to schedule your 30-minute call.</p>
        <p>Innovia Co-op</p></div>`,
    });

    return json({ ok: true });
  } catch (err) {
    await postSlack(
      `:rotating_light: *Member profile intake failed*\n` +
        `Firm: ${slackEsc(firmName || '(unknown)')}\n` +
        `Stage: ${stage}\n` +
        `Error: ${slackEsc(err instanceof Error ? err.message : String(err))}\n` +
        `Time: ${submittedAt}`,
    );
    return json({ ok: false, error: 'send_failed' }, 500);
  }
};
