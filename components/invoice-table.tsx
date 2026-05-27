"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

interface TableItem {
  name: string
  quantity: number
  price: number
}

interface TableService {
  name: string
  price: number
}

function calcItemTotal(qty: number, price: number) {
  return (qty || 0) * (price || 0)
}

export function InvoiceItemsTable({
  items,
  onUpdate,
  onAdd,
  onRemove,
}: {
  items: TableItem[]
  onUpdate: (index: number, field: keyof TableItem, value: string | number) => void
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
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground w-[45%]">Item</th>
              <th className="text-left p-3 font-medium text-muted-foreground w-[15%]">Qty</th>
              <th className="text-right p-3 font-medium text-muted-foreground w-[18%]">Rate</th>
              <th className="text-right p-3 font-medium text-muted-foreground w-[18%]">Amount</th>
              <th className="w-[4%]" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                  No items added yet
                </td>
              </tr>
            ) : (
              items.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="p-1.5">
                    <Input
                      value={item.name}
                      onChange={(e) => onUpdate(i, "name", e.target.value)}
                      placeholder="Item name"
                      className="border-0 shadow-none focus-visible:ring-0 px-2 py-1 h-9"
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
                    ₹{calcItemTotal(item.quantity, item.price).toLocaleString("en-IN")}
                  </td>
                  <td className="p-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRemove(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
  onUpdate: (index: number, field: keyof TableService, value: string | number) => void
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
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground w-[70%]">Service</th>
              <th className="text-right p-3 font-medium text-muted-foreground w-[26%]">Amount</th>
              <th className="w-[4%]" />
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-muted-foreground text-sm">
                  No services added yet
                </td>
              </tr>
            ) : (
              services.map((service, i) => (
                <tr key={i} className="border-t">
                  <td className="p-1.5">
                    <Input
                      value={service.name}
                      onChange={(e) => onUpdate(i, "name", e.target.value)}
                      placeholder="Service name"
                      className="border-0 shadow-none focus-visible:ring-0 px-2 py-1 h-9"
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
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
  total,
}: {
  itemsTotal: number
  servicesTotal: number
  labourCharges: number
  discount: number
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
          <span className="text-destructive">-₹{discount.toLocaleString("en-IN")}</span>
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
