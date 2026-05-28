"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function getEmailError(email: string): string | null {
  if (email.length === 0) return null
  if (!email.includes("@")) return "Must contain @"
  if (!email.includes(".")) return "Must contain a domain"
  if (!isValidEmail(email)) return "Invalid email format"
  return null
}

export function EmailInput({
  value,
  onChange,
  id,
  label,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  id: string
  label: string
  placeholder?: string
  disabled?: boolean
}) {
  const error = getEmailError(value)
  const isValid = value.length > 0 && !error

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="pb-1">
          {label}
        </Label>
      )}
      <Input
        id={id}
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "customer@example.com"}
        disabled={disabled}
        className={cn(
          error && "focus:border-red-500 focus-visible:ring-red-500",
          isValid && "focus:border-green-500 focus-visible:ring-green-500",
        )}
        aria-invalid={!!error}
      />
    </div>
  )
}
