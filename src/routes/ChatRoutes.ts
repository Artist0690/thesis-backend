import express from "express";
import { getAllChats } from "../controllers/ChatController";
import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();

router.get("/", verifyToken, getAllChats);

export { router };
