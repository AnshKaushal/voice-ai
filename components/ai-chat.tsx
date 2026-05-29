"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Send,
  Mic,
  Square,
  Bot,
  User,
  Lightbulb,
  Loader2,
  Sparkles,
  IndianRupee,
  Users,
  ArrowUpRight,
  Package,
  Plus,
  Clock,
  Trash2,
  TrendingUp,
  FileText,
  HelpCircle,
  Building2,
} from "lucide-react"
import { toast } from "sonner"

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

export interface QuickAction {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface CommandResult {
  type: "navigate" | "query" | "action" | "help" | "unknown" | "error"
  message: string
  path?: string
  queryType?: "invoices" | "stats" | "customers" | "inventory" | "outstanding"
  params?: Record<string, unknown>
  action?: string
  data?: any
  suggestions?: string[]
  actions?: QuickAction[]
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  command?: CommandResult
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = "bolkebill-chat-conversations"

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
  credit: "bg-primary/10 text-primary",
}

function formatCurrency(n: number) {
  return `\u20B9${n.toLocaleString("en-IN")}`
}

export function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

function InvoiceResults({ data }: { data: any }) {
  const invoices: any[] = data
  if (!invoices || invoices.length === 0) {
    return (
      <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        No invoices found.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {invoices.slice(0, 5).map((inv) => (
        <Link
          key={inv._id}
          href={`/dashboard/invoices/${inv._id}`}
          className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{inv.customerName}</p>
            <p className="text-xs text-muted-foreground">{inv.invoiceNumber}</p>
          </div>
          <div className="ml-3 shrink-0 text-right">
            <p className="font-medium">{formatCurrency(inv.total || 0)}</p>
            <Badge
              variant="secondary"
              className={cn("text-xs", statusColors[inv.status] || "")}
            >
              {inv.status}
            </Badge>
          </div>
        </Link>
      ))}
      {invoices.length > 5 && (
        <p className="pt-1 text-center text-xs text-muted-foreground">
          +{invoices.length - 5} more results
        </p>
      )}
    </div>
  )
}

function StatsResults({ data }: { data: any }) {
  if (!data) return null

  const cards = [
    { label: "Invoices", value: data.totalInvoices ?? 0, icon: FileText },
    {
      label: "Revenue",
      value: formatCurrency(data.totalRevenue ?? 0),
      icon: IndianRupee,
    },
    { label: "Customers", value: data.totalCustomers ?? 0, icon: Users },
  ]

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="space-y-1 rounded-lg bg-muted/50 px-3 py-2 text-center"
        >
          <c.icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-sm font-bold">{c.value}</p>
          <p className="text-[10px] text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </div>
  )
}

function InventoryResults({ data }: { data: any }) {
  const items: any[] = data
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        No inventory items found.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {items.slice(0, 5).map((item) => (
        <div
          key={item._id}
          className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.category || "Uncategorized"}
            </p>
          </div>
          <p className="ml-3 shrink-0 font-medium">
            {formatCurrency(item.price || 0)}
          </p>
        </div>
      ))}
      {items.length > 5 && (
        <p className="pt-1 text-center text-xs text-muted-foreground">
          +{items.length - 5} more items
        </p>
      )}
    </div>
  )
}

