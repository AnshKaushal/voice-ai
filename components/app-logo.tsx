"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AppLogoProps {
  href?: string
  className?: string
}

export function AppLogo({ href, className }: AppLogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLight = resolvedTheme === "light"
  const logoSrc = !isLight ? "/logo-light.svg" : "/logo-dark.svg"
  const logoSqSrc = !isLight
    ? "/logo-square-light.svg"
    : "/logo-square-dark.svg"

  const content = (
    <div className={cn("flex items-center", className)}>
      {mounted ? (
        <>
          <Image
            src={logoSqSrc}
            alt="BolKeBill™"
            width={28}
            height={28}
            className="md:hidden h-8 w-auto"
            priority
          />
          <Image
            src={logoSrc}
            alt="BolKeBill™"
            width={110}
            height={28}
            className="hidden md:block h-8 w-auto"
            priority
          />
        </>
      ) : (
        <div className="h-7" />
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
