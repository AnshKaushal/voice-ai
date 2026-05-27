import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VerificationToken } from "@/lib/models/verification-token";
import { sendOTPEmail } from "@/lib/email";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    await connectDB();

    const existing = await VerificationToken.findOne({
      identifier: email.toLowerCase(),
      expires: { $gt: new Date() },
    });

    if (existing) {
      const timeLeft = Math.ceil(
        (existing.expires.getTime() - Date.now()) / 1000 / 60
      );
      return NextResponse.json(
        { error: `OTP already sent. Try again in ${timeLeft} minutes.` },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await VerificationToken.create({
      identifier: email.toLowerCase(),
      token: otp,
      expires,
    });

    await sendOTPEmail(email, otp);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
