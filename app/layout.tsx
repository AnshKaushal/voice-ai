import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/session-provider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "BolKeBill™ | Voice-First Business Assistant",
    template: "%s | BolKeBill™",
  },
  description:
    "The fastest way for offline businesses to capture and organize business activity using voice. Convert speech into invoices, job cards, and business records instantly.",
  keywords: [
    "invoice",
    "voice",
    "business",
    "AI",
    "accounting",
    "India",
    "GST",
  ],
  authors: [{ name: "BolKeBill™" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "BolKeBill™",
    title: "BolKeBill™ | Voice-First Business Assistant",
    description:
      "Convert speech into invoices, job cards, and business records instantly. Built for India's offline businesses.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BolKeBill™ | Voice-First Business Assistant",
    description:
      "Convert speech into invoices, job cards, and business records instantly. Built for India's offline businesses.",
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
