import { NextRequest, NextResponse } from "next/server"
import { getAuthBusinessId } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { Business } from "@/lib/models/business"
import { Invoice } from "@/lib/models/invoice"
import { Customer } from "@/lib/models/customer"
import { InventoryItem } from "@/lib/models/inventory"

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, val] of Object.entries(obj)) {
    const k = prefix ? `${prefix}.${key}` : key
    if (val === null || val === undefined) result[k] = ""
    else if (Array.isArray(val)) result[k] = val.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join("; ")
    else if (typeof val === "object") Object.assign(result, flattenObject(val as Record<string, unknown>, k))
    else result[k] = String(val)
  }
  return result
}

function toCsv(rows: Record<string, string>[]): string {
  if (rows.length === 0) return ""
  const keys = Object.keys(rows[0])
  const escape = (s: string) => (s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s)
  return [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k] ?? "")).join(","))].join("\n")
}

function toTxt(rows: Record<string, string>[]): string {
  if (rows.length === 0) return ""
  const keys = Object.keys(rows[0])
  const colWidths = keys.map((k) => Math.max(k.length, ...rows.map((r) => (r[k] ?? "").length)))
  const pad = (s: string, i: number) => String(s).padEnd(colWidths[i])
  const header = keys.map((k, i) => pad(k, i)).join(" | ")
  const sep = colWidths.map((w) => "-".repeat(w)).join("-+-")
  const body = rows.map((r) => keys.map((k, i) => pad(r[k] ?? "", i)).join(" | "))
  return [header, sep, ...body].join("\n")
}

export async function GET(request: NextRequest) {
  const { userId, businessId, error } = await getAuthBusinessId()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const format = searchParams.get("format") || "json"

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

  if (format === "csv") {
    const rows = [
      ...invoices.map((i) => flattenObject(i)),
      ...customers.map((c) => flattenObject(c)),
      ...inventory.map((inv) => flattenObject(inv)),
    ]
    const csv = toCsv(rows)
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="BolKeBill™-export-${businessId}.csv"`,
      },
    })
  }

  if (format === "txt") {
    const sections: string[] = []
    if (invoices.length > 0) {
      sections.push("=== INVOICES ===", toTxt(invoices.map((i) => flattenObject(i))))
    }
    if (customers.length > 0) {
      sections.push("=== CUSTOMERS ===", toTxt(customers.map((c) => flattenObject(c))))
    }
    if (inventory.length > 0) {
      sections.push("=== INVENTORY ===", toTxt(inventory.map((inv) => flattenObject(inv))))
    }
    const txt = sections.join("\n\n")
    return new NextResponse(txt, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="BolKeBill™-export-${businessId}.txt"`,
      },
    })
  }

  const json = JSON.stringify(data, null, 2)
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="BolKeBill™-export-${businessId}.json"`,
    },
  })
}
