import { NextResponse } from "next/server"
import { getAuthBusinessId } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Business } from "@/lib/models/business"
import { razorpay } from "@/lib/razorpay"

export async function POST(request: Request) {
  const { businessId, error } = await getAuthBusinessId()
  if (error) return error

  try {
    const body = await request.json()
    const { planId } = body

    if (!planId || !["starter", "free"].includes(planId)) {
      return NextResponse.json(
        { error: "Invalid target plan" },
        { status: 400 },
      )
    }

    await connectDB()

    const business = await Business.findById(businessId)
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    if (!business.razorpaySubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 },
      )
    }

    // Fetch the subscription to get current cycle end
    const razorpaySub = await razorpay.subscriptions.fetch(business.razorpaySubscriptionId)

    // Only cancel at period end if not already cancelled
    if (razorpaySub.status !== "cancelled" && razorpaySub.status !== "completed") {
      await razorpay.subscriptions.cancel(business.razorpaySubscriptionId, true)
    }

    // Store the pending plan change
    const currentEnd = razorpaySub.current_end;
    const effectiveDate = currentEnd ? new Date(currentEnd * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    business.pendingPlan = planId
    business.pendingPlanEffectiveDate = effectiveDate
    await business.save()

    const planName = planId === "starter" ? "Starter" : "Free"

    return NextResponse.json({
      success: true,
      pendingPlan: planId,
      pendingPlanName: planName,
      effectiveDate,
      message: `Your plan will switch to ${planName} on ${effectiveDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    })
  } catch (err) {
    console.error("Downgrade error:", err)
    return NextResponse.json(
      { error: "Failed to process downgrade" },
      { status: 500 },
    )
  }
}
