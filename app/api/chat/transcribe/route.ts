import { NextRequest, NextResponse } from "next/server"
import { transcribeAudio } from "@/lib/groq"
import { getAuthBusinessId } from "@/lib/api-auth"

export async function POST(request: NextRequest) {
  try {
    const { error } = await getAuthBusinessId()
    if (error) return error

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File | null

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer())
    const transcript = await transcribeAudio(buffer)

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error("Chat transcribe error:", error)
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 },
    )
  }
}
