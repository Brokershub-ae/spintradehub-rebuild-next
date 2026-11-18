import { NextResponse } from 'next/server';

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'email-not-configured' }, { status: 503 });
  }

  let payload: { subject?: unknown; body?: unknown; replyTo?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const subject = String(payload.subject ?? '').trim().slice(0, 200);
  const body = String(payload.body ?? '').trim().slice(0, 10000);
  const replyTo = String(payload.replyTo ?? '').trim().slice(0, 200);
  if (!subject || !body) {
    return NextResponse.json({ error: 'missing-fields' }, { status: 400 });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || 'SpinTradeHub Website <onboarding@resend.dev>',
      to: [process.env.CONTACT_TO_EMAIL || 'info@spintradehub.com'],
      subject,
      text: body,
      ...(EMAIL_REGEX.test(replyTo) ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    console.error('Contact email send failed:', response.status, await response.text());
    return NextResponse.json({ error: 'send-failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
