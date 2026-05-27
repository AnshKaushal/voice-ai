import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { InventoryItem } from "@/lib/models/inventory";
import { getAuthBusinessId } from "@/lib/api-auth";

export async function POST(request: Request) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 }
      );
    }

    const validItems = items.map((item: Record<string, unknown>) => ({
      businessId,
      name: String(item.name || "").trim(),
      price: parseFloat(String(item.price)) || 0,
      category: String(item.category || "").trim(),
      brand: String(item.brand || "").trim(),
    })).filter((item: { name: string; price: number }) => item.name && item.price > 0);

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: "No valid items found. Each item needs a name and a price greater than 0." },
        { status: 400 }
      );
    }

    await connectDB();

    const created = await InventoryItem.insertMany(validItems, { ordered: false });

    return NextResponse.json({
      created: created.length,
      total: validItems.length,
      items: created,
    }, { status: 201 });
  } catch (error) {
    console.error("Error bulk creating inventory:", error);
    return NextResponse.json(
      { error: "Failed to bulk create inventory items" },
      { status: 500 }
    );
  }
}
