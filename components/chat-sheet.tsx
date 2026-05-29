"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  ChatUI,
  useChatManager,
  InventoryPreviewDialog,
  ReminderDialog,
  formatRelativeTime,
} from "@/components/ai-chat"
import type { CommandResult, ChatMessage } from "@/components/ai-chat"
import {
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  Search,
  X,
  FileText,
  Mic,
  Package,
  Users,
  MessageCircle,
  ChevronDown,
} from "lucide-react"

export function ChatSheet() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 active:scale-95 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground hover:shadow-xl hover:shadow-primary/30"
        title="AI Assistant"
      >
        <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
      </button>

      {/* Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:max-w-[500px] p-0 flex flex-col bg-background"
        >
          <SheetTitle className="sr-only">AI Assistant Chat</SheetTitle>
          <ChatPanel
            onClose={() => setOpen(false)}
            onNavigate={(path) => {
              setOpen(false)
              router.push(path)
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}

function ChatPanel({
  onClose,
  onNavigate,
}: {
  onClose: () => void
  onNavigate: (path: string) => void
}) {
  const {
    conversations,
    activeId,
    messages,
    setMessages,
    newConversation,
    switchConversation,
    deleteConversation,
  } = useChatManager()

  const [isProcessing, setIsProcessing] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [pendingInventory, setPendingInventory] = useState<{
    name: string
    price: number
    category: string
    brand: string
    messageId: string
  } | null>(null)
  const [pendingReminder, setPendingReminder] = useState<{
    customers: Array<{
      _id: string
      name: string
      total: number
      invoiceCount: number
    }>
    messageId: string
  } | null>(null)

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q)),
    )
  }, [conversations, searchQuery])

  const sendReminder = useCallback(
    async (customerIds: string[]) => {
      if (!pendingReminder) return
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingReminder.messageId
            ? {
                ...m,
                command: { ...m.command!, data: { type: "sending" as const } },
              }
            : m,
        ),
      )

      let sent = 0
      let waUrls: string[] = []
      for (const cId of customerIds) {
        try {
          const res = await fetch(`/api/customers/${cId}/remind`, {
            method: "POST",
          })
          if (res.ok) {
            const data = await res.json()
            if (data.success) {
              sent++
              if (data.waUrl) waUrls.push(data.waUrl)
            }
          }
        } catch {}
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingReminder.messageId
            ? {
                ...m,
                content: `✅ ${sent} customer(s) ko reminder bhej diya. ${waUrls.length > 0 ? "WhatsApp link(s) bhi open ho gaye." : ""}`,
                command: {
                  ...m.command!,
                  data: { type: "success" as const, sent, waUrls },
                },
              }
            : m,
        ),
      )
      setPendingReminder(null)
    },
    [pendingReminder, setMessages],
  )

  const confirmInventory = useCallback(
    async (item: {
      name: string
      price: number
      category: string
      brand: string
    }) => {
      if (!pendingInventory) return
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingInventory.messageId
            ? {
                ...m,
                command: { ...m.command!, data: { type: "saving" as const } },
              }
            : m,
        ),
      )

      try {
        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        })
        if (!res.ok) throw new Error("Save failed")
        const { item: saved } = await res.json()
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingInventory.messageId
              ? {
                  ...m,
                  content: `✅ Done! **${saved.name}** (₹${saved.price}) inventory mein add ho gaya.`,
                  command: {
                    ...m.command!,
                    data: { type: "success" as const, item: saved },
                  },
                }
              : m,
          ),
        )
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingInventory.messageId
              ? {
                  ...m,
                  content: "❌ Item add nahi ho paya. Please try again.",
                  command: { ...m.command!, data: { type: "error" as const } },
                }
              : m,
          ),
        )
      } finally {
        setPendingInventory(null)
      }
    },
    [pendingInventory, setMessages],
  )

  const enrichCommand = useCallback((cmd: CommandResult): CommandResult => {
    if (cmd.type === "navigate") {
      const pathMap: Record<
        string,
        { label: string; icon: React.ComponentType<{ className?: string }> }
      > = {
        "/dashboard/invoices": { label: "Invoices", icon: FileText },
        "/dashboard/invoices/new": { label: "New Invoice", icon: FileText },
        "/dashboard/voice": { label: "Voice Entry", icon: Mic },
        "/dashboard/inventory": { label: "Inventory", icon: Package },
        "/dashboard/customers": { label: "Customers", icon: Users },
        "/dashboard/settings": { label: "Settings", icon: FileText },
        "/dashboard/analytics": { label: "Analytics", icon: FileText },
      }
      const info = pathMap[cmd.path || ""]
      return {
        ...cmd,
        message: cmd.message,
        actions: info
          ? [
              {
                label: `Go to ${info.label}`,
                href: cmd.path || "",
                icon: info.icon,
              },
            ]
          : cmd.path
            ? [{ label: "Go there", href: cmd.path }]
            : undefined,
      }
    }
    return cmd
  }, [])

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isProcessing) return

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      }
      setMessages((prev) => [...prev, userMsg])
      setIsProcessing(true)

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        })
        if (!res.ok) throw new Error("Request failed")
        const command: CommandResult = await res.json()

        if (command.type === "action" && command.action === "send-reminder") {
          const id = crypto.randomUUID()
          setMessages((prev) => [
            ...prev,
            { id, role: "assistant", content: command.message, command },
          ])
          const customers = (command.data || []) as Array<{
            _id: string
            name: string
            total: number
            invoiceCount: number
          }>
          if (customers.length === 0) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === id
                  ? {
                      ...m,
                      content:
                        "Kisi bhi customer ka koi outstanding balance nahi hai. 🎉",
                    }
                  : m,
              ),
            )
          } else {
            setPendingReminder({ customers, messageId: id })
          }
          setIsProcessing(false)
          return
        }

        if (command.type === "action" && command.action === "add-inventory") {
          const id = crypto.randomUUID()
          setMessages((prev) => [
            ...prev,
            { id, role: "assistant", content: command.message, command },
          ])
          setPendingInventory({
            name: (command.params?.name as string) || "",
            price: (command.params?.price as number) || 0,
            category: (command.params?.category as string) || "",
            brand: (command.params?.brand as string) || "",
            messageId: id,
          })
          setIsProcessing(false)
          return
        }

        const enriched = enrichCommand(command)
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: enriched.message,
            command: enriched,
          },
        ])

        if (command.type === "action" && command.action === "clear") {
          setTimeout(() => setMessages([]), 400)
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Sorry, I ran into an error. Please try again.",
            command: { type: "error", message: "Sorry, I ran into an error." },
          },
        ])
      } finally {
        setIsProcessing(false)
      }
    },
    [isProcessing, setMessages, enrichCommand],
  )

  const handleSuggestion = useCallback(
    (query: string) => {
      if (query.startsWith("/go ")) {
        const path = query.replace("/go ", "")
        onNavigate(path)
        return
      }
      handleSendMessage(query)
    },
    [handleSendMessage, onNavigate],
  )

  const activeTitle =
    conversations.find((c) => c.id === activeId)?.title || "AI Assistant"

  const navActions = useMemo(() => {
    const actions: {
      label: string
      href: string
      icon: React.ComponentType<{ className?: string }>
    }[] = []
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.command?.actions) {
        lastMsg.command.actions.forEach((a) => {
          if (a.href && a.icon) {
            actions.push({
              label: a.label,
              href: a.href,
              icon: a.icon as React.ComponentType<{ className?: string }>,
            })
          }
        })
      }
    }
    return actions
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 h-14 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setShowSidebar(!showSidebar)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors shrink-0",
              showSidebar
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
            title="Conversations"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/90 to-primary shadow-sm shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate leading-tight">
              {activeTitle}
            </h2>
            <p className="text-[10px] text-muted-foreground/60 leading-tight">
              {conversations.find((c) => c.id === activeId)?.messages.length ||
                0}{" "}
              messages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isProcessing && (
            <div className="flex items-center gap-1.5 bg-primary/5 rounded-full px-2.5 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <span className="text-[10px] text-muted-foreground">
                Thinking...
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Conversations sidebar (collapsible) */}
      {showSidebar && (
        <div className="border-b border-border/30 bg-sidebar/50">
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-7 rounded-md bg-muted/60 border border-border/30 pl-7 pr-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                newConversation()
                setShowSidebar(false)
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
              title="New Chat"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto px-2 pb-2 space-y-0.5">
            {filteredConversations.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 text-center py-4">
                No conversations
              </p>
            ) : (
              filteredConversations.map((conv) => {
                const lastUserMsg = [...conv.messages]
                  .reverse()
                  .find((m) => m.role === "user")
                const isActive = conv.id === activeId
                return (
                  <div
                    key={conv.id}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs cursor-pointer transition-all",
                      isActive
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                    )}
                    onClick={() => {
                      switchConversation(conv.id)
                      setShowSidebar(false)
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "bg-sidebar-accent text-muted-foreground",
                      )}
                    >
                      {conv.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-medium">
                          {conv.title}
                        </span>
                        <span className="shrink-0 text-[9px] text-muted-foreground/50">
                          {formatRelativeTime(conv.updatedAt)}
                        </span>
                      </div>
                      {lastUserMsg && (
                        <p className="truncate text-[10px] text-muted-foreground/50 leading-tight mt-0.5">
                          {lastUserMsg.content}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conv.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3 text-destructive/60" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Chat content */}
      <div className="flex-1 min-h-0">
        <ChatUI
          messages={messages}
          onSendMessage={handleSendMessage}
          onSuggestion={handleSuggestion}
          isProcessing={isProcessing}
        />
      </div>

      {/* Navigation actions */}
      {navActions.length > 0 && (
        <div className="border-t border-border/20 bg-muted/20 px-3 py-1.5 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {navActions.map((a) => (
              <button
                key={a.href}
                type="button"
                onClick={() => onNavigate(a.href)}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <a.icon className="h-3 w-3" />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ReminderDialog
        customers={pendingReminder?.customers || null}
        onConfirm={(ids) => sendReminder(ids)}
        onCancel={() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === pendingReminder?.messageId
                ? {
                    ...m,
                    command: {
                      ...m.command!,
                      data: { type: "cancelled" as const },
                    },
                  }
                : m,
            ),
          )
          setPendingReminder(null)
        }}
      />

      <InventoryPreviewDialog
        item={pendingInventory}
        onConfirm={(item) => confirmInventory(item)}
        onCancel={() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === pendingInventory?.messageId
                ? {
                    ...m,
                    command: {
                      ...m.command!,
                      data: { type: "cancelled" as const },
                    },
                  }
                : m,
            ),
          )
          setPendingInventory(null)
        }}
      />
    </div>
  )
}
