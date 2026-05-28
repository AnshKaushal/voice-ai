import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="space-y-6 py-8">
            <h1 className="text-3xl font-bold">Terms & Conditions</h1>
            <p className="text-muted-foreground">
              These terms and conditions outline the rules and regulations for the
              use of BolKeBill&trade;s Service.
            </p>
            <h2 className="text-xl font-semibold mt-8">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using this service, you accept and agree to be
              bound by these terms. If you do not agree, please do not use our
              service.
            </p>
            <h2 className="text-xl font-semibold mt-8">2. Service Description</h2>
            <p className="text-muted-foreground">
              BolKeBill provides a voice-first invoicing platform. We grant you a
              limited, non-exclusive, non-transferable license to use the service
              during your subscription period.
            </p>
            <h2 className="text-xl font-semibold mt-8">3. User Responsibilities</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account.
            </p>
            <h2 className="text-xl font-semibold mt-8">4. Privacy</h2>
            <p className="text-muted-foreground">
              We respect your privacy. Please refer to our Privacy Policy for
              information about how we collect, use, and protect your data.
            </p>
            <div className="pt-6">
              <Button asChild variant="outline">
                <Link href="/register">Back to Registration</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
