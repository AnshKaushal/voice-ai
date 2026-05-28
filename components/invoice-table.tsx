"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, Loader2 } from "lucide-react"

interface TableItem {
  name: string
  quantity: number
  price: number
}

interface TableService {
  name: string
  price: number
}

interface InventoryEntry {
  _id: string
  name: string
  price: number
  category?: string
}

function calcItemTotal(qty: number, price: number) {
  return (qty || 0) * (price || 0)
}

function InventorySearchInput({
  value,
  onChange,
  onSelect,
  placeholder,
  type = "item",
}: {
  value: string
  onChange: (val: string) => void
  onSelect: (entry: { name: string; price: number }) => void
  placeholder: string
  type: "item" | "service"
}) {
  const [results, setResults] = useState<InventoryEntry[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  function handleInput(val: string) {
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val || val.length < 1) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    setOpen(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/inventory?search=${encodeURIComponent(val)}&limit=6`,
        )
        const data = await res.json()
        const items = data.items || []
        setResults(items)
        setOpen(items.length > 0 || val.length >= 1)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  function selectInventory(item: InventoryEntry) {
    const name = item.name.charAt(0).toUpperCase() + item.name.slice(1)
    onChange(name)
    onSelect({ name, price: item.price })
    setOpen(false)
    setResults([])
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          className="border-0 shadow-none focus-visible:ring-0 px-2 py-1 h-9"
        />
        {loading && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-0.5 bg-popover border rounded shadow-md max-h-48 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item._id}
              type="button"
              className="w-full text-left px-2 py-1.5 text-xs flex items-center justify-between hover:bg-accent"
              onMouseDown={() => selectInventory(item)}
            >
              <span className="font-medium truncate">{item.name}</span>
              <span className="text-muted-foreground shrink-0 ml-2">
                ₹{item.price}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && value.length >= 1 && (
        <div className="absolute z-50 left-0 right-0 mt-0.5 bg-popover border rounded shadow-md p-3 text-center text-xs text-muted-foreground">
          No matching {type === "service" ? "service" : "item"} in inventory.
          <br />
          Typed name will be used as-is.
        </div>
      )}
    </div>
  )
}

export function InvoiceItemsTable({
  items,
  onUpdate,
  onAdd,
  onRemove,
}: {
  items: TableItem[]
  onUpdate: (
    index: number,
    field: keyof TableItem,
    value: string | number,
  ) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Items</h3>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-3 w-3 mr-1" />
          Add Item
        </Button>
      </div>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground w-[45%]">
                Item
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground w-[15%]">
                Qty
              </th>
              <th className="text-right p-3 font-medium text-muted-foreground w-[18%]">
                Rate
              </th>
              <th className="text-right p-3 font-medium text-muted-foreground w-[18%]">
                Amount
              </th>
              <th className="w-[4%]" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No items added yet
                </td>
              </tr>
            ) : (
              items.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="p-1.5">
                    <InventorySearchInput
                      value={item.name}
                      onChange={(v) => onUpdate(i, "name", v)}
                      onSelect={(entry) => {
                        onUpdate(i, "name", entry.name)
                        onUpdate(i, "price", entry.price)
                      }}
                      placeholder="Item name"
                      type="item"
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={item.quantity || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "")
                        onUpdate(i, "quantity", val ? parseInt(val) : 0)
                      }}
                      placeholder="0"
                      className="border-0 shadow-none focus-visible:ring-0 px-2 py-1 h-9"
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={item.price || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "")
                        onUpdate(i, "price", val ? parseFloat(val) : 0)
                      }}
                      placeholder="0"
                      className="border-0 shadow-none focus-visible:ring-0 px-2 py-1 h-9 text-right"
                    />
                  </td>
                  <td className="p-1.5 text-right font-medium">
                    ₹
                    {calcItemTotal(item.quantity, item.price).toLocaleString(
                      "en-IN",
                    )}
                  </td>
                  <td className="p-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRemove(i)}
                    >
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function InvoiceServicesTable({
  services,
  onUpdate,
  onAdd,
  onRemove,
}: {
  services: TableService[]
  onUpdate: (
    index: number,
    field: keyof TableService,
    value: string | number,
  ) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Services</h3>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-3 w-3 mr-1" />
          Add Service
        </Button>
      </div>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground w-[70%]">
                Service
              </th>
              <th className="text-right p-3 font-medium text-muted-foreground w-[26%]">
                Amount
              </th>
              <th className="w-[4%]" />
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No services added yet
                </td>
              </tr>
            ) : (
              services.map((service, i) => (
                <tr key={i} className="border-t">
                  <td className="p-1.5">
                    <InventorySearchInput
                      value={service.name}
                      onChange={(v) => onUpdate(i, "name", v)}
                      onSelect={(entry) => {
                        onUpdate(i, "name", entry.name)
                        onUpdate(i, "price", entry.price)
                      }}
                      placeholder="Service name"
                      type="service"
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={service.price || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "")
                        onUpdate(i, "price", val ? parseFloat(val) : 0)
                      }}
                      placeholder="0"
                      className="border-0 shadow-none focus-visible:ring-0 px-2 py-1 h-9 text-right"
                    />
                  </td>
                  <td className="p-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRemove(i)}
                    >
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function InvoiceTotals({
  itemsTotal,
  servicesTotal,
  labourCharges,
  discount,
  tax,
  taxRate,
  total,
}: {
  itemsTotal: number
  servicesTotal: number
  labourCharges: number
  discount: number
  tax?: number
  taxRate?: number
  total: number
}) {
  return (
    <div className="space-y-1.5 text-sm ml-auto w-full max-w-xs">
      <div className="flex justify-between py-1">
        <span className="text-muted-foreground">Items Total</span>
        <span>₹{itemsTotal.toLocaleString("en-IN")}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="text-muted-foreground">Services Total</span>
        <span>₹{servicesTotal.toLocaleString("en-IN")}</span>
      </div>
      {labourCharges > 0 && (
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Labour Charges</span>
          <span>₹{labourCharges.toLocaleString("en-IN")}</span>
        </div>
      )}
      {discount > 0 && (
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Discount</span>
          <span className="text-destructive">
            -₹{discount.toLocaleString("en-IN")}
          </span>
        </div>
      )}
      {tax != null && tax > 0 && (
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">
            GST{taxRate ? ` (${taxRate}%)` : ""}
          </span>
          <span>₹{tax.toLocaleString("en-IN")}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-lg pt-2 border-t">
        <span>Total</span>
        <span>₹{total.toLocaleString("en-IN")}</span>
      </div>
    </div>
  )
}

export type { TableItem, TableService }
