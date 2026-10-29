/**
 * Verifies the form Slack log + failure alerting, with no network and no keys.
 *
 * Run it after wiring a client site, and before trusting that a site has
 * stopped emailing Alloy:  node scripts/test-form-alert.ts   (Node >= 22.6)
 *
 * It stubs global fetch and asserts WHICH destination each path hits, which is
 * the part that actually matters here: a site with a Slack webhook must never
 * send a failure email, and a site without one must never go silent.
 */
import { sendWithAlert, notifySubmission, fieldsFromFormData } from '../src/lib/form-alert.ts';

const SLACK = 'https://hooks.slack.com/services/T/B/xxx';
const ALERT_EMAIL = { apiKey: 're_test', to: 'admin@alloygp.co', from: 'x@y.co' };

let calls: string[] = [];
(globalThis as any).fetch = async (url: string) => {
  calls.push(String(url));
  return { ok: true, status: 200, json: async () => ({}) } as any;
};

const failingSend = async () => { throw new Error('Resend is down'); };
const hosts = () => calls.map((u) => new URL(u).host);
let failures = 0;
function check(label: string, cond: boolean) {
  console.log(`${cond ? '  ok  ' : ' FAIL '} ${label}`);
  if (!cond) failures++;
}

// 1. Slack configured → failure alerts Slack ONLY, never the email inbox.
calls = [];
try {
  await sendWithAlert(
    { client: 'Acme', formName: 'Contact form', slackWebhookUrl: SLACK, alertEmail: ALERT_EMAIL },
    failingSend,
  );
} catch { /* expected: re-thrown */ }
check('slack configured → posts to Slack', hosts().includes('hooks.slack.com'));
check('slack configured → does NOT email admin@alloygp.co', !hosts().includes('api.resend.com'));

// 2. No Slack anywhere → the email fallback must still fire, or failures are silent.
delete process.env.FORM_SLACK_WEBHOOK;
delete process.env.FORM_ALERT_SLACK_URL;
calls = [];
try {
  await sendWithAlert(
    { client: 'Acme', formName: 'Contact form', alertEmail: ALERT_EMAIL },
    failingSend,
  );
} catch { /* expected */ }
check('no slack → falls back to email', hosts().includes('api.resend.com'));

// 3. Env-only Slack config also suppresses the email.
process.env.FORM_SLACK_WEBHOOK = SLACK;
calls = [];
try {
  await sendWithAlert({ client: 'Acme', alertEmail: ALERT_EMAIL }, failingSend);
} catch { /* expected */ }
check('slack via env → does NOT email', !hosts().includes('api.resend.com'));
check('slack via env → still POSTS to Slack (no silent gap)', hosts().includes('hooks.slack.com'));
delete process.env.FORM_SLACK_WEBHOOK;

// 4. An error-shaped response (Resend returns {error} without throwing) alerts too.
calls = [];
try {
  await sendWithAlert(
    { client: 'Acme', slackWebhookUrl: SLACK, alertEmail: ALERT_EMAIL },
    async () => ({ error: { message: 'domain not verified', name: 'validation_error' } }),
  );
} catch { /* expected */ }
check('error-shaped response alerts Slack', hosts().includes('hooks.slack.com'));
check('error-shaped response does NOT email', !hosts().includes('api.resend.com'));

// 5. notifySubmission never throws, even with a webhook that rejects.
(globalThis as any).fetch = async () => { throw new Error('network gone'); };
let threw = false;
try {
  await notifySubmission({ client: 'Acme', slackWebhookUrl: SLACK, fields: [['Name', 'A']] });
} catch { threw = true; }
check('notifySubmission swallows a dead webhook', !threw);

// 6. No webhook → no throw, no call.
calls = [];
(globalThis as any).fetch = async (url: string) => { calls.push(String(url)); return { ok: true } as any; };
await notifySubmission({ client: 'Acme', fields: [['Name', 'A']] });
check('notifySubmission with no webhook is a no-op', calls.length === 0);

// 7. Payload shape: delivered vs not.
let bodies: any[] = [];
(globalThis as any).fetch = async (_u: string, o: any) => { bodies.push(JSON.parse(o.body)); return { ok: true } as any; };
await notifySubmission({ client: 'Acme', slackWebhookUrl: SLACK, route: 'Proposal', fields: [['Name', 'A']] });
await notifySubmission({ client: 'Acme', slackWebhookUrl: SLACK, route: 'Proposal', delivered: false, fields: [['Name', 'A']] });
check('delivered post is marked 📬', bodies[0].text.startsWith('📬'));
check('undelivered post is marked ⚠️', bodies[1].text.startsWith('⚠️'));
check('undelivered post says it is the only record',
  JSON.stringify(bodies[1].blocks).includes('only record of the submission'));
check('field values are rendered', JSON.stringify(bodies[0].blocks).includes('*Name:* A'));

// 8. Long values are truncated so Slack can't reject the payload.
bodies = [];
await notifySubmission({ client: 'Acme', slackWebhookUrl: SLACK, fields: [['Message', 'x'.repeat(5000)]] });
check('long values truncated', JSON.stringify(bodies[0].blocks).includes('…'));

