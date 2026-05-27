"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { AppLogo } from "@/components/app-logo"
import { Loader2, Mail } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [loading, setLoading] = useState(false)

  const sendOTP = async () => {
    if (!email.includes("@")) {
      toast.error("Please enter a valid email")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to send OTP")
        return
      }
      setStep("otp")
      toast.success("OTP sent to your email")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP")
      return
    }
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        otp,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid or expired OTP")
        return
      }

      toast.success("Account created! Let's set up your business.")
      router.push("/onboarding")
      router.refresh()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/onboarding" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <AppLogo href="/" className="justify-center" />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {step === "email" ? "Create your account" : "Check your email"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {step === "email"
                ? "Enter your email to get started"
                : `We sent an OTP to ${email}`}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "email" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendOTP()}
                  />
                </div>
                <Button className="w-full" onClick={sendOTP} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Send OTP
                </Button>

                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    OR
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="text-center text-2xl tracking-[8px]"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    onKeyDown={(e) => e.key === "Enter" && verifyOTP()}
                    autoFocus
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={verifyOTP}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Verify & Create Account
                </Button>
                <div className="text-center">
                  <button
                    onClick={sendOTP}
                    disabled={loading}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Resend OTP
                  </button>
                </div>
                <button
                  onClick={() => {
                    setStep("email")
                    setOtp("")
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Use a different email
                </button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
