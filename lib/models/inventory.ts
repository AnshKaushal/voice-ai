import mongoose, { Schema, Document } from "mongoose";

export interface IInventoryItem extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  category?: string;
  brand?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: "" },
    brand: { type: String, default: "" },
  },
  { timestamps: true }
);

InventoryItemSchema.index({ businessId: 1, name: 1 });
InventoryItemSchema.index({ businessId: 1, category: 1 });

export const InventoryItem =
  mongoose.models.InventoryItem ?? mongoose.model<IInventoryItem>("InventoryItem", InventoryItemSchema);
