import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/invoice";
import { Customer } from "@/lib/models/customer";
import { Business } from "@/lib/models/business";
import { InventoryItem } from "@/lib/models/inventory";
import { generateInvoiceNumber, calculateTotals } from "@/lib/invoice-utils";
import { getAuthBusinessId } from "@/lib/api-auth";

function capitalize(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const MANUAL_CREDIT_COST = 0.5;

export async function GET(request: NextRequest) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");

    const query: Record<string, unknown> = { businessId };
    if (status) query.status = status;

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { businessId, userId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    await connectDB();

    const business = await Business.findById(businessId)
      .select("credits subscription subscriptionStatus trialEnd defaultTaxRate")
      .lean();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const isPaid =
      business.subscriptionStatus === "active" &&
      (business.subscription === "starter" || business.subscription === "pro");

    if (!isPaid && (business.credits ?? 0) < MANUAL_CREDIT_COST) {
      return NextResponse.json(
        { error: "Manual invoice limit reached. Please upgrade your plan.", creditsExhausted: true },
        { status: 403 }
      );
    }

    const body = await request.json();

    const items = (body.items || []).map(
      (item: { name: string; quantity: number; price: number }) => ({
        name: capitalize(item.name),
        quantity: item.quantity || 1,
        price: item.price || 0,
        total: (item.quantity || 1) * (item.price || 0),
      })
    );

    const services = (body.services || []).map(
      (s: { name: string; price: number }) => ({
        name: capitalize(s.name),
        price: s.price || 0,
      })
    );

    const labourCharges = body.labourCharges || 0;
    const discount = body.discount || 0;
    const taxRate = "taxRate" in body ? (body.taxRate ?? 0) : (business.defaultTaxRate ?? 0);
    const totals = calculateTotals(items, services, labourCharges, discount, taxRate);

    let customerId = body.customerId || null;
    if (customerId) {
      const customer = await Customer.findOneAndUpdate(
        { _id: customerId, businessId },
        {
          $inc: { totalVisits: 1, totalSpent: totals.total },
          $set: body.customerEmail ? { email: body.customerEmail } : {},
        },
        { new: true }
      );
      if (!customer) customerId = null;
    }
    if (!customerId && body.customerName) {
      const existing = await Customer.findOne({
        businessId,
        name: body.customerName,
      });
      if (!existing) {
        const created = await Customer.create({
          businessId,
          name: body.customerName,
          phone: body.customerPhone || "",
          email: body.customerEmail || "",
          totalVisits: 1,
          totalSpent: totals.total,
        });
        customerId = created._id;
      } else {
        const update: Record<string, unknown> = {
          $inc: { totalVisits: 1, totalSpent: totals.total },
        };
        if (body.customerEmail && !existing.email) {
          update.$set = { email: body.customerEmail };
        }
        const updated = await Customer.findOneAndUpdate(
          { _id: existing._id, businessId },
          update,
          { new: true }
        );
        customerId = updated!._id;
      }
    }

    const invoiceNumber = generateInvoiceNumber();

    const invoice = await Invoice.create({
      businessId,
      customerId,
      customerName: body.customerName || "Walk-in Customer",
      customerPhone: body.customerPhone || "",
      customerEmail: body.customerEmail || "",
      invoiceNumber,
      items,
      services,
      labourCharges,
      discount,
      taxRate,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      source: body.source || "voice",
      rawTranscript: body.rawTranscript || "",
      notes: body.notes || "",
      status: "draft",
    });

    if (!isPaid) {
      await Business.findByIdAndUpdate(businessId, {
        $inc: { credits: -MANUAL_CREDIT_COST },
      });
    }

    // Auto-add missing items/services to inventory
    const allEntries = [
      ...items.map((i: { name: string; price: number }) => ({ name: i.name, price: i.price, type: "item" as const })),
      ...services.map((s: { name: string; price: number }) => ({ name: s.name, price: s.price, type: "service" as const })),
    ];
    if (allEntries.length > 0) {
      const existing = await InventoryItem.find({
        businessId,
        name: { $in: allEntries.map((e) => e.name) },
      })
        .select("name")
        .lean();
      const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));

      const toCreate = allEntries.filter(
        (e) => !existingNames.has(e.name.toLowerCase())
      );

      if (toCreate.length > 0) {
        await InventoryItem.insertMany(
          toCreate.map((e) => ({
            businessId,
            name: e.name,
            price: e.price,
            category: e.type === "service" ? "Service" : "",
            brand: "",
          }))
        );
      }
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
