// src/pages/api/form-health.ts
// Daily heartbeat for the form pipeline (Vercel cron — see vercel.json), so "is
// the form working?" is answered in Slack every morning instead of wondered
// about. It checks the things that break a form silently: that Resend accepts
// a real email from the site's notification address (src/lib/resend-probe.ts —
// sent to Resend's simulated-delivery inbox, so nobody receives it),
// the Slack webhook, the Mailchimp credentials, and that the lead route has somewhere to send.
// One line is posted to the forms channel — ✅ when everything passes, 🚨 with
// the failures when not. No line on a morning means the cron itself did not run.
//
// Auth: Vercel sends `Authorization: Bearer $CRON_SECRET` with every cron request
// once CRON_SECRET is set on the project (any long random string). The same
// header works for a manual check:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://innoviaco-op.com/api/form-health
// Without CRON_SECRET the route only answers Vercel's cron user-agent, so the
// heartbeat still runs on day one; set the secret so nobody else can trigger it.
//
// Ships with the AGP Astro starter. The only per-client input is EMAIL_CONFIG;
// src/lib/resend-probe.ts is shared and should not be edited per client.

import type { APIRoute } from 'astro';
import { EMAIL_CONFIG } from '~/lib/email.config';
import { probeResendSend } from '~/lib/resend-probe';

export const prerender = false;

interface Check { name: string; ok: boolean; detail: string }

const SLACK_WEBHOOK =
  import.meta.env.FORM_SLACK_WEBHOOK || import.meta.env.FORM_ALERT_SLACK_URL;
// Vercel sets VERCEL_ENV on every deployment: production | preview | development.
const DEPLOYMENT = process.env.VERCEL_ENV || 'development';

function authorized(request: Request): boolean {
  const secret = import.meta.env.CRON_SECRET;
  if (secret) return request.headers.get('authorization') === `Bearer ${secret}`;
  return (request.headers.get('user-agent') ?? '').startsWith('vercel-cron/');
}

const withTimeout = (ms: number) => AbortSignal.timeout(ms);

function checkRouting(): Check {
  const name = 'Routing';
  const to = [EMAIL_CONFIG.notify].flat().filter(Boolean) as string[];
  if (!to.length) return { name, ok: false, detail: 'leads route is empty — nothing would be emailed' };
  return { name, ok: true, detail: `${DEPLOYMENT} → leads to ${to.join(', ')}` };
}

async function checkResend(): Promise<Check> {
  // A real send, not a domains lookup: a Sending-access key is all production
  // needs, and "would Resend accept a message from notifications@?" is the
  // question anyway. See resend-probe.ts for why and where the email goes.
  const result = await probeResendSend({
    apiKey: import.meta.env.RESEND_API_KEY,
    from: EMAIL_CONFIG.from.notifications,
    client: EMAIL_CONFIG.brand.name,
    site: EMAIL_CONFIG.brand.url,
    timeoutMs: 8000,
  });
  return { name: 'Resend', ...result };
}

function checkSlack(): Check {
  return SLACK_WEBHOOK
    ? { name: 'Slack', ok: true, detail: 'webhook set (this message proves it posts)' }
    : { name: 'Slack', ok: false, detail: 'no FORM_SLACK_WEBHOOK / FORM_ALERT_SLACK_URL — submissions are not being logged' };
}

async function checkMailchimp(): Promise<Check> {
  const name = 'Mailchimp';
  if (!EMAIL_CONFIG.mailchimp.enabled) return { name, ok: true, detail: 'off in email.config.ts' };
  const key = import.meta.env.MAILCHIMP_API_KEY;
  const server = import.meta.env.MAILCHIMP_SERVER_PREFIX;
  const list = import.meta.env.MAILCHIMP_AUDIENCE_ID ?? import.meta.env.MAILCHIMP_LIST_ID;
  if (!key || !server || !list) {
    return { name, ok: false, detail: 'enabled in email.config.ts but MAILCHIMP_API_KEY / SERVER_PREFIX / AUDIENCE_ID are not all set — sign-ups are failing' };
  }
  try {
    const auth = { Authorization: `Basic ${Buffer.from(`anystring:${key}`).toString('base64')}` };
    const res = await fetch(`https://${server}.api.mailchimp.com/3.0/lists/${list}?fields=id,name`, {
      headers: auth, signal: withTimeout(8000),
    });
    if (res.status === 401) return { name, ok: false, detail: 'API key rejected (401)' };
    if (res.status === 404) return { name, ok: false, detail: `audience ${list} not found` };
    if (!res.ok) return { name, ok: false, detail: `responded ${res.status}` };
    const body = await res.json();
    return { name, ok: true, detail: `audience "${body?.name ?? list}" reachable` };
  } catch (err) {
    return { name, ok: false, detail: `unreachable: ${(err as Error).message}` };
  }
}

async function postHeartbeat(ok: boolean, checks: Check[]): Promise<void> {
  if (!SLACK_WEBHOOK) return;
  const client = EMAIL_CONFIG.brand.name;
  const line = checks.map((c) => `${c.ok ? '✓' : '✗'} ${c.name}: ${c.detail}`).join('\n');
  const text = ok
    ? `✅ Forms healthy — ${client} · ${checks.map((c) => c.name).join(' · ')} all ok`
    : `🚨 Form pipeline problem — ${client}: ${checks.filter((c) => !c.ok).map((c) => `${c.name} (${c.detail})`).join('; ')}`;
  try {
    await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: ok ? `✅ Forms healthy — ${client}` : `🚨 Form pipeline problem — ${client}` } },
          { type: 'section', text: { type: 'mrkdwn', text: line } },
          { type: 'context', elements: [{ type: 'mrkdwn', text: `Daily form health check · ${DEPLOYMENT} · ${new Date().toISOString()}` }] },
        ],
      }),
      signal: withTimeout(8000),
    });
  } catch (err) {
    console.error('[form-health] could not post to Slack:', err);
  }
}

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const checks: Check[] = [
    checkRouting(),
    await checkResend(),
    checkSlack(),
    await checkMailchimp(),
  ];
  const ok = checks.every((c) => c.ok);
  await postHeartbeat(ok, checks);
  if (!ok) console.error('[form-health] failing checks:', checks.filter((c) => !c.ok));
  return new Response(JSON.stringify({ ok, checks, deployment: DEPLOYMENT, checkedAt: new Date().toISOString() }, null, 2), {
    status: ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
