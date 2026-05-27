import { NextResponse } from "next/server"
import { getAuthBusinessId } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { Business } from "@/lib/models/business"
import { Invoice } from "@/lib/models/invoice"
import { Customer } from "@/lib/models/customer"
import { InventoryItem } from "@/lib/models/inventory"

export async function GET() {
  const { userId, businessId, error } = await getAuthBusinessId()
  if (error) return error

  await connectDB()

  const [user, business, invoices, customers, inventory] = await Promise.all([
    User.findById(userId).select("-password").lean(),
    Business.findById(businessId).lean(),
    Invoice.find({ businessId }).lean(),
    Customer.find({ businessId }).lean(),
    InventoryItem.find({ businessId }).lean(),
  ])

  const data = {
    exportedAt: new Date().toISOString(),
    user,
    business,
    invoices,
    customers,
    inventory,
  }

  const json = JSON.stringify(data, null, 2)

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="BolKeBill™-export-${businessId}.json"`,
    },
  })
}
