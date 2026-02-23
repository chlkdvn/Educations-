import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./configs/mongodb.js";
import connectCloudinary from "./configs/ckoudinary.js";

import educatorRouter from "./router/educatorRoutes.js";
import courseRouter from "./router/courseRouter.js";
import userRouter from "./router/userRouter.js";

import cookieParser from "cookie-parser";
import AdminRouter from "./router/AdminRouter.js";
import chatRouter from "./router/chatRouter.js";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
// -----------------------------

import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";
import airouter from "./router/AiRouter.js";

const app = express();

// Create HTTP server (required for Socket.io)
const server = http.createServer(app);

// -----------------------------

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:19006"], // Web + Expo
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.use(cookieParser());

// -----------------------------

app.use(express.json());

// -----------------------------

app.get("/", (req, res) => {
  res.send("API Working");
});

app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/chat", chatRouter);
app.use("/api", airouter);

// -----------------------------

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:19006"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Track online users: userId → socket.id
const onlineUsers = new Map();

// Helper function to parse cookies from socket handshake
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
  });
  return cookies;
};

// FIXED: Socket.io authentication using JWT from cookies
io.use(async (socket, next) => {
  try {
    // Parse cookies from handshake headers
    const cookies = parseCookies(socket.handshake.headers.cookie);
    
    // Get the token from cookies - your backend sets this when user logs in
    // Common names: 'token', 'jwt', 'auth_token', 'session'
    const token = cookies['token'] || cookies['jwt'] || cookies['auth_token'] || cookies['session'];
    
    if (!token) {
      console.log('No token found in cookies');
      return next(new Error("Authentication error: No token found"));
    }

    // Verify JWT using your JWT_SECRET
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error('JWT verification error:', err.message);
      return next(new Error("Invalid token"));
    }

    if (!decoded || !decoded.userId) {
      console.log('Invalid token: no userId claim');
      return next(new Error("Invalid token"));
    }

    // Find user by ID from token
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return next(new Error("User not found"));
    }

    socket.user = {
      _id: user._id,
      name: user.name,
      imageUrl: user.imageUrl
    };

    console.log(`Socket authenticated for user: ${user.name} (${user._id})`);
    next();
    
  } catch (err) {
    console.error("Socket authentication error:", err);
    next(new Error("Authentication failed"));
  }
});

// Socket connection
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

  // Add to online users
  onlineUsers.set(socket.user._id.toString(), socket.id);

  // Join personal room
  socket.join(socket.user._id.toString());

  // Handle incoming message
  socket.on("send_message", async ({ conversationId, message: text }) => {
    try {
      const senderId = socket.user._id;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(senderId)) {
        console.log('Unauthorized message attempt');
        return;
      }

      // Save message
      const newMessage = new Message({
        conversation: conversationId,
        sender: senderId,
        text: text.trim()
      });
      await newMessage.save();

      // Update conversation
      conversation.lastMessage = {
        text: text.trim(),
        sender: senderId,
        createdAt: new Date()
      };

      const otherUserId = conversation.participants.find(p => p.toString() !== senderId.toString());
      const currentUnread = conversation.unreadCounts.get(otherUserId?.toString()) || 0;
      conversation.unreadCounts.set(otherUserId.toString(), currentUnread + 1);

      await conversation.save();

      const formattedMessage = {
        _id: newMessage._id,
        text: text.trim(),
        sender: senderId,
        time: newMessage.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        createdAt: newMessage.createdAt
      };

      // Send to both users
      conversation.participants.forEach(userId => {
        const socketId = onlineUsers.get(userId.toString());
        if (socketId) {
          io.to(socketId).emit("new_message", {
            conversationId,
            message: {
              ...formattedMessage,
              sent: userId.toString() === senderId.toString()
            }
          });
        }
      });

      // Update conversation list (last message + unread)
      conversation.participants.forEach(userId => {
        const socketId = onlineUsers.get(userId.toString());
        if (socketId) {
          io.to(socketId).emit("conversation_updated", {
            conversationId,
            lastMessage: formattedMessage,
            unreadCount: userId.toString() === otherUserId?.toString() ? currentUnread + 1 : 0
          });
        }
      });

    } catch (err) {
      console.error("Socket message error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.name}`);
    onlineUsers.delete(socket.user._id.toString());
  });
});

// -----------------------------

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    await connectCloudinary();

    server.listen(PORT, () => {
      console.log(`Server running with Socket.io on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
};

startServer();