import mongoose from "mongoose";

const FollowSchema = new mongoose.Schema(
    {
        followerId: {
            type: String, // Clerk user ID
            required: true,
            ref: "User",
        },
        educatorId: {
            type: String, // also User ID
            required: true,
            ref: "User",
        },
    },
    { timestamps: true }
);

// Prevent duplicate follows
FollowSchema.index({ followerId: 1, educatorId: 1 }, { unique: true });

export default mongoose.model("Follow", FollowSchema);
