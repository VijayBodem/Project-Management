import nodemailer from "nodemailer";
import { AppError } from "../middlewares/errorHandler";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface OTPEmailData {
  to: string;
  otp: string;
  purpose: "login" | "logout" | "logout_all" | "session_logout";
  userName?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    };

    // Validate configuration
    if (!config.auth.user || !config.auth.pass) {
      console.warn(
        "⚠️ Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables."
      );
      this.transporter = nodemailer.createTransport({
        jsonTransport: true, // For development/testing - logs emails instead of sending
      });
    } else {
      this.transporter = nodemailer.createTransport(config);
    }
  }

  private getOTPEmailTemplate(data: OTPEmailData): {
    subject: string;
    html: string;
    text: string;
  } {
    const { otp, purpose, userName } = data;
    const greeting = userName ? `Hi ${userName},` : "Hi there,";

    let actionText = "";
    let subject = "";

    switch (purpose) {
      case "login":
        subject = "Verify Your Login - Security Code";
        actionText = "logging into your account from a new device";
        break;
      case "logout":
        subject = "Verify Logout - Security Code";
        actionText = "logging out from one of your devices";
        break;
      case "logout_all":
        subject = "Verify Logout All Devices - Security Code";
        actionText = "logging out from all your devices";
        break;
      case "session_logout":
        subject = "Verify Session Logout - Security Code";
        actionText = "terminating a specific session";
        break;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #667eea; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Security Verification</h1>
          <p>Project Management Platform</p>
        </div>

        <div class="content">
          <p>${greeting}</p>

          <p>For security reasons, we need to verify your identity before proceeding with ${actionText}.</p>

          <div class="otp-code">${otp}</div>

          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This code expires in 10 minutes</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this action, please contact support immediately</li>
            </ul>
          </div>

          <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>

          <p>Best regards,<br>The Project Management Team</p>
        </div>

        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; 2024 Project Management Platform. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${subject}

      ${greeting}

      For security reasons, we need to verify your identity before proceeding with ${actionText}.

      Your verification code is: ${otp}

      ⚠️ Important:
      - This code expires in 10 minutes
      - Do not share this code with anyone
      - If you didn't request this action, please contact support immediately

      If you have any questions or concerns, please contact our support team.

      Best regards,
      The Project Management Team

      ---
      This is an automated message. Please do not reply to this email.
    `;

    return { subject, html, text };
  }

  async sendOTPEmail(data: OTPEmailData): Promise<boolean> {
    try {
      const template = this.getOTPEmailTemplate(data);

      const mailOptions = {
        from: `"Project Management" <${
          process.env.SMTP_USER || "noreply@projectmanagement.com"
        }>`,
        to: data.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.log("📧 OTP email sent successfully:", {
        to: data.to,
        purpose: data.purpose,
        messageId: result.messageId,
      });

      console.log("result****", result);

      return true;
    } catch (error) {
      console.error("❌ Failed to send OTP email:", error);
      throw new AppError(
        "Failed to send verification email. Please try again.",
        500
      );
    }
  }

  async sendTestEmail(to: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Project Management" <${
          process.env.SMTP_USER || "test@projectmanagement.com"
        }>`,
        to,
        subject: "Test Email - Project Management",
        html: "<h1>Test Email</h1><p>This is a test email from Project Management platform.</p>",
        text: "Test Email - This is a test email from Project Management platform.",
      };

      await this.transporter.sendMail(mailOptions);
      console.log("📧 Test email sent successfully to:", to);
      return true;
    } catch (error) {
      console.error("❌ Failed to send test email:", error);
      return false;
    }
  }

  // Verify transporter configuration
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("✅ Email service connection verified");
      return true;
    } catch (error) {
      console.error("❌ Email service connection failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
