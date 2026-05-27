import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
})

export async function sendOTPEmail(email: string, otp: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "BolKeBill™ <noreply@BolKeBill™.in>",
    to: email,
    subject: "Your BolKeBill™ OTP",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">BolKeBill™</h1>
        <p style="color: #666; margin-bottom: 24px;">Your verification code:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px; background: #f5f5f5; border-radius: 8px; margin-bottom: 24px;">
          ${otp}
        </div>
        <p style="color: #999; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="color: #999; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  })
}
