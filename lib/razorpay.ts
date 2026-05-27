import Razorpay from "razorpay"

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function createSubscriptionOrder(
  planId: string,
  businessId: string,
) {
  return razorpay.subscriptions.create({
    plan_id: planId,
    total_count: 12,
    customer_notify: 1,
    notes: { businessId },
  })
}

export async function createPaymentOrder(amount: number, receipt: string) {
  return razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt,
  })
}
