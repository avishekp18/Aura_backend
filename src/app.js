import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Parse allowed origins from .env
const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

// Health checkfvzcv
app.get("/", (req, res) => res.send("Server is running!"));

// Routes
import commentRoute from "./routes/comment.routes.js";
import friendRoute from "./routes/friendRequests.routes.js";
import postRoute from "./routes/post.routes.js";
import savesRoute from "./routes/saves.routes.js";
import userRoute from "./routes/user.routes.js";
import storyRoute from "./routes/story.routes.js";
import notificationRoute from "./routes/notification.routes.js";
import chatsRouter from "./routes/chat.routes.js";

app.use("/api/comments", commentRoute);
app.use("/api/friendRequests", friendRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/posts", postRoute);
app.use("/api/saves", savesRoute);
app.use("/api/user", userRoute);
app.use("/api/story", storyRoute);
app.use("/api/chats", chatsRouter);

export { app };
