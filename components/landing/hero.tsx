import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
            Voice-Powered Business Operations
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            The fastest way to capture
            <span className="text-primary"> business activity </span>
            using your voice
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 px-4">
            Stop typing. Start speaking. BolKeBill™ converts speech into
            invoices, job cards, and business records instantly. Built for
            workshops, shops, and local businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/register">
                Try Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto"
            >
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>
          <div className="mt-12 text-sm text-muted-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              No credit card required
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              50 free transcriptions
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              Works on any device
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
