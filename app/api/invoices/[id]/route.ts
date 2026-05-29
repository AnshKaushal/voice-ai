import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/invoice";
import { Customer } from "@/lib/models/customer";
import { getAuthBusinessId } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const invoice = await Invoice.findOne({ _id: id, businessId }).lean();

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, businessId },
      body,
      { new: true }
    );

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const invoice = await Invoice.findOneAndDelete({ _id: id, businessId });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.customerId) {
      await Customer.findByIdAndUpdate(invoice.customerId, {
        $inc: { totalVisits: -1, totalSpent: -invoice.total },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
