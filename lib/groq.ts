import Groq from "groq-sdk"
import { toFile } from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const file = await toFile(audioBuffer, "audio.wav")

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3-turbo",
    language: "en",
    response_format: "verbose_json",
    prompt:
      "Write Hinglish in Roman script: teen kilo, do sau rupaye, kaise ho aap, namaste, aloo, tamatar, baingan",
  })

  return transcription.text
}

export interface ParsedInvoice {
  customerName?: string
  customerPhone?: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  services: Array<{
    name: string
    price: number
  }>
  labourCharges?: number
  discount?: number
  notes?: string
}

interface InventoryItem {
  name: string
  price: number
  category?: string
  brand?: string
}

export async function parseInvoiceFromTranscript(
  transcript: string,
  inventory?: InventoryItem[],
): Promise<ParsedInvoice> {
  const inventoryContext =
    inventory && inventory.length > 0
      ? `\n\nYour inventory (match items against these products, use their prices if found):\n${inventory
          .map(
            (i) =>
              `- ${i.name} (₹${i.price})${i.category ? ` [${i.category}]` : ""}${i.brand ? ` — ${i.brand}` : ""}`,
          )
          .join("\n")}`
      : ""

  const systemPrompt = `You are a business data extraction AI. Extract structured invoice data from voice transcript. The transcript is in Hinglish (Hindi + English mix in Roman script).

Extract:
- customerName (if mentioned)
- customerPhone (if mentioned)
- items: array of { name, quantity, price } — products mentioned, where PRICE is per-unit rate
- services: array of { name, price } — services mentioned (e.g. wheel alignment, oil change)
- labourCharges (if mentioned as labour/charges)
- discount (if mentioned)
- notes (any additional relevant info)

Rules:
- Compute per-unit price from total. E.g. "3 kg beans 200 rupees" means quantity=3, price per unit=66.67 (total 200/3). NEVER set price=200 when quantity>1 unless it's clearly per-unit.
- If quantity not specified, assume 1
- If price per item not specified but total given, try to derive
- MATCH spoken items against the inventory list if provided — use the inventory product name and price when a match is found
- Be conservative — only extract what's clearly stated
- Prices are in INR (₹)
- Return ONLY valid JSON, no markdown, no explanation
- CRITICAL: All numeric values must be plain numbers. NEVER output mathematical expressions like "200/3" — compute the result (e.g., 66.67).
- When a price phrase like "both costing X rupees" or "each costing X rupees" follows a list of services, apply that price to EACH service. Do not leave services with price=0.${inventoryContext}`

  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Extract invoice data from this Hinglish transcript: "${transcript}"`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      })

      const content = completion.choices[0]?.message?.content || "{}"

      const parsed = JSON.parse(content) as ParsedInvoice
      return {
        items: parsed.items || [],
        services: parsed.services || [],
        customerName: parsed.customerName || "",
        customerPhone: parsed.customerPhone || "",
        labourCharges: parsed.labourCharges || 0,
        discount: parsed.discount || 0,
        notes: parsed.notes || "",
      }
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}
