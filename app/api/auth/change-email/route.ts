import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VerificationToken } from "@/lib/models/verification-token";
import { User } from "@/lib/models/user";
import { Business } from "@/lib/models/business";
import { getAuthBusinessId } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const { userId, businessId, error } = await getAuthBusinessId();
  if (error) return error;

  const { newEmail, otp } = await request.json();

  if (!newEmail || !newEmail.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  if (!otp || otp.length !== 6) {
    return NextResponse.json({ error: "Valid OTP required" }, { status: 400 });
  }

  await connectDB();

  const email = newEmail.toLowerCase();

  const existingUser = await User.findOne({ email, _id: { $ne: userId } });
  if (existingUser) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const stored = await VerificationToken.findOne({
    identifier: email,
    token: otp,
    expires: { $gt: new Date() },
  });

  if (!stored) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  }

  await VerificationToken.deleteOne({ _id: stored._id });

  await User.findByIdAndUpdate(userId, { $set: { email } });
  await Business.findByIdAndUpdate(businessId, { $set: { email } });

  return NextResponse.json({ success: true, email });
}
