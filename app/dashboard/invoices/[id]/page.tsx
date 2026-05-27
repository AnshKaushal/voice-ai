"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  ArrowLeft,
  Download,
  MessageSquare,
  Loader2,
  FileText,
  CheckCircle2,
  Send,
  XCircle,
  Mail,
} from "lucide-react"
import { jsPDF } from "jspdf"

interface InvoiceItem {
  name: string
  quantity: number
  price: number
  total: number
}

interface InvoiceService {
  name: string
  price: number
}

interface Invoice {
  _id: string
  invoiceNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  items: InvoiceItem[]
  services: InvoiceService[]
  subtotal: number
  tax: number
  discount: number
  labourCharges: number
  total: number
  status: string
  source: string
  rawTranscript: string
  notes: string
  createdAt: string
}

interface BusinessData {
  name: string
  email: string
  phone: string
  address: string
  gstin?: string
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<BusinessData | null>(null)

  useEffect(() => {
    fetchInvoice()
    fetch("/api/business")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setBusiness(data)
      })
      .catch(() => {})
  }, [])

  async function fetchInvoice() {
    try {
      const res = await fetch(`/api/invoices/${params.id}`)
      if (!res.ok) throw new Error("Not found")
      const data = await res.json()
      setInvoice(data.invoice)
    } catch (err) {
      console.error("Failed to fetch invoice:", err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(status: string) {
    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success(`Invoice marked as ${status}`)
      fetchInvoice()
    } catch {
      toast.error("Failed to update invoice")
    }
  }

  async function handleSendEmail() {
    if (!invoice || !invoice.customerEmail) {
      toast.error("No email on this invoice")
      return
    }
    try {
      const res = await fetch(`/api/invoices/${invoice._id}/send`, {
        method: "POST",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to send")
      }
      toast.success("Invoice sent to " + invoice.customerEmail)
    } catch (err) {
      toast.error((err as Error).message || "Failed to send email")
    }
  }

  async function handleWhatsApp() {
    if (!invoice) return

    const bizName = "BolKeBill"
    const message = `Thank you for your purchase from ${bizName}!

Invoice: ${invoice.invoiceNumber}
Total: ₹${invoice.total.toLocaleString("en-IN")}

Your invoice PDF is attached. Please keep it for your records.

— ${bizName} (Powered by BolKeBill)`

    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" })
      doc.setFontSize(16)
      doc.text(`Invoice: ${invoice.invoiceNumber}`, 18, 30)
      doc.setFontSize(12)
      doc.text(`Customer: ${invoice.customerName}`, 18, 40)
      doc.text(`Total: ₹${invoice.total.toLocaleString("en-IN")}`, 18, 50)
      const pdfBlob = doc.output("blob")
      const pdfFile = new File(
        [pdfBlob],
        `Invoice_${invoice.invoiceNumber}.pdf`,
        { type: "application/pdf" },
      )
      await navigator.share({
        files: [pdfFile],
        text: message,
        title: `Invoice ${invoice.invoiceNumber}`,
      })
      return
    } catch {}

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    if (!isMobile) {
      const doc = new jsPDF({ unit: "mm", format: "a4" })
      doc.setFontSize(16)
      doc.text(`Invoice: ${invoice.invoiceNumber}`, 18, 30)
      doc.setFontSize(12)
      doc.text(`Customer: ${invoice.customerName}`, 18, 40)
      doc.text(`Total: ₹${invoice.total.toLocaleString("en-IN")}`, 18, 50)
      const pdfBlob = doc.output("blob")
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = pdfUrl
      a.download = `Invoice_${invoice.invoiceNumber}.pdf`
      a.click()
      URL.revokeObjectURL(pdfUrl)
      toast.info(
        "Invoice PDF downloaded. WhatsApp opened — please attach the PDF to the chat.",
      )
    }

    const url = `https://wa.me/${invoice.customerPhone || "91"}?text=${encodeURIComponent(message)}`
    if (isMobile) {
      window.location.href = url
    } else {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  function handleDownload() {
    if (!invoice) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const biz = business || {
      name: "BolKeBill",
      email: "no-reply@bolkebill.anshkaushal.in",
      phone: "",
      address: "",
      gstin: "",
    }

    const statusColor: Record<string, string> = {
      paid: "#059669",
      sent: "#2563eb",
      draft: "#d97706",
      cancelled: "#dc2626",
    }

    const itemsRows = invoice.items
      .map(
        (i, idx) =>
          `<tr${idx % 2 === 0 ? ' class="alt"' : ""}><td class="item-name">${i.name}</td><td class="item-qty">${i.quantity}</td><td class="item-rate">₹${i.price.toLocaleString("en-IN")}</td><td class="item-amt">₹${(i.total || i.quantity * i.price).toLocaleString("en-IN")}</td></tr>`,
      )
      .join("")

    const servicesRows = invoice.services
      .map(
        (s, idx) =>
          `<tr${idx % 2 === 0 ? ' class="alt"' : ""}><td class="item-name">${s.name}</td><td class="item-amt">₹${s.price.toLocaleString("en-IN")}</td></tr>`,
      )
      .join("")

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
            .page { max-width: 800px; margin: 0 auto; position: relative; }
            .watermark {
              position: fixed; top: 50%; left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 72px; font-weight: 900; color: var(--muted);
              opacity: 0.3; z-index: -1; pointer-events: none;
              letter-spacing: 8px; user-select: none;
            }
            .top-bar, .bottom-bar { height: 4px; background: var(--primary); margin: 0 -12mm; }
            .bottom-bar { margin-top: 16px; }
            .header {
              display: flex; justify-content: space-between; align-items: flex-start;
              padding: 20px 0 16px; border-bottom: 2px solid var(--primary); margin-bottom: 20px;
            }
            .biz-name { font-size: 22px; font-weight: 800; color: var(--foreground); margin: 0 0 2px; }
            .biz-detail { font-size: 11px; color: var(--muted-foreground); margin: 1px 0; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { font-size: 20px; font-weight: 800; color: var(--primary); margin: 0 0 2px; }
            .invoice-title p { font-size: 11px; color: var(--muted-foreground); margin: 1px 0; }
            .status-badge {
              display: inline-block; padding: 2px 10px; font-size: 10px; font-weight: 700;
              text-transform: uppercase; letter-spacing: 0.5px;
              color: #fff; background: ${statusColor[invoice.status] || "#6b7280"}; margin-top: 4px;
            }
            .bill-to-header { background: var(--primary); color: #fff; font-size: 10px; font-weight: 700; padding: 5px 12px; letter-spacing: 0.5px; margin-bottom: 8px; }
            .customer-name { font-size: 15px; font-weight: 700; margin: 0 0 2px; }
            .customer-detail { font-size: 12px; color: var(--muted-foreground); margin: 1px 0; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
            thead th { background: var(--primary); color: #fff; padding: 7px 10px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
            thead th:last-child { text-align: right; }
            thead th:nth-child(2) { text-align: center; }
            thead th:nth-child(3) { text-align: right; }
            tbody td { padding: 7px 10px; border-bottom: 1px solid var(--border); }
            tbody td:last-child { text-align: right; font-weight: 600; }
            tbody td:nth-child(2) { text-align: center; }
            tbody td:nth-child(3) { text-align: right; }
            tbody tr.alt td { background: var(--background); }
            .totals { margin-left: auto; width: 280px; border-top: 2px solid var(--primary); padding-top: 6px; }
            .totals table { margin: 0; }
            .totals td { padding: 4px 0; border: none; font-size: 12px; }
            .totals td:last-child { text-align: right; }
            .totals .grand-total td { font-weight: 800; font-size: 15px; padding-top: 8px; border-top: 2px solid var(--primary); }
            .notes-section { margin-top: 20px; padding-top: 12px; border-top: 1px solid var(--muted); }
            .notes-section h4 { font-size: 10px; font-weight: 700; color: var(--muted-foreground); margin: 0 0 4px; letter-spacing: 0.5px; }
            .notes-section p { font-size: 12px; color: var(--muted-foreground); margin: 0; }
            .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid var(--muted); text-align: center; font-size: 10px; color: var(--muted-foreground); }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="watermark">BolKeBill</div>
            <div class="top-bar"></div>
            <div class="header">
              <div>
                <p class="biz-name">${biz.name}</p>
                ${biz.address ? `<p class="biz-detail">${biz.address}</p>` : ""}
                <p class="biz-detail">${biz.email}${biz.phone ? ` | ${biz.phone}` : ""}</p>
                ${biz.gstin ? `<p class="biz-detail">GSTIN: ${biz.gstin}</p>` : ""}
              </div>
              <div class="invoice-title">
                <h2>INVOICE</h2>
                <p>#${invoice.invoiceNumber}</p>
                <p>${new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
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
              <thead><tr><th style="width:46%">Item</th><th style="width:10%">Qty</th><th style="width:18%">Rate</th><th style="width:26%">Amount</th></tr></thead>
              <tbody>${itemsRows}</tbody>
            </table>`
                : ""
            }
            ${
              invoice.services.length > 0
                ? `
            <table>
              <thead><tr><th style="width:70%">Service</th><th style="width:30%">Amount</th></tr></thead>
              <tbody>${servicesRows}</tbody>
            </table>`
                : ""
            }
            <div class="totals">
              <table>
                <tr><td>Subtotal</td><td>₹${invoice.subtotal.toLocaleString("en-IN")}</td></tr>
                ${invoice.labourCharges ? `<tr><td>Labour Charges</td><td>₹${invoice.labourCharges.toLocaleString("en-IN")}</td></tr>` : ""}
                ${invoice.discount ? `<tr><td style="color:var(--destructive)">Discount</td><td style="color:var(--destructive)">-₹${invoice.discount.toLocaleString("en-IN")}</td></tr>` : ""}
                <tr class="grand-total"><td>Total</td><td>₹${invoice.total.toLocaleString("en-IN")}</td></tr>
              </table>
            </div>
            ${invoice.notes ? `<div class="notes-section"><h4>Notes</h4><p>${invoice.notes}</p></div>` : ""}
            <div class="footer">Generated by ${biz.name} | Invoice #${invoice.invoiceNumber}</div>
            <div class="bottom-bar"></div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-16 ml-auto" />
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
            <Separator />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-12" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-lg font-medium">Invoice not found</h2>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard/invoices">Back to Invoices</Link>
        </Button>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    paid: "bg-green-500/10 text-green-600 dark:text-green-400",
    cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Created{" "}
              {new Date(invoice.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className={statusColors[invoice.status]}>
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {invoice.status === "draft" && (
          <>
            <Button size="sm" onClick={() => updateStatus("sent")}>
              <Send className="h-4 w-4" />
              Mark as Sent
            </Button>
            <Button size="sm" onClick={() => updateStatus("paid")}>
              <CheckCircle2 className="h-4 w-4" />
              Mark as Paid
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus("cancelled")}
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          </>
        )}
        {invoice.status === "sent" && (
          <Button size="sm" onClick={() => updateStatus("paid")}>
            <CheckCircle2 className="h-4 w-4" />
            Mark as Paid
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          PDF
        </Button>
        <Button size="sm" variant="outline" onClick={handleWhatsApp}>
          <img
            src="/whatsapp.svg"
            height={300}
            width={300}
            className="h-4 w-4"
          />
          WhatsApp
        </Button>
        {invoice.customerEmail && (
          <Button size="sm" variant="outline" onClick={handleSendEmail}>
            <Mail className="h-4 w-4" />
            Send Email
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium">{invoice.customerName}</p>
              {invoice.customerPhone && (
                <p className="text-muted-foreground">{invoice.customerPhone}</p>
              )}
              {invoice.customerEmail && (
                <p className="text-muted-foreground">{invoice.customerEmail}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Source</p>
              <Badge variant="outline" className="mt-1">
                {invoice.source === "voice" ? "Voice" : "Manual"}
              </Badge>
            </div>
          </div>

          <Separator />

          {invoice.items.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Items</h3>
              <div className="overflow-x-auto border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">
                        Item
                      </th>
                      <th className="text-right p-3 font-medium text-muted-foreground">
                        Qty
                      </th>
                      <th className="text-right p-3 font-medium text-muted-foreground">
                        Rate
                      </th>
                      <th className="text-right p-3 font-medium text-muted-foreground">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3">{item.name}</td>
                        <td className="p-3 text-right">{item.quantity}</td>
                        <td className="p-3 text-right">
                          ₹{item.price.toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-right font-medium">
                          ₹{item.total.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {invoice.services.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Services</h3>
              <div className="overflow-x-auto border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">
                        Service
                      </th>
                      <th className="text-right p-3 font-medium text-muted-foreground">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.services.map((s, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3">{s.name}</td>
                        <td className="p-3 text-right font-medium">
                          ₹{s.price.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{invoice.subtotal}</span>
            </div>
            {invoice.labourCharges > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labour Charges</span>
                <span>₹{invoice.labourCharges}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-destructive">-₹{invoice.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>₹{invoice.total}</span>
            </div>
          </div>

          {invoice.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm mt-1">{invoice.notes}</p>
              </div>
            </>
          )}

          {invoice.rawTranscript && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">
                  Original Voice Transcript
                </p>
                <p className="text-sm mt-1 italic">
                  &ldquo;{invoice.rawTranscript}&rdquo;
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
