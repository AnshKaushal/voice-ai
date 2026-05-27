import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { InventoryItem } from "@/lib/models/inventory";
import { getAuthBusinessId } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, category, brand } = body;

    await connectDB();

    const item = await InventoryItem.findOneAndUpdate(
      { _id: id, businessId },
      { $set: { name: name.trim(), price, category, brand } },
      { new: true, runValidators: true }
    );

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    const { id } = await params;

    await connectDB();

    const item = await InventoryItem.findOneAndDelete({
      _id: id,
      businessId,
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}
