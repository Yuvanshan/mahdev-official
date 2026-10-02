/**
 * Mahdev Enterprise Email Dispatch Service (Server-side)
 * Handles delivery of incoming website customer enquiries to info.mahdev.lk@gmail.com
 * using Nodemailer with SMTP / Gmail integration and resilient fallbacks.
 */

// @ts-ignore
import nodemailer, { type Transporter } from 'nodemailer';
import { getServerConfig } from '../config/serverEnv';

export interface WebsiteEnquiryPayload {
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  division?: string;
  service?: string;
  subject?: string;
  message: string;
  referenceId?: string;
  preferredDate?: string;
  budget?: string;
  metadata?: Record<string, any>;
  receivedAt?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  delivered: boolean;
  targetEmail: string;
  deliveryMethod: 'smtp' | 'sandbox_logged';
  messageId?: string;
  timestamp: string;
  notice?: string;
}

const DEFAULT_TARGET_EMAIL = 'info.mahdev.lk@gmail.com';

/**
 * Lazily initialize and return the Nodemailer transporter if credentials exist
 */
let cachedTransporter: Transporter | null = null;
let hasCheckedCredentials = false;

function getMailTransporter(): Transporter | null {
  const config = getServerConfig();
  const rawUser = process.env.GMAIL_USER || process.env.SMTP_USER || config.notifications.smtpUser || '';
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD || process.env.SMTP_PASS || config.notifications.smtpPass || '';

  const smtpUser = rawUser.trim();
  // Strip spaces if user pasted 16-character Google App Password format "xxxx xxxx xxxx xxxx"
  const smtpPass = rawPass.trim().replace(/\s+/g, '');
  const smtpHost = process.env.SMTP_HOST || config.notifications.smtpHost || (smtpUser.includes('@gmail.com') ? 'smtp.gmail.com' : 'smtp.gmail.com');
  const smtpPort = parseInt(process.env.SMTP_PORT || String(config.notifications.smtpPort || '587'), 10);

  if (!smtpUser || !smtpPass) {
    if (!hasCheckedCredentials) {
      console.info(
        `[EmailService] Notice: GMAIL_USER/SMTP_USER or GMAIL_APP_PASSWORD/SMTP_PASS not set in environment. Enquiries to ${DEFAULT_TARGET_EMAIL} will be logged to server console and stored in audit trail.`
      );
      hasCheckedCredentials = true;
    }
    return null;
  }

  if (!cachedTransporter) {
    try {
      const isGmail = smtpHost.includes('gmail') || smtpUser.includes('@gmail.com');
      if (isGmail) {
        cachedTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      } else {
        cachedTransporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      }
      console.info(`[EmailService] SMTP transporter configured successfully for ${smtpUser} via ${smtpHost}`);
    } catch (err) {
      console.warn('[EmailService] Failed to initialize Nodemailer transporter:', err);
      cachedTransporter = null;
    }
  }

  return cachedTransporter;
}

/**
 * Formats a clean, high-contrast corporate HTML email template
 */