// 9. fieldsFromFormData: honeypot + machine fields out, real content in.
const fd = new FormData();
fd.set('name', 'Dana Reyes');
fd.set('firstName', 'Dana');
fd.set('website', 'http://spam.example');        // honeypot
fd.set('company_website', 'http://spam.example'); // honeypot (other convention)
fd.set('fieldsJson', '[{"label":"Units"}]');
fd.set('audience', 'proposal');
fd.set('blank', '   ');
const rows = fieldsFromFormData(fd);
const keys = rows.map(([k]) => k);
check('keeps real fields', keys.includes('Name'));
check('camelCase labelled', keys.includes('First name'));
check('drops both honeypots', !keys.includes('Website') && !keys.includes('Company website'));
check('drops machine fields', !keys.includes('Fieldsjson') && !keys.includes('Audience'));
check('drops whitespace-only values', !keys.includes('Blank'));


// The Resend probe behind /api/form-health: a real send to Resend's test inbox,
// reported as the form routes would experience it. (No domains lookup — that
// needs a Full-access key; production keys are Sending-access only.)
const { probeResendSend, RESEND_TEST_INBOX } = await import('../src/lib/resend-probe.ts');
type RpStub = { status: number; body: unknown } | Error;
let rpCalls: { url: string; init: any }[] = [];
function stubResend(...responses: RpStub[]) {
  rpCalls = [];
  const queue = [...responses];
  (globalThis as any).fetch = async (url: string, init: any) => {
    rpCalls.push({ url: String(url), init });
    const next = queue.shift() ?? { status: 500, body: {} };
    if (next instanceof Error) throw next;
    return { ok: next.status < 300, status: next.status, json: async () => next.body } as any;
  };
}
const RP_OPTS = { apiKey: 're_test', from: 'Acme <notifications@mail.acme.test>', client: 'Acme', site: 'https://acme.test', retryDelayMs: 0 };

stubResend({ status: 200, body: { id: 're_abc123' } });
let rp = await probeResendSend(RP_OPTS);
const rpSent = JSON.parse(rpCalls[0].init.body);
check('probe: 200 → ok, names the sender and the Resend id', rp.ok && rp.detail.includes('notifications@mail.acme.test') && rp.detail.includes('re_abc123'));
check('probe: POSTs to /emails with the key', rpCalls[0].url === 'https://api.resend.com/emails' && rpCalls[0].init.method === 'POST' && rpCalls[0].init.headers.Authorization === 'Bearer re_test');
check('probe: FROM the notification address, TO the test inbox only', rpSent.from === RP_OPTS.from && JSON.stringify(rpSent.to) === JSON.stringify([RESEND_TEST_INBOX]));
check("probe: the test inbox is Resend's simulated-delivery address", /^delivered(\+[\w-]+)?@resend\.dev$/.test(RESEND_TEST_INBOX));
check('probe: subject and body say what it is', /health check/i.test(rpSent.subject) && rpSent.subject.includes('Acme') && /nobody receives/i.test(rpSent.text));

stubResend({ status: 401, body: { statusCode: 401, name: 'validation_error', message: 'API key is invalid' } });
rp = await probeResendSend(RP_OPTS);
check("probe: bad key → ✗ with Resend's message and status", !rp.ok && rp.detail === 'API key is invalid (401)');

stubResend({ status: 403, body: { statusCode: 403, name: 'validation_error', message: 'The mail.acme.test domain is not verified. Please, add and verify your domain on https://resend.com/domains' } });
rp = await probeResendSend(RP_OPTS);
check('probe: unverified domain → ✗ naming the domain', !rp.ok && rp.detail.includes('mail.acme.test domain is not verified') && rp.detail.endsWith('(403)'));

stubResend({ status: 429, body: { message: 'Too many requests' } }, { status: 200, body: { id: 're_retry' } });
rp = await probeResendSend(RP_OPTS);
check('probe: one 429 is retried once, not reported', rp.ok && rpCalls.length === 2 && rp.detail.includes('re_retry'));

stubResend({ status: 429, body: { message: 'Too many requests.' } }, { status: 429, body: { message: 'Too many requests.' } });
rp = await probeResendSend(RP_OPTS);
check('probe: two 429s → ✗, no endless retry', !rp.ok && rpCalls.length === 2 && rp.detail.endsWith('(429)'));

stubResend(new Error('fetch failed'));
rp = await probeResendSend(RP_OPTS);
check('probe: network error → ✗ unreachable', !rp.ok && rp.detail === 'unreachable: fetch failed');

stubResend({ status: 200, body: { id: 'never' } });
rp = await probeResendSend({ ...RP_OPTS, apiKey: undefined });
check('probe: no key → ✗ without calling Resend', !rp.ok && rp.detail === 'RESEND_API_KEY is not set' && rpCalls.length === 0);

stubResend({ status: 200, body: {} });
rp = await probeResendSend(RP_OPTS);
check('probe: a 200 with no id is still a pass', rp.ok);

stubResend({ status: 500, body: 'not json' });
rp = await probeResendSend(RP_OPTS);
check('probe: a 5xx with an unreadable body still reports the status', !rp.ok && rp.detail.endsWith('(500)'));

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
