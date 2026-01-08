import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// GET all conversations for current user
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id; // from auth middleware (Clerk ID as string)

        const conversations = await Conversation.find({
            participants: userId
        })
            .populate('participants', 'name imageUrl')
            .sort({ 'lastMessage.createdAt': -1 });

        const formatted = await Promise.all(
            conversations.map(async (conv) => {
                const otherUser = conv.participants.find(p => p._id !== userId);

                const unreadCount = conv.unreadCounts.get(userId) || 0;

                return {
                    _id: conv._id,
                    otherUser: {
                        _id: otherUser?._id || null,
                        name: otherUser?.name || 'User',
                        imageUrl: otherUser?.imageUrl || ''
                    },
                    lastMessage: conv.lastMessage ? {
                        text: conv.lastMessage.text,
                        time: conv.lastMessage.createdAt
                    } : null,
                    lastMessageTime: conv.lastMessage?.createdAt || null,
                    unreadCount
                };
            })
        );

        res.json({ success: true, conversations: formatted });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET messages in a conversation
export const getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const convId = req.params.id;

        const conversation = await Conversation.findById(convId);
        if (!conversation || !conversation.participants.includes(userId)) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const messages = await Message.find({ conversation: convId })
            .sort({ createdAt: 1 });

        const formattedMessages = messages.map(msg => ({
            _id: msg._id,
            text: msg.text,
            sent: msg.sender === userId,
            time: msg.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            createdAt: msg.createdAt
        }));

        // Mark as read
        await Message.updateMany(
            { conversation: convId, sender: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        await Conversation.updateOne(
            { _id: convId },
            { $set: { [`unreadCounts.${userId}`]: 0 } }
        );

        res.json({ success: true, messages: formattedMessages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST send message
export const sendMessage = async (req, res) => {
    try {
        const { conversationId, message } = req.body;
        const senderId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(senderId)) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const newMessage = new Message({
            conversation: conversationId,
            sender: senderId,
            text: message.trim()
        });

        await newMessage.save();

        // Update last message
        conversation.lastMessage = {
            text: message.trim(),
            sender: senderId,
            createdAt: new Date()
        };

        // Increment unread for other user
        const otherUserId = conversation.participants.find(p => p !== senderId);
        const currentUnread = conversation.unreadCounts.get(otherUserId) || 0;
        conversation.unreadCounts.set(otherUserId, currentUnread + 1);

        await conversation.save();

        const formatted = {
            _id: newMessage._id,
            text: message.trim(),
            sent: true,
            time: newMessage.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            createdAt: newMessage.createdAt
        };

        res.json({ success: true, message: formatted });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};



// controllers/chat.js (add this function)



export const startConversation = async (req, res) => {
  try {
    const { educatorId } = req.body;
    const studentId = req.user._id;

    if (!educatorId) {
      return res.status(400).json({
        success: false,
        message: "Educator ID required"
      });
    }

    // 🚫 Block self-chat
    if (studentId.toString() === educatorId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot chat with yourself"
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [studentId, educatorId] }
    });

    let alreadyExists = true;

    if (!conversation) {
      alreadyExists = false;
      conversation = new Conversation({
        participants: [studentId, educatorId]
      });
      await conversation.save();
    }

    const otherUserId = conversation.participants.find(
      id => id.toString() !== studentId.toString()
    );

    const otherUser = await User.findById(otherUserId)
      .select("name imageUrl");

    res.json({
      success: true,
      alreadyExists,
      conversation: {
        _id: conversation._id,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          imageUrl: otherUser.imageUrl || ""
        }
      }
    });
  } catch (error) {
    console.error("Start conversation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
