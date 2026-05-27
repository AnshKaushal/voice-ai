"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { VoiceRecorder } from "@/components/voice/voice-recorder"
import { toast } from "sonner"
import { InvoiceActions } from "@/components/invoice-actions"
import { InvoiceItemsTable, InvoiceServicesTable, InvoiceTotals } from "@/components/invoice-table"
import { PhoneInput } from "@/components/phone-input"
import {
  FileText,
  Save,
  Loader2,
  Wand2,
  CheckCircle2,
} from "lucide-react"

interface InvoiceItem {
  name: string
  quantity: number
  price: number
}

interface InvoiceService {
  name: string
  price: number
}

interface ParsedData {
  customerName?: string
  customerPhone?: string
  items: InvoiceItem[]
  services: InvoiceService[]
  labourCharges?: number
  discount?: number
  notes?: string
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
  const itemsTotal = items.reduce(
    (s, i) => s + calcItemTotal(i.quantity, i.price),
    0,
  )
  const servicesTotal = services.reduce((s, sv) => s + (sv.price || 0), 0)
  const subtotal = itemsTotal + servicesTotal + (labour || 0)
  return {
    itemsTotal,
    servicesTotal,
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round((subtotal - (discount || 0)) * 100) / 100,
  }
}

export default function VoicePage() {
  const [transcript, setTranscript] = useState("")
  const [liveTranscript, setLiveTranscript] = useState("")
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [createdInvoice, setCreatedInvoice] = useState<Record<
    string,
    unknown
  > | null>(null)
  const [editable, setEditable] = useState<ParsedData>({
    items: [],
    services: [],
    customerName: "",
    customerPhone: "",
    labourCharges: 0,
    discount: 0,
    notes: "",
  })

  const handleVoiceResult = (text: string, parsed: ParsedData) => {
    setLiveTranscript("")
    setParsedData((prev) => prev ?? ({} as ParsedData))
    setEditable((prev) => ({
      customerName: parsed.customerName || prev.customerName || "",
      customerPhone: parsed.customerPhone || prev.customerPhone || "",
      items: [...prev.items, ...(parsed.items || [])],
      services: [...prev.services, ...(parsed.services || [])],
      labourCharges: parsed.labourCharges || prev.labourCharges || 0,
      discount: parsed.discount || prev.discount || 0,
      notes: parsed.notes || prev.notes || "",
    }))
    setTranscript((prev) => (prev ? `${prev}\n${text}` : text))
  }

  const addItem = () => {
    setEditable((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: 1, price: 0 }],
    }))
  }

  const removeItem = (index: number) => {
    setEditable((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    setEditable((prev) => {
      const items = [...prev.items]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, items }
    })
  }

  const addService = () => {
    setEditable((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", price: 0 }],
    }))
  }

  const removeService = (index: number) => {
    setEditable((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }))
  }

  const updateService = (
    index: number,
    field: keyof InvoiceService,
    value: string | number,
  ) => {
    setEditable((prev) => {
      const services = [...prev.services]
      services[index] = { ...services[index], [field]: value }
      return { ...prev, services }
    })
  }

  const saveInvoice = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editable,
          rawTranscript: transcript,
          source: "voice",
        }),
      })

      if (!res.ok) throw new Error("Failed to save invoice")

      const data = await res.json()
      data.invoice.status = "draft"
      setCreatedInvoice(data.invoice)
      toast.success("Invoice created")
    } catch {
      toast.error("Failed to save invoice")
    } finally {
      setIsSaving(false)
    }
  }

  function resetForm() {
    setTranscript("")
    setLiveTranscript("")
    setParsedData(null)
    setCreatedInvoice(null)
    setEditable({
      items: [],
      services: [],
      customerName: "",
      customerPhone: "",
      labourCharges: 0,
      discount: 0,
      notes: "",
    })
  }

  const totals = calculateTotal(
    editable.items,
    editable.services,
    editable.labourCharges || 0,
    editable.discount || 0,
  )

  if (createdInvoice) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Voice Entry</h1>
          <p className="text-muted-foreground">
            Speak naturally to create an invoice. AI extracts everything
            automatically.
          </p>
        </div>
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
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Voice Entry</h1>
        <p className="text-muted-foreground">
          Speak naturally to create an invoice. AI extracts everything
          automatically.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <VoiceRecorder
            onResult={handleVoiceResult}
            onInterimTranscript={setLiveTranscript}
            disabled={isSaving}
          />

          {liveTranscript && !transcript && (
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-sm font-medium">Listening...</span>
              </div>
              <p className="text-sm text-muted-foreground">{liveTranscript}</p>
            </div>
          )}

          {transcript && !liveTranscript && (
            <div className="mt-6 p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-2 mb-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Transcript</span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Name</label>
                <Input
                  value={editable.customerName}
                  onChange={(e) =>
                    setEditable((prev) => ({
                      ...prev,
                      customerName: e.target.value,
                    }))
                  }
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-2">
                <PhoneInput
                  id="customer-phone"
                  label="Phone"
                  value={editable.customerPhone || ""}
                  onChange={(v) =>
                    setEditable((prev) => ({
                      ...prev,
                      customerPhone: v,
                    }))
                  }
                  placeholder="Phone number"
                />
              </div>
            </div>

            <Separator />

            <InvoiceItemsTable
              items={editable.items}
              onUpdate={updateItem}
              onAdd={addItem}
              onRemove={removeItem}
            />

            <Separator />

            <InvoiceServicesTable
              services={editable.services}
              onUpdate={updateService}
              onAdd={addService}
              onRemove={removeService}
            />

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Labour Charges (₹)
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={editable.labourCharges || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "")
                    setEditable((prev) => ({
                      ...prev,
                      labourCharges: val ? parseFloat(val) : 0,
                    }))
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount (₹)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={editable.discount || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "")
                    setEditable((prev) => ({
                      ...prev,
                      discount: val ? parseFloat(val) : 0,
                    }))
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={editable.notes}
                onChange={(e) =>
                  setEditable((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <Separator />

            <InvoiceTotals
              itemsTotal={totals.itemsTotal}
              servicesTotal={totals.servicesTotal}
              labourCharges={editable.labourCharges || 0}
              discount={editable.discount || 0}
              total={totals.total}
            />

            <Button
              className="w-full"
              size="lg"
              onClick={saveInvoice}
              disabled={isSaving || editable.items.length === 0}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Invoice
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
