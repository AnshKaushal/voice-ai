"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  TrendingUp,
  IndianRupee,
  FileText,
  Users,
  ShoppingCart,
  Lock,
  BarChart3,
  PieChart as PieChartIcon,
  Package,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface RevenuePeriod {
  date: string
  revenue: number
  count: number
}

interface ServiceStat {
  name: string
  count: number
  revenue: number
}

interface CustomerGrowth {
  date: string
  newCustomers: number
  totalCustomers: number
}

interface StatusBreakdown {
  status: string
  count: number
  total: number
}

interface TopItem {
  name: string
  quantity: number
  revenue: number
}

interface AnalyticsData {
  revenueByPeriod: RevenuePeriod[]
  serviceUsage: ServiceStat[]
  customerGrowth: CustomerGrowth[]
  statusBreakdown: StatusBreakdown[]
  topItems: TopItem[]
  summary: {
    totalRevenue: number
    totalInvoices: number
    totalCustomers: number
    averageInvoiceValue: number
  }
  meta: {
    period: string
    isPaid: boolean
  }
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--primary)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
  "var(--primary)",
  "var(--chart-3)",
]

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  cancelled: "Cancelled",
}

function PaidOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/60">
        <div className="text-center space-y-2">
          <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-medium">Premium Feature</p>
          <p className="text-sm text-muted-foreground">
            Upgrade to unlock detailed analytics
          </p>
          <Button size="sm" asChild>
            <Link href="/dashboard/settings">Upgrade</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("month")
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?period=${period}`)
      const data = await res.json()
      if (!data.error) setAnalytics(data)
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into your business performance
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="quarter">Last 3 months</SelectItem>
            <SelectItem value="year">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-32 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-72 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : !analytics ? (
        <div className="text-center py-20 text-muted-foreground">
          Failed to load analytics
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue
                </CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analytics.summary.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg {formatCurrency(analytics.summary.averageInvoiceValue)}{" "}
                  per invoice
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Invoices
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.summary.totalInvoices}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.statusBreakdown.find((s) => s.status === "paid")
                    ?.count || 0}{" "}
                  paid
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Customers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.summary.totalCustomers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total registered
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Value
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analytics.summary.averageInvoiceValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per invoice
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Trend
              </CardTitle>
              <CardDescription>
                Revenue over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.revenueByPeriod.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                  No revenue data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={analytics.revenueByPeriod}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        "Revenue",
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        background: "var(--primary)",
                        color: "var(--background)",
                      }}
                      labelStyle={{ color: "var(--foreground)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ fill: "var(--primary)", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Two Column Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Growth */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Growth
                </CardTitle>
                <CardDescription>Total customers over time</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.customerGrowth.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                    No customer data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={analytics.customerGrowth}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "var(--radius)",
                          border: "1px solid var(--border)",
                          background: "var(--primary)",
                        }}
                        labelStyle={{ color: "var(--foreground)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="totalCustomers"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        dot={false}
                        name="Total Customers"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Invoice Status
                </CardTitle>
                <CardDescription>Breakdown by status</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.statusBreakdown.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                    No invoices yet
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="60%" height={240}>
                      <PieChart>
                        <Pie
                          data={analytics.statusBreakdown}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={50}
                        >
                          {analytics.statusBreakdown.map((entry, i) => (
                            <Cell
                              key={entry.status}
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            Number(value),
                            STATUS_LABELS[String(name)] || String(name),
                          ]}
                          contentStyle={{
                            borderRadius: 0,
                            border: "1px solid var(--border)",
                            background: "var(--background)",
                          }}
                          labelStyle={{ color: "var(--foreground)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 text-sm">
                      {analytics.statusBreakdown.map((entry, i) => (
                        <div
                          key={entry.status}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="h-3 w-3"
                            style={{
                              backgroundColor:
                                CHART_COLORS[i % CHART_COLORS.length],
                            }}
                          />
                          <span className="text-muted-foreground">
                            {STATUS_LABELS[entry.status] || entry.status}
                          </span>
                          <span className="font-medium ml-auto">
                            {entry.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Service Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Service Usage
              </CardTitle>
              <CardDescription>Most frequently used services</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.serviceUsage.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  No services data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.serviceUsage} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      width={150}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        Number(value),
                        String(name) === "count" ? "Times used" : "Revenue",
                      ]}
                      contentStyle={{
                        borderRadius: 0,
                        border: "1px solid var(--border)",
                        background: "var(--background)",
                      }}
                      labelStyle={{ color: "var(--foreground)" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--primary)"
                      radius={0}
                      name="count"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Premium Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Selling Items
              </CardTitle>
              <CardDescription>
                Best performing products by quantity sold
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analytics.meta.isPaid ? (
                <PaidOverlay>
                  <div className="h-48" />
                </PaidOverlay>
              ) : analytics.topItems.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  No item data yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">
                          Item
                        </th>
                        <th className="text-right p-3 font-medium text-muted-foreground">
                          Qty Sold
                        </th>
                        <th className="text-right p-3 font-medium text-muted-foreground">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topItems.map((item, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-3">{item.name}</td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(item.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Status Table - Premium */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Revenue by Status
              </CardTitle>
              <CardDescription>
                Revenue breakdown by invoice status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analytics.meta.isPaid ? (
                <PaidOverlay>
                  <div className="h-48" />
                </PaidOverlay>
              ) : analytics.statusBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  No data yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-right p-3 font-medium text-muted-foreground">
                          Count
                        </th>
                        <th className="text-right p-3 font-medium text-muted-foreground">
                          Total Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.statusBreakdown.map((entry, i) => (
                        <tr key={entry.status} className="border-b">
                          <td className="p-3 flex items-center gap-2">
                            <div
                              className="h-3 w-3"
                              style={{
                                backgroundColor:
                                  CHART_COLORS[i % CHART_COLORS.length],
                              }}
                            />
                            {STATUS_LABELS[entry.status] || entry.status}
                          </td>
                          <td className="p-3 text-right">{entry.count}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(entry.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
