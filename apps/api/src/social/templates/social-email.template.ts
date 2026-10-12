/**
 * Email template for confirming successful social account connections.
 * Follows the established Aayeshol design system and dark theme.
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
  max-width: 520px;
  margin: 0 auto;
  padding: 40px;
`;

const badgeStyle = `
  display: inline-block;
  background: rgba(167, 139, 250, 0.15);
  border: 1px solid #a78bfa;
  color: #a78bfa;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 20px;
`;

const headingStyle = `color: #f0f0ff; font-size: 22px; font-weight: 700; margin: 0 0 12px;`;
const subStyle = `color: #aaaacc; font-size: 15px; margin: 0 0 24px; line-height: 1.5;`;
const infoBoxStyle = `
  background: #1e1e2e;
  border: 1px solid #3b3b56;
  border-radius: 8px;
  padding: 20px;
  margin: 24px 0;
`;

const infoRowStyle = `display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;`;
const labelStyle = `color: #8888aa; font-weight: 500;`;
const valueStyle = `color: #e4e4f0; font-weight: 600;`;
const buttonStyle = `
  display: inline-block;
  background: #6366f1;
  color: #ffffff !important;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 24px;
  border-radius: 8px;
  margin: 16px 0 24px;
`;
const mutedStyle = `color: #8888aa; font-size: 13px; line-height: 1.6;`;

export interface SocialAccountConnectedEmailOptions {
  userName: string;
  platform: string;
  accountName: string;
  accountId: string;
  connectedAt: Date;
  frontendUrl: string;
}

/**
 * Generates HTML email confirming that a social media account was connected for automation.
 *
 * @param options - Configuration containing user name, platform, account details, and links.
 * @returns Self-contained HTML email string suitable for Resend delivery.
 */
export function socialAccountConnectedTemplate(
  options: SocialAccountConnectedEmailOptions,
): string {
  const formattedDate = options.connectedAt.toUTCString();
  const manageUrl = `${options.frontendUrl}/settings/connections`;

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${baseStyle}">
  <div style="${cardStyle}">
    <div style="${badgeStyle}">AAYESHOL AUTOMATION</div>
    <h1 style="${headingStyle}">Social Account Connected Successfully</h1>
    <p style="${subStyle}">Hi ${options.userName}, your <strong>${options.platform}</strong> account has been successfully linked to your Aayeshol workspace.</p>
    
    <div style="${infoBoxStyle}">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="${labelStyle}; padding: 6px 0;">Platform:</td>
          <td style="${valueStyle}; text-align: right; padding: 6px 0;">${options.platform}</td>
        </tr>
        <tr>
          <td style="${labelStyle}; padding: 6px 0;">Connected Account:</td>
          <td style="${valueStyle}; text-align: right; padding: 6px 0;">${options.accountName}</td>
        </tr>
        <tr>
          <td style="${labelStyle}; padding: 6px 0;">Account ID:</td>
          <td style="${valueStyle}; text-align: right; padding: 6px 0;">${options.accountId}</td>
        </tr>
        <tr>
          <td style="${labelStyle}; padding: 6px 0;">Connected At:</td>
          <td style="${valueStyle}; text-align: right; padding: 6px 0;">${formattedDate}</td>
        </tr>
      </table>
    </div>

    <p style="${subStyle}">This account is now ready for scheduled publishing, AI-generated content distribution, and social automation workflows.</p>

    <div style="text-align: center;">
      <a href="${manageUrl}" style="${buttonStyle}" target="_blank">Manage Connected Accounts</a>
    </div>

    <hr style="border:none;border-top:1px solid #2a2a3a;margin:28px 0;">
    <p style="${mutedStyle}">
      <strong>Security notice:</strong> If you did not initiate this connection, please disconnect this account immediately from your settings page and rotate your credentials.
    </p>
  </div>
</body>
</html>`;
}
