import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, parseInvoiceFromTranscript } from "@/lib/groq";
import { connectDB } from "@/lib/mongodb";
import { Business } from "@/lib/models/business";
import { InventoryItem } from "@/lib/models/inventory";
import { getAuthBusinessId } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const { businessId, error } = await getAuthBusinessId();
    if (error) return error;

    await connectDB();

    const business = await Business.findById(businessId)
      .select("credits subscriptionStatus trialEnd")
      .lean();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if ((business.credits ?? 0) <= 0) {
      return NextResponse.json(
        { error: "No credits remaining. Please upgrade your plan.", creditsExhausted: true },
        { status: 403 }
      );
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());

    const transcript = await transcribeAudio(buffer);

    const inventoryItems = await InventoryItem.find({ businessId })
      .select("name price category brand")
      .lean();

    const parsedData = await parseInvoiceFromTranscript(transcript, inventoryItems);

    await Business.findByIdAndUpdate(businessId, {
      $inc: { credits: -1 },
    });

    return NextResponse.json({
      transcript,
      parsed: parsedData,
    });
  } catch (error) {
    console.error("Voice parse error:", error);
    return NextResponse.json(
      { error: "Failed to process voice input. Please try again." },
      { status: 500 }
    );
  }
}
