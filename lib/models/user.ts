import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
  email: string
  name?: string
  phone?: string
  password?: string
  image?: string
  emailVerified: Date | null
  onboardingCompleted: boolean
  businessId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    password: { type: String },
    image: { type: String, default: "" },
    emailVerified: { type: Date, default: null },
    onboardingCompleted: { type: Boolean, default: false },
    businessId: { type: Schema.Types.ObjectId, ref: "Business" },
  },
  { timestamps: true },
)

export const User =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema)
