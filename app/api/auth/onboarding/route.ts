import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/user";
import { Business } from "@/lib/models/business";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { personal, business, password, gstin } = body;

    if (!personal?.name || !personal?.phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    if (!business?.name || !business?.type) {
      return NextResponse.json({ error: "Business name and type are required" }, { status: 400 });
    }

    await connectDB();

    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000);

    const businessDoc = await Business.create({
      name: business.name,
      type: business.type,
      phone: business.phone || personal.phone,
      email: business.email || session.user.email,
      gstin: business.gstin || "",
      businessType: business.type,
      subscription: "free",
      subscriptionStatus: "trialing",
      trialStart,
      trialEnd,
      credits: 50,
    });

    const updateData: Record<string, unknown> = {
      name: personal.name,
      phone: personal.phone,
      businessId: businessDoc._id,
      onboardingCompleted: true,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase() },
      updateData
    );

    sendWelcomeEmail(session.user.email, personal.name).catch(() => {});

    return NextResponse.json({
      success: true,
      name: personal.name,
      businessId: businessDoc._id.toString(),
      onboardingCompleted: true,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Failed to complete setup" }, { status: 500 });
  }
}
