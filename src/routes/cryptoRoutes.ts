import express from "express";
import { encrypt_process } from "../controllers/CryptoController";

const router = express.Router();

router.post("/enc", encrypt_process);

export { router };
