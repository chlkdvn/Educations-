import mongoose from "mongoose";

const certificateRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  courseId: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  requestedAt: { type: Date, default: Date.now },
  status: { type: String, default: "pending" }, // pending, approved, rejected
});

export const CertificateRequest = mongoose.model("CertificateRequest", certificateRequestSchema);