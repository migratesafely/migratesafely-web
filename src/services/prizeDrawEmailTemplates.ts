/**
 * Prize Draw Email Templates
 * 
 * Contains email templates for prize draw notifications:
 * - Winner notification (initial selection)
 * - Claim confirmation (after user claims)
 * - Redraw winner notification (replacement winner)
 */

interface WinnerNotificationParams {
  userName: string;
  prizeTitle: string;
  drawDate: string;
  claimDeadline: string;
  claimLink: string;
}

interface ClaimConfirmationParams {
  userName: string;
  prizeTitle: string;
}

interface RedrawWinnerNotificationParams {
  userName: string;
  prizeTitle: string;
  claimDeadline: string;
  claimLink: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export const prizeDrawEmailTemplates = {
  /**
   * Winner notification email (sent when user is initially selected as winner)
   */
  winnerNotificationEmail(params: WinnerNotificationParams): EmailTemplate {
    const { userName, prizeTitle, drawDate, claimDeadline, claimLink } = params;

    const subject = `🎉 Congratulations! You Won: ${prizeTitle}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prize Winner Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">🎉 Congratulations!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                We're thrilled to inform you that you have been selected as a winner in our prize draw!
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
                  <strong>Prize:</strong>
                </p>
                <p style="margin: 0 0 20px 0; font-size: 20px; font-weight: bold; color: #667eea;">
                  ${prizeTitle}
                </p>
                
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
                  <strong>Draw Date:</strong>
                </p>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">
                  ${drawDate}
                </p>
                
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
                  <strong>Claim Deadline:</strong>
                </p>
                <p style="margin: 0; font-size: 16px; color: #dc3545; font-weight: bold;">
                  ${claimDeadline}
                </p>
              </div>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                <strong>Important:</strong> You must claim your prize before the deadline above. If you don't claim within the specified timeframe, your prize will be forfeited and assigned to another winner.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${claimLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Claim Your Prize Now
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: #666666;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #667eea; word-break: break-all;">
                ${claimLink}
              </p>
              
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Congratulations again, and we'll be in touch soon regarding prize fulfillment!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #666666;">
                Best regards,<br>
                <strong>The Migrate Safely Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `
🎉 Congratulations! You Won: ${prizeTitle}

Hi ${userName},

We're thrilled to inform you that you have been selected as a winner in our prize draw!

PRIZE DETAILS:
Prize: ${prizeTitle}
Draw Date: ${drawDate}
Claim Deadline: ${claimDeadline}

IMPORTANT: You must claim your prize before the deadline above. If you don't claim within the specified timeframe, your prize will be forfeited and assigned to another winner.

CLAIM YOUR PRIZE:
${claimLink}

Congratulations again, and we'll be in touch soon regarding prize fulfillment!

Best regards,
The Migrate Safely Team
    `.trim();

    return { subject, html, text };
  },

  /**
   * Claim confirmation email (sent after user successfully claims prize)
   */
  claimConfirmationEmail(params: ClaimConfirmationParams): EmailTemplate {
    const { userName, prizeTitle } = params;

    const subject = `✓ Prize Claim Confirmed: ${prizeTitle}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prize Claim Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">✓ Claim Confirmed</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Great news! Your prize claim has been successfully submitted and confirmed.
              </p>
              
              <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #155724;">
                  <strong>Claimed Prize:</strong>
                </p>
                <p style="margin: 0; font-size: 20px; font-weight: bold; color: #28a745;">
                  ${prizeTitle}
                </p>
              </div>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                <strong>What happens next?</strong>
              </p>
              
              <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #333333;">
                <li>Our team will review your claim</li>
                <li>We'll contact you via email with further instructions</li>
                <li>You'll receive details about prize fulfillment</li>
                <li>Please keep an eye on your inbox for updates</li>
              </ul>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                If you have any questions or concerns, please don't hesitate to reach out to our support team.
              </p>
              
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Thank you for being a valued member!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #666666;">
                Best regards,<br>
                <strong>The Migrate Safely Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `
✓ Prize Claim Confirmed: ${prizeTitle}

Hi ${userName},

Great news! Your prize claim has been successfully submitted and confirmed.

CLAIMED PRIZE:
${prizeTitle}

WHAT HAPPENS NEXT?
- Our team will review your claim
- We'll contact you via email with further instructions
- You'll receive details about prize fulfillment
- Please keep an eye on your inbox for updates

If you have any questions or concerns, please don't hesitate to reach out to our support team.

Thank you for being a valued member!

Best regards,
The Migrate Safely Team
    `.trim();

    return { subject, html, text };
  },

  /**
   * Redraw winner notification email (sent when user is selected as replacement winner)
   */
  redrawWinnerNotificationEmail(params: RedrawWinnerNotificationParams): EmailTemplate {
    const { userName, prizeTitle, claimDeadline, claimLink } = params;

    const subject = `🎉 You're Now a Winner: ${prizeTitle}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redraw Winner Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #fd7e14 0%, #dc3545 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">🎉 You're a Winner!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Exciting news! You have been selected as a winner in our prize draw as a result of a redraw. A previously selected winner did not claim their prize within the deadline, and you're now the lucky recipient!
              </p>
              
              <div style="background-color: #fff3cd; border-left: 4px solid #fd7e14; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #856404;">
                  <strong>Your Prize:</strong>
                </p>
                <p style="margin: 0 0 20px 0; font-size: 20px; font-weight: bold; color: #fd7e14;">
                  ${prizeTitle}
                </p>
                
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #856404;">
                  <strong>Claim Deadline:</strong>
                </p>
                <p style="margin: 0; font-size: 16px; color: #dc3545; font-weight: bold;">
                  ${claimDeadline}
                </p>
              </div>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                <strong>⚠️ Important:</strong> You have 14 days from now to claim your prize. Please act quickly to ensure you don't miss this opportunity!
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${claimLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #fd7e14 0%, #dc3545 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Claim Your Prize Now
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: #666666;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #fd7e14; word-break: break-all;">
                ${claimLink}
              </p>
              
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Congratulations on your win! We look forward to delivering your prize.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #666666;">
                Best regards,<br>
                <strong>The Migrate Safely Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `
🎉 You're Now a Winner: ${prizeTitle}

Hi ${userName},

Exciting news! You have been selected as a winner in our prize draw as a result of a redraw. A previously selected winner did not claim their prize within the deadline, and you're now the lucky recipient!

YOUR PRIZE:
${prizeTitle}

CLAIM DEADLINE:
${claimDeadline}

⚠️ IMPORTANT: You have 14 days from now to claim your prize. Please act quickly to ensure you don't miss this opportunity!

CLAIM YOUR PRIZE:
${claimLink}

Congratulations on your win! We look forward to delivering your prize.

Best regards,
The Migrate Safely Team
    `.trim();

    return { subject, html, text };
  },
};