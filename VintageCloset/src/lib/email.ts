// Sends transactional email through Resend (https://resend.com), server only.
// Needs RESEND_API_KEY in Vercel; sender address via EMAIL_FROM (domain must be verified in Resend).

import { SITE_URL } from '@/lib/site';

const DEFAULT_FROM = 'Vintage Closet <hello@vintagecloset.app>';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export async function sendEmail({ to, subject, html, text, headers }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: [to],
      subject,
      html,
      text,
      headers,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend error ${response.status}: ${detail.slice(0, 200)}`);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// Shared branded layout: plum header with the logo, teal button
export function brandEmail({ title, body, buttonLabel, buttonUrl, footer }: {
  title: string;
  body: string;
  buttonLabel?: string;
  buttonUrl?: string;
  footer?: string;
}): string {
  const button = buttonLabel && buttonUrl
    ? `<p style="margin:28px 0"><a href="${escapeHtml(buttonUrl)}" style="background:#4CC2BA;color:#0C1114;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;display:inline-block">${escapeHtml(buttonLabel)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#F5F7F8;font-family:Helvetica,Arial,sans-serif;color:#0C1114">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td align="center" style="background:#602140;padding:24px"><img src="${SITE_URL}/brand/vintage-closet-logo.png" width="96" alt="Vintage Closet" style="display:block"></td></tr>
<tr><td style="padding:32px 28px">
<h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(title)}</h1>
<div style="font-size:15px;line-height:1.6;color:#4F5A63">${body}</div>
${button}
</td></tr>
<tr><td style="padding:0 28px 28px;font-size:12px;line-height:1.5;color:#8A949C">${footer ?? ''}Vintage Closet Vienna · <a href="${SITE_URL}" style="color:#8A949C">vintagecloset.app</a></td></tr>
</table></td></tr></table></body></html>`;
}

export { escapeHtml };