function CustomerResults({ data }: { data: any }) {
  const customers: any[] = data
  if (!customers || customers.length === 0) {
    return (
      <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        No customers found.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {customers.slice(0, 5).map((c) => (
        <Link
          key={c._id}
          href={`/dashboard/customers/${c._id}`}
          className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">
              {c.phone || "No phone"}
            </p>
          </div>
          <p className="ml-3 shrink-0 text-xs text-muted-foreground">
            {formatCurrency(c.totalSpent || 0)}
          </p>
        </Link>
      ))}
    </div>
  )
}

function OutstandingResults({ data }: { data: any }) {
  if (!data || !data.invoices) return null

  return (
    <div className="space-y-1.5">
      <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm">
        <span className="text-xs text-muted-foreground">Total Udhaar</span>
        <p className="text-lg font-bold">
          {formatCurrency(data.totalOutstanding || 0)}
        </p>
      </div>
      {data.customers && data.customers.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            By customer
          </p>
          {data.customers.map((c: any) => (
            <div
              key={c.name}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="truncate font-medium">{c.name}</span>
              <span className="ml-3 shrink-0 font-medium text-destructive">
                {formatCurrency(c.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const SUGGESTION_CARDS = [
  {
    icon: IndianRupee,
    label: "Kitna udhaar hai?",
    hint: "Check outstanding",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: TrendingUp,
    label: "Show revenue",
    hint: "Business summary",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: FileText,
    label: "Create invoice",
    hint: "New bill",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Package,
    label: "Add inventory item",
    hint: "Stock entry",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Users,
    label: "Pending payments",
    hint: "Follow up",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Building2,
    label: "My customers",
    hint: "View all",
    color: "text-primary",
    bg: "bg-primary/10",
  },
]

function HelpView({ suggestions, onPick }: { suggestions?: string[]; onPick?: (s: string) => void }) {
  const items = suggestions ?? [
    "Show pending payments",
    "Create manual invoice",
    "Voice entry",
    "Show revenue",
    "Kitna udhaar hai",
    "बकाया payment dikhao",
    "Kitna revenue hua",
    "Kis kis ka udhaar hai",
  ]

  return (
    <div className="space-y-2.5">
      {onPick ? (
        <>
          <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
            Quick actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTION_CARDS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => onPick(s.label)}
                className={cn(
                  "group flex flex-col items-start gap-1 rounded-xl border border-border/50 p-3 text-left text-sm transition-all",
                  "hover:border-border hover:shadow-sm hover:-translate-y-0.5",
                  "bg-card/50 hover:bg-card",
                )}
              >
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", s.bg)}>
                  <s.icon className={cn("h-4 w-4", s.color)} />
                </div>
                <span className="font-medium text-foreground">{s.label}</span>
                <span className="text-[11px] text-muted-foreground">{s.hint}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {items.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                <Lightbulb className="mr-1 h-2.5 w-2.5" />
                {s}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ActionButtons({ actions }: { actions?: QuickAction[] }) {
  if (!actions || actions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {actions.map((a) => (
        <Button
          key={a.href}
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          asChild
        >
          <Link href={a.href}>
            {a.icon && <a.icon className="h-3.5 w-3.5" />}
            {a.label}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </Button>
      ))}
    </div>
  )
}

const CATEGORY_HINTS: Record<string, string> = {
  nail: "Hardware", screw: "Hardware", bolt: "Hardware", nut: "Hardware",
  washer: "Hardware", hammer: "Tools", drill: "Tools", spanner: "Tools",
  wrench: "Tools", screwdriver: "Tools", saw: "Tools",
  cement: "Construction", brick: "Construction", sand: "Construction",
  stone: "Construction", marble: "Construction", tile: "Construction",
  paint: "Painting", brush: "Painting", roller: "Painting", thinner: "Painting",
  wire: "Electrical", cable: "Electrical", switch: "Electrical",
  socket: "Electrical", fuse: "Electrical", bulb: "Electrical", tube: "Electrical",
  pipe: "Plumbing", tap: "Plumbing", valve: "Plumbing", fitting: "Plumbing",
  oil: "Lubricants", grease: "Lubricants", tyre: "Auto",
  soap: "Cleaning", detergent: "Cleaning", cleaner: "Cleaning",
  glue: "Chemicals", sealant: "Chemicals",
}

function guessCategory(name: string): string {
  const lower = name.toLowerCase()
  for (const [keyword, cat] of Object.entries(CATEGORY_HINTS)) {
    if (lower.includes(keyword)) return cat
  }
  return ""
}

function capitalizeName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

export function InventoryPreviewDialog({
  item,
  onConfirm,
  onCancel,
}: {
  item: { name: string; price: number; category: string; brand: string; messageId: string } | null
  onConfirm: (item: { name: string; price: number; category: string; brand: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [brand, setBrand] = useState("")
  const [userEditedCategory, setUserEditedCategory] = useState(false)

  useEffect(() => {
    if (item) {
      setName(capitalizeName(item.name))
      setPrice(item.price ? String(item.price) : "")
      setCategory(item.category || guessCategory(item.name))
      setBrand(item.brand || "")
      setUserEditedCategory(false)
    }
  }, [item])

  const handleNameChange = (val: string) => {
    setName(val)
    if (!userEditedCategory) {
      const guessed = guessCategory(val)
      if (guessed) setCategory(guessed)
    }
  }

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    setUserEditedCategory(true)
  }

  const handleConfirm = () => {
    if (!name.trim() || !price) return
    onConfirm({
      name: capitalizeName(name),
      price: parseFloat(price) || 0,
      category: category.trim(),
      brand: brand.trim(),
    })
  }

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to Inventory</DialogTitle>
          <DialogDescription>
            Main ne jo samajha woh yeh hai. Agar kuch galat hai toh edit karo aur confirm karo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="inv-name" className="text-xs">Item Name *</Label>
            <Input id="inv-name" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Nails" autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inv-price" className="text-xs">Price (₹) *</Label>
            <Input id="inv-price" type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 50" autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inv-category" className="text-xs">Category</Label>
            <Input id="inv-category" value={category} onChange={(e) => handleCategoryChange(e.target.value)} placeholder="e.g. Hardware" autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inv-brand" className="text-xs">Brand</Label>
            <Input id="inv-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Tata" autoComplete="off" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={handleConfirm} disabled={!name.trim() || !price}>Add to Inventory</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ReminderDialog({
  customers,
  onConfirm,
  onCancel,
}: {
  customers: Array<{ _id: string; name: string; total: number; invoiceCount: number }> | null
  onConfirm: (customerIds: string[]) => void
  onCancel: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (customers) setSelected(new Set(customers.map((c) => c._id)))
  }, [customers])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (!customers) return
    setSelected((prev) =>
      prev.size === customers.length
        ? new Set()
        : new Set(customers.map((c) => c._id)),
    )
  }

  return (
    <Dialog open={!!customers} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Send Payment Reminder</DialogTitle>
          <DialogDescription>
            In customers ka outstanding balance hai. Select karo jinhe reminder bhejna hai.
          </DialogDescription>
        </DialogHeader>
        {customers && (
          <div className="space-y-2 py-2 max-h-64 overflow-y-auto">
            <label className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm cursor-pointer hover:bg-muted">
              <input type="checkbox" checked={selected.size === customers.length} onChange={toggleAll} className="h-4 w-4" />
              <span className="font-medium">All Customers</span>
              <span className="ml-auto text-xs text-muted-foreground">{customers.length} total</span>
            </label>
            {customers.map((c) => (
              <label key={c._id} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm cursor-pointer hover:bg-muted">
                <input type="checkbox" checked={selected.has(c._id)} onChange={() => toggle(c._id)} className="h-4 w-4" />
                <span className="truncate flex-1 font-medium">{c.name}</span>
                <span className="shrink-0 text-destructive font-medium">₹{c.total.toLocaleString("en-IN")}</span>
              </label>
            ))}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={() => onConfirm(Array.from(selected))} disabled={selected.size === 0}>
            Send Reminder ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-1">
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl bg-muted/70 px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "150ms" }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  onSuggestion,
  showTimestamp,
}: {
  message: ChatMessage
  onSuggestion: (q: string) => void
  showTimestamp?: boolean
}) {
  const { role, content, command } = message

  return (
    <div className={cn("flex items-end gap-2.5 group", role === "user" ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 ring-background",
          role === "user"
            ? "bg-primary"
            : "bg-gradient-to-br from-primary/80 to-primary",
        )}
      >
        {role === "user" ? (
          <User className="h-3.5 w-3.5 text-primary-foreground" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
        )}
      </div>

      {/* Content */}
      <div className={cn("max-w-[85%] space-y-1.5", role === "user" ? "items-end" : "items-start")}>
        {/* Bubble */}
        <div
          className={cn(
            "relative text-sm leading-relaxed",
            role === "user"
              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm"
              : "bg-card text-foreground rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm border border-border/40",
          )}
        >
          {content}
        </div>

        {/* Results & actions */}
        {command?.type === "query" && command.data && (
          <div className={cn(
            "pt-1.5",
            role === "user" && "w-full",
          )}>
            {command.queryType === "invoices" && <InvoiceResults data={command.data} />}
            {command.queryType === "stats" && <StatsResults data={command.data} />}
            {command.queryType === "inventory" && <InventoryResults data={command.data} />}
            {command.queryType === "customers" && <CustomerResults data={command.data} />}
            {command.queryType === "outstanding" && <OutstandingResults data={command.data} />}
          </div>
        )}

        {command?.actions && command.actions.length > 0 && (
          <div className={cn(
            "pt-0.5",
            role === "user" && "flex justify-end",
          )}>
            <ActionButtons actions={command.actions} />
          </div>
        )}

        {command?.type === "help" && <HelpView suggestions={command.suggestions} onPick={onSuggestion} />}

        {command?.type === "unknown" && (
          <button
            type="button"
            onClick={() => onSuggestion("help")}
            className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 pt-0.5"
          >
            Type &quot;help&quot; to see what I can do
          </button>
        )}

        {/* Timestamp */}
        {showTimestamp && (
          <p className={cn(
            "text-[10px] text-muted-foreground/60 px-1",
            role === "user" && "text-right",
          )}>
            {formatTime(Date.now())}
          </p>
        )}
      </div>
    </div>
  )
}

function WelcomeScreen({ onPick }: { onPick: (q: string) => void }) {
  const suggestionFlavors = [
    { icon: IndianRupee, label: "Kitna udhaar hai?", desc: "Check outstanding balance", color: "from-primary to-primary/80" },
    { icon: TrendingUp, label: "Show revenue", desc: "Business summary & stats", color: "from-primary to-primary/80" },
    { icon: FileText, label: "Create invoice", desc: "New bill banayein", color: "from-primary to-primary/80" },
    { icon: Package, label: "Add to inventory", desc: "Naya product daalein", color: "from-primary to-primary/80" },
    { icon: Users, label: "Pending payments", desc: "Baki payment follow up", color: "from-primary to-primary/80" },
    { icon: Building2, label: "Mere customers", desc: "Customer list dekhein", color: "from-primary to-primary/80" },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      {/* Logo mark */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/90 to-primary shadow-lg shadow-primary/20">
        <Sparkles className="h-8 w-8 text-primary-foreground" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-foreground text-center">
        Namaste! Main aapka AI assistant hoon
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground text-center max-w-sm">
        Poochhiye invoices, revenue, customers ya inventory ke baare mein — Hindi ya English mein
      </p>

      {/* Quick action cards */}
      <div className="mt-8 w-full max-w-lg">
        <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest text-center mb-3">
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {suggestionFlavors.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onPick(s.label)}
              className="group flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-card/50 p-3.5 text-left text-sm transition-all hover:border-border hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm transition-transform group-hover:scale-105",
                s.color,
              )}>
                <s.icon className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="mt-0.5 font-semibold text-foreground leading-tight">{s.label}</span>
              <span className="text-[11px] text-muted-foreground/70">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Voice hint */}
      <div className="mt-8 flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-xs text-muted-foreground">
        <Mic className="h-3.5 w-3.5 text-primary/60" />
        Aap bol bhi sakte hain — mic button dabakar
      </div>
    </div>
  )
}

export function ChatUI({
  messages,
  onSendMessage,
  onSuggestion,
  isProcessing,
}: {
  messages: ChatMessage[]
  onSendMessage: (text: string) => void
  onSuggestion: (text: string) => void
  isProcessing: boolean
}) {
  const [input, setInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = () => {
    const text = input.trim()
    if (!text || isProcessing) return
    setInput("")
    onSendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const toggleListening = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop()
      setIsListening(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4"
      const mediaRecorder = new MediaRecorder(stream, { mimeType })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true)
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType })
          const formData = new FormData()
          formData.append("audio", blob, "recording.webm")

          const res = await fetch("/api/chat/transcribe", {
            method: "POST",
            body: formData,
          })

          if (!res.ok) throw new Error("Transcription failed")

          const { transcript } = await res.json()
          if (transcript?.trim()) {
            setInput(transcript)
            onSendMessage(transcript)
          }
        } catch {
          toast.error("Voice transcription failed. Please try again or type your message.")
        } finally {
          setIsTranscribing(false)
          stream.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()
      setIsListening(true)
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        toast.error("Microphone access denied. Please allow mic permissions.")
      } else if (err?.name === "NotFoundError") {
        toast.error("No microphone found. Please connect a mic and try again.")
      } else {
        toast.error("Could not access microphone. Please check your mic settings.")
      }
    }
  }

  const isWelcome = messages.length === 0 || (messages.length === 1 && messages[0].id === "welcome")

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      {isWelcome ? (
        <div className="flex-1 overflow-y-auto">
          <WelcomeScreen onPick={onSuggestion} />
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4 md:px-6 lg:px-8">
          <div className="space-y-4 max-w-3xl mx-auto py-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onSuggestion={onSuggestion} />
            ))}
            {isProcessing && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      {/* Input area */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 lg:px-8 py-3 md:py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
              {/* Mic button */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={isTranscribing}
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                  isTranscribing
                    ? "bg-primary/10 text-primary"
                    : isListening
                      ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 scale-110"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                title={isListening ? "Stop recording" : isTranscribing ? "Transcribing..." : "Voice input"}
              >
                {isTranscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isListening ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>

              {/* Input */}
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Sun raha hoon..." : isTranscribing ? "Transcribing..." : "Poochhiye kuch bhi... Hindi ya English"}
                  className={cn(
                    "h-11 w-full rounded-xl border-border/60 bg-muted/50 pl-4 pr-12 text-sm placeholder:text-muted-foreground/50 transition-all",
                    "focus-visible:bg-background focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/10",
                    isListening && "border-destructive/50 bg-destructive/5",
                  )}
                  disabled={isProcessing || isTranscribing}
                />
              </div>

            {/* Send button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                input.trim() && !isProcessing
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95"
                  : "bg-muted/70 text-muted-foreground/50",
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Floating action button (navigates to chat page)
// ---------------------------------------------------------------------------

export function AIChatFAB() {
  return null
}

// ---------------------------------------------------------------------------
// Conversation management hook (unchanged)
// ---------------------------------------------------------------------------

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveConversations(convs: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs))
  } catch {}
}

export function useChatManager() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const convs = loadConversations()
    setConversations(convs)
    if (convs.length > 0 && !activeId) {
      setActiveId(convs[0].id)
    }
  }, [])

  const persist = useCallback((convs: Conversation[]) => {
    setConversations(convs)
    saveConversations(convs)
  }, [])

  const activeConversation = conversations.find((c) => c.id === activeId)

  const getMessages = useCallback(() => activeConversation?.messages || [], [activeConversation])

  const setMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setConversations((prev) => {
        const next = [...prev]
        const idx = next.findIndex((c) => c.id === activeId)
        if (idx === -1) return prev
        const current = next[idx].messages
        const updated = typeof updater === "function" ? updater(current) : updater
        next[idx] = { ...next[idx], messages: updated, updatedAt: Date.now() }
        saveConversations(next)
        return next
      })
    },
    [activeId],
  )

  const newConversation = useCallback(() => {
    const conv: Conversation = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content:
            "Namaste! Main aapka AI assistant hoon. Ask me about invoices, revenue, customers, or inventory - Hindi ya English mein poochh sakte hain.",
          command: {
            type: "help",
            message: "How can I help you?",
            suggestions: [
              "Show pending payments",
              "Create manual invoice",
              "Voice entry",
              "Show revenue",
              "बकाया payment dikhao",
              "Kitna revenue hua",
            ],
          },
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const updated = [conv, ...conversations]
    persist(updated)
    setActiveId(conv.id)
    return conv.id
  }, [conversations, persist])

  const switchConversation = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const deleteConversation = useCallback(
    (id: string) => {
      const updated = conversations.filter((c) => c.id !== id)
      persist(updated)
      if (activeId === id) {
        setActiveId(updated.length > 0 ? updated[0].id : null)
      }
    },
    [conversations, activeId, persist],
  )

  const updateTitle = useCallback(
    (id: string, title: string) => {
      setConversations((prev) => {
        const next = [...prev]
        const idx = next.findIndex((c) => c.id === id)
        if (idx > -1) next[idx] = { ...next[idx], title }
        saveConversations(next)
        return next
      })
    },
    [],
  )

  // Auto-title: use first user message as title
  useEffect(() => {
    if (!activeConversation) return
    if (activeConversation.title !== "New Chat") return
    const userMsg = activeConversation.messages.find((m) => m.role === "user")
    if (userMsg) {
      const title = userMsg.content.length > 40
        ? userMsg.content.slice(0, 40) + "..."
        : userMsg.content
      updateTitle(activeConversation.id, title)
    }
  }, [activeConversation, updateTitle])

  // Initialize first conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      newConversation()
    }
  }, [conversations.length, newConversation])

  // Update messages on active conversation change
  const messages = activeConversation?.messages || []

  return {
    conversations,
    activeId,
    messages,
    setMessages,
    newConversation,
    switchConversation,
    deleteConversation,
    activeConversationTitle: activeConversation?.title,
  }
}
