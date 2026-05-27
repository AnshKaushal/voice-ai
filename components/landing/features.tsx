import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Wrench,
  ShoppingBag,
  Stethoscope,
  Warehouse,
  Building2,
  Smartphone,
} from "lucide-react"

const useCases = [
  {
    icon: Wrench,
    title: "Mechanics & Workshops",
    description:
      "Voice-log parts, labour, and services. Generate job cards in seconds.",
  },
  {
    icon: ShoppingBag,
    title: "Tyre Shops",
    description:
      "Speak tyre sizes, brands, and quantities. Instant invoice ready.",
  },
  {
    icon: Stethoscope,
    title: "Pharmacies",
    description:
      "Dictate medicine names and quantities. Generate bills faster than typing.",
  },
  {
    icon: Warehouse,
    title: "Wholesalers",
    description: "Record bulk orders by voice. No more lost paper notes.",
  },
  {
    icon: Building2,
    title: "Hardware Shops",
    description:
      "List items, quantities, and prices hands-free while serving customers.",
  },
  {
    icon: Smartphone,
    title: "Any Local Business",
    description:
      "Cash memos, service bills, delivery notes — all from your voice.",
  },
]

export function Features() {
  return (
    <section id="features" className="border-t py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <Badge variant="secondary" className="mb-4">
            Use Cases
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Built for real businesses
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From mechanics to pharmacists — BolKeBill™ adapts to how you work.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {useCases.map((useCase) => (
            <Card key={useCase.title} className="border-0 bg-muted/50">
              <CardContent>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <useCase.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {useCase.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
