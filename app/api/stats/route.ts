import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/invoice";
import { Customer } from "@/lib/models/customer";
import { Business } from "@/lib/models/business";
import { getAuthBusinessId } from "@/lib/api-auth";

export async function GET() {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    await connectDB();

    const bizId = new mongoose.Types.ObjectId(businessId);

    const [totalInvoices, totalRevenue, totalCustomers, voiceInvoices, recentInvoices, business] =
      await Promise.all([
        Invoice.countDocuments({ businessId }),
        Invoice.aggregate([
          { $match: { businessId: bizId } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Customer.countDocuments({ businessId }),
        Invoice.countDocuments({ businessId, source: "voice" }),
        Invoice.find({ businessId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("customerName total status invoiceNumber createdAt")
          .lean(),
        Business.findById(businessId)
          .select("credits subscription subscriptionStatus trialEnd createdAt")
          .lean(),
      ]);

    const now = new Date();
    let trialEnd = business?.trialEnd ? new Date(business.trialEnd) : null;
    if (!trialEnd && business?.createdAt) {
      trialEnd = new Date(new Date(business.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    if (!trialEnd) {
      trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    const trialExpired = now > trialEnd;
    const trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      stats: {
        totalInvoices,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCustomers,
        voiceEntries: voiceInvoices,
        creditsRemaining: business?.credits || 0,
        subscription: business?.subscription || "free",
        subscriptionStatus: business?.subscriptionStatus || "trialing",
        trialExpired,
        trialDaysLeft,
      },
      recentInvoices,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
