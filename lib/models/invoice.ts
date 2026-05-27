import mongoose, { Schema, Document } from "mongoose";

export interface IInvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IInvoiceService {
  name: string;
  price: number;
}

export interface IInvoice extends Document {
  businessId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  invoiceNumber: string;
  items: IInvoiceItem[];
  services: IInvoiceService[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  labourCharges: number;
  total: number;
  status: "draft" | "sent" | "paid" | "cancelled";
  source: "voice" | "manual";
  rawTranscript?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoiceServiceSchema = new Schema<IInvoiceService>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    invoiceNumber: { type: String, required: true },
    items: { type: [InvoiceItemSchema], default: [] },
    services: { type: [InvoiceServiceSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    labourCharges: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "cancelled"],
      default: "draft",
    },
    source: {
      type: String,
      enum: ["voice", "manual"],
      default: "voice",
    },
    rawTranscript: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

InvoiceSchema.index({ businessId: 1, createdAt: -1 });
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

export const Invoice =
  mongoose.models.Invoice ?? mongoose.model<IInvoice>("Invoice", InvoiceSchema);
