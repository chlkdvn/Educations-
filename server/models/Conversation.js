// models/Conversation.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [
        { type: String, ref: 'User' } // We use String _id (Clerk ID)
    ],
    lastMessage: {
        text: String,
        sender: { type: String, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: () => new Map()
    }
}, { timestamps: true });

export default mongoose.model('Conversation', conversationSchema);