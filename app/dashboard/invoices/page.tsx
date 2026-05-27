"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { toast } from "sonner"
import {
  Plus,
  Mic,
  Search,
  FileText,
  Loader2,
  Download,
  ExternalLink,
  Trash2,
} from "lucide-react"

interface Invoice {
  _id: string
  invoiceNumber: string
  customerName: string
  total: number
  status: "draft" | "sent" | "paid" | "cancelled"
  source: "voice" | "manual"
  items: Array<{ name: string; quantity: number; price: number }>
  createdAt: string
}

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    try {
      const res = await fetch("/api/invoices")
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch (err) {
      console.error("Failed to fetch invoices:", err)
    } finally {
      setLoading(false)
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    number: string
  } | null>(null)

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Invoice deleted")
      setDeleteTarget(null)
      fetchInvoices()
    } catch {
      toast.error("Failed to delete invoice")
    }
  }

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage all your invoices</p>
        </div>
        <div className="flex gap-2 w-fit">
          <Button variant="outline" asChild>
            <Link href="/dashboard/voice">
              <Mic className="h-4 w-4" />
              Voice Entry
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/invoices/new">
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Invoice"
        description={
          deleteTarget
            ? `Are you sure you want to delete invoice ${deleteTarget.number}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />

      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-36" />
          </div>
          <Card>
            <CardContent className="divide-y py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first invoice using voice or manually.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/dashboard/voice">
                  <Mic className="h-4 w-4" />
                  Voice Entry
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/invoices/new">
                  <Plus className="h-4 w-4" />
                  Manual Entry
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-0!">
          <CardContent className="p-0!">
            <div className="divide-y">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv._id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{inv.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.invoiceNumber} ·{" "}
                        {new Date(inv.createdAt).toLocaleDateString()} ·{" "}
                        {inv.items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="secondary"
                      className={statusColors[inv.status]}
                    >
                      {inv.status}
                    </Badge>
                    <span className="font-semibold">
                      ₹{inv.total.toLocaleString()}
                    </span>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/invoices/${inv._id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() =>
                        setDeleteTarget({
                          id: inv._id,
                          number: inv.invoiceNumber,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
