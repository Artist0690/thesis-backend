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
import { Setup_Schema, Setup_Type } from "./zod/socket_type";
import {
  chat_event,
  connect_event,
  joinRoom_event,
  typing_event,
} from "./socket_event/event_controller";

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

const server = http.createServer(app);
const io = new Server(server, {
  // pingTimeout: 60000,
  cors: {},
});

mongoose
  .connect("mongodb://127.0.0.1/test")
  .then(() => {
    // app.listen(port, () => {
    //   console.log("Connected to mongodb");
    //   console.log(`app is listening on ${port}.`);
    // });
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((e) => console.log("Error connecting with db", e));

//socket 🚀
io.on("connection", (socket: Socket) => {
  console.log("user connected.", socket.id);

  // connect event
  connect_event(socket);

  // events
  chat_event(socket);
  joinRoom_event(socket);
  typing_event(socket);

  socket.on("disconnect", () => {
    console.log("user disconnected.");
    io.emit("someone disconnected.");
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("landing!");
});

app.use("/auth", authRouter);
app.use("/chats", chatRouter);
app.use("/messages", messageRouter);
app.use("/crypto", cryptoRouter);
