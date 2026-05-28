import { NextResponse } from "next/server";
import { getAuthBusinessId } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { Business } from "@/lib/models/business";

export async function GET() {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  await connectDB();

  const business = await Business.findById(businessId).select("-__v");
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json(business);
}

export async function PUT(request: Request) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  const body = await request.json();
  const { name, phone, email, address, gstin, defaultTaxRate } = body;

  await connectDB();

  const update: Record<string, unknown> = { name, phone, email, address, gstin };
  if (defaultTaxRate !== undefined) update.defaultTaxRate = defaultTaxRate;

  const business = await Business.findByIdAndUpdate(
    businessId,
    { $set: update },
    { new: true, runValidators: true }
  ).select("-__v");

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json(business);
}
