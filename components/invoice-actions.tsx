"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle2, Download } from "lucide-react"

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
  return (
    typeof window !== "undefined" &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  )
}

export function InvoiceActions({
  invoice,
  onStatusChange,
}: InvoiceActionsProps) {
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

  async function handleWhatsApp() {
    const bizName = business?.name || "BolKeBill"
    const invoiceUrl = `${window.location.origin}/invoice/${invoice._id}`
    const message = `Thank you for your purchase from ${bizName}!

Invoice: ${invoice.invoiceNumber}
Total: ${formatCurrency(invoice.total)}

View invoice: ${invoiceUrl}

— ${bizName} (Powered by BolKeBill)`

    const url = `https://wa.me/${invoice.customerPhone || "91"}?text=${encodeURIComponent(message)}`
    if (isMobile()) {
      window.location.href = url
    } else {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  function handleDownload() {
    const biz = business || {
      name: "HisaabAI",
      email: "",
      phone: "",
      address: "",
      gstin: "",
    }

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

            ${
              invoice.items.length > 0
                ? `
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
            `
                : ""
            }

            ${
              invoice.services.length > 0
                ? `
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
            `
                : ""
            }

            <div class="totals">
              <table>
                <tr><td>Subtotal</td><td>${formatCurrency(invoice.subtotal)}</td></tr>
                ${invoice.labourCharges ? `<tr><td>Labour Charges</td><td>${formatCurrency(invoice.labourCharges)}</td></tr>` : ""}
                ${invoice.discount ? `<tr><td style="color:#dc2626">Discount</td><td style="color:#dc2626">-${formatCurrency(invoice.discount)}</td></tr>` : ""}
                <tr class="grand-total"><td>Total</td><td>${formatCurrency(invoice.total)}</td></tr>
              </table>
            </div>

            ${
              invoice.notes
                ? `
            <div class="notes-section">
              <h4>Notes</h4>
              <p>${invoice.notes}</p>
            </div>
            `
                : ""
            }

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
          <img
            src="/whatsapp.svg"
            height={300}
            width={300}
            className="h-4 w-4"
          />
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
