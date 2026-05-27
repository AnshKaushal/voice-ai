import { NextResponse } from "next/server";
import { getAuthBusinessId } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/user";
import { Business } from "@/lib/models/business";
import { Invoice } from "@/lib/models/invoice";
import { Customer } from "@/lib/models/customer";
import { InventoryItem } from "@/lib/models/inventory";
import { VerificationToken } from "@/lib/models/verification-token";

export async function DELETE() {
  const { userId, businessId, error } = await getAuthBusinessId();
  if (error) return error;

  await connectDB();

  await Promise.all([
    Invoice.deleteMany({ businessId }),
    Customer.deleteMany({ businessId }),
    InventoryItem.deleteMany({ businessId }),
    VerificationToken.deleteMany({ identifier: (await User.findById(userId))?.email }),
    Business.findByIdAndDelete(businessId),
    User.findByIdAndDelete(userId),
  ]);

  return NextResponse.json({ success: true });
}
