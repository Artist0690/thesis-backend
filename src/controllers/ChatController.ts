import { Request, Response } from "express";
import z from "zod";
import Chat, { ChatModelSchema } from "../Models/Chat";
import { User } from "../Models/User";
import Message from "../Models/Message";
import { populate } from "dotenv";
import { InferSchemaType } from "mongoose";

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

  const { id: currentUserId } = zRequestObjCheck.data;

  // TODO: determine whether chat exist or not🔎

  let isChat = await Chat.find({
    $and: [
      { "users.userInfo": currentUserId },
      { "users.userInfo": chatMateId },
    ],
  })
    .populate("latestMessage")
    .populate("users.userInfo", "id name email");

  // TODO: populate chat model
  const chat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name email id",
  });

  // check whether chat exists
  if (chat.length > 0) {
    return res.status(200).send(chat[0]);
  }

  // TODO: If chat didn't exist, create a new one.
  const passphrase = "abcd";
  let chatData = {
    chatName: "sender",
    isGroupChat: false,
    users: [
      { userInfo: zRequestObjCheck.data.id, passphrase },
      { userInfo: chatMateId, passphrase },
    ],
  };

  // create a new chat
  try {
    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.find({ id: createdChat.id });

    return res.status(200).json(fullChat);
  } catch (error) {
    res.json({ message: "Failed to create chat." });
    console.log((error as Error).message);
  }
};

// TODO: fetch all chats for a user
// GET chats/get_all_chats 🛤️
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

  // console.log("req user id: ", currentUserId);

  // --------------------------------------------
  // | find all chats associating with this user
  // --------------------------------------------
  const findAllChats = await Chat.find({
    users: { $elemMatch: { userInfo: { $eq: currentUserId } } },
  })
    .populate("users.userInfo", "name id email")
    // .populate("groupAdmin", "-password -rsa_public_key")
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

const test = (req: Request, res: Response) => {
  const zRequestObjSchema = z.object({ id: z.string() });
  console.log(req.user);
  const zRequestObjCheck = zRequestObjSchema.safeParse(req.user);
  if (!zRequestObjCheck.success) {
    return res.status(403).json({ message: "Unauthorized." });
  }

  res.status(200).json({ message: "ok", id: zRequestObjCheck.data.id });
};

export { accessChat, fetchChats, test };
