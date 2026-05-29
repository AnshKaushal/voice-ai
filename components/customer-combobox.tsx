"use client"

import { useState, useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"

interface CustomerValue {
  _id: string
  name: string
  phone: string
  email: string
}

interface CustomerComboboxProps {
  value: string
  onChange: (value: string) => void
  onCustomerSelect?: (customer: {
    _id: string
    name: string
    phone: string
    email?: string
  }) => void
  id: string
  label: string
  placeholder?: string
  disabled?: boolean
}

export function CustomerCombobox({
  value,
  onChange,
  onCustomerSelect,
  id,
  label,
  placeholder,
  disabled,
}: CustomerComboboxProps) {
  const [customers, setCustomers] = useState<CustomerValue[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerValue | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value || value.length < 1) {
      setCustomers([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/customers?search=${encodeURIComponent(value)}&limit=8`,
        )
        const data = await res.json()
        setCustomers(data.customers || [])
      } catch {
        setCustomers([])
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  function handleValueChange(val: CustomerValue | null) {
    if (!val) {
      onChange("")
      setSelectedCustomer(null)
      return
    }
    if (val._id === "new") {
      onChange(val.name)
      setSelectedCustomer({ _id: "new", name: val.name, phone: "", email: "" })
      return
    }
    setSelectedCustomer(val)
    onChange(val.name)
    onCustomerSelect?.(val)
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="pb-1">
          {label}
        </Label>
      )}
      <Combobox
        value={selectedCustomer}
        onValueChange={handleValueChange}
        onInputValueChange={(v) => onChange(v)}
        itemToStringLabel={(item) => item.name}
        isItemEqualToValue={(a, b) => a._id === b._id}
        autoHighlight
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder || "Search customers..."}
          disabled={disabled}
          showTrigger={false}
          autoComplete="off"
        >
          <ComboboxContent>
            <ComboboxList>
              {customers.map((c) => (
                <ComboboxItem key={c._id} value={c}>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.phone}
                      {c.email ? ` · ${c.email}` : ""}
                    </div>
                  </div>
                </ComboboxItem>
              ))}
              {customers.length === 0 && value.length >= 1 && (
                <ComboboxItem
                  key="new"
                  value={{ _id: "new", name: value, phone: "", email: "" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">Add "{value}" as new customer</div>
                    <div className="text-xs text-muted-foreground">
                      Create new customer
                    </div>
                  </div>
                </ComboboxItem>
              )}
              <ComboboxEmpty>No customers found</ComboboxEmpty>
            </ComboboxList>
          </ComboboxContent>
        </ComboboxInput>
      </Combobox>
    </div>
  )
}
