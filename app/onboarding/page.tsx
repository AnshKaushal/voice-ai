"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { AppLogo } from "@/components/app-logo"
import { PhoneInput } from "@/components/phone-input"
import {
  Loader2,
  Check,
  ArrowRight,
  ArrowLeft,
  Building2,
  User,
  Lock,
} from "lucide-react"

const businessTypes = [
  { value: "workshop", label: "Mechanics / Workshop" },
  { value: "tyre_shop", label: "Tyre Shop" },
  { value: "pharmacy", label: "Pharmacy / Medicine Store" },
  { value: "hardware", label: "Hardware Shop" },
  { value: "wholesale", label: "Wholesaler" },
  { value: "general", label: "General Store / Other" },
]

const steps = [
  { id: 1, label: "Personal Details", icon: User },
  { id: 2, label: "Business Details", icon: Building2 },
  { id: 3, label: "Set Password", icon: Lock },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [personal, setPersonal] = useState({
    name: session?.user?.name || "",
    phone: "",
  })

  const [business, setBusiness] = useState({
    name: "",
    type: "",
    phone: "",
    email: session?.user?.email || "",
    gstin: "",
  })

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const isGoogleUser = !!session?.user?.image
  const totalSteps = isGoogleUser ? 2 : 3

  const canProceed = () => {
    if (step === 1)
      return (
        personal.name.trim().length > 0 && personal.phone.trim().length >= 10
      )
    if (step === 2)
      return business.name.trim().length > 0 && business.type.length > 0
    if (step === 3) return password.length >= 6 && password === confirmPassword
    return false
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personal,
          business,
          ...(isGoogleUser ? {} : { password }),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Something went wrong")
        return
      }

      await updateSession({
        name: data.name,
        onboardingCompleted: true,
        businessId: data.businessId,
      })
      toast.success("Welcome to BolKeBill™!")
      router.push("/dashboard")
    } catch {
      toast.error("Failed to complete setup")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <AppLogo className="justify-center mb-2" />
          <h1 className="text-2xl font-bold tracking-tight">
            Set up your business
          </h1>
          <p className="text-muted-foreground mt-1">
            Just a few details to get started
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.slice(0, totalSteps).map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div
                className={`flex flex-col items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  step === s.id
                    ? "bg-primary text-primary-foreground"
                    : step > s.id
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={`h-px w-8 transition-colors ${
                    step > s.id ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {step === 1 && "Your Details"}
              {step === 2 && "Business Information"}
              {step === 3 && "Set a Password"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    value={personal.name}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <PhoneInput
                    id="phone"
                    label="Phone Number"
                    value={personal.phone}
                    onChange={(v) => setPersonal((p) => ({ ...p, phone: v }))}
                    placeholder="10-digit phone number"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={business.name}
                    onChange={(e) =>
                      setBusiness((b) => ({ ...b, name: e.target.value }))
                    }
                    placeholder="e.g. Sharma Motors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-type">Business Type</Label>
                  <Select
                    value={business.type}
                    onValueChange={(value) =>
                      setBusiness((b) => ({ ...b, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <PhoneInput
                    id="business-phone"
                    label="Business Phone"
                    value={business.phone}
                    onChange={(v) => setBusiness((b) => ({ ...b, phone: v }))}
                    placeholder="Business phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-email">Business Email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={business.email}
                    onChange={(e) =>
                      setBusiness((b) => ({ ...b, email: e.target.value }))
                    }
                    placeholder="Business email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-gstin">
                    GSTIN{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="business-gstin"
                    value={business.gstin}
                    onChange={(e) =>
                      setBusiness((b) => ({ ...b, gstin: e.target.value }))
                    }
                    placeholder="e.g. 22AAAAA0000A1Z5"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                  />
                </div>
              </div>
            )}

            <Separator />

            <div className="flex gap-3">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              {step < totalSteps ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={loading || !canProceed()}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
