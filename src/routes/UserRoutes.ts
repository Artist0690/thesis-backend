import express from "express";
import { login, refresh, register } from "../controllers/UserController";

const router = express.Router();

router.post("/login", login);

router.post("/register", register);

router.get("/refresh", refresh);

router.route("/logout").post();

export { router };
