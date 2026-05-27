import { Badge } from "@/components/ui/badge"
import { Mic, Zap, FileText, MessageSquare } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Speak naturally",
    description:
      "Just say what you'd write. '2 Apollo tyres, wheel alignment, total 8500'",
    icon: Mic,
  },
  {
    number: "02",
    title: "AI structures it",
    description:
      "Our AI extracts items, quantities, prices, services, and customer details.",
    icon: Zap,
  },
  {
    number: "03",
    title: "Review & edit",
    description: "Preview the draft. Make corrections with a tap or voice.",
    icon: FileText,
  },
  {
    number: "04",
    title: "Share instantly",
    description: "Send invoice as PDF or WhatsApp message. Done in seconds.",
    icon: MessageSquare,
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t py-16 sm:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <Badge variant="secondary" className="mb-4">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Four seconds. That&apos;s all it takes.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From voice to invoice in under 30 seconds.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">
          {steps.map((step) => (
            <div key={step.number} className="relative text-center">
              <div className="flex justify-center items-center gap-4 mb-4">
                <span className="text-4xl sm:text-5xl font-bold text-muted-foreground/20">
                  {step.number}
                </span>
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
