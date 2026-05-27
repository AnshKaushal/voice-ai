import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Invoice } from "@/lib/models/invoice"
import { Business } from "@/lib/models/business"
import { jsPDF } from "jspdf"

function formatCurrency(n: number) {
  return `\u20B9${n.toLocaleString("en-IN")}`
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

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

    const biz = business || { name: "BolKeBill", email: "", phone: "", address: "", gstin: "" }

    const GRAY_200 = "#e5e7eb"
    const GRAY_600 = "#6b7280"
    const GRAY_900 = "#111827"
    const WHITE = "#ffffff"

    const doc = new jsPDF({ unit: "mm", format: "a4" })
    const pw = doc.internal.pageSize.getWidth()
    const ph = doc.internal.pageSize.getHeight()
    const ml = 18
    const mr = 18
    const cw = pw - ml - mr
    let y = 18

    doc.setFontSize(48)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(230)
    doc.text("BolKeBill", pw / 2, ph / 2, { align: "center", angle: -30 })

    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pw, 4, "F")
    doc.setFillColor(37, 99, 235)
    doc.rect(0, ph - 4, pw, 4, "F")

    doc.setTextColor(0)

    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text(biz.name || "HisaabAI", ml, y)
    y += 6
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100)
    if (biz.address) {
      doc.text(biz.address, ml, y)
      y += 4
    }
    doc.text(`${biz.email}${biz.phone ? ` | ${biz.phone}` : ""}`, ml, y)
    y += 4
    if (biz.gstin) {
      doc.text(`GSTIN: ${biz.gstin}`, ml, y)
      y += 4
    }

    y += 2
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.3)
    doc.line(ml, y, pw - mr, y)
    y += 6

    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(37, 99, 235)
    doc.text("INVOICE", ml, y)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(GRAY_900)
    doc.text(`#${invoice.invoiceNumber}`, pw / 2, y)
    const createdDate = invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : String(invoice.createdAt)
    doc.text(formatDate(createdDate), pw - mr, y, { align: "right" })
    y += 12

    doc.setFillColor(37, 99, 235)
    doc.setTextColor(WHITE)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("BILL TO", ml + 2, y + 4)
    doc.rect(ml, y, cw, 7, "F")
    y += 11
    doc.setTextColor(GRAY_900)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(invoice.customerName, ml, y)
    y += 6
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(GRAY_600)
    if (invoice.customerPhone) {
      doc.text(invoice.customerPhone, ml, y)
      y += 4
    }
    if (invoice.customerEmail) {
      doc.text(invoice.customerEmail, ml, y)
      y += 4
    }
    doc.setTextColor(GRAY_900)
    y += 4

    if (invoice.items?.length > 0) {
      doc.setFillColor(37, 99, 235)
      doc.setTextColor(WHITE)
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      const colDefs = [
        { x: ml + 3, w: cw * 0.45, align: "left" as const, label: "ITEM" },
        { x: ml + 3 + cw * 0.45, w: cw * 0.12, align: "center" as const, label: "QTY" },
        { x: ml + 3 + cw * 0.57, w: cw * 0.18, align: "right" as const, label: "RATE" },
        { x: ml + cw - 3, w: cw * 0.25, align: "right" as const, label: "AMOUNT" },
      ]
      doc.rect(ml, y, cw, 7, "F")
      colDefs.forEach((c) => doc.text(c.label, c.x, y + 4.5, { align: c.align }))
      y += 7
      doc.setTextColor(GRAY_900)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      let rowNum = 0
      for (const item of invoice.items) {
        if (y > ph - 30) {
          doc.addPage()
          y = 18
          doc.setFillColor(37, 99, 235)
          doc.rect(0, 0, pw, 4, "F")
        }
        rowNum++
        if (rowNum % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(ml, y - 3, cw, 7, "F")
        }
        const amt = item.total || item.quantity * item.price
        doc.text(item.name, ml + 3, y + 1)
        doc.text(String(item.quantity), ml + 3 + cw * 0.45 + cw * 0.06, y + 1, { align: "center" })
        doc.text(formatCurrency(item.price), ml + 3 + cw * 0.57 + cw * 0.09, y + 1, { align: "right" })
        doc.setFont("helvetica", "bold")
        doc.text(formatCurrency(amt), ml + cw - 3, y + 1, { align: "right" })
        doc.setFont("helvetica", "normal")
        y += 7
      }
      y += 3
    }

    if (invoice.services?.length > 0) {
      doc.setFillColor(37, 99, 235)
      doc.setTextColor(WHITE)
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.text("SERVICE", ml + 3, y + 4.5)
      doc.text("AMOUNT", ml + cw - 3, y + 4.5, { align: "right" })
      doc.rect(ml, y, cw, 7, "F")
      y += 7
      doc.setTextColor(GRAY_900)
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      for (const s of invoice.services) {
        if (y > ph - 30) { doc.addPage(); y = 18 }
        doc.text(s.name, ml + 3, y + 1)
        doc.setFont("helvetica", "bold")
        doc.text(formatCurrency(s.price), ml + cw - 3, y + 1, { align: "right" })
        doc.setFont("helvetica", "normal")
        y += 7
      }
      y += 3
    }

    y += 2
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.3)
    doc.line(ml, y, pw - mr, y)
    y += 5
    const tx = ml + cw - 65
    const tvx = ml + cw - 3
    const addLine = (label: string, val: string, bold = false, large = false, color?: string) => {
      doc.setFont("helvetica", bold ? "bold" : "normal")
      doc.setFontSize(large ? 13 : 10)
      if (color) doc.setTextColor(color)
      else doc.setTextColor(GRAY_900)
      doc.text(label, tx, y)
      doc.text(val, tvx, y, { align: "right" })
      y += large ? 8 : 6
    }
    addLine("Subtotal", formatCurrency(invoice.subtotal))
    if (invoice.labourCharges) addLine("Labour Charges", formatCurrency(invoice.labourCharges))
    if (invoice.discount) addLine("Discount", `-${formatCurrency(invoice.discount)}`, false, false, "#dc2626")
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.5)
    doc.line(tx - 2, y, ml + cw, y)
    y += 3
    addLine("Total", formatCurrency(invoice.total), true, true)

    if (invoice.notes) {
      y += 4
      doc.setDrawColor(GRAY_200)
      doc.line(ml, y, pw - mr, y)
      y += 5
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(GRAY_600)
      doc.text("NOTES", ml, y)
      y += 4
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.text(invoice.notes, ml, y)
      y += 5
    }

    const footerY = ph - 10
    doc.setDrawColor(GRAY_200)
    doc.line(ml, footerY - 3, pw - mr, footerY - 3)
    doc.setFontSize(7)
    doc.setTextColor(180)
    doc.text(`Generated by ${biz.name}`, pw / 2, footerY + 1, { align: "center" })
    doc.text(`Invoice #${invoice.invoiceNumber}`, pw / 2, footerY + 5, { align: "center" })

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Invoice_${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (err) {
    console.error("PDF generation error:", err)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
