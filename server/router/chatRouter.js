// routes/chatRoutes.js
import express from 'express';
import { protectChatUser } from '../middlewares/authMiddleware.js';
import { getConversations, getMessages, sendMessage, startConversation } from '../controllers/chat.js';

const chatRouter = express.Router();

chatRouter.get('/conversations', protectChatUser, getConversations);
chatRouter.get('/conversation/:id', protectChatUser, getMessages);
chatRouter.post('/send-message', protectChatUser, sendMessage);
chatRouter.post('/start-conversation', protectChatUser, startConversation);
export default chatRouter;