"use client"

import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Upload, Loader2, FileText, AlertCircle, CheckCircle2, X } from "lucide-react"

interface ParsedItem {
  name: string
  price: number
  category: string
  brand: string
}

interface BulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const MAX_FILE_SIZE = 2 * 1024 * 1024

function parseCSV(text: string): ParsedItem[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  const headerLine = lines[0].toLowerCase()
  const hasHeader = /name/.test(headerLine) && /price/.test(headerLine)
  const dataLines = hasHeader ? lines.slice(1) : lines

  return dataLines.map((line) => {
    const parts = line.split(",").map((p) => p.trim())
    return {
      name: parts[0] || "",
      price: parseFloat(parts[1]?.replace(/[₹,]/g, "")) || 0,
      category: parts[2] || "",
      brand: parts[3] || "",
    }
  }).filter((i) => i.name && i.price > 0)
}

function parseJSON(text: string): ParsedItem[] {
  const data = JSON.parse(text)
  const arr = Array.isArray(data) ? data : data.items || data.products || []
  return arr.map((item: Record<string, unknown>) => ({
    name: String(item.name || item.title || "").trim(),
    price: parseFloat(String(item.price || item.rate || 0)) || 0,
    category: String(item.category || item.cat || "").trim(),
    brand: String(item.brand || "").trim(),
  })).filter((i: ParsedItem) => i.name && i.price > 0)
}

function parseTXT(text: string): ParsedItem[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const sep = line.includes("\t") ? "\t" : ","
    const parts = line.split(sep).map((p) => p.trim())
    return {
      name: parts[0] || "",
      price: parseFloat(parts[1]?.replace(/[₹,]/g, "")) || 0,
      category: parts[2] || "",
      brand: parts[3] || "",
    }
  }).filter((i) => i.name && i.price > 0)
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess }: BulkUploadDialogProps) {
  const [parsed, setParsed] = useState<ParsedItem[]>([])
  const [fileName, setFileName] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setError("")
    setParsed([])
    setFileName("")

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 2MB.")
      return
    }

    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!ext || !["csv", "json", "txt"].includes(ext)) {
      setError("Unsupported file format. Use CSV, JSON, or TXT.")
      return
    }

    const text = await file.text()
    if (!text.trim()) {
      setError("File is empty.")
      return
    }

    let items: ParsedItem[] = []
    try {
      if (ext === "csv") items = parseCSV(text)
      else if (ext === "json") items = parseJSON(text)
      else items = parseTXT(text)
    } catch {
      setError("Failed to parse file. Check the format.")
      return
    }

    if (items.length === 0) {
      setError("No valid items found. Ensure each entry has a name and price.")
      return
    }

    setParsed(items)
    setFileName(file.name)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleUpload = async () => {
    if (parsed.length === 0) return
    setUploading(true)
    try {
      const res = await fetch("/api/inventory/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      toast.success(`${data.created} products added`)
      setParsed([])
      setFileName("")
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Upload Products</DialogTitle>
          <DialogDescription>
            Upload a CSV, JSON, or TXT file with your product data.{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                const sample = `name,price,category,brand
Engine Oil 10W40,450,Lubricants,Castrol
Brake Fluid DOT4,350,Fluids,Bosch
Air Filter,250,Filters,MANN`
                const blob = new Blob([sample], { type: "text/csv" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "sample-products.csv"
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="text-primary underline"
              onClickCapture={(e) => e.stopPropagation()}
            >
              Download sample CSV
            </a>
          </DialogDescription>
        </DialogHeader>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drop a file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports CSV, JSON, TXT (max 2MB)
          </p>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {parsed.length > 0 && (
          <div className="flex-1 min-h-0 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {fileName} — {parsed.length} product{parsed.length !== 1 ? "s" : ""} found
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setParsed([])
                  setFileName("")
                }}
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Price</th>
                    <th className="text-left p-2 font-medium">Category</th>
                    <th className="text-left p-2 font-medium">Brand</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsed.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/25">
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">₹{item.price.toLocaleString()}</td>
                      <td className="p-2 text-muted-foreground">{item.category || "—"}</td>
                      <td className="p-2 text-muted-foreground">{item.brand || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Upload {parsed.length} Product{parsed.length !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
