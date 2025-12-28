import express from "express";
import { fetchUser } from "../middleware/fetchUser.js";
import {
  accessChat,
  fetchChats,
  sendMessage,
  fetchMessages,
  fetchFriends,
  deleteChat,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/access", fetchUser, accessChat);
router.get("/", fetchUser, fetchChats);
router.post("/message", fetchUser, sendMessage);
router.get("/messages/:chatId", fetchUser, fetchMessages);
router.get("/friends", fetchUser, fetchFriends);
router.delete("/:chatId", fetchUser, deleteChat);

export default router;
