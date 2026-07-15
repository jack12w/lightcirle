// lightcirle — Mailer utility
// Sends a notification to the sales inbox whenever a new quote request arrives.
// Design rules:
//   1. NEVER throws and NEVER blocks the HTTP response — callers fire-and-forget.
//   2. If SMTP is not configured, or sending fails, we just log and skip.
//   3. SMTP config comes from environment variables (see .env.production on server).
//      Sales recipient: SALES_EMAIL env > settings.email_address > inquiry@lightcirle.com

// Lazy-require so the server still boots even if nodemailer is not installed.
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

function getSettingsEmail() {
  try {
    const { getDb } = require('../db/schema');
    const row = getDb().prepare('SELECT email_address FROM settings WHERE id = 1').get();
    return row && row.email_address ? row.email_address : null;
  } catch (e) {
    return null;
  }
}

function buildTransport() {
  if (!nodemailer) return null;
  const host = process.env.SMTP_HOST;
  if (!host) return null; // not configured -> skip silently
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || /^(1|true|yes)$/i.test(process.env.SMTP_SECURE || ''),
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
  });
}

function salesRecipient() {
  return (
    process.env.SALES_EMAIL ||
    getSettingsEmail() ||
    'inquiry@lightcirle.com'
  );
}

function fmt(v) {
  return v && String(v).trim() ? String(v).trim() : '—';
}

function row(label, value) {
  return (
    '<tr><td style="padding:6px 10px;color:#6B7280;font-size:13px;white-space:nowrap">' +
    label +
    '</td><td style="padding:6px 10px;font-size:13px;color:#1F2937">' +
    String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;') +
    '</td></tr>'
  );
}

function buildHtml(q) {
  const color = [q.color, q.colorHex ? '(' + q.colorHex + ')' : ''].filter(Boolean).join(' ');
  const custom = Array.isArray(q.customization) && q.customization.length
    ? q.customization.join('，')
    : '—';
  return (
    '<div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#FAFAF8">' +
    '<div style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;overflow:hidden">' +
    '<div style="background:#2D5A3D;color:#fff;padding:18px 24px;font-family:\'Playfair Display\',serif;font-size:18px">New Quote Request #' +
    q.id +
    '</div>' +
    '<table style="width:100%;border-collapse:collapse;padding:8px 24px">' +
    row('Company', fmt(q.company)) +
    row('Contact', fmt(q.name)) +
    row('Email', fmt(q.email)) +
    row('WhatsApp', fmt(q.whatsapp)) +
    row('Category', fmt(q.category)) +
    row('Quantity', fmt(q.qty) + ' pcs') +
    row('Color / Pantone', fmt(color)) +
    row('Fabric / Style', fmt(q.fabric)) +
    row('Customization', fmt(custom)) +
    row('Target Delivery', fmt(q.delivery)) +
    row('Budget', fmt(q.budget)) +
    row('Notes', fmt(q.notes)) +
    '</table>' +
    '<div style="padding:0 24px 20px"><a href="' +
    (process.env.SITE_BASE_URL || 'https://lightcirle.com') +
    '/admin/quotes.html" style="display:inline-block;background:#2D5A3D;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-size:14px">Open in Admin →</a></div>' +
    '</div></div>'
  );
}

function buildText(q) {
  const color = [q.color, q.colorHex ? '(' + q.colorHex + ')' : ''].filter(Boolean).join(' ');
  const custom = Array.isArray(q.customization) && q.customization.length
    ? q.customization.join(', ')
    : '—';
  return [
    'New Quote Request #' + q.id,
    'Company: ' + fmt(q.company),
    'Contact: ' + fmt(q.name),
    'Email: ' + fmt(q.email),
    'WhatsApp: ' + fmt(q.whatsapp),
    'Category: ' + fmt(q.category),
    'Quantity: ' + fmt(q.qty) + ' pcs',
    'Color / Pantone: ' + fmt(color),
    'Fabric / Style: ' + fmt(q.fabric),
    'Customization: ' + fmt(custom),
    'Target Delivery: ' + fmt(q.delivery),
    'Budget: ' + fmt(q.budget),
    'Notes: ' + fmt(q.notes),
  ].join('\n');
}

async function notifySales(quote) {
  const transport = buildTransport();
  if (!transport) {
    console.log('[mailer] SMTP not configured — quote notification skipped (id=' + quote.id + ')');
    return { sent: false, skipped: true, reason: 'smtp_not_configured' };
  }
  const to = salesRecipient();
  const from = process.env.MAIL_FROM || to;
  const subject = 'New Quote Request — ' + fmt(quote.company) + ' (' + fmt(quote.name) + ')';
  try {
    await transport.sendMail({
      to,
      from,
      replyTo: fmt(quote.email),
      subject,
      html: buildHtml(quote),
      text: buildText(quote),
    });
    console.log('[mailer] quote notification sent to ' + to + ' (id=' + quote.id + ')');
    return { sent: true };
  } catch (e) {
    console.error('[mailer] failed to send quote notification (id=' + quote.id + '):', e.message);
    return { sent: false, error: e.message };
  }
}

module.exports = { notifySales };
