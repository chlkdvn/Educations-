import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Clerk user ID string
      required: true,
      unique: true, // one wallet per user
    },
    balance: {
      type: Number,
      default: 0, // balance in NGN
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ["credit", "debit"],
          required: true,
        },
        amount: { type: Number, required: true },
        reference: { type: String }, // Paystack reference or internal ref
        description: { type: String },
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "pending",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Wallet = mongoose.model("Wallet", walletSchema);
