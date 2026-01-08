import "dotenv/config";
import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import connectCloudinary from "./configs/ckoudinary.js";

import { ClerkWebhooks } from "./controllers/webhooks.js";

import educatorRouter from "./router/educatorRoutes.js";
import courseRouter from "./router/courseRouter.js";
import userRouter from "./router/userRouter.js";

import cookieParser from "cookie-parser";
import { clerkMiddleware } from "@clerk/express";
import AdminRouter from "./router/AdminRouter.js";
import chatRouter from "./router/chatRouter.js";

// -----------------------------
// NEW: Socket.io imports
// -----------------------------
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";

const app = express();

// Create HTTP server (required for Socket.io)
const server = http.createServer(app);

// -----------------------------
// 1️⃣ Clerk Webhook (raw body)
// -----------------------------
app.post(
  "/clerk",
  express.raw({ type: "*/*" }),
  ClerkWebhooks
);

// -----------------------------
// 2️⃣ CORS MIDDLEWARE
// -----------------------------
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:19006"], // Web + Expo
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.use(cookieParser());

// -----------------------------
// 3️⃣ Clerk Middleware (auth)
// -----------------------------
app.use(clerkMiddleware());

// -----------------------------
// 4️⃣ Normal JSON Parser
// -----------------------------
app.use(express.json());

// -----------------------------
// 5️⃣ API Routes (unchanged)
// -----------------------------
app.get("/", (req, res) => {
  res.send("API Working");
});

app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/chat", chatRouter);

// -----------------------------
// 6️⃣ Socket.io Setup (NEW)
// -----------------------------
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:19006"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Track online users: clerkUserId → socket.id
const onlineUsers = new Map();

// Socket.io authentication using Clerk token
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.decode(token);
    if (!decoded?.sub) {
      return next(new Error("Invalid token"));
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = {
      _id: user._id,
      name: user.name,
      imageUrl: user.imageUrl
    };

    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
});

// Socket connection
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

  // Add to online users
  onlineUsers.set(socket.user._id, socket.id);

  // Join personal room
  socket.join(socket.user._id);

  // Handle incoming message
  socket.on("send_message", async ({ conversationId, message: text }) => {
    try {
      const senderId = socket.user._id;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(senderId)) {
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

      const otherUserId = conversation.participants.find(p => p !== senderId);
      const currentUnread = conversation.unreadCounts.get(otherUserId) || 0;
      conversation.unreadCounts.set(otherUserId, currentUnread + 1);

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
        const socketId = onlineUsers.get(userId);
        if (socketId) {
          io.to(socketId).emit("new_message", {
            conversationId,
            message: {
              ...formattedMessage,
              sent: userId === senderId
            }
          });
        }
      });

      // Update conversation list (last message + unread)
      conversation.participants.forEach(userId => {
        const socketId = onlineUsers.get(userId);
        if (socketId) {
          io.to(socketId).emit("conversation_updated", {
            conversationId,
            lastMessage: formattedMessage,
            unreadCount: userId === otherUserId ? currentUnread + 1 : 0
          });
        }
      });

    } catch (err) {
      console.error("Socket message error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.name}`);
    onlineUsers.delete(socket.user._id);
  });
});

// -----------------------------
// 7️⃣ Start Server (now uses 'server' instead of 'app')
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