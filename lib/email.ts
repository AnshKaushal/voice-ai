import nodemailer from "nodemailer"

const FROM = "BolKeBill™ <no-reply@bolkebill.anshkaushal.in>"

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
  from: FROM,
})

export async function sendOTPEmail(email: string, otp: string) {
  await transporter.sendMail({
    from: FROM,
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

export async function sendWelcomeEmail(email: string, name: string) {
  await transporter.sendMail({
    from: FROM,
    replyTo: "Anshh <anshh@bolkebill.anshkaushal.in>",
    to: email,
    subject: "Welcome to BolKeBill™ — Start invoicing with your voice!",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 22px; margin-bottom: 4px;">Welcome to BolKeBill™, ${name}!</h1>
        <p style="color: #666; margin-bottom: 28px;">Your 30-day free trial is active. Here's how to get started:</p>

        <div style="margin-bottom: 24px;">
          <div style="display: flex; gap: 16px; margin-bottom: 20px;">
            <div style="width: 32px; height: 32px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">1</div>
            <div>
              <p style="font-weight: 600; margin: 0 0 2px;">Speak to create an invoice</p>
              <p style="color: #666; margin: 0; font-size: 14px;">Go to <strong>Voice Entry</strong> in the sidebar, tap the mic, and say something like <em>"Two Apollo tyres size 255 45 R17, one car wash and one wheel alignment, both costing 300 rupees"</em>. AI extracts everything automatically.</p>
            </div>
          </div>

          <div style="display: flex; gap: 16px; margin-bottom: 20px;">
            <div style="width: 32px; height: 32px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">2</div>
            <div>
              <p style="font-weight: 600; margin: 0 0 2px;">Or create invoices manually</p>
              <p style="color: #666; margin: 0; font-size: 14px;">Go to <strong>New Invoice</strong> to add items, services, customer details, and generate a professional invoice.</p>
            </div>
          </div>

          <div style="display: flex; gap: 16px; margin-bottom: 20px;">
            <div style="width: 32px; height: 32px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">3</div>
            <div>
              <p style="font-weight: 600; margin: 0 0 2px;">Manage inventory</p>
              <p style="color: #666; margin: 0; font-size: 14px;">Add your products and services in <strong>Inventory</strong> so AI can match them when you speak.</p>
            </div>
          </div>

          <div style="display: flex; gap: 16px; margin-bottom: 20px;">
            <div style="width: 32px; height: 32px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">4</div>
            <div>
              <p style="font-weight: 600; margin: 0 0 2px;">Share & export</p>
              <p style="color: #666; margin: 0; font-size: 14px;">Share invoices via WhatsApp, download as PDF, or mark them paid — all from the invoice detail page.</p>
            </div>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-weight: 600;">Your trial includes:</p>
          <p style="color: #666; margin: 0; font-size: 14px;">50 voice transcriptions, unlimited invoices, inventory & customer management.</p>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://bolkebill.anshkaushal.in"}/dashboard/voice" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600;">Go to Voice Entry</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

        <p style="color: #999; font-size: 13px; text-align: center;">Need help? Reply to this email or check your dashboard settings.</p>
      </div>
    `,
  })
}

export async function sendSubscriptionReminderEmail(
  email: string,
  name: string,
  planName: string,
  daysLeft: number,
  nextBillingDate: string,
) {
  const settingsUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bolkebill.anshkaushal.in"}/dashboard/settings`

  await transporter.sendMail({
    from: FROM,
    replyTo: "Anshh <anshh@bolkebill.anshkaushal.in>",
    to: email,
    subject: `Your ${planName} plan renews in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} — BolKeBill™`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 22px; margin-bottom: 4px;">Hi ${name},</h1>
        <p style="color: #666; margin-bottom: 24px;">
          Your <strong>${planName}</strong> subscription will renew on <strong>${nextBillingDate}</strong> (${daysLeft} day${daysLeft !== 1 ? "s" : ""} from today).
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-weight: 600;">Next billing: ${nextBillingDate}</p>
          <p style="color: #666; margin: 0; font-size: 14px;">
            You will be charged for the next cycle on this date. If you'd like to cancel or downgrade, please do so at least <strong>1 day before</strong> to avoid being charged.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${settingsUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600;">
            Manage Subscription
          </a>
        </div>

        <p style="color: #999; font-size: 13px; text-align: center;">
          You received this because you have an active ${planName} subscription on BolKeBill™.
        </p>
      </div>
    `,
  })
}
