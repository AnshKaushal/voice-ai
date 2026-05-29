export function generateInvoiceNumber(businessPrefix: string = "INV"): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${businessPrefix}-${timestamp}${random}`
}

export function calculateTotals(
  items: Array<{ quantity: number; price: number }>,
  services: Array<{ price: number }>,
  labourCharges: number = 0,
  discount: number = 0,
  taxRate: number = 0,
) {
  const itemsTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  )
  const servicesTotal = services.reduce((sum, s) => sum + s.price, 0)
  const subtotal = itemsTotal + servicesTotal + labourCharges
  const tax = (subtotal * taxRate) / 100
  const total = subtotal + tax - discount

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemsTotal: Math.round(itemsTotal * 100) / 100,
    servicesTotal: Math.round(servicesTotal * 100) / 100,
  }
}
