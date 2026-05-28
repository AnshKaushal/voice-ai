"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SwitchPlanDialogProps {
  planName: string
  planPrice: string
  children: React.ReactNode
}

export function SwitchPlanDialog({
  planName,
  planPrice,
  children,
}: SwitchPlanDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const isDowngrade = planName === "Free" || planName === "Starter"
  const pros = isDowngrade
    ? [
        `Save ${planName === "Free" ? "₹499" : "₹500"}/month`,
        "Keep existing features until billing cycle ends",
      ]
    : [
        "More voice transcriptions",
        "Priority support",
        "Advanced analytics",
        "Higher transcript/invoice limits",
      ]
  const cons = isDowngrade
    ? ["Lose higher-tier features", "Fewer monthly credits"]
    : [`Pay ${planPrice}/month`, "Billed monthly, cancel anytime"]

  return (
    <>
      <span onClick={() => setOpen(true)} className="w-full cursor-pointer">
        {children}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to {planName}?</DialogTitle>
            <DialogDescription className="space-y-4 pt-3">
              <div>
                <p className="font-medium text-sm mb-2 text-foreground">Pros</p>
                <ul className="space-y-1">
                  {pros.map((p, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <span className="text-green-500">+</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
              {cons.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-2 text-foreground">
                    Cons
                  </p>
                  <ul className="space-y-1">
                    {cons.map((c, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-center gap-2"
                      >
                        <span className="text-red-500">-</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => router.push("/dashboard/settings")}>
              Proceed to Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
