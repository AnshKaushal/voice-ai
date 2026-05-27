import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/lib/models/customer";
import { getAuthBusinessId } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";

    const query: Record<string, unknown> = { businessId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(query)
      .sort({ totalSpent: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
