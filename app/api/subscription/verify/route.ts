import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Business } from "@/lib/models/business"
import { getAuthBusinessId } from "@/lib/api-auth"
import { razorpay } from "@/lib/razorpay"

export async function POST(request: NextRequest) {
  const { businessId, error } = await getAuthBusinessId()
  if (error) return error

  try {
    const { subscriptionId } = await request.json()
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 },
      )
    }

    const sub = await razorpay.subscriptions.fetch(subscriptionId)

    const status = sub.status
    const planId = (sub as unknown as Record<string, string>).plan_id

    let subscription: "starter" | "pro" = "starter"
    if (planId === process.env.RAZORPAY_PRO_PLAN_ID) {
      subscription = "pro"
    }

    await connectDB()

    await Business.findByIdAndUpdate(businessId, {
      subscription,
      subscriptionStatus: "active",
      razorpaySubscriptionId: subscriptionId,
      credits: subscription === "pro" ? 300 : 100,
    })

    return NextResponse.json({
      active: true,
      subscription,
      status,
      planName: subscription === "pro" ? "Pro" : "Starter",
      credits: subscription === "pro" ? 300 : 100,
    })
  } catch (err) {
    console.error("Subscription verification error:", err)
    return NextResponse.json(
      { error: "Failed to verify subscription" },
      { status: 500 },
    )
  }
}
