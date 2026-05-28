"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import {
  ArrowLeft,
  Users,
  Phone,
  Mail,
  IndianRupee,
  ShoppingBag,
  Calendar,
  TrendingUp,
  Package,
  Clock,
  Lock,
  FileText,
  ChevronRight,
} from "lucide-react"

interface CustomerData {
  _id: string
  name: string
  phone: string
  email?: string
  createdAt: string
}

interface InvoiceData {
  _id: string
  invoiceNumber: string
  total: number
  status: "draft" | "sent" | "paid" | "cancelled" | "credit"
  createdAt: string
  items: { name: string; quantity: number; total: number }[]
}

interface CustomerAnalytics {
  totalSpent: number
  visitDates: string[]
  mostPurchasedItems: { name: string; quantity: number; revenue: number }[]
  retentionRate: number
  totalVisits: number
  outstandingBalance: number
}

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/10 text-yellow-600",
  sent: "bg-blue-500/10 text-blue-600",
  paid: "bg-green-500/10 text-green-600",
  cancelled: "bg-red-500/10 text-red-600",
  credit: "bg-primary/10 text-primary",
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)

  useEffect(() => {
    fetchCustomer()
  }, [])

  async function fetchCustomer() {
    try {
      const res = await fetch(`/api/customers/${params.id}`)
      const data = await res.json()
      if (data.error) {
        router.push("/dashboard/customers")
        return
      }
      setCustomer(data.customer)
      setInvoices(data.invoices || [])
      setAnalytics(data.analytics)
      setIsPaid(data.meta?.isPaid ?? false)
    } catch {
      router.push("/dashboard/customers")
    } finally {
      setLoading(false)
    }
  }

  function getRetentionLabel(rate: number): string {
    if (rate >= 70) return "High"
    if (rate >= 40) return "Medium"
    return "Low"
  }

  function getRetentionColor(rate: number): string {
    if (rate >= 70) return "text-green-600"
    if (rate >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!customer) return null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground">Customer details & history</p>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold">{customer.name}</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone}
                </div>
                {customer.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Customer since {formatDate(customer.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="columns-1 md:columns-2 gap-4 space-y-4">
        <Card className="break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics?.totalSpent || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              Total Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalVisits || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics && analytics.retentionRate > 0
                ? "Returning customer"
                : "First-time customer"}
            </p>
          </CardContent>
        </Card>

        <Card className="break-inside-avoid border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <IndianRupee className="h-4 w-4 text-primary" />
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(analytics?.outstandingBalance || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Amount due on credit invoices
            </p>
          </CardContent>
        </Card>

        <Card className="break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-muted-foreground" />
              Most Purchased Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isPaid ? (
              <div className="relative">
                <div className="blur-sm pointer-events-none select-none">
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>Item {i + 1}</span>
                        <span className="text-muted-foreground">x0</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUpgradeDialogOpen(true)}
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Premium
                  </Button>
                </div>
              </div>
            ) : analytics?.mostPurchasedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No items purchased yet
              </p>
            ) : (
              <div className="space-y-2">
                {analytics?.mostPurchasedItems.slice(0, 5).map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="truncate flex-1">{item.name}</span>
                    <span className="text-muted-foreground ml-2">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isPaid ? (
              <div className="relative">
                <div className="blur-sm pointer-events-none select-none">
                  <div className="text-2xl font-bold">--%</div>
                  <p className="text-xs text-muted-foreground mt-1">--</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUpgradeDialogOpen(true)}
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Premium
                  </Button>
                </div>
              </div>
            ) : analytics ? (
              <>
                <div className="text-2xl font-bold">
                  {analytics.retentionRate}%
                </div>
                <p
                  className={`text-xs mt-1 ${getRetentionColor(analytics.retentionRate)}`}
                >
                  {getRetentionLabel(analytics.retentionRate)} retention
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Visit History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isPaid ? (
              <div className="relative py-5">
                <div className="blur-sm pointer-events-none select-none">
                  <div className="flex flex-wrap gap-2">
                    {["01 Jan", "15 Jan", "01 Feb"].map((d, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUpgradeDialogOpen(true)}
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Premium
                  </Button>
                </div>
              </div>
            ) : analytics?.visitDates && analytics.visitDates.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {[...analytics.visitDates].reverse().map((date, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {formatDate(date)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No visit history yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No invoices yet
            </p>
          ) : (
            <Table className="border">
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-[120px] sm:w-auto">Invoice</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">
                    Amount
                  </TableHead>
                  <TableHead className="text-right w-[100px]">Status</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow
                    key={inv._id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/invoices/${inv._id}`)
                    }
                  >
                    <TableCell className="font-medium">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(inv.createdAt)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right font-semibold">
                      {formatCurrency(inv.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${statusColors[inv.status]}`}
                      >
                        {inv.status.charAt(0).toUpperCase() +
                          inv.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        feature="Customer analytics"
      />
    </div>
  )
}
