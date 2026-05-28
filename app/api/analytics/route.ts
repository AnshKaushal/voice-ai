import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getAuthBusinessId } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/invoice";
import { Customer } from "@/lib/models/customer";
import { Business } from "@/lib/models/business";

function getPeriodRange(period: string, now: Date) {
  const start = new Date(now);
  switch (period) {
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setMonth(start.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(start.getMonth() - 3);
      break;
    case "year":
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setMonth(start.getMonth() - 1);
  }
  return start;
}

function getGroupFormat(period: string) {
  switch (period) {
    case "week":
      return { dateFormat: "%Y-%m-%d", label: "day" };
    case "month":
      return { dateFormat: "%Y-%m-%d", label: "day" };
    case "quarter":
      return { dateFormat: "%Y-%m", label: "month" };
    case "year":
      return { dateFormat: "%Y-%m", label: "month" };
    default:
      return { dateFormat: "%Y-%m-%d", label: "day" };
  }
}

export async function GET(request: NextRequest) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    await connectDB();

    const bizId = new mongoose.Types.ObjectId(businessId);
    const now = new Date();
    const periodStart = getPeriodRange(period, now);

    let effectiveStart: Date;
    let effectiveEnd: Date;
    let effectiveFormat: string;

    if (startDateParam && endDateParam) {
      effectiveStart = new Date(startDateParam);
      effectiveEnd = new Date(endDateParam);
      effectiveEnd.setHours(23, 59, 59, 999);
      const diffDays = Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
      effectiveFormat = diffDays <= 31 ? "%Y-%m-%d" : "%Y-%m";
    } else {
      effectiveStart = periodStart;
      effectiveEnd = now;
      effectiveFormat = getGroupFormat(period).dateFormat;
    }

    const matchStage = {
      businessId: bizId,
      createdAt: { $gte: effectiveStart, $lte: effectiveEnd },
    };

    const revenueMatch = {
      ...matchStage,
      status: { $ne: "cancelled" },
    };

    const [revenueByPeriod, serviceUsage, customerGrowth, statusBreakdown, topItems, summary, business, creditInvoices] =
      await Promise.all([
        Invoice.aggregate([
          { $match: revenueMatch },
          {
            $group: {
              _id: { $dateToString: { format: effectiveFormat, date: "$createdAt" } },
              revenue: { $sum: "$total" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { date: "$_id", revenue: 1, count: 1, _id: 0 } },
        ]),

        Invoice.aggregate([
          { $match: matchStage },
          { $unwind: "$services" },
          {
            $group: {
              _id: { $toLower: { $trim: { input: "$services.name" } } },
              count: { $sum: 1 },
              revenue: { $sum: "$services.price" },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $project: { name: "$_id", count: 1, revenue: 1, _id: 0 } },
        ]),

        Customer.aggregate([
          { $match: { businessId: bizId, createdAt: { $gte: effectiveStart } } },
          {
            $group: {
              _id: { $dateToString: { format: effectiveFormat, date: "$createdAt" } },
              newCustomers: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { date: "$_id", newCustomers: 1, _id: 0 } },
        ]),

        Invoice.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              total: { $sum: "$total" },
            },
          },
          { $project: { status: "$_id", count: 1, total: 1, _id: 0 } },
        ]),

        Invoice.aggregate([
          { $match: matchStage },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.name",
              quantity: { $sum: "$items.quantity" },
              revenue: { $sum: "$items.total" },
            },
          },
          { $sort: { quantity: -1 } },
          { $limit: 10 },
          { $project: { name: "$_id", quantity: 1, revenue: 1, _id: 0 } },
        ]),

        Invoice.aggregate([
          { $match: { businessId: bizId, createdAt: { $gte: effectiveStart }, status: { $ne: "cancelled" } } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$total" },
              totalInvoices: { $sum: 1 },
              avgInvoiceValue: { $avg: "$total" },
            },
          },
        ]),

        Business.findById(businessId)
          .select("subscription subscriptionStatus")
          .lean(),

        Invoice.aggregate([
          { $match: { businessId: bizId, createdAt: { $gte: effectiveStart }, status: "credit" } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
      ]);

    // total customers
    const totalCustomers = await Customer.countDocuments({ businessId });

    // Build customer growth cumulative
    let cumulative = 0;
    const customerGrowthCumulative = customerGrowth.map((c) => {
      cumulative += c.newCustomers;
      return { ...c, totalCustomers: cumulative };
    });

    const isPaid =
      business?.subscriptionStatus === "active" &&
      (business?.subscription === "starter" || business?.subscription === "pro");

    return NextResponse.json({
      revenueByPeriod,
      serviceUsage,
      customerGrowth: customerGrowthCumulative,
      statusBreakdown,
      topItems,
      summary: {
        totalRevenue: summary[0]?.totalRevenue || 0,
        totalInvoices: summary[0]?.totalInvoices || 0,
        totalCustomers,
        averageInvoiceValue: Math.round(summary[0]?.avgInvoiceValue || 0),
        outstandingCredit: creditInvoices[0]?.total || 0,
      },
      meta: {
        period,
        periodStart: effectiveStart,
        periodEnd: effectiveEnd,
        isPaid,
      },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
