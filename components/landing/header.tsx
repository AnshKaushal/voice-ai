"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { UserMenu } from "@/components/user-menu";
import { AppLogo } from "@/components/app-logo";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <AppLogo href="/" />

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ModeToggle />
            {session?.user ? (
              <UserMenu />
            ) : (
              <>
                <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden border-t overflow-hidden transition-all duration-200",
          mobileOpen ? "max-h-64" : "max-h-0"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium py-2 hover:text-primary transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2 border-t">
            {session?.user ? (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
