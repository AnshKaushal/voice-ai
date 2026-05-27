"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle2, MessageSquare, Download } from "lucide-react"
import { jsPDF } from "jspdf"

interface ActionInvoice {
  _id: string
  invoiceNumber: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  customerAddress?: string
  items: Array<{
    name: string
    quantity: number
    price: number
    total?: number
  }>
  services: Array<{ name: string; price: number }>
  subtotal: number
  tax?: number
  discount?: number
  labourCharges?: number
  total: number
  status: string
  notes?: string
  createdAt?: string
}

interface InvoiceActionsProps {
  invoice: ActionInvoice
  onStatusChange?: () => void
}

interface BusinessData {
  name: string
  email: string
  phone: string
  address: string
  gstin?: string
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`
}

const ACCENT = "#2563eb"
const ACCENT_LIGHT = "#dbeafe"
const GRAY_100 = "#f3f4f6"
const GRAY_200 = "#e5e7eb"
const GRAY_600 = "#6b7280"
const GRAY_900 = "#111827"
const WHITE = "#ffffff"

function isMobile() {
  return typeof window !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function InvoiceActions({ invoice, onStatusChange }: InvoiceActionsProps) {
  const [business, setBusiness] = useState<BusinessData | null>(null)

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setBusiness(data)
      })
      .catch(() => {})
  }, [])

  async function markAsPaid() {
    try {
      const res = await fetch(`/api/invoices/${invoice._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Invoice marked as paid")
      onStatusChange?.()
    } catch {
      toast.error("Failed to update invoice")
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      paid: "#059669",
      sent: ACCENT,
      draft: "#d97706",
      cancelled: "#dc2626",
    }
    return colors[status] || GRAY_600
  }

  function generatePDFBlob(): Blob {
    const doc = new jsPDF({ unit: "mm", format: "a4" })
    const pw = doc.internal.pageSize.getWidth()
    const ph = doc.internal.pageSize.getHeight()
    const ml = 18
    const mr = 18
    const cw = pw - ml - mr
    let y = 18
    const biz = business || { name: "HisaabAI", email: "", phone: "", address: "", gstin: "" }

    // Watermark
    doc.setFontSize(48)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(230)
    doc.text("BolKeBill", pw / 2, ph / 2, { align: "center", angle: -30 })

    // Top accent bar
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pw, 4, "F")
    doc.setFillColor(37, 99, 235)
    doc.rect(0, ph - 4, pw, 4, "F")

    doc.setTextColor(0)

    // Business header
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

    // Separator
    y += 2
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.3)
    doc.line(ml, y, pw - mr, y)
    y += 6

    // Invoice title + meta
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(37, 99, 235)
    doc.text("INVOICE", ml, y)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(GRAY_900)
    doc.text(`#${invoice.invoiceNumber}`, pw / 2, y)
    doc.text(formatDate(invoice.createdAt), pw - mr, y, { align: "right" })
    y += 5

    doc.setFontSize(8)
    doc.setTextColor(getStatusColor(invoice.status))
    doc.setFont("helvetica", "bold")
    doc.text(invoice.status.toUpperCase(), ml, y)
    doc.setTextColor(GRAY_900)
    y += 8

    // Bill To
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

    // --- Items Table ---
    if (invoice.items.length > 0) {
      // Header
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

      // Rows
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

    // --- Services ---
    if (invoice.services.length > 0) {
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
        if (y > ph - 30) {
          doc.addPage()
          y = 18
        }
        doc.text(s.name, ml + 3, y + 1)
        doc.setFont("helvetica", "bold")
        doc.text(formatCurrency(s.price), ml + cw - 3, y + 1, { align: "right" })
        doc.setFont("helvetica", "normal")
        y += 7
      }
      y += 3
    }

    // Spacer line
    y += 2
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.3)
    doc.line(ml, y, pw - mr, y)
    y += 5

    // Totals
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

    // Notes
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

    // Footer
    const footerY = ph - 10
    doc.setDrawColor(GRAY_200)
    doc.line(ml, footerY - 3, pw - mr, footerY - 3)
    doc.setFontSize(7)
    doc.setTextColor(180)
    doc.text(`Generated by ${biz.name || "BolKeBill"}`, pw / 2, footerY + 1, { align: "center" })
    doc.text(`Invoice #${invoice.invoiceNumber}`, pw / 2, footerY + 5, { align: "center" })

    return doc.output("blob")
  }

  async function handleWhatsApp() {
    const bizName = business?.name || "BolKeBill"
    const message = `Thank you for your purchase from ${bizName}!

Invoice: ${invoice.invoiceNumber}
Total: ${formatCurrency(invoice.total)}

Your invoice PDF is attached. Please keep it for your records.

— ${bizName} (Powered by BolKeBill)`

    try {
      const pdfBlob = generatePDFBlob()
      const pdfFile = new File([pdfBlob], `Invoice_${invoice.invoiceNumber}.pdf`, { type: "application/pdf" })
      await navigator.share({ files: [pdfFile], text: message, title: `Invoice ${invoice.invoiceNumber}` })
      return
    } catch {}

    if (!isMobile()) {
      const pdfBlob = generatePDFBlob()
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = pdfUrl
      a.download = `Invoice_${invoice.invoiceNumber}.pdf`
      a.click()
      URL.revokeObjectURL(pdfUrl)
      toast.info("Invoice PDF downloaded. WhatsApp opened — please attach the PDF to the chat.")
    }

    const url = `https://wa.me/${invoice.customerPhone || "91"}?text=${encodeURIComponent(message)}`
    if (isMobile()) {
      window.location.href = url
    } else {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  function handleDownload() {
    const biz = business || { name: "HisaabAI", email: "", phone: "", address: "", gstin: "" }

    const itemsRows = invoice.items
      .map(
        (i, idx) =>
          `<tr${idx % 2 === 0 ? ' class="alt"' : ""}><td class="item-name">${i.name}</td><td class="item-qty">${i.quantity}</td><td class="item-rate">${formatCurrency(i.price)}</td><td class="item-amt">${formatCurrency(i.total || i.quantity * i.price)}</td></tr>`,
      )
      .join("")

    const servicesRows = invoice.services
      .map(
        (s, idx) =>
          `<tr${idx % 2 === 0 ? ' class="alt"' : ""}><td class="item-name">${s.name}</td><td class="item-amt">${formatCurrency(s.price)}</td></tr>`,
      )
      .join("")

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const statusColor = getStatusColor(invoice.status)

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            :root {
              --primary: oklch(0.704 0.04 256.788);
              --background: oklch(0.9818 0.0054 95.0986);
              --foreground: oklch(0.145 0 0);
              --muted: oklch(0.923 0.003 48.717);
              --muted-foreground: oklch(0.553 0.013 58.071);
              --border: oklch(0.869 0.005 56.366);
              --destructive: oklch(0.6368 0.2078 25.3313);
            }
            @page { margin: 12mm; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: var(--foreground);
              margin: 0;
              padding: 0;
              line-height: 1.5;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page {
              max-width: 800px;
              margin: 0 auto;
              position: relative;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 72px;
              font-weight: 900;
              color: var(--muted);
              opacity: 0.3;
              z-index: -1;
              pointer-events: none;
              letter-spacing: 8px;
              user-select: none;
            }
            .top-bar, .bottom-bar {
              height: 4px;
              background: var(--primary);
              margin: 0 -12mm;
            }
            .bottom-bar { margin-top: 16px; }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 20px 0 16px;
              border-bottom: 2px solid var(--primary);
              margin-bottom: 20px;
            }
            .biz-name {
              font-size: 22px;
              font-weight: 800;
              color: var(--foreground);
              margin: 0 0 2px;
            }
            .biz-detail {
              font-size: 11px;
              color: var(--muted-foreground);
              margin: 1px 0;
            }
            .invoice-title {
              text-align: right;
            }
            .invoice-title h2 {
              font-size: 20px;
              font-weight: 800;
              color: var(--primary);
              margin: 0 0 2px;
            }
            .invoice-title p {
              font-size: 11px;
              color: var(--muted-foreground);
              margin: 1px 0;
            }
            .status-badge {
              display: inline-block;
              padding: 2px 10px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #fff;
              background: ${statusColor};
              margin-top: 4px;
            }
            .bill-to-header {
              background: var(--primary);
              color: #fff;
              font-size: 10px;
              font-weight: 700;
              padding: 5px 12px;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .customer-name {
              font-size: 15px;
              font-weight: 700;
              margin: 0 0 2px;
            }
            .customer-detail {
              font-size: 12px;
              color: var(--muted-foreground);
              margin: 1px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              font-size: 12px;
            }
            thead th {
              background: var(--primary);
              color: #fff;
              padding: 7px 10px;
              text-align: left;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            thead th:last-child { text-align: right; }
            thead th:nth-child(2) { text-align: center; }
            thead th:nth-child(3) { text-align: right; }
            tbody td {
              padding: 7px 10px;
              border-bottom: 1px solid var(--border);
            }
            tbody td:last-child { text-align: right; font-weight: 600; }
            tbody td:nth-child(2) { text-align: center; }
            tbody td:nth-child(3) { text-align: right; }
            tbody tr.alt td { background: var(--background); }
            .totals {
              margin-left: auto;
              width: 280px;
              border-top: 2px solid var(--primary);
              padding-top: 6px;
            }
            .totals table { margin: 0; }
            .totals td { padding: 4px 0; border: none; font-size: 12px; }
            .totals td:last-child { text-align: right; }
            .totals .grand-total td {
              font-weight: 800;
              font-size: 15px;
              padding-top: 8px;
              border-top: 2px solid var(--primary);
            }
            .notes-section {
              margin-top: 20px;
              padding-top: 12px;
              border-top: 1px solid var(--muted);
            }
            .notes-section h4 {
              font-size: 10px;
              font-weight: 700;
              color: var(--muted-foreground);
              margin: 0 0 4px;
              letter-spacing: 0.5px;
            }
            .notes-section p {
              font-size: 12px;
              color: var(--muted-foreground);
              margin: 0;
            }
            .footer {
              margin-top: 24px;
              padding-top: 8px;
              border-top: 1px solid var(--muted);
              text-align: center;
              font-size: 10px;
              color: var(--muted-foreground);
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="watermark">BolKeBill</div>
            <div class="top-bar"></div>

            <div class="header">
              <div>
                <p class="biz-name">${biz.name || "HisaabAI"}</p>
                ${biz.address ? `<p class="biz-detail">${biz.address}</p>` : ""}
                <p class="biz-detail">${biz.email}${biz.phone ? ` | ${biz.phone}` : ""}</p>
                ${biz.gstin ? `<p class="biz-detail">GSTIN: ${biz.gstin}</p>` : ""}
              </div>
              <div class="invoice-title">
                <h2>INVOICE</h2>
                <p>#${invoice.invoiceNumber}</p>
                <p>${formatDate(invoice.createdAt)}</p>
                <div class="status-badge">${invoice.status}</div>
              </div>
            </div>

            <div class="bill-to-header">BILL TO</div>
            <p class="customer-name">${invoice.customerName}</p>
            ${invoice.customerPhone ? `<p class="customer-detail">${invoice.customerPhone}</p>` : ""}
            ${invoice.customerEmail ? `<p class="customer-detail">${invoice.customerEmail}</p>` : ""}

            ${invoice.items.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th style="width:46%">Item</th>
                  <th style="width:10%">Qty</th>
                  <th style="width:18%">Rate</th>
                  <th style="width:26%">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
            ` : ""}

            ${invoice.services.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th style="width:70%">Service</th>
                  <th style="width:30%">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${servicesRows}
              </tbody>
            </table>
            ` : ""}

            <div class="totals">
              <table>
                <tr><td>Subtotal</td><td>${formatCurrency(invoice.subtotal)}</td></tr>
                ${invoice.labourCharges ? `<tr><td>Labour Charges</td><td>${formatCurrency(invoice.labourCharges)}</td></tr>` : ""}
                ${invoice.discount ? `<tr><td style="color:#dc2626">Discount</td><td style="color:#dc2626">-${formatCurrency(invoice.discount)}</td></tr>` : ""}
                <tr class="grand-total"><td>Total</td><td>${formatCurrency(invoice.total)}</td></tr>
              </table>
            </div>

            ${invoice.notes ? `
            <div class="notes-section">
              <h4>Notes</h4>
              <p>${invoice.notes}</p>
            </div>
            ` : ""}

            <div class="footer">
              Generated by ${biz.name || "BolKeBill"} — Invoice #${invoice.invoiceNumber}
            </div>

            <div class="bottom-bar"></div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (invoice.status === "paid") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleWhatsApp}>
          <img src="/whatsapp.svg" height={300} width={300} className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          PDF
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={markAsPaid}>
        <CheckCircle2 className="h-4 w-4" />
        Mark as Paid
      </Button>
      <Button size="sm" variant="outline" onClick={handleWhatsApp}>
        <img src="/whatsapp.svg" height={300} width={300} className="h-4 w-4" />
        WhatsApp
      </Button>
      <Button size="sm" variant="outline" onClick={handleDownload}>
        <Download className="h-4 w-4" />
        PDF
      </Button>
    </div>
  )
}
