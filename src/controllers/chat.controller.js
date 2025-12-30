import mongoose from "mongoose";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import {
  getCache,
  setCache,
  deleteCache,
  deleteByPrefix,
} from "../utils/cache.js";

// Access or create a 1-to-1 chat
export const accessChat = async (req, res) => {
  const { email } = req.body;
  const loggedUserId = req.user?.id;

  if (!email) return res.status(400).json({ error: "Email required" });
  if (!loggedUserId)
    return res.status(401).json({ error: "Authentication required" });

  const user = await User.findOne({ email }).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });

  let chats = await Chat.find({
    isGroupChat: false,
    users: { $all: [loggedUserId, user._id] },
  })
    .populate("users", "-password")
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "username fullName email profilePicture",
      },
    });

  if (chats.length > 0) return res.json(chats[0]);

  const newChat = await Chat.create({
    chatName: user.fullName,
    users: [loggedUserId, user._id],
  });

  const fullChat = await Chat.findById(newChat._id).populate(
    "users",
    "-password"
  );
  // Invalidate chat list cache for this user and the other participant
  deleteCache(`chats:${loggedUserId}`);
  deleteCache(`chats:${user._id.toString()}`);
  res.json(fullChat);
};

// Fetch all chats of logged-in user
export const fetchChats = async (req, res) => {
  try {
    const loggedUserId = req.user?.id;
    if (!loggedUserId)
      return res.status(401).json({ error: "Authentication required" });

    const cacheKey = `chats:${loggedUserId}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const chats = await Chat.find({
      users: { $elemMatch: { $eq: loggedUserId } },
    })
      .populate("users", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "username fullName email profilePicture",
        },
      })
      .sort({ updatedAt: -1 });
    setCache(cacheKey, chats, 60_000); // cache chats 1 minute
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch messages for a chat
export const fetchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const loggedUserId = req.user?.id;
    if (!loggedUserId)
      return res.status(401).json({ error: "Authentication required" });

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Invalid chat id" });
    }

    const cacheKey = `messages:${loggedUserId}:${chatId}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    if (!chat.users.some((u) => u.toString() === loggedUserId)) {
      return res.status(403).json({ error: "Not a member of this chat" });
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username fullName email profilePicture")
      .sort({ createdAt: 1 });
    setCache(cacheKey, messages, 30_000); // cache messages 30s
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  const { chatId, content } = req.body;
  const senderId = req.user?.id;

  if (!chatId || !content)
    return res.status(400).json({ error: "Invalid data" });
  if (!senderId)
    return res.status(401).json({ error: "Authentication required" });

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ error: "Chat not found" });
  if (!chat.users.some((u) => u.toString() === senderId)) {
    return res.status(403).json({ error: "Not a member of this chat" });
  }

  const newMessage = await Message.create({
    sender: senderId,
    chat: chatId,
    content,
  });
  const message = await Message.findById(newMessage._id).populate(
    "sender",
    "username fullName email profilePicture"
  );

  await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

  // Invalidate caches for messages and chats for members
  chat.users.forEach((u) => {
    deleteCache(`messages:${u.toString()}:${chatId}`);
    deleteCache(`chats:${u.toString()}`);
  });

  res.json(message);
};

// Fetch friends
export const fetchFriends = async (req, res) => {
  try {
    const userId = req.user?._id;
    const cacheKey = `friends:${userId}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const user = await User.findById(userId).populate(
      "friends",
      "username fullName email profilePicture coverImage"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    setCache(cacheKey, user.friends, 60_000); // cache friends 1 minute
    res.json(user.friends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete an entire chat (and its messages) for members
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const loggedUserId = req.user?.id;
    if (!loggedUserId)
      return res.status(401).json({ error: "Authentication required" });

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Invalid chat id" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const isMember = chat.users.some((u) => u.toString() === loggedUserId);
    if (!isMember) return res.status(403).json({ error: "Not a member" });

    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);

    // Invalidate caches for all members
    chat.users.forEach((u) => {
      const uid = u.toString();
      deleteCache(`messages:${uid}:${chatId}`);
      deleteCache(`chats:${uid}`);
    });

    return res.json({ success: true, chatId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
