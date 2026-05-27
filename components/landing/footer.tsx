import { AppLogo } from "@/components/app-logo"

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <AppLogo />
          <p>
            &copy; {new Date().getFullYear()} BolKeBill™. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
