import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { InventoryItem } from "@/lib/models/inventory";
import { getAuthBusinessId } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const query: Record<string, unknown> = { businessId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    const items = await InventoryItem.find(query)
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    const body = await request.json();
    const { name, price, category, brand } = body;

    if (!name || typeof price !== "number") {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const item = await InventoryItem.create({
      businessId,
      name: name.trim(),
      price,
      category: category || "",
      brand: brand || "",
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}
