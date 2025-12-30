import "dotenv/config";
import connectToMongo from "./db/index.js";
import { app } from "./app.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Message } from "./models/message.model.js";
import { Chat } from "./models/chat.model.js";

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectToMongo()
  .then(() => {
    const server = http.createServer(app);

    // Socket.io with CORS
    const io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN.split(","),
        credentials: true,
      },
    });

    // JWT auth for sockets
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
      } catch (err) {
        next(new Error("Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      console.log("User connected:", socket.userId);

      socket.on("joinChat", ({ chatId }) => {
        if (!chatId) return;
        socket.join(chatId);
        console.log(`User ${socket.userId} joined chat ${chatId}`);
      });

      socket.on("sendMessage", async ({ chatId, content }) => {
        if (!chatId || !content) return;

        try {
          const chat = await Chat.findById(chatId);
          if (!chat) return socket.emit("error", { message: "Chat not found" });
          if (!chat.users.some((u) => u.toString() === socket.userId)) {
            return socket.emit("error", {
              message: "Not a member of this chat",
            });
          }

          const message = await Message.create({
            sender: socket.userId,
            chat: chatId,
            content,
          });

          await message.populate(
            "sender",
            "username fullName profilePicture email"
          );
          await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

          io.to(chatId).emit("receiveMessage", message);
        } catch (err) {
          console.error("Socket sendMessage error:", err);
          socket.emit("error", { message: "Failed to send message" });
        }
      });

      // Typing indicators
      socket.on("typing", ({ chatId }) => {
        if (!chatId) return;
        socket.to(chatId).emit("typing", { chatId, userId: socket.userId });
      });

      socket.on("stopTyping", ({ chatId }) => {
        if (!chatId) return;
        socket.to(chatId).emit("stopTyping", { chatId, userId: socket.userId });
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.userId);
      });
    });

    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection failed:", err));
