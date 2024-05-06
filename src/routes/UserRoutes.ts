import express from "express";
import {
  check,
  find,
  login,
  refresh,
  register,
} from "../controllers/UserController";
import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();

router.post("/login", login);

router.post("/register", register);

router.get("/refresh", refresh);

router.get("/check", check);

router.get("/search", verifyToken, find);

router.route("/logout").post();

export { router };
