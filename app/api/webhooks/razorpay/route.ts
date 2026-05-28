import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Business } from "@/lib/models/business";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body.event;
    const payload = body.payload;

    if (!event || !payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await connectDB();

    if (event === "subscription.activated" || event === "subscription.charged") {
      const subscriptionId = payload.subscription?.entity?.id;
      const notes = payload.subscription?.entity?.notes || {};

      if (subscriptionId && notes.businessId) {
        const planId = payload.subscription?.entity?.plan_id;
        let subscription: "starter" | "pro" = "starter";
        if (planId === process.env.RAZORPAY_PRO_PLAN_ID) {
          subscription = "pro";
        }

        await Business.findByIdAndUpdate(notes.businessId, {
          subscription,
          subscriptionStatus: "active",
          credits: subscription === "pro" ? 300 : 100,
        });
      }
    }

    if (event === "subscription.cancelled") {
      const subscriptionId = payload.subscription?.entity?.id;
      if (subscriptionId) {
        const business = await Business.findOne({ razorpaySubscriptionId: subscriptionId });
        if (business) {
          if (business.pendingPlan) {
            // Apply pending downgrade
            business.subscription = business.pendingPlan;
            business.subscriptionStatus = "cancelled";
            business.credits = business.pendingPlan === "starter" ? 100 : 0;
            business.razorpaySubscriptionId = "";
            business.pendingPlan = null;
            business.pendingPlanEffectiveDate = null;
          } else {
            // Regular cancellation (no pending plan)
            business.subscriptionStatus = "cancelled";
            business.credits = 0;
            business.razorpaySubscriptionId = "";
          }
          await business.save();
        }
      }
    }

    if (event === "subscription.completed") {
      const subscriptionId = payload.subscription?.entity?.id;
      if (subscriptionId) {
        const business = await Business.findOne({ razorpaySubscriptionId: subscriptionId });
        if (business) {
          if (business.pendingPlan) {
            business.subscription = business.pendingPlan;
            business.subscriptionStatus = "expired";
            business.credits = business.pendingPlan === "starter" ? 100 : 0;
            business.razorpaySubscriptionId = "";
            business.pendingPlan = null;
            business.pendingPlanEffectiveDate = null;
          } else {
            business.subscriptionStatus = "expired";
            business.credits = 0;
            business.razorpaySubscriptionId = "";
          }
          await business.save();
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
