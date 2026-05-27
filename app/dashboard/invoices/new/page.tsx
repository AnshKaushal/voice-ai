"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { InvoiceActions } from "@/components/invoice-actions"
import { InvoiceItemsTable, InvoiceServicesTable, InvoiceTotals } from "@/components/invoice-table"
import { PhoneInput } from "@/components/phone-input"
import { Save, Plus, Trash2, Loader2, ArrowLeft, FileText, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface InvoiceItem {
  name: string
  quantity: number
  price: number
}

interface InvoiceService {
  name: string
  price: number
}

function calcItemTotal(qty: number, price: number) {
  return (qty || 0) * (price || 0)
}

function calculateTotal(
  items: InvoiceItem[],
  services: InvoiceService[],
  labour: number,
  discount: number,
) {
  const itemsTotal = items.reduce((s, i) => s + calcItemTotal(i.quantity, i.price), 0)
  const servicesTotal = services.reduce((s, sv) => s + (sv.price || 0), 0)
  const subtotal = itemsTotal + servicesTotal + (labour || 0)
  return {
    itemsTotal,
    servicesTotal,
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round((subtotal - (discount || 0)) * 100) / 100,
  }
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([
    { name: "", quantity: 1, price: 0 },
  ])
  const [services, setServices] = useState<InvoiceService[]>([])
  const [labourCharges, setLabourCharges] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState("")
  const [createdInvoice, setCreatedInvoice] = useState<Record<string, unknown> | null>(null)

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, price: 0 }])
  }

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const addService = () => {
    setServices([...services, { name: "", price: 0 }])
  }

  const updateService = (
    index: number,
    field: keyof InvoiceService,
    value: string | number,
  ) => {
    setServices((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const saveInvoice = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          items,
          services,
          labourCharges,
          discount,
          notes,
          source: "manual",
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        if (errData.creditsExhausted) {
          toast.error("Manual invoice limit reached. Upgrade your plan to continue.")
          return
        }
        throw new Error("Failed to save")
      }

      const data = await res.json()
      data.invoice.status = "draft"
      setCreatedInvoice(data.invoice)
      toast.success("Invoice created")
    } catch {
      toast.error("Failed to create invoice")
    } finally {
      setIsSaving(false)
    }
  }

  function resetForm() {
    setCreatedInvoice(null)
    setCustomerName("")
    setCustomerPhone("")
    setCustomerEmail("")
    setItems([{ name: "", quantity: 1, price: 0 }])
    setServices([])
    setLabourCharges(0)
    setDiscount(0)
    setNotes("")
  }

  const totals = calculateTotal(items, services, labourCharges, discount)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-muted-foreground">Create a manual invoice</p>
        </div>
      </div>

      {createdInvoice ? (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-medium">Invoice Created</p>
                <p className="text-sm text-muted-foreground">
                  {(createdInvoice as Record<string, string>).invoiceNumber || "New Invoice"}
                </p>
              </div>
            </div>
            <InvoiceActions
              invoice={createdInvoice as unknown as Parameters<typeof InvoiceActions>[0]["invoice"]}
              onStatusChange={() =>
                setCreatedInvoice((prev) =>
                  prev ? { ...prev, status: "paid" } : prev,
                )
              }
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>
                <FileText className="h-4 w-4" />
                New Invoice
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/dashboard/invoices">
                  All Invoices
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Name</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-2">
                <PhoneInput
                  id="customer-phone"
                  label="Phone"
                  value={customerPhone}
                  onChange={setCustomerPhone}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
            </div>

            <Separator />

            <InvoiceItemsTable
              items={items}
              onUpdate={updateItem}
              onAdd={addItem}
              onRemove={removeItem}
            />

            <Separator />

            <InvoiceServicesTable
              services={services}
              onUpdate={updateService}
              onAdd={addService}
              onRemove={removeService}
            />

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Labour Charges (₹)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={labourCharges || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "")
                    setLabourCharges(val ? parseFloat(val) : 0)
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount (₹)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={discount || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "")
                    setDiscount(val ? parseFloat(val) : 0)
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <Separator />

            <InvoiceTotals
              itemsTotal={totals.itemsTotal}
              servicesTotal={totals.servicesTotal}
              labourCharges={labourCharges}
              discount={discount}
              total={totals.total}
            />

            <Button
              className="w-full"
              size="lg"
              onClick={saveInvoice}
              disabled={isSaving || items.every((i) => !i.name)}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
