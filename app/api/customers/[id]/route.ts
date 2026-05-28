import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthBusinessId } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/lib/models/customer";
import { Invoice } from "@/lib/models/invoice";
import { Business } from "@/lib/models/business";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    const { id } = await params;
    await connectDB();

    const customer = await Customer.findOne({
      _id: id,
      businessId,
    }).lean();

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const invoices = await Invoice.find({
      businessId,
      customerId: id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const visitDates = invoices.map((inv) => inv.createdAt);
    const totalSpent = invoices
      .filter((inv) => inv.status !== "cancelled")
      .reduce((sum, inv) => sum + inv.total, 0);
    const outstandingBalance = invoices
      .filter((inv) => inv.status === "credit")
      .reduce((sum, inv) => sum + inv.total, 0);

    const itemCounts: Record<string, { quantity: number; revenue: number }> =
      {};
    for (const inv of invoices) {
      for (const item of inv.items) {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { quantity: 0, revenue: 0 };
        }
        itemCounts[item.name].quantity += item.quantity;
        itemCounts[item.name].revenue += item.total;
      }
    }
    const mostPurchasedItems = Object.entries(itemCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    let retentionRate = 0;
    if (visitDates.length >= 2) {
      const sorted = [...visitDates].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );
      const firstDate = new Date(sorted[0]).getTime();
      const lastDate = new Date(sorted[sorted.length - 1]).getTime();
      const dateRangeMs = lastDate - firstDate;
      const visitCount = visitDates.length;
      if (dateRangeMs > 0) {
        const avgGapDays = dateRangeMs / (visitCount - 1) / (1000 * 60 * 60 * 24);
        retentionRate = Math.max(
          0,
          Math.min(100, Math.round((1 - avgGapDays / 90) * 100))
        );
      }
    }

    const business = await Business.findById(businessId)
      .select("subscription subscriptionStatus")
      .lean();

    const isPaid =
      business?.subscriptionStatus === "active" &&
      (business?.subscription === "starter" ||
        business?.subscription === "pro");

    return NextResponse.json({
      customer,
      invoices,
      analytics: {
        totalSpent,
        visitDates: visitDates.map((d) => d.toISOString?.() || d),
        mostPurchasedItems,
        retentionRate,
        totalVisits: invoices.length,
        outstandingBalance,
      },
      meta: { isPaid },
    });
  } catch (err) {
    console.error("Customer detail error:", err);
    return NextResponse.json(
      { error: "Failed to fetch customer details" },
      { status: 500 }
    );
  }
}
