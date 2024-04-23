import express from "express";
import { verifyToken } from "../middleware/verifyToken";
import {
  fetchAllMessages,
  sendMessage,
} from "../controllers/MessageController";

const router = express.Router();

router.get("/getAllMessages/:chatId", verifyToken, fetchAllMessages);
router.post("/send", verifyToken, sendMessage);

export { router };
