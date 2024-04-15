import express from "express";
import { check, login, refresh, register } from "../controllers/UserController";

const router = express.Router();

router.post("/login", login);

router.post("/register", register);

router.get("/refresh", refresh);

router.get("/check", check);

router.route("/logout").post();

export { router };
