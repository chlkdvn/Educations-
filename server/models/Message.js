// models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: { type: String, ref: 'User', required: true },
    text: { type: String, required: true },
    readBy: [{ type: String, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);