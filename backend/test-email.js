// Quick email test script
const nodemailer = require("nodemailer");
require("dotenv").config();

async function testEmail() {
  console.log("🧪 Testing email configuration...\n");

  const config = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  };

  console.log("📧 SMTP Configuration:");
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   User: ${config.auth.user ? "✅ Set" : "❌ Not set"}`);
  console.log(`   Pass: ${config.auth.pass ? "✅ Set" : "❌ Not set"}\n`);

  if (!config.auth.user || !config.auth.pass) {
    console.log(
      "❌ Email not configured. Emails will only be logged to console."
    );
    console.log("📝 To enable real email sending:");
    console.log("   1. Edit backend/.env file");
    console.log("   2. Set SMTP_USER and SMTP_PASS");
    console.log("   3. For Gmail: Use app password, not regular password");
    console.log("   4. For testing: Use Mailtrap.io (free)");
    return;
  }

  const transporter = nodemailer.createTransport(config);

  try {
    // Test connection
    await transporter.verify();
    console.log("✅ SMTP connection successful!");

    // Send test email
    const mailOptions = {
      from: `"Project Management Test" <${config.auth.user}>`,
      to: "test@yopmail.com", // You can change this to your yopmail address
      subject: "Test Email - Project Management System",
      html: `
        <h1>🧪 Test Email</h1>
        <p>This is a test email from your Project Management system.</p>
        <p>If you received this, email configuration is working!</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Test email sent successfully!");
    console.log(`📨 Message ID: ${result.messageId}`);
    console.log(`📧 Sent to: test@yopmail.com`);
  } catch (error) {
    console.error("❌ Email test failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("   1. Check SMTP credentials");
    console.log("   2. For Gmail: Enable 2FA and use App Password");
    console.log("   3. For Mailtrap: Use the correct host/port from dashboard");
    console.log("   4. Check firewall/antivirus blocking SMTP");
  }
}

testEmail().catch(console.error);
