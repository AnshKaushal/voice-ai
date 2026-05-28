import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Business } from "@/lib/models/business"
import { User } from "@/lib/models/user"
import { razorpay } from "@/lib/razorpay"
import { sendSubscriptionReminderEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectDB()

    const businesses = await Business.find({
      razorpaySubscriptionId: { $ne: "", $exists: true },
      subscriptionStatus: "active",
    })
      .select("name email razorpaySubscriptionId remindersSent subscription")
      .lean()

    const results: { business: string; sent: number[] }[] = []

    for (const business of businesses) {
      if (!business.razorpaySubscriptionId) continue

      try {
        const razorpaySub = await razorpay.subscriptions.fetch(business.razorpaySubscriptionId)
        const currentEnd = razorpaySub.current_end
        if (!currentEnd) continue

        const now = Math.floor(Date.now() / 1000)
        const secondsUntilBilling = currentEnd - now
        const daysUntilBilling = Math.ceil(secondsUntilBilling / (60 * 60 * 24))

        // Check which reminder intervals apply (1, 3, or 7 days)
        const checkpoints = [7, 3, 1]
        const remindersSent: number[] = business.remindersSent || []
        const toSend = checkpoints.filter(
          (d) => daysUntilBilling <= d && daysUntilBilling > d - 1 && !remindersSent.includes(d),
        )

        if (toSend.length === 0) continue

        // Reset reminders if this is a new cycle (daysUntilBilling > 7)
        if (daysUntilBilling > 7 && remindersSent.length > 0) {
          await Business.findByIdAndUpdate(business._id, { remindersSent: [] })
        }

        // Send email
        const user = await User.findOne({ businessId: business._id }).select("name email").lean()
        const recipientEmail = user?.email || business.email
        const recipientName = user?.name || business.name || "there"

        const planName = business.subscription === "pro" ? "Pro" : "Starter"
        const billingDate = new Date(currentEnd * 1000).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })

        for (const days of toSend) {
          await sendSubscriptionReminderEmail(recipientEmail, recipientName, planName, days, billingDate)
        }

        // Update remindersSent
        await Business.findByIdAndUpdate(business._id, {
          $addToSet: { remindersSent: { $each: toSend } },
        })

        results.push({ business: business.name || business._id.toString(), sent: toSend })
      } catch {
        // Individual subscription fetch failure shouldn't block others
        continue
      }
    }

    return NextResponse.json({ success: true, sent: results })
  } catch (error) {
    console.error("Cron error:", error)
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 })
  }
}
