"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function isValidPhone(phone: string): boolean {
  return phone.length === 10 && /^[6-9]/.test(phone)
}

export function getPhoneError(phone: string): string | null {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 0) return null
  if (digits.length < 10) return "Must be exactly 10 digits"
  if (!/^[6-9]/.test(digits)) return "Must start with 6, 7, 8, or 9"
  return null
}

export function PhoneInput({
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
  const error = getPhoneError(value)
  const digits = value.replace(/\D/g, "")
  const isValid = value.length > 0 && !error

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        placeholder={placeholder || "10-digit phone number"}
        disabled={disabled}
        className={cn(
          error && "border-red-500 focus-visible:ring-red-500",
          isValid && "border-green-500 focus-visible:ring-green-500",
        )}
        aria-invalid={!!error}
      />
    </div>
  )
}
