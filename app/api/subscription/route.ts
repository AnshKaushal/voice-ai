import { NextResponse } from "next/server"
import { getAuthBusinessId } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Business } from "@/lib/models/business"
import { razorpay } from "@/lib/razorpay"

export async function GET() {
  const { businessId, error } = await getAuthBusinessId()
  if (error) return error

  await connectDB()

  const business = await Business.findById(businessId)
    .select(
      "subscription subscriptionStatus credits trialStart trialEnd razorpaySubscriptionId createdAt",
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

  let planName = "Free"
  let monthlyCredits = 0
  if (business.subscription === "starter") {
    planName = "Starter"
    monthlyCredits = 100
  } else if (business.subscription === "pro") {
    planName = "Pro"
    monthlyCredits = 300
  }

  return NextResponse.json({
    subscription: business.subscription,
    subscriptionStatus: business.subscriptionStatus,
    credits: business.credits || 0,
    monthlyCredits,
    trialStart: business.trialStart,
    trialEnd: business.trialEnd,
    trialExpired,
    trialDaysLeft,
    planName,
    razorpaySubscriptionId: business.razorpaySubscriptionId || null,
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

    await connectDB()

    const business = await Business.findById(businessId)
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
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
