import { Request, Response } from "express";
import z from "zod";
import Chat, { ChatModelSchema } from "../Models/Chat";
import { User } from "../Models/User";
import Message from "../Models/Message";
import { populate } from "dotenv";
import mongoose, { InferSchemaType, Types } from "mongoose";
import { generatePassphrase } from "../cryptography/getPassphrase";
import { encrypt_rsa_key } from "../cryptography/rsa_crypto";

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
    return res.status(200).json(chat[0]);
  }

  // TODO: If chat didn't exist, create a new one.
  const UserInfoArrSchema = z.array(
    z.object({
      _id: z.string(),
      rsa_public_key: z.string(),
    })
  );

  // TODO: Convert string id to object id and
  // TODO: search users!!
  const ObjectId = mongoose.Types.ObjectId;

  // TODO: Search rsa keys of two chat mates
  const userInfo = await User.aggregate([
    {
      $match: {
        _id: { $in: [new ObjectId(currentUserId), new ObjectId(chatMateId)] },
      },
    },
    {
      $project: {
        _id: { $toString: "$_id" },
        rsa_public_key: 1,
      },
    },
  ]);

  const checkUserInfoArr = UserInfoArrSchema.safeParse(userInfo);
  if (!checkUserInfoArr.success) {
    return res.json({
      message: "User info type mismatch.",
      error: checkUserInfoArr.error,
      info: userInfo,
    });
  }

  // TODO: Use this array to encrypt passphrase
  const userInfoArr = checkUserInfoArr.data;

  type KeyObj = {
    [key in string]: string;
  };

  // TODO: User this keyOBj to get users' rsa keys
  let keyObj: KeyObj = {};
  userInfoArr.map((uInfo) => {
    keyObj[uInfo._id] = uInfo.rsa_public_key;
  });

  // TODO: Use this chat data payload to store in database
  type ChatDataPayload = {
    userInfo: string;
    passphrase: string;
  };

  let chatDataPayload: ChatDataPayload[] = [];

  // TODO: plaintext passphrase
  const passphrase = generatePassphrase(16);

  // TODO: Prepare chat data payload
  userInfoArr.map((userInfo) => {
    const encrypted_passphrase = encrypt_rsa_key(
      passphrase,
      userInfo.rsa_public_key
    );
    chatDataPayload.push({
      userInfo: userInfo._id,
      passphrase: encrypted_passphrase,
    });
  });

  let chatData = {
    chatName: "sender",
    isGroupChat: false,
    users: chatDataPayload,
  };

  try {
    const createdChat = await Chat.create(chatData);
    // FIXME: error when searching chat using ID
    const fullChat = await Chat.findById({
      id: createdChat.id,
    })
      .populate("users.userInfo", "name id email")
      .populate("latestMessage");

    return res.status(200).json({ fullChat });
  } catch (error) {
    console.log((error as Error).message);
    res.json({ message: "Failed to create chat." });
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

const test = async (req: Request, res: Response) => {
  const ReqObjSchema = z.object({ id: z.string() });
  const reqObj = ReqObjSchema.safeParse(req.user);
  if (!reqObj.success) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id: currentUserId } = reqObj.data;

  const ReqBodySchema = z.object({ chatMateId: z.string() });
  const reqBody = ReqBodySchema.safeParse(req.body);
  if (!reqBody.success) {
    return res.status(400).json({ message: "Bad Request" });
  }

  const { chatMateId } = reqBody.data;

  const UserInfoArrSchema = z.array(
    z.object({
      _id: z.string(),
      rsa_public_key: z.string(),
    })
  );

  // TODO: Convert string id to object id and
  // TODO: search users!!
  const ObjectId = mongoose.Types.ObjectId;

  const userInfo = await User.aggregate([
    {
      $match: {
        _id: { $in: [new ObjectId(currentUserId), new ObjectId(chatMateId)] },
      },
    },
    {
      $project: {
        _id: { $toString: "_id" },
        rsa_public_key: 1,
      },
    },
  ]);

  const checkUserInfoArr = UserInfoArrSchema.safeParse(userInfo);
  if (!checkUserInfoArr.success) {
    return res.json({
      message: "User info type mismatch.",
      error: checkUserInfoArr.error,
      info: userInfo,
    });
  }

  // TODO: Use this array to encrypt passphrase
  const userInfoArr = checkUserInfoArr.data;

  type KeyObj = {
    [key in string]: string;
  };

  // TODO: User this keyOBj to get users' rsa keys
  let keyObj: KeyObj = {};
  userInfoArr.map((uInfo) => {
    keyObj[uInfo._id] = uInfo.rsa_public_key;
  });

  // TODO: Use this chat data payload to store in database
  type ChatDataPayload = {
    _id: string;
    passphrase: string;
  };

  let chatDataPayload: ChatDataPayload[] = [];

  // TODO: plaintext passphrase
  const passphrase = generatePassphrase(16);

  // TODO: Prepare chat data payload
  userInfoArr.map((userInfo) => {
    const encrypted_passphrase = encrypt_rsa_key(
      passphrase,
      userInfo.rsa_public_key
    );
    chatDataPayload.push({
      _id: userInfo._id,
      passphrase: encrypted_passphrase,
    });
  });

  console.log("passphrase: ", passphrase);
  console.log(chatDataPayload[0].passphrase);

  res.send(chatDataPayload);
};

export { accessChat, fetchChats, test };
