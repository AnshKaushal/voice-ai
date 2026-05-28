"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Mic,
  FileText,
  Users,
  IndianRupee,
  ArrowUpRight,
  Clock,
  Plus,
  Loader2,
  Zap,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Lock,
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
} from "recharts"
import { UpgradeDialog } from "@/components/upgrade-dialog"


interface DashboardStats {
  totalInvoices: number
  totalRevenue: number
  totalCustomers: number
  voiceEntries: number
  creditsRemaining: number
  subscription: string
  subscriptionStatus: string
  trialExpired: boolean
  trialDaysLeft: number
}

interface RecentInvoice {
  _id: string
  invoiceNumber: string
  customerName: string
  total: number
  status: string
  createdAt: string
}

interface AnalyticsData {
  revenueByPeriod: { date: string; revenue: number; count: number }[]
  serviceUsage: { name: string; count: number; revenue: number }[]
  customerGrowth: { date: string; newCustomers: number; totalCustomers: number }[]
  summary: {
    totalRevenue: number
    totalInvoices: number
    totalCustomers: number
    averageInvoiceValue: number
    outstandingCredit: number
  }
  meta: {
    period: string
    isPaid: boolean
  }
}

const quickActions = [
  {
    title: "Voice Entry",
    description: "Speak to create an invoice",
    icon: Mic,
    href: "/dashboard/voice",
    variant: "secondary" as const,
  },
  {
    title: "New Invoice",
    description: "Create invoice manually",
    icon: Plus,
    href: "/dashboard/invoices/new",
    variant: "outline" as const,
  },
  {
    title: "View Invoices",
    description: "Browse all invoices",
    icon: FileText,
    href: "/dashboard/invoices",
    variant: "outline" as const,
  },
]

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
  credit: "bg-primary/10 text-primary",
}

const CHART_COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#0891b2", "#ca8a04"]

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([])
  const [loading, setLoading] = useState(true)

  const [period, setPeriod] = useState("week")
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [lockedPeriod, setLockedPeriod] = useState("")
  const isPaid = analytics?.meta?.isPaid ?? false

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  function handlePeriodChange(value: string) {
    if (!isPaid && value !== "week") {
      setLockedPeriod(value)
      setUpgradeDialogOpen(true)
      return
    }
    setPeriod(value)
  }

  async function fetchStats() {
    try {
      const res = await fetch("/api/stats")
      const data = await res.json()
      setStats(data.stats)
      setRecentInvoices(data.recentInvoices || [])
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAnalytics() {
    setAnalyticsLoading(true)
    try {
      const res = await fetch(`/api/analytics?period=${period}`)
      const data = await res.json()
      if (!data.error) setAnalytics(data)
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-60 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-60 w-full" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-60 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
              <Skeleton className="h-9 w-full mt-2" />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="grid gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: stats ? `₹${stats.totalRevenue.toLocaleString("en-IN")}` : "₹0",
      icon: IndianRupee,
    },
    {
      title: "Invoices",
      value: stats?.totalInvoices?.toString() || "0",
      icon: FileText,
    },
    {
      title: "Customers",
      value: stats?.totalCustomers?.toString() || "0",
      icon: Users,
    },
    {
      title: "Credits Left",
      value: stats?.creditsRemaining?.toString() || "0",
      icon: Zap,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {stats?.creditsRemaining !== undefined
              ? `${stats.creditsRemaining} voice credits remaining this month`
              : "Here&apos;s your business overview."}
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link href="/dashboard/voice">
            <Mic className="h-4 w-4" />
            Voice Entry
          </Link>
        </Button>
      </div>

      {stats?.trialExpired && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Trial Expired</p>
              <p className="text-sm text-muted-foreground">
                Your free trial has ended. Choose a plan to continue using voice transcription.
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/dashboard/settings">Upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {stats?.subscriptionStatus === "trialing" && !stats?.trialExpired && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Free Trial</p>
                <p className="text-sm text-muted-foreground">
                  {stats.trialDaysLeft} day{stats.trialDaysLeft !== 1 ? "s" : ""} remaining
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings">View Plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Analytics</h2>
        <div className="ml-auto">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">
                <span className="flex items-center gap-2">
                  Last 30 days
                  {!isPaid && <Lock className="h-3 w-3" />}
                </span>
              </SelectItem>
              <SelectItem value="quarter">
                <span className="flex items-center gap-2">
                  Last 3 months
                  {!isPaid && <Lock className="h-3 w-3" />}
                </span>
              </SelectItem>
              <SelectItem value="year">
                <span className="flex items-center gap-2">
                  Last 12 months
                  {!isPaid && <Lock className="h-3 w-3" />}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {analyticsLoading ? (
        <div className="columns-1 md:columns-2 gap-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="break-inside-avoid">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analytics ? (
        <div className="columns-1 md:columns-2 gap-4 space-y-4">
          {/* Revenue Chart */}
          <Card className="break-inside-avoid">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.revenueByPeriod.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  No data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={analytics.revenueByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
                      formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                      contentStyle={{ borderRadius: 0, border: "1px solid var(--border)", background: "var(--background)" }}
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

          {/* Customer Growth */}
          <Card className="break-inside-avoid">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.customerGrowth.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  No customers yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={analytics.customerGrowth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{ borderRadius: 0, border: "1px solid var(--border)", background: "var(--background)" }}
                      labelStyle={{ color: "var(--foreground)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalCustomers"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Service Popularity */}
          <Card className="break-inside-avoid">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Most Used Services</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.serviceUsage.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  No services data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={analytics.serviceUsage.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      width={120}
                    />
                    <Tooltip
                      formatter={(value) => [Number(value), "Times used"]}
                      contentStyle={{ borderRadius: 0, border: "1px solid var(--border)", background: "var(--background)" }}
                      labelStyle={{ color: "var(--foreground)" }}
                    />
                    <Bar dataKey="count" fill="var(--primary)" radius={0} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <Card className="break-inside-avoid">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Period Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="font-semibold">
                  {formatCurrency(analytics.summary.totalRevenue - analytics.summary.outstandingCredit)}
                  {analytics.summary.outstandingCredit > 0 && (
                    <span className="text-primary ml-1">
                      + {formatCurrency(analytics.summary.outstandingCredit)}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. Invoice Value</span>
                <span className="font-semibold">{formatCurrency(analytics.summary.averageInvoiceValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Invoices</span>
                <span className="font-semibold">{analytics.summary.totalInvoices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Customers</span>
                <span className="font-semibold">{analytics.summary.totalCustomers}</span>
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/analytics">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Full Analytics
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="break-inside-avoid">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant={action.variant}
                  className="justify-start h-auto py-3 px-4"
                  asChild
                >
                  <Link href={action.href}>
                    <action.icon className="mr-3 h-5 w-5 shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                    <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
          <Card className="break-inside-avoid">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Invoices</CardTitle>
              {recentInvoices.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/invoices">View all</Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {recentInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No invoices yet</p>
                  <p className="text-xs mt-1">
                    Start by creating your first invoice.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentInvoices.map((inv) => (
                    <Link
                      key={inv._id}
                      href={`/dashboard/invoices/${inv._id}`}
                      className="flex items-start gap-3 hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {inv.customerName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{inv.invoiceNumber}</span>
                          <span>·</span>
                          <span>
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">
                          ₹{inv.total.toLocaleString("en-IN")}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${statusColors[inv.status]}`}
                        >
                          {inv.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        feature={
          lockedPeriod === "month"
            ? "Last 30 days"
            : lockedPeriod === "quarter"
              ? "Last 3 months"
              : lockedPeriod === "year"
                ? "Last 12 months"
                : undefined
        }
      />
    </div>
  )
}
