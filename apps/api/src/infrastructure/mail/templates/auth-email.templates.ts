/**
 * Email templates for the authentication flow.
 * All templates are self-contained HTML strings suitable for Resend.
 */

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0d0d12;
  color: #e4e4f0;
  padding: 40px 20px;
`;

const cardStyle = `
  background: #16161f;
  border: 1px solid #2a2a3a;
  border-radius: 12px;
  max-width: 480px;
  margin: 0 auto;
  padding: 40px;
`;

const otpBoxStyle = `
  background: #1e1e2e;
  border: 1px solid #3b3b56;
  border-radius: 8px;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 12px;
  text-align: center;
  color: #a78bfa;
  padding: 20px;
  margin: 24px 0;
`;

const mutedStyle = `color: #8888aa; font-size: 13px; line-height: 1.6;`;
const headingStyle = `color: #f0f0ff; font-size: 22px; font-weight: 700; margin: 0 0 8px;`;
const subStyle = `color: #aaaacc; font-size: 15px; margin: 0 0 24px;`;

function buildEmail(heading: string, sub: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${baseStyle}">
  <div style="${cardStyle}">
    <p style="color:#a78bfa;font-size:13px;font-weight:600;letter-spacing:2px;margin:0 0 20px;">AAYESHOL</p>
    <h1 style="${headingStyle}">${heading}</h1>
    <p style="${subStyle}">${sub}</p>
    ${body}
    <hr style="border:none;border-top:1px solid #2a2a3a;margin:28px 0;">
    <p style="${mutedStyle}">This email was sent by Aayeshol. If you did not request this, please ignore it. Do not share this code with anyone.</p>
  </div>
</body>
</html>`;
}

/**
 * Email verification OTP template sent on registration.
 */
export function emailVerificationTemplate(name: string, otp: string, expiryMinutes = 15): string {
  return buildEmail(
    'Verify your email',
    `Hi ${name}, enter the code below to verify your Aayeshol account.`,
    `<div style="${otpBoxStyle}">${otp}</div>
     <p style="${mutedStyle}">This code expires in <strong style="color:#e4e4f0;">${expiryMinutes} minutes</strong>.</p>`,
  );
}

/**
 * Login OTP template sent during two-step login.
 */
export function loginOtpTemplate(name: string, otp: string, expiryMinutes = 5): string {
  return buildEmail(
    'Your login code',
    `Hi ${name}, use the code below to complete your login.`,
    `<div style="${otpBoxStyle}">${otp}</div>
     <p style="${mutedStyle}">This code expires in <strong style="color:#e4e4f0;">${expiryMinutes} minutes</strong>. Do not share it with anyone.</p>`,
  );
}

/**
 * Password reset OTP template.
 */
export function passwordResetOtpTemplate(name: string, otp: string, expiryMinutes = 10): string {
  return buildEmail(
    'Reset your password',
    `Hi ${name}, use the code below to reset your Aayeshol password.`,
    `<div style="${otpBoxStyle}">${otp}</div>
     <p style="${mutedStyle}">This code expires in <strong style="color:#e4e4f0;">${expiryMinutes} minutes</strong>. If you did not request a password reset, secure your account immediately.</p>`,
  );
}

/**
 * Password reset confirmation email sent after a successful password change.
 */
export function passwordResetConfirmationTemplate(name: string): string {
  return buildEmail(
    'Password changed',
    `Hi ${name}, your Aayeshol password has been changed successfully.`,
    `<p style="${mutedStyle}">If you did not make this change, please contact support immediately and secure your account.</p>`,
  );
}
