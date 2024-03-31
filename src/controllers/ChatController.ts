import { Request, Response } from "express";

const getAllChats = async (req: Request, res: Response) => {
  res.status(200).json({ data: "all chats" });
};

export { getAllChats };
