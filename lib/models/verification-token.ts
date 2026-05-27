import mongoose, { Schema, Document } from "mongoose";

export interface IVerificationToken extends Document {
  identifier: string;
  token: string;
  expires: Date;
  attempts: number;
}

const VerificationTokenSchema = new Schema<IVerificationToken>({
  identifier: { type: String, required: true },
  token: { type: String, required: true },
  expires: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
});

VerificationTokenSchema.index({ identifier: 1, token: 1 });
VerificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken =
  mongoose.models.VerificationToken ??
  mongoose.model<IVerificationToken>("VerificationToken", VerificationTokenSchema);
