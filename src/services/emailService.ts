interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export const emailService = {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      console.log(`[Email Mock] Sending email to ${options.to}`);
      console.log(`[Email Mock] Subject: ${options.subject}`);
      // In a real app, you would integrate with Resend, SendGrid, AWS SES, etc.
      // For now, we just log it to simulate success.
      return true;
    } catch (error) {
      console.error("[Email Mock] Failed to send email:", error);
      return false;
    }
  }
};