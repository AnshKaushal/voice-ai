import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI must be set in .env.local");
  process.exit(1);
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const collections = await mongoose.connection.db?.listCollections().toArray();
  const names = collections?.map((c) => c.name).join(", ") || "none";

  console.log(`\nCollections found: ${names}`);
  console.log("\n⚠️  This will DELETE ALL DATA in the database above.");
  console.log("   Press Ctrl+C within 5 seconds to cancel...");

  await new Promise((resolve) => setTimeout(resolve, 5000));

  await mongoose.connection.dropDatabase();
  console.log("\n✓ Database dropped. All collections cleared.");

  await mongoose.disconnect();
  console.log("Disconnected.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
