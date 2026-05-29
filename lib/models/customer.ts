import mongoose, { Schema, Document } from "mongoose"

export interface ICustomer extends Document {
  businessId: mongoose.Types.ObjectId
  name: string
  phone: string
  email?: string
  address?: string
  vehicleDetails?: string
  notes?: string
  totalVisits: number
  totalSpent: number
  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<ICustomer>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    vehicleDetails: { type: String, default: "" },
    notes: { type: String, default: "" },
    totalVisits: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true },
)

CustomerSchema.index({ businessId: 1, phone: 1 })

export const Customer =
  mongoose.models.Customer ??
  mongoose.model<ICustomer>("Customer", CustomerSchema)
