import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";

// Access or create a 1-to-1 chat
export const accessChat = async (req, res) => {
  const { email } = req.body;
  const loggedUser = req.user;

  if (!email) return res.status(400).json({ error: "Email required" });

  const user = await User.findOne({ email }).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });

  let chats = await Chat.find({
    isGroupChat: false,
    users: { $all: [loggedUser._id, user._id] },
  })
    .populate("users", "-password")
    .populate("latestMessage");

  if (chats.length > 0) return res.json(chats[0]);

  const newChat = await Chat.create({
    chatName: user.fullName,
    users: [loggedUser._id, user._id],
  });

  const fullChat = await Chat.findById(newChat._id).populate(
    "users",
    "-password"
  );
  res.json(fullChat);
};

// Fetch all chats of logged-in user
export const fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch messages for a chat
export const fetchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username fullName email profilePicture")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  const { chatId, content, senderEmail } = req.body;

  if (!chatId || !content || !senderEmail)
    return res.status(400).json({ error: "Invalid data" });

  const sender = await User.findOne({ email: senderEmail }).select("-password");
  if (!sender) return res.status(404).json({ error: "Sender not found" });

  const newMessage = await Message.create({
    sender: sender._id,
    chat: chatId,
    content,
  });
  const message = await Message.findById(newMessage._id).populate(
    "sender",
    "username fullName email profilePicture"
  );

  await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

  res.json(message);
};

// Fetch friends
export const fetchFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friends",
      "username fullName email profilePicture coverImage"
    );
    res.json(user.friends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
