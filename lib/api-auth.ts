import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/user"

export async function getAuthBusinessId(): Promise<{
  userId: string
  businessId: string
  error?: NextResponse
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      userId: "",
      businessId: "",
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const businessId = (session.user as unknown as Record<string, string>)
    .businessId

  if (!businessId) {
    return {
      userId: session.user.id,
      businessId: "",
      error: NextResponse.json(
        { error: "Business not set up" },
        { status: 400 },
      ),
    }
  }

  return { userId: session.user.id, businessId }
}
