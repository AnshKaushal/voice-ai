import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Rajesh Sharma",
    role: "Workshop Owner, Pune",
    content:
      "My typing is slow. With BolKeBill™, I just speak the bill and it's ready. Game changer for my workshop.",
    avatar: "RS",
  },
  {
    name: "Priya Patel",
    role: "Pharmacy Owner, Surat",
    content:
      "Reduced my billing time by 70%. Customers don't have to wait anymore. Absolutely love it.",
    avatar: "PP",
  },
  {
    name: "Amit Singh",
    role: "Tyre Dealer, Delhi",
    content:
      "Earlier I'd write on paper and bill later. Now I speak and the invoice is ready. No more lost notes.",
    avatar: "AS",
  },
]

export function Testimonials() {
  return (
    <section className="border-t py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <Badge variant="secondary" className="mb-4">
            Testimonials
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Loved by business owners
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-0 bg-muted/50">
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarFallback>{t.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  &ldquo;{t.content}&rdquo;
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
