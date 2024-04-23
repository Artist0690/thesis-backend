// src/index.ts
import express, { Request, Response } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoose from "mongoose";

import { router as authRouter } from "./routes/UserRoutes";
import { router as chatRouter } from "./routes/ChatRoutes";
import { router as cryptoRouter } from "./routes/cryptoRoutes";
import { router as messageRouter } from "./routes/MessageRoute";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    // preflightContinue: true,
    // optionsSuccessStatus: 200,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

dotenv.config();
const port = process.env.PORT;

// const server = http.createServer(app);
// const io = new Server(server);

// io.on("connection", (socket: Socket) => {
//   console.log("user connected.");
// });

// server.listen(port, () => {
//   console.log(`Server is listening on port ${port}`);
// });

mongoose
  .connect("mongodb://127.0.0.1/test")
  .then(() => {
    app.listen(port, () => {
      console.log("Connected to mongodb");
      console.log(`app is listening on ${port}.`);
    });
  })
  .catch((e) => console.log("Error connecting with db", e));

app.get("/", (req: Request, res: Response) => {
  res.send("landing!");
});

app.use("/auth", authRouter);
app.use("/chats", chatRouter);
app.use("/messages", messageRouter);
app.use("/crypto", cryptoRouter);
