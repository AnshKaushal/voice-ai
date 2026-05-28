import mongoose, { Schema, Document } from "mongoose";

export interface IBusiness extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin?: string;
  defaultTaxRate: number;
  businessType: "workshop" | "tyre_shop" | "pharmacy" | "hardware" | "wholesale" | "general";
  credits: number;
  subscription: "free" | "starter" | "pro";
  subscriptionStatus: "trialing" | "active" | "cancelled" | "expired" | "past_due";
  razorpaySubscriptionId?: string;
  trialStart?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String, default: "" },
    gstin: { type: String, default: "" },
    defaultTaxRate: { type: Number, default: 0 },
    businessType: {
      type: String,
      enum: ["workshop", "tyre_shop", "pharmacy", "hardware", "wholesale", "general"],
      default: "general",
    },
    credits: { type: Number, default: 50 },
    subscription: {
      type: String,
      enum: ["free", "starter", "pro"],
      default: "free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["trialing", "active", "cancelled", "expired", "past_due"],
      default: "trialing",
    },
    razorpaySubscriptionId: { type: String, default: "" },
    trialStart: { type: Date },
    trialEnd: { type: Date },
  },
  { timestamps: true }
);

export const Business =
  mongoose.models.Business ?? mongoose.model<IBusiness>("Business", BusinessSchema);
