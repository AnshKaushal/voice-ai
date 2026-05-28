import { NextResponse } from "next/server"
import { getAuthBusinessId } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Business } from "@/lib/models/business"
import { razorpay } from "@/lib/razorpay"

const PLAN_CONFIG: Record<string, { name: string; credits: number }> = {
  free: { name: "Free", credits: 0 },
  starter: { name: "Starter", credits: 100 },
  pro: { name: "Pro", credits: 300 },
}

export async function GET() {
  const { businessId, error } = await getAuthBusinessId()
  if (error) return error

  await connectDB()

  const business = await Business.findById(businessId)
    .select(
      "subscription subscriptionStatus credits trialStart trialEnd razorpaySubscriptionId pendingPlan pendingPlanEffectiveDate createdAt",
    )
    .lean()

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const now = new Date()
  let trialEnd = business.trialEnd ? new Date(business.trialEnd) : null
  if (!trialEnd && business.createdAt) {
    trialEnd = new Date(
      new Date(business.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000,
    )
  }
  if (!trialEnd) {
    trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  }
  const trialExpired = now > trialEnd
  const trialDaysLeft = Math.max(
    0,
    Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  )

  const config = PLAN_CONFIG[business.subscription as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free

  let pendingPlanName: string | null = null
  if (business.pendingPlan) {
    pendingPlanName = PLAN_CONFIG[business.pendingPlan as keyof typeof PLAN_CONFIG]?.name || null
  }

  let nextBillingDate: string | null = null
  if (business.razorpaySubscriptionId && (business.subscriptionStatus === "active" || business.subscriptionStatus === "trialing")) {
    try {
      const razorpaySub = await razorpay.subscriptions.fetch(business.razorpaySubscriptionId)
      const currentEnd = razorpaySub.current_end
      if (currentEnd) {
        nextBillingDate = new Date(currentEnd * 1000).toISOString()
      }
    } catch {
      // Razorpay fetch may fail — fall back to estimated date
    }
    // Fallback: estimate next billing from trialStart or createdAt + 30 days per cycle
    if (!nextBillingDate) {
      const baseDate = business.trialStart || business.createdAt || new Date()
      const now = new Date()
      let estimated = new Date(baseDate)
      while (estimated <= now) {
        estimated.setMonth(estimated.getMonth() + 1)
      }
      nextBillingDate = estimated.toISOString()
    }
  }

  return NextResponse.json({
    subscription: business.subscription,
    subscriptionStatus: business.subscriptionStatus,
    credits: business.credits || 0,
    monthlyCredits: config.credits,
    trialStart: business.trialStart,
    trialEnd: business.trialEnd,
    trialExpired,
    trialDaysLeft,
    planName: config.name,
    razorpaySubscriptionId: business.razorpaySubscriptionId || null,
    pendingPlan: business.pendingPlan || null,
    pendingPlanName,
    pendingPlanEffectiveDate: business.pendingPlanEffectiveDate || null,
    nextBillingDate,
  })
}

export async function POST(request: Request) {
  const { businessId, error } = await getAuthBusinessId()
  if (error) return error

  try {
    const body = await request.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 },
      )
    }

    if (planId === "free") {
      return NextResponse.json(
        { error: "Cannot subscribe to free plan" },
        { status: 400 },
      )
    }

    await connectDB()

    const business = await Business.findById(businessId)
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    // Cancel old subscription immediately if upgrading
    if (business.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.cancel(business.razorpaySubscriptionId, false)
      } catch {
        // Old sub may already be cancelled — ignore
      }
    }

    const razorpayPlanId =
      planId === "starter"
        ? process.env.RAZORPAY_STARTER_PLAN_ID
        : planId === "pro"
          ? process.env.RAZORPAY_PRO_PLAN_ID
          : null

    if (!razorpayPlanId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: 12,
      customer_notify: 1,
      notes: { businessId },
    })

    business.razorpaySubscriptionId = subscription.id
    await business.save()

    return NextResponse.json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
      status: subscription.status,
    })
  } catch (err) {
    console.error("Subscription creation error:", err)
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    )
  }
}
