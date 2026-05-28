"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Loader2, Printer, Download } from "lucide-react"

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
  customerPhone?: string
  customerEmail?: string
  items: InvoiceItem[]
  services: InvoiceService[]
  subtotal: number
  discount: number
  labourCharges: number
  tax: number
  taxRate: number
  total: number
  status: string
  notes?: string
  createdAt: string
}

interface Business {
  name: string
  email: string
  phone: string
  address: string
  gstin?: string
}

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

export default function SharedInvoicePage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/share/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(true)
          return
        }
        setInvoice(data.invoice)
        setBusiness(data.business)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [params.id])

  const handleDownload = useCallback(() => {
    if (!invoice) return
    const biz = business || {
      name: "BolKeBill",
      email: "",
      phone: "",
      address: "",
      gstin: "",
    }

    const statusColor: Record<string, string> = {
      paid: "#059669",
      sent: "oklch(0.704 0.04 256.788)",
      draft: "#d97706",
      cancelled: "#dc2626",
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
                <tr><td>Subtotal</td><td>${formatCurrency(invoice.subtotal)}</td></tr>
                ${invoice.labourCharges ? `<tr><td>Labour Charges</td><td>${formatCurrency(invoice.labourCharges)}</td></tr>` : ""}
                ${invoice.discount ? `<tr><td style="color:var(--destructive)">Discount</td><td style="color:var(--destructive)">-${formatCurrency(invoice.discount)}</td></tr>` : ""}
                ${invoice.tax > 0 ? `<tr><td>GST${invoice.taxRate ? ` (${invoice.taxRate}%)` : ""}</td><td>${formatCurrency(invoice.tax)}</td></tr>` : ""}
                <tr class="grand-total"><td>Total</td><td>${formatCurrency(invoice.total)}</td></tr>
              </table>
            </div>
            ${
              invoice.notes
                ? `
            <div class="notes-section">
              <h4>NOTES</h4>
              <p>${invoice.notes}</p>
            </div>`
                : ""
            }
            <div class="footer">Generated by ${biz.name} — Invoice #${invoice.invoiceNumber}</div>
            <div class="bottom-bar"></div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }, [invoice, business])

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "oklch(0.9818 0.0054 95.0986)",
        }}
      >
        <Loader2
          style={{
            height: "2rem",
            width: "2rem",
            animation: "spin 1s linear infinite",
            color: "oklch(0.704 0.04 256.788)",
          }}
        />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "oklch(0.9818 0.0054 95.0986)",
        }}
      >
        <p style={{ color: "oklch(0.553 0.013 58.071)" }}>Invoice not found</p>
      </div>
    )
  }

  const biz = business || {
    name: "BolKeBill",
    email: "",
    phone: "",
    address: "",
    gstin: "",
  }
  const statusColors: Record<string, string> = {
    paid: "#059669",
    sent: "oklch(0.704 0.04 256.788)",
    draft: "#d97706",
    cancelled: "#dc2626",
    credit: "#7c3aed",
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "oklch(0.9818 0.0054 95.0986)",
        padding: "2rem 0",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1rem" }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "center",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={() => window.print()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "1px solid oklch(0.704 0.04 256.788)",
              background: "oklch(0.704 0.04 256.788)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            className="transition duration-300 rounded-3xl"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "oklch(0.6 0.04 256.788)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "oklch(0.704 0.04 256.788)"
            }}
          >
            <Printer style={{ height: "1rem", width: "1rem" }} />
            Print
          </button>
          <button
            onClick={handleDownload}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "1px solid oklch(0.704 0.04 256.788)",
              background: "transparent",
              color: "oklch(0.704 0.04 256.788)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            className="transition duration-300 rounded-3xl"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "oklch(0.9245 0.0138 92.9892)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
            }}
          >
            <Download style={{ height: "1rem", width: "1rem" }} />
            Download PDF
          </button>
        </div>

        <div
          id="invoice-content"
          style={{
            background: "#fff",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: "oklch(0.145 0 0)",
            lineHeight: 1.5,
          }}
        >
          <div
            style={{
              height: "4px",
              background: "oklch(0.704 0.04 256.788)",
              margin: "0 -12mm",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "20px 32px 16px",
              borderBottom: "2px solid oklch(0.704 0.04 256.788)",
              marginBottom: "20px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "oklch(0.145 0 0)",
                  margin: "0 0 2px",
                }}
              >
                {biz.name}
              </p>
              {biz.address && (
                <p
                  style={{
                    fontSize: "11px",
                    color: "oklch(0.553 0.013 58.071)",
                    margin: "1px 0",
                  }}
                >
                  {biz.address}
                </p>
              )}
              <p
                style={{
                  fontSize: "11px",
                  color: "oklch(0.553 0.013 58.071)",
                  margin: "1px 0",
                }}
              >
                {biz.email}
                {biz.phone ? ` | ${biz.phone}` : ""}
              </p>
              {biz.gstin && (
                <p
                  style={{
                    fontSize: "11px",
                    color: "oklch(0.553 0.013 58.071)",
                    margin: "1px 0",
                  }}
                >
                  GSTIN: {biz.gstin}
                </p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "oklch(0.704 0.04 256.788)",
                  margin: "0 0 2px",
                }}
              >
                INVOICE
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "oklch(0.553 0.013 58.071)",
                  margin: "1px 0",
                }}
              >
                #{invoice.invoiceNumber}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "oklch(0.553 0.013 58.071)",
                  margin: "1px 0",
                }}
              >
                {formatDate(invoice.createdAt)}
              </p>
              <div
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#fff",
                  background:
                    statusColors[invoice.status] || "oklch(0.553 0.013 58.071)",
                  marginTop: "4px",
                }}
              >
                {invoice.status}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "oklch(0.704 0.04 256.788)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              padding: "5px 12px",
              letterSpacing: "0.5px",
              margin: "0 32px 8px",
            }}
          >
            BILL TO
          </div>
          <p
            style={{ fontSize: "15px", fontWeight: 700, margin: "0 32px 2px" }}
          >
            {invoice.customerName}
          </p>
          {invoice.customerPhone && (
            <p
              style={{
                fontSize: "12px",
                color: "oklch(0.553 0.013 58.071)",
                margin: "1px 32px",
              }}
            >
              {invoice.customerPhone}
            </p>
          )}
          {invoice.customerEmail && (
            <p
              style={{
                fontSize: "12px",
                color: "oklch(0.553 0.013 58.071)",
                margin: "1px 32px",
              }}
            >
              {invoice.customerEmail}
            </p>
          )}

          <div style={{ margin: "16px 32px" }}>
            {invoice.items.length > 0 && (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                  marginBottom: "16px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        background: "oklch(0.704 0.04 256.788)",
                        color: "#fff",
                        padding: "7px 10px",
                        textAlign: "left",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        width: "46%",
                      }}
                    >
                      Item
                    </th>
                    <th
                      style={{
                        background: "oklch(0.704 0.04 256.788)",
                        color: "#fff",
                        padding: "7px 10px",
                        textAlign: "center",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        width: "10%",
                      }}
                    >
                      Qty
                    </th>
                    <th
                      style={{
                        background: "oklch(0.704 0.04 256.788)",
                        color: "#fff",
                        padding: "7px 10px",
                        textAlign: "right",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        width: "18%",
                      }}
                    >
                      Rate
                    </th>
                    <th
                      style={{
                        background: "oklch(0.704 0.04 256.788)",
                        color: "#fff",
                        padding: "7px 10px",
                        textAlign: "right",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        width: "26%",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((i, idx) => (
                    <tr
                      key={idx}
                      style={
                        idx % 2 === 0
                          ? { background: "oklch(0.9818 0.0054 95.0986)" }
                          : undefined
                      }
                    >
                      <td
                        style={{
                          padding: "7px 10px",
                          borderBottom: "1px solid oklch(0.869 0.005 56.366)",
                        }}
                      >
                        {i.name}
                      </td>
                      <td
                        style={{
                          padding: "7px 10px",
                          borderBottom: "1px solid oklch(0.869 0.005 56.366)",
                          textAlign: "center",
                        }}
                      >
                        {i.quantity}
                      </td>
                      <td
                        style={{
                          padding: "7px 10px",
                          borderBottom: "1px solid oklch(0.869 0.005 56.366)",
                          textAlign: "right",
                        }}
                      >
                        {formatCurrency(i.price)}
                      </td>
                      <td
                        style={{
                          padding: "7px 10px",
                          borderBottom: "1px solid oklch(0.869 0.005 56.366)",
                          textAlign: "right",
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(i.total || i.quantity * i.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {invoice.services.length > 0 && (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                  marginBottom: "16px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        background: "oklch(0.704 0.04 256.788)",
                        color: "#fff",
                        padding: "7px 10px",
                        textAlign: "left",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        width: "70%",
                      }}
                    >
                      Service
                    </th>
                    <th
                      style={{
                        background: "oklch(0.704 0.04 256.788)",
                        color: "#fff",
                        padding: "7px 10px",
                        textAlign: "right",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        width: "30%",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.services.map((s, idx) => (
                    <tr
                      key={idx}
                      style={
                        idx % 2 === 0
                          ? { background: "oklch(0.9818 0.0054 95.0986)" }
                          : undefined
                      }
                    >
                      <td
                        style={{
                          padding: "7px 10px",
                          borderBottom: "1px solid oklch(0.869 0.005 56.366)",
                        }}
                      >
                        {s.name}
                      </td>
                      <td
                        style={{
                          padding: "7px 10px",
                          borderBottom: "1px solid oklch(0.869 0.005 56.366)",
                          textAlign: "right",
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(s.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div
            style={{
              marginLeft: "auto",
              width: "280px",
              borderTop: "2px solid oklch(0.704 0.04 256.788)",
              padding: "6px 32px 0",
            }}
          >
            <table style={{ width: "100%", fontSize: "12px" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "4px 0", border: "none" }}>Subtotal</td>
                  <td
                    style={{
                      padding: "4px 0",
                      border: "none",
                      textAlign: "right",
                    }}
                  >
                    {formatCurrency(invoice.subtotal)}
                  </td>
                </tr>
                {invoice.labourCharges ? (
                  <tr>
                    <td style={{ padding: "4px 0", border: "none" }}>
                      Labour Charges
                    </td>
                    <td
                      style={{
                        padding: "4px 0",
                        border: "none",
                        textAlign: "right",
                      }}
                    >
                      {formatCurrency(invoice.labourCharges)}
                    </td>
                  </tr>
                ) : null}
                {invoice.discount ? (
                  <tr>
                    <td
                      style={{
                        padding: "4px 0",
                        border: "none",
                        color: "oklch(0.6368 0.2078 25.3313)",
                      }}
                    >
                      Discount
                    </td>
                    <td
                      style={{
                        padding: "4px 0",
                        border: "none",
                        textAlign: "right",
                        color: "oklch(0.6368 0.2078 25.3313)",
                      }}
                    >
                      -{formatCurrency(invoice.discount)}
                    </td>
                  </tr>
                ) : null}
                {invoice.tax > 0 ? (
                  <tr>
                    <td style={{ padding: "4px 0", border: "none" }}>
                      GST{invoice.taxRate ? ` (${invoice.taxRate}%)` : ""}
                    </td>
                    <td style={{ padding: "4px 0", border: "none", textAlign: "right" }}>
                      {formatCurrency(invoice.tax)}
                    </td>
                  </tr>
                ) : null}
                <tr>
                  <td
                    style={{
                      fontWeight: 800,
                      fontSize: "15px",
                      paddingTop: "8px",
                      borderTop: "2px solid oklch(0.704 0.04 256.788)",
                    }}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      fontWeight: 800,
                      fontSize: "15px",
                      paddingTop: "8px",
                      borderTop: "2px solid oklch(0.704 0.04 256.788)",
                      textAlign: "right",
                    }}
                  >
                    {formatCurrency(invoice.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {invoice.notes && (
            <div
              style={{
                margin: "20px 32px 0",
                paddingTop: "12px",
                borderTop: "1px solid oklch(0.923 0.003 48.717)",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "oklch(0.553 0.013 58.071)",
                  margin: "0 0 4px",
                  letterSpacing: "0.5px",
                }}
              >
                NOTES
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "oklch(0.553 0.013 58.071)",
                  margin: 0,
                }}
              >
                {invoice.notes}
              </p>
            </div>
          )}

          <div
            style={{
              marginTop: "24px",
              padding: "8px 32px 0",
              borderTop: "1px solid oklch(0.923 0.003 48.717)",
              textAlign: "center",
              fontSize: "10px",
              color: "oklch(0.553 0.013 58.071)",
            }}
          >
            Generated by {biz.name} — Invoice #{invoice.invoiceNumber}
          </div>

          <div
            style={{
              height: "4px",
              background: "oklch(0.704 0.04 256.788)",
              margin: "16px -12mm 0",
            }}
          />
        </div>

        <style>{`
          body { margin: 0; background: oklch(0.9818 0.0054 95.0986) !important; color: oklch(0.145 0 0) !important; }
          @media print {
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 12mm; }
            button { display: none !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
