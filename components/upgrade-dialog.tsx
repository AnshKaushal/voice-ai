"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Lock, Zap } from "lucide-react"

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: string
}

export function UpgradeDialog({
  open,
  onOpenChange,
  feature,
}: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
          </div>
          <DialogTitle>Premium Feature</DialogTitle>
          <DialogDescription>
            {feature
              ? `"${feature}" is available on the Pro plan.`
              : "This feature is available on the Pro plan."}{" "}
            Upgrade to unlock detailed analytics, extended date ranges, and
            more.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border p-3 flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">Pro Plan — ₹999/mo</p>
              <p className="text-xs text-muted-foreground">
                300 voice transcriptions, advanced analytics, priority support
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" asChild>
              <Link href="/dashboard/settings">Upgrade Now</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
