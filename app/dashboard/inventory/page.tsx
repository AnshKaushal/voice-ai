"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { BulkUploadDialog } from "@/components/bulk-upload-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Package,
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  Save,
  Upload,
} from "lucide-react"

interface InventoryItem {
  _id: string
  name: string
  price: number
  category: string
  brand: string
}

const emptyForm = { name: "", price: 0, category: "", brand: "" }

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res = await fetch(`/api/inventory?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setItems(data.items)
    } catch {
      toast.error("Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (item: InventoryItem) => {
    setEditingId(item._id)
    setForm({
      name: item.name,
      price: item.price,
      category: item.category,
      brand: item.brand,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || form.price <= 0) {
      toast.error("Name and valid price required")
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/inventory/${editingId}` : "/api/inventory"
      const method = editingId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editingId ? "Item updated" : "Item added")
      setDialogOpen(false)
      fetchItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Item deleted")
      setDeleteTarget(null)
      fetchItems()
    } catch {
      toast.error("Failed to delete item")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Add / Manage your products from here for easier invoicing.
          </p>
        </div>
        <div className="flex gap-2 w-fit">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Upload className="h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        {loading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mb-3" />
            <p className="font-medium">No products yet</p>
            <p className="text-sm">Add your first product to get started</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>₹{item.price.toLocaleString()}</span>
                    {item.category && <span>• {item.category}</span>}
                    {item.brand && <span>• {item.brand}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() =>
                      setDeleteTarget({ id: item._id, name: item.name })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSuccess={fetchItems}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Product"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="inv-name">Product Name</Label>
              <Input
                id="inv-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Engine Oil 10W40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-price">Price (₹)</Label>
              <Input
                id="inv-price"
                type="text"
                inputMode="decimal"
                value={form.price || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "")
                  setForm((p) => ({ ...p, price: val ? parseFloat(val) : 0 }))
                }}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-category">Category</Label>
                <Input
                  id="inv-category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  placeholder="e.g. Lubricants"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-brand">Brand</Label>
                <Input
                  id="inv-brand"
                  value={form.brand}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, brand: e.target.value }))
                  }
                  placeholder="e.g. Castrol"
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingId ? "Update" : "Add"} Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
