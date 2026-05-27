import Razorpay from "razorpay";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  console.error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env.local");
  process.exit(1);
}

const razorpay = new Razorpay({ key_id, key_secret });

const plans = [
  {
    name: "Starter",
    description: "100 voice transcriptions/mo, unlimited invoices, inventory & customer management",
    amount: 49900,
    period: "monthly",
    envKey: "RAZORPAY_STARTER_PLAN_ID",
  },
  {
    name: "Pro",
    description: "300 voice transcriptions/mo, unlimited invoices, priority support, advanced analytics",
    amount: 99900,
    period: "monthly",
    envKey: "RAZORPAY_PRO_PLAN_ID",
  },
];

async function main() {
  for (const plan of plans) {
    try {
      const existing = await razorpay.plans.all({ count: 50 });
      const match = existing.items.find(
        (p: { item?: { name?: string }; period?: string }) =>
          p.item?.name === plan.name &&
          p.period === plan.period,
      ) as { id?: string } | undefined;
      if (match) {
        console.log(`${plan.name}: Already exists — ${match.id}`);
        console.log(`  Add to .env.local: ${plan.envKey}=${match.id}`);
        continue;
      }
    } catch {
      // proceed to create
    }

    const created = await razorpay.plans.create({
      period: plan.period as "monthly",
      interval: 1,
      item: {
        name: plan.name,
        description: plan.description,
        amount: plan.amount,
        currency: "INR",
      },
    });

    console.log(`${plan.name}: Created — ${created.id}`);
    console.log(`  Add to .env.local: ${plan.envKey}=${created.id}`);
  }

  console.log("\nDone. Copy the plan IDs above into your .env.local file.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
