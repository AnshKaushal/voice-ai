import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Invoice } from "@/lib/models/invoice"
import { Business } from "@/lib/models/business"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params

    const invoice = await Invoice.findById(id).lean()
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const business = await Business.findById(invoice.businessId).lean()

    return NextResponse.json({
      invoice,
      business: business || { name: "BolKeBill", email: "", phone: "", address: "", gstin: "" },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
