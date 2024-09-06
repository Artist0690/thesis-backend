import { Request, Response } from "express";
import z, { ZodError } from "zod";
import Chat, { ChatModelSchema } from "../Models/Chat";
import { User } from "../Models/User";
import mongoose, { InferSchemaType, Types } from "mongoose";
import { generatePassphrase, get_AES_key } from "../cryptography/getPassphrase";
import { encrypt_rsa_key } from "../cryptography/rsa_crypto";

// create or fetch one to one chat
const accessChat = async (req: Request, res: Response) => {
  try {
    const REQUEST_BODY_VALIDATOR = z.object({ chatMateId: z.string() });
    const validatedBody = REQUEST_BODY_VALIDATOR.parse(req.body);

    const { chatMateId } = validatedBody;

    const REQUEST_OBJECT_VALIDATOR = z.object({
      id: z.string(),
    });

    const reqObj = req.user;
    const validatedRequestObject = REQUEST_OBJECT_VALIDATOR.parse(reqObj);

    const { id: currentUserId } = validatedRequestObject;

    let isChat = await Chat.find({
      users: {
        $all: [
          {
            $elemMatch: {
              userInfo: currentUserId,
            },
          },
          {
            $elemMatch: {
              userInfo: chatMateId,
            },
          },
        ],
      },
    })
      .populate("latestMessage")
      .populate("users.userInfo", "id name email");

    if (isChat && isChat.length > 0) {
      const chat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name email id",
      });

      return res.json(chat[0]).status(200);
    }

    // ---------------------------------------------------

    const chatMembers = await Promise.all([
      await User.findOne({ _id: currentUserId }).select("-password"),
      await User.findOne({ _id: chatMateId }).select("-password"),
    ]);

    if (!chatMembers || chatMembers.length < 1) {
      return res.json({ message: "Fail to create chat" }).status(500);
    }

    const passphrase = get_AES_key();

    const ObjectId = mongoose.Types.ObjectId;

    const userInfos = chatMembers.map((user) => {
      const cipherAES = encrypt_rsa_key(
        passphrase,
        user?.rsa_public_key as string
      );

      return {
        userInfo: new ObjectId(user?.id as string),
        passphrase: cipherAES,
      };
    });

    const createChat = await Chat.create({ users: userInfos });

    const newChat = await Chat.findById(createChat.id).populate(
      "users.userInfo"
    );

    return res.json(newChat).status(200);
  } catch (error) {
    if (error instanceof ZodError)
      return res.json({ message: "Unprocessable payload" }).status(422);

    res.json({ message: "Failed to create chat." });
  }
};

// fetch all chats for a user
const fetchChats = async (req: Request, res: Response) => {
  try {
    const REQUEST_OBJECT_VALIDATOR = z.object({
      id: z.string(),
    });
    const validatedRequestObject = REQUEST_OBJECT_VALIDATOR.parse(req.user);

    const { id: currentUserId } = validatedRequestObject;

    const chats = await Chat.find({
      users: { $elemMatch: { userInfo: { $eq: currentUserId } } },
    })
      .populate("users.userInfo", "name id email")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    if (chats && chats.length < 1) {
      return res.status(404).json({ message: "No chats." });
    }

    const allChats = await User.populate(chats, {
      path: "latestMessage.sender",
      select: "id name email",
    });

    res.status(200).send(allChats);
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(error.message);
      return res
        .json({ message: `Unprocessable payload. ${error.message}` })
        .status(422);
    }

    return res.json({ message: "Fail to access chats" }).status(500);
  }
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

  const USER_INFO_VALIDATOR = z.array(
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

  const usersInfo = USER_INFO_VALIDATOR.safeParse(userInfo);
  if (!usersInfo.success) {
    return res.json({
      message: "User info type mismatch.",
      error: usersInfo.error,
      info: userInfo,
    });
  }

  // TODO: Use this array to encrypt passphrase
  const userInfoArray = usersInfo.data;

  type KeyObj = {
    [key in string]: string;
  };

  // TODO: User this keyOBj to get users' rsa keys
  let keyObj: KeyObj = {};
  userInfoArray.map((uInfo) => {
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
  userInfoArray.map((userInfo) => {
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
