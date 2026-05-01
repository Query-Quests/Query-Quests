import { Resend } from 'resend';
import crypto from 'crypto';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS =
  process.env.EMAIL_FROM || 'QueryQuest <onboarding@resend.dev>';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// 32 bytes hex = 64 chars, fits VARCHAR(191) and is collision-safe.
export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Backwards-compatible alias used by older call sites.
export const generateVerificationToken = generateToken;

export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;             // 1h

async function sendEmail({ to, subject, html }) {
  if (!resend) {
    // Dev fallback when RESEND_API_KEY isn't configured: log instead of send
    // so developers can still copy verification/reset URLs out of the console.
    console.log('=== EMAIL (no RESEND_API_KEY, not sent) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    console.log('===========================================');
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('Resend error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Resend exception:', err);
    return false;
  }
}

// Shared branded layout. All template bodies plug into `content`.
function layout({ heading, content }) {
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f9f9f9;font-family:Arial,Helvetica,sans-serif;color:#030914;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
                 style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 40px 0 40px;">
                <div style="display:inline-flex;align-items:center;gap:8px;">
                  <div style="background:#19aa59;width:32px;height:32px;border-radius:8px;display:inline-block;"></div>
                  <span style="font-size:20px;font-weight:700;color:#030914;vertical-align:middle;margin-left:8px;">QueryQuest</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 8px 40px;">
                <h1 style="margin:0;font-size:24px;line-height:1.25;color:#030914;font-weight:700;letter-spacing:-0.4px;">${heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 32px 40px;font-size:15px;line-height:1.6;color:#374151;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 32px 40px;border-top:1px solid #e5e7eb;">
                <p style="margin:24px 0 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
                  This is an automated email from QueryQuest. Please do not reply to this address.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href, label) {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${href}"
         style="background:#19aa59;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:9999px;display:inline-block;font-weight:600;font-size:14px;">
        ${label}
      </a>
    </div>`;
}

function fallbackLink(href) {
  return `
    <p style="margin:16px 0 0 0;font-size:13px;color:#6b7280;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="word-break:break-all;font-size:13px;color:#6b7280;margin:4px 0 0 0;">${href}</p>`;
}

export async function sendVerificationEmail(email, name, token) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  const html = layout({
    heading: 'Verify your email',
    content: `
      <p style="margin:0 0 12px 0;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 12px 0;">
        Welcome to QueryQuest! Confirm your email address to activate your account
        and start solving SQL challenges.
      </p>
      ${button(url, 'Verify Email Address')}
      <p style="margin:0;font-size:13px;color:#6b7280;">This link expires in 24 hours.</p>
      ${fallbackLink(url)}
      <p style="margin:20px 0 0 0;font-size:13px;color:#6b7280;">
        If you didn't create a QueryQuest account, you can safely ignore this email.
      </p>`,
  });

  return sendEmail({
    to: email,
    subject: 'Verify your email address — QueryQuest',
    html,
  });
}

export async function sendPasswordResetEmail(email, name, token) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  const html = layout({
    heading: 'Reset your password',
    content: `
      <p style="margin:0 0 12px 0;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 12px 0;">
        We received a request to reset the password for your QueryQuest account.
        Click the button below to choose a new one.
      </p>
      ${button(url, 'Reset Password')}
      <p style="margin:0;font-size:13px;color:#6b7280;">This link expires in 1 hour.</p>
      ${fallbackLink(url)}
      <p style="margin:20px 0 0 0;font-size:13px;color:#6b7280;">
        If you didn't request a password reset, you can safely ignore this email —
        your password won't change.
      </p>`,
  });

  return sendEmail({
    to: email,
    subject: 'Reset your password — QueryQuest',
    html,
  });
}

export async function sendWelcomeEmail(email, name) {
  const url = `${APP_URL}/auth`;
  const html = layout({
    heading: 'Welcome to QueryQuest 🎉',
    content: `
      <p style="margin:0 0 12px 0;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 12px 0;">
        Your email is verified and your account is active. You're ready to start
        learning SQL through interactive challenges.
      </p>
      ${button(url, 'Sign In')}
      <p style="margin:20px 0 0 0;font-size:13px;color:#6b7280;">
        Need help getting started? Reply to this email or visit our help center.
      </p>`,
  });

  return sendEmail({
    to: email,
    subject: 'Welcome to QueryQuest!',
    html,
  });
}

// Kept for any legacy callers; prefer the named template helpers above.
export async function sendMockVerificationEmail(email, name, token) {
  console.log('=== MOCK EMAIL ===');
  console.log('To:', email);
  console.log('Verification URL:', `${APP_URL}/verify-email?token=${token}`);
  console.log('==================');
  return true;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
