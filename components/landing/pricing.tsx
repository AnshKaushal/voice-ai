import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "",
    description: "Get started with voice invoicing",
    features: [
      "30-day free trial",
      "100 voice transcriptions",
      "Basic invoice generation",
      "PDF export & WhatsApp sharing",
      "₹10 per additional transcription",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Starter",
    price: "₹499",
    period: "/month",
    description: "For small businesses getting started",
    features: [
      "100 voice transcriptions/mo",
      "Unlimited invoices",
      "Customer & inventory management",
      "Email support",
      "₹5 per additional transcription",
      "₹2 per additional invoice",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/month",
    description: "For growing businesses",
    features: [
      "300 voice transcriptions/mo",
      "Unlimited invoices",
      "Advanced analytics",
      "Priority support",
      "₹3 per additional transcription",
      "₹1 per additional invoice",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t py-16 sm:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <Badge variant="secondary" className="mb-4">
            Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start free. Upgrade when you grow.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.popular ? "border-primary shadow-lg" : "border-0 bg-background"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Most Popular</Badge>
                </div>
              )}
              <CardContent className="p-6 pt-8">
                <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href="/register">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
