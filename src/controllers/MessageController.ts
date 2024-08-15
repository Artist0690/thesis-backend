import { Request, Response } from "express";
import z, { ZodError } from "zod";
import Chat from "../Models/Chat";
import Message from "../Models/Message";

const fetchAllMessages = async (req: Request, res: Response) => {
  try {
    const REQUEST_PARAM_VALIDATOR = z.object({ chatId: z.string() });
    const reqParam = REQUEST_PARAM_VALIDATOR.parse(req.params);

    const { chatId } = reqParam;

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "id name email")
      .sort({ createdAt: 1 });

    if (!messages || messages.length < 1) {
      return res.status(200).send([]);
    }

    res.status(200).send(messages);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.json({ message: "Unprocessable payload" }).status(422);
    }
    return res.json({ message: "Fail to access messages" }).status(500);
  }
};

const sendMessage = async (req: Request, res: Response) => {
  try {
    const REQUEST_BODY_VALIDATOR = z.object({
      chatId: z.string(),
      content: z.string(),
    });

    const reqBody = REQUEST_BODY_VALIDATOR.parse(req.body);

    const REQUEST_USER_VALIDATOR = z.object({ id: z.string() });
    const reqUser = REQUEST_USER_VALIDATOR.parse(req.user);

    const { chatId, content } = reqBody;
    const { id: currentUserId } = reqUser;

    const newMsgPayload = {
      chat: chatId,
      sender: currentUserId,
      content: content,
    };

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
    if (error instanceof ZodError)
      return res.status(422).json({ message: "Unprocessable payload." });

    return res.status(401).json({ message: "Failed to send message." });
  }
};

export { fetchAllMessages, sendMessage };
