import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Parse multiple origins from .env
const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman/curl
      if (!allowedOrigins.includes(origin)) {
        return callback(
          new Error("CORS policy does not allow this origin."),
          false
        );
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

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
