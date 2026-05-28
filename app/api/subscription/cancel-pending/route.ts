import { NextResponse } from "next/server"
import { getAuthBusinessId } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Business } from "@/lib/models/business"

export async function POST() {
  const { businessId, error } = await getAuthBusinessId()
  if (error) return error

  try {
    await connectDB()

    const business = await Business.findById(businessId)
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    if (!business.pendingPlan) {
      return NextResponse.json(
        { error: "No pending plan change" },
        { status: 400 },
      )
    }

    business.pendingPlan = null
    business.pendingPlanEffectiveDate = null
    await business.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Cancel pending error:", err)
    return NextResponse.json(
      { error: "Failed to cancel pending change" },
      { status: 500 },
    )
  }
}