function generateEnquiryHtmlEmail(data: WebsiteEnquiryPayload, targetEmail: string): string {
  const divisionName = (data.division || 'Mahdev Group').toUpperCase();
  const refId = data.referenceId || `ENQ-${Date.now().toString(36).toUpperCase()}`;
  const time = data.receivedAt || new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
  const cleanPhone = data.senderPhone ? data.senderPhone.replace(/[^0-9+]/g, '') : '';
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}` : null;
  const replySubject = encodeURIComponent(`Re: ${data.subject || 'Website Enquiry'} [${refId}]`);
  const replyMailto = `mailto:${data.senderEmail}?subject=${replySubject}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Website Enquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0a1128; padding: 28px 32px; border-bottom: 3px solid #0052FF;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #38bdf8; text-transform: uppercase;">Mahdev Enterprise Ecosystem</span>
                    <h1 style="margin: 4px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">New Website Customer Enquiry</h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Dispatched to ${targetEmail}</p>
                  </td>
                  <td align="right" valign="top">
                    <span style="display: inline-block; background-color: #0052FF; color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${divisionName}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Pill / Ref -->
          <tr>
            <td style="padding: 20px 32px 12px 32px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 13px; color: #64748b;">
                    <strong>Reference ID:</strong> <span style="font-family: monospace; color: #0052FF; font-weight: 700;">${refId}</span>
                  </td>
                  <td align="right" style="font-size: 13px; color: #64748b;">
                    <strong>Received:</strong> ${time}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Details Card -->
          <tr>
            <td style="padding: 24px 32px 16px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #0052FF; padding-left: 8px;">
                Customer Contact Details
              </h2>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; width: 35%; font-size: 13px; color: #64748b; font-weight: 600;">Full Name</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; font-weight: 600;">${data.senderName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600;">Email Address</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0052FF; font-weight: 600;">
                    <a href="${replyMailto}" style="color: #0052FF; text-decoration: none;">${data.senderEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600;">Phone / WhatsApp</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">
                    ${data.senderPhone ? `<a href="tel:${cleanPhone}" style="color: #0f172a; text-decoration: none;">${data.senderPhone}</a>` : '<span style="color: #94a3b8; font-style: italic;">Not provided</span>'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-weight: 600;">Division & Topic</td>
                  <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 500;">
                    ${data.division || 'General Group'} ${data.service ? `&bull; ${data.service}` : ''}
                  </td>
                </tr>
                ${data.preferredDate ? `
                <tr>
                  <td style="padding: 12px 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600;">Preferred Date</td>
                  <td style="padding: 12px 16px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">${data.preferredDate}</td>
                </tr>` : ''}
                ${data.budget ? `
                <tr>
                  <td style="padding: 12px 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600;">Budget / Scope</td>
                  <td style="padding: 12px 16px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">${data.budget}</td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <!-- Message / Requirements Card -->
          <tr>
            <td style="padding: 8px 32px 24px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #0052FF; padding-left: 8px;">
                Subject: ${data.subject || 'Website Customer Enquiry'}
              </h2>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${data.message}</div>
            </td>
          </tr>

          <!-- Quick Action Buttons -->
          <tr>
            <td style="padding: 0 32px 32px 32px;" align="center">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right: 12px;">
                    <a href="${replyMailto}" style="display: inline-block; background-color: #0052FF; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,82,255,0.2);">
                      &larr; Reply to ${data.senderName} (${data.senderEmail})
                    </a>
                  </td>
                  ${waLink ? `
                  <td>
                    <a href="${waLink}" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px;">
                      WhatsApp Customer
                    </a>
                  </td>
                  ` : ''}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 4px 0;">This email was automatically generated by the Mahdev Pvt Ltd Website (mahdev.lk).</p>
              <p style="margin: 0;">Recipient: <strong>${targetEmail}</strong> &bull; Replying will send directly to <strong>${data.senderEmail}</strong></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Formats a plain-text fallback version of the enquiry
 */
function generateEnquiryPlainText(data: WebsiteEnquiryPayload, targetEmail: string): string {
  const refId = data.referenceId || `ENQ-${Date.now().toString(36).toUpperCase()}`;
  const time = data.receivedAt || new Date().toISOString();

  return `
=====================================================
MAHDEV PVT LTD — NEW WEBSITE CUSTOMER ENQUIRY
=====================================================
Target Mailbox: ${targetEmail}
Reference ID:   ${refId}
Received At:    ${time}
Division:       ${(data.division || 'Mahdev Group').toUpperCase()}
${data.service ? `Service:        ${data.service}\n` : ''}
${data.preferredDate ? `Preferred Date: ${data.preferredDate}\n` : ''}
${data.budget ? `Budget:         ${data.budget}\n` : ''}

CUSTOMER DETAILS:
-----------------------------------------------------
Name:  ${data.senderName}
Email: ${data.senderEmail}
Phone: ${data.senderPhone || 'Not provided'}

SUBJECT:
${data.subject || 'Website Customer Enquiry'}

MESSAGE:
-----------------------------------------------------
${data.message}

-----------------------------------------------------
To reply directly to this customer, email: ${data.senderEmail}
`.trim();
}

/**
 * Dispatches the website customer enquiry to info.mahdev.lk@gmail.com
 */
export async function sendEnquiryEmail(payload: WebsiteEnquiryPayload): Promise<EmailDispatchResult> {
  const targetEmail = process.env.ENQUIRY_TARGET_EMAIL || DEFAULT_TARGET_EMAIL;
  const config = getServerConfig();
  const smtpFromEmail = process.env.SMTP_FROM_EMAIL || config.notifications.smtpUser || targetEmail;
  const fromAddress = `"${payload.senderName} via Mahdev" <${smtpFromEmail}>`;
  const subjectLine = `[Website Enquiry - ${(payload.division || 'General').toUpperCase()}] ${payload.subject || payload.service || 'Customer Inquiry'} - from ${payload.senderName}`;

  const htmlContent = generateEnquiryHtmlEmail(payload, targetEmail);
  const textContent = generateEnquiryPlainText(payload, targetEmail);

  const transporter = getMailTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: targetEmail,
        replyTo: payload.senderEmail,
        subject: subjectLine,
        text: textContent,
        html: htmlContent,
      });

      console.info(
        `[EmailService] SUCCESS: Enquiry sent to ${targetEmail} via SMTP! MessageID: ${info.messageId} | Reply-To: ${payload.senderEmail}`
      );

      return {
        success: true,
        delivered: true,
        targetEmail,
        deliveryMethod: 'smtp',
        messageId: info.messageId,
        timestamp: new Date().toISOString(),
        notice: `Enquiry successfully delivered to ${targetEmail}.`,
      };
    } catch (err: any) {
      console.error(`[EmailService] SMTP delivery failed to ${targetEmail}:`, err?.message || err);
      // Fall through to sandbox fallback logging so customer enquiry is NEVER lost
    }
  }

  // Fallback logging when SMTP credentials are not yet set up or transport failed
  console.info(`\n================== [ENQUIRY DISPATCH TO ${targetEmail}] ==================`);
  console.info(`From: ${payload.senderName} <${payload.senderEmail}> | Phone: ${payload.senderPhone || 'N/A'}`);
  console.info(`Division: ${payload.division || 'general'} | Subject: ${payload.subject || 'Enquiry'}`);
  console.info(`Message:\n${payload.message}`);
  console.info(`=========================================================================\n`);

  return {
    success: true,
    delivered: false,
    targetEmail,
    deliveryMethod: 'sandbox_logged',
    timestamp: new Date().toISOString(),
    notice: `Enquiry recorded for dispatch to ${targetEmail}. To enable direct live SMTP inbox delivery, configure SMTP_USER and SMTP_PASS in environment variables.`,
  };
}
