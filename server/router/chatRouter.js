// routes/chatRoutes.js
import express from 'express';
import { getConversations, getMessages, sendMessage, startConversation } from '../controllers/chat.js';
import { AuthUser } from '../middlewares/authMiddleware.js';

const chatRouter = express.Router();

chatRouter.get('/conversations', AuthUser , getConversations);
chatRouter.get('/conversation/:id',  AuthUser, getMessages);
chatRouter.post('/send-message',  AuthUser, sendMessage);
chatRouter.post('/start-conversation',  AuthUser, startConversation);
export default chatRouter;