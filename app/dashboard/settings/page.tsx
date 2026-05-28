"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PhoneInput } from "@/components/phone-input"
import { EmailInput } from "@/components/email-input"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  Save,
  CreditCard,
  Loader2,
  Shield,
  Zap,
  Clock,
  AlertCircle,
  User,
  Download,
  Trash2,
  Mail,
  Check,
  X,
  PartyPopper,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  )
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as Record<string, unknown>).Razorpay) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"))
    document.head.appendChild(script)
  })
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const { data: session, update } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [userName, setUserName] = useState("")

  const [business, setBusiness] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    defaultTaxRate: 0,
  })

  const [subscription, setSubscription] = useState({
    planName: "Free",
    subscription: "free",
    subscriptionStatus: "trialing",
    credits: 0,
    monthlyCredits: 0,
    trialExpired: false,
    trialDaysLeft: 0,
    razorpaySubscriptionId: null as string | null,
  })

  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const [emailChanging, setEmailChanging] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState("json")
  const [successPlan, setSuccessPlan] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name)
    }
  }, [session])

  useEffect(() => {
    const subSuccess = searchParams.get("subscription")
    const plan = searchParams.get("plan")

    if (subSuccess === "success" && plan) {
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, "", cleanUrl)
      ;(async () => {
        const res = await fetch("/api/subscription")
        const subData = await res.json()
        if (!subData.error) setSubscription(subData)
        setLoading(false)
      })()
      setSuccessPlan(plan === "pro" ? "Pro" : "Starter")
    } else {
      Promise.all([
        fetch("/api/business").then((r) => r.json()),
        fetch("/api/subscription").then((r) => r.json()),
      ])
        .then(([businessData, subData]) => {
          if (!businessData.error) {
            setBusiness({
              name: businessData.name || "",
              phone: businessData.phone || "",
              email: businessData.email || "",
              address: businessData.address || "",
              gstin: businessData.gstin || "",
              defaultTaxRate: businessData.defaultTaxRate ?? 0,
            })
          }
          if (!subData.error) {
            setSubscription(subData)
          }
        })
        .catch(() => toast.error("Failed to load settings"))
        .finally(() => setLoading(false))
    }
  }, [searchParams])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(business),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to save")
        return
      }
      toast.success("Business settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleSavePersonal = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...business }),
      })
      if (!res.ok) throw new Error("Failed to save")
      await update({ name: userName })
      toast.success("Name updated")
    } catch {
      toast.error("Failed to update name")
    } finally {
      setSaving(false)
    }
  }

  const handleSendOtp = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email")
      return
    }
    setOtpLoading(true)
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOtpSent(true)
      toast.success("OTP sent to " + newEmail)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP")
    } finally {
      setOtpLoading(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the OTP")
      return
    }
    setEmailChanging(true)
    try {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Email changed to " + data.email)
      setEmailDialogOpen(false)
      setNewEmail("")
      setOtp("")
      setOtpSent(false)
      setBusiness((prev) => ({ ...prev, email: data.email }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change email")
    } finally {
      setEmailChanging(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/export?format=${exportFormat}`)
      if (!res.ok) throw new Error("Failed to export")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `BolKeBill-export-${session?.user?.email || "data"}.${exportFormat === "json" ? "json" : exportFormat === "csv" ? "csv" : "txt"}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Data exported")
    } catch {
      toast.error("Failed to export data")
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch("/api/account", { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete account")
      toast.success("Account deleted")
      await signOut({ callbackUrl: "/" })
    } catch {
      toast.error("Failed to delete account")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const isTrialing = subscription.subscriptionStatus === "trialing"
  const isActive = subscription.subscriptionStatus === "active"
  const needsUpgrade = subscription.trialExpired && !isActive

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and business settings
        </p>
      </div>

      {needsUpgrade && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Trial Expired</p>
              <p className="text-sm text-muted-foreground">
                Your free trial has ended. Choose a plan to continue using
                BolKeBill™.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName">Name</Label>
            <div className="flex gap-2">
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSavePersonal} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="flex gap-2 items-center">
              <Input value={business.email} disabled className="flex-1" />
              <Button
                variant="outline"
                onClick={() => setEmailDialogOpen(true)}
              >
                <Mail className="h-4 w-4" />
                Change
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-primary">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {isTrialing
                    ? "Free Trial"
                    : isActive
                      ? subscription.planName
                      : "Free"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isTrialing
                    ? `${subscription.trialDaysLeft} days remaining`
                    : isActive
                      ? "Active"
                      : subscription.subscriptionStatus}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{subscription.credits} credits left</p>
              {/* <p className="text-xs text-muted-foreground">
                {subscription.monthlyCredits}/month
              </p> */}
            </div>
          </div>

          {isTrialing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Trial ends in {subscription.trialDaysLeft} day
                {subscription.trialDaysLeft !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">
              {isActive ? "Current Plan" : "Choose a plan"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-all hover:border-primary ${
                  subscription.subscription === "starter" && isActive
                    ? "border-primary ring-1 ring-primary"
                    : ""
                }`}
              >
                <CardContent className="space-y-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Starter</p>
                  <p className="flex gap-2 items-end mb-2">
                    <span className="text-2xl/6 font-bold">₹499</span>
                    <span className="text-xs text-muted-foreground">
                      per month
                    </span>
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>100 voice transcriptions/mo</li>
                    <li>Unlimited invoices</li>
                    <li>Inventory management</li>
                    <li>Customer management</li>
                    <li>Basic analytics (7-day view)</li>
                    <li className="text-primary/70">
                      ₹5 per additional transcription
                    </li>
                    <li className="text-primary/70">
                      ₹2 per additional invoice
                    </li>
                  </ul>
                  {isActive && subscription.subscription === "starter" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleSubscribe("starter")}
                    >
                      {isTrialing ? "Subscribe" : "Switch"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all hover:border-primary ${
                  subscription.subscription === "pro" && isActive
                    ? "border-primary ring-1 ring-primary"
                    : ""
                }`}
              >
                <CardContent className="space-y-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Pro</p>
                  <p className="flex gap-2 items-end mb-2">
                    <span className="text-2xl/6 font-bold">₹999</span>
                    <span className="text-xs text-muted-foreground">
                      per month
                    </span>
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>300 voice transcriptions/mo</li>
                    <li>Unlimited invoices</li>
                    <li>Priority support</li>
                    <li>Advanced analytics</li>
                    <li className="text-primary/70">
                      ₹3 per additional transcription
                    </li>
                    <li className="text-primary/70">
                      ₹1 per additional invoice
                    </li>
                  </ul>
                  {isActive && subscription.subscription === "pro" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleSubscribe("pro")}
                    >
                      {isTrialing ? "Subscribe" : "Upgrade"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name</Label>
            <Input
              id="name"
              value={business.name}
              onChange={(e) =>
                setBusiness((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <PhoneInput
                id="phone"
                label="Phone"
                value={business.phone}
                onChange={(v) => setBusiness((prev) => ({ ...prev, phone: v }))}
              />
            </div>
            <div className="space-y-2">
              <EmailInput
                id="email"
                label="Email"
                value={business.email}
                onChange={(v) => setBusiness((prev) => ({ ...prev, email: v }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={business.address}
              onChange={(e) =>
                setBusiness((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN (optional)</Label>
            <Input
              id="gstin"
              value={business.gstin}
              onChange={(e) =>
                setBusiness((prev) => ({ ...prev, gstin: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultTaxRate">Default GST Rate (%)</Label>
            <Input
              id="defaultTaxRate"
              type="text"
              inputMode="decimal"
              value={business.defaultTaxRate || ""}
              onChange={(e) => {
                const v = e.target.value
                setBusiness((prev) => ({
                  ...prev,
                  defaultTaxRate: v === "" ? 0 : parseFloat(v) || 0,
                }))
              }}
            />
            <p className="text-xs text-muted-foreground">
              Applied automatically when creating new invoices.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium">Download your data</p>
              <p className="text-sm text-muted-foreground">
                Export all your invoices, customers, inventory and settings.
              </p>
              <div className="mt-2">
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="txt">TXT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>
              Enter your new email address. We&apos;ll send you an OTP to verify
              it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                disabled={otpSent}
              />
            </div>

            {!otpSent ? (
              <Button
                onClick={handleSendOtp}
                disabled={otpLoading}
                className="w-full"
              >
                {otpLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send OTP
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOtpSent(false)
                      setOtp("")
                    }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChangeEmail}
                    disabled={emailChanging || otp.length !== 6}
                    className="flex-1"
                  >
                    {emailChanging ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Verify & Update
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Account"
        description="Are you sure you want to delete your account? This will permanently remove all your invoices, customers, inventory, and business data. This action cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete My Account"}
        onConfirm={handleDeleteAccount}
      />

      <Dialog
        open={!!successPlan}
        onOpenChange={(open) => !open && setSuccessPlan(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <PartyPopper className="h-6 w-6 text-green-500" />
              Welcome to {successPlan}!
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              You&apos;re now subscribed to the <strong>{successPlan}</strong>{" "}
              plan.
              {successPlan === "Pro"
                ? " You now get 300 voice transcriptions per month, priority support, and advanced analytics. Additional transcriptions at ₹3 each and additional invoices at ₹1 each."
                : " You now get 100 voice transcriptions per month, unlimited invoices, inventory, and customer management. Additional transcriptions at ₹5 each and additional invoices at ₹2 each."}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setSuccessPlan(null)} className="w-full">
            <Check className="h-4 w-4" />
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )

  async function handleSubscribe(planId: "starter" | "pro") {
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (!data.subscriptionId) throw new Error("No subscription ID returned")

      const razorpayKey =
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_6DQodv1ZakcVLE"

      await loadRazorpayScript()

      const options: Record<string, unknown> = {
        key: razorpayKey,
        name: "BolKeBill™",
        description:
          planId === "pro" ? "Pro Plan - ₹999/mo" : "Starter Plan - ₹499/mo",
        subscription_id: data.subscriptionId,
        modal: {
          ondismiss: () => {
            toast.error("Payment was cancelled")
          },
        },
        handler: async function (
          this: unknown,
          response: Record<string, string>,
        ) {
          try {
            const subId = response.razorpay_subscription_id
            if (subId) {
              await fetch("/api/subscription/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriptionId: subId }),
              })
            }
          } catch {}
          window.location.href = `/dashboard/settings?subscription=success&plan=${planId}`
        },
      }

      const rzp = new (
        window as unknown as Record<
          string,
          new (options: Record<string, unknown>) => { open: () => void }
        >
      ).Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to subscribe")
    }
  }
}
