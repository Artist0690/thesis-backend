import { Request, Response } from "express";
import z from "zod";
import Chat from "../Models/Chat";
import { User } from "../Models/User";
import Message from "../Models/Message";
import { populate } from "dotenv";

// create or fetch one to one chat
// POST chats/chat 🛤️
const accessChat = async (req: Request, res: Response) => {
  // retrieve other user's id from request body
  const zRequestBodySchema = z.object({ chatMateId: z.string() });
  const zRequestBodyCheck = zRequestBodySchema.safeParse(req.body);

  if (!zRequestBodyCheck.success) {
    return res
      .status(400)
      .json({ message: "user id is required.Bad request." });
  }

  const { chatMateId } = zRequestBodyCheck.data;

  // retrieve user id from request object
  const zRequestObjSchema = z.object({
    id: z.string(),
  });

  const reqObj = req.user;
  const zRequestObjCheck = zRequestObjSchema.safeParse(reqObj);

  // console.log("reqobj- ", reqObj);

  if (!zRequestObjCheck.success) {
    return res.status(400).json({ message: "Not authorized." });
  }

  // determine whether chat exist or not🔎
  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: chatMateId } } },
      { users: { $elemMatch: { $eq: zRequestObjCheck.data.id } } },
    ],
  })
    .populate("latestMessage", "content sender")
    .populate("users", "-password -rsa_public_key");

  // add a new field to isChat(latestMessage.sender)❌
  // 🚨🚨🚨🚨🚨 we need to fix here 🚨🚨🚨🚨🚨🚨
  const chat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name email id",
  });

  // check whether chat exists
  if (chat.length > 0) {
    return res.status(200).send(chat[0]);
  }

  // if not
  let chatData = {
    chatName: "sender",
    isGroupChat: false,
    users: [zRequestObjCheck.data.id, chatMateId],
  };

  // create a new chat
  try {
    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.find({ id: createdChat.id });
    // .populate(
    //   "users",
    //   "-password -rsa_public_key"
    // );
    return res.status(200).json(fullChat);
  } catch (error) {
    res.json({ message: "Failed to create chat." });
    console.log((error as Error).message);
  }
};

// send a message
// POST chats/send
const sendMessage = async (req: Request, res: Response) => {
  const zRequestBodySchema = z.object({
    content: z.string(),
    chat: z.string(),
  });

  const zRequestBodyCheck = zRequestBodySchema.safeParse(req.body);
  if (!zRequestBodyCheck.success) {
    return res.status(400).json({ message: "Bad request." });
  }

  const { chat, content } = zRequestBodyCheck.data;

  // check req.user
  const zRequestObjSchema = z.object({
    id: z.string(),
  });

  const zRequestObjCheck = zRequestObjSchema.safeParse(req.user);

  if (!zRequestObjCheck.success) {
    return res.status(403).json({ message: "Unauthorized." });
  }

  const { id: currentUserId } = zRequestObjCheck.data;

  const createMessage = await Message.create({
    sender: currentUserId,
    chat: chat,
    content: content,
    readBy: [currentUserId],
  });

  if (!createMessage) {
    return res.status(500).json({ message: "Failed to send message." });
  }

  res.status(201).json(createMessage);
};

// fetch all chats for a user
// POST chats/get_all_chats 🛤️
const fetchChats = async (req: Request, res: Response) => {
  // retrieve user's id from request object
  const zRequestObjSchema = z.object({
    id: z.string(),
  });
  const zRequestObjCheck = zRequestObjSchema.safeParse(req.user);

  if (!zRequestObjCheck.success) {
    return res.status(403).json({ message: "Unauthorized." });
  }

  const { id: currentUserId } = zRequestObjCheck.data;

  // find all chats associating with this user
  const findAllChats = await Chat.find({
    users: { $elemMatch: { $eq: currentUserId } },
  })
    .populate("users", "-password -rsa_public_key")
    .populate("groupAdmin", "-password -rsa_public_key")
    .populate("latestMessage")
    .sort({ updatedAt: -1 });

  if (findAllChats.length < 1) {
    return res.status(400).json({ message: "No chats." });
  }

  const allChats = await User.populate(findAllChats, {
    path: "latestMessage.sender",
    select: "id name email",
  });

  res.status(200).send(allChats);
};

export { accessChat, sendMessage, fetchChats };
