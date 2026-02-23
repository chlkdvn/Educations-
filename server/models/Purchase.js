import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema(
    {
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: [true, "Course ID is required"],
        },
        userId: {
            type: String, // ✅ Clerk user ID
            required: [true, "User ID is required"],
            index: true,
        },

        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0, "Amount cannot be negative"],
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
        },
        paymentReference: {
            type: String,
            unique: true, // Very important for Paystack reference
            sparse: true, // Allows null/undefined for non-Paystack payments
        },
        paymentMethod: {
            type: String,
            enum: ["paystack", "wallet", "free"],
            default: "paystack",
        },
        transactionId: {
            type: String, // Paystack's transaction ID (optional, from verification)
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed, // For extra Paystack data if needed
        },
    },
    {
        timestamps: true, // createdAt & updatedAt
    }
);

// Index for faster queries (especially verification)
PurchaseSchema.index({ paymentReference: 1 });
PurchaseSchema.index({ userId: 1, courseId: 1 });
PurchaseSchema.index({ status: 1 });

export const Purchase = mongoose.model("Purchase", PurchaseSchema);