import { Request, Response } from "express";
import z from "zod";
import Chat from "../Models/Chat";
import Message from "../Models/Message";

const fetchAllMessages = async (req: Request, res: Response) => {
  const ReqParam = z.object({ chatId: z.string() });
  const reqParam = ReqParam.safeParse(req.params);

  console.log("fetch all msg.");

  if (!reqParam.success) {
    return res.status(400).json({ message: "Bad Request." });
  }

  const { chatId } = reqParam.data;

  const messages = await Message.find({ chat: chatId })
    .populate("sender", "id name email")
    .sort({ createdAt: 1 });

  if (!messages || messages.length < 1) {
    return res.status(200).send([]);
  }

  res.status(200).send(messages);
};

const sendMessage = async (req: Request, res: Response) => {
  const ReqBody = z.object({
    chatId: z.string(),
    content: z.string(),
  });

  const reqBody = ReqBody.safeParse(req.body);
  if (!reqBody.success) {
    return res.status(400).json({ message: "Bad request." });
  }

  const ReqUser = z.object({ id: z.string() });
  const reqUser = ReqUser.safeParse(req.user);

  if (!reqUser.success) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { chatId, content } = reqBody.data;
  const { id: currentUserId } = reqUser.data;

  const newMsgPayload = {
    chat: chatId,
    sender: currentUserId,
    content: content,
  };

  try {
    // create a message
    const createMessage = await Message.create(newMsgPayload);

    const message = await Message.findById(createMessage.id).populate(
      "sender",
      "id name email"
    );

    // update corresponding chat info
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: createMessage.id,
    });

    res.status(200).json(message);
  } catch (error) {
    return res.status(401).json({ message: "Failed to send message." });
  }
};

export { fetchAllMessages, sendMessage };
