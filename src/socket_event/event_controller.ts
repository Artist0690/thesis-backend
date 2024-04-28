import { Socket } from "socket.io";
import z from "zod";
import { ChatSchema, MessageSchema } from "../zod/chatSchema";

type Chat = z.infer<typeof ChatSchema>;
type Message = z.infer<typeof MessageSchema>;

export const connect_event = (socket: Socket) => {
  socket.emit("connection", "U've just connected socket IO.");
};

export const chat_event = (socket: Socket) => {
  socket.on("chat", (payload: Message) => {
    const { content, chat } = payload;
    console.log(`${content} sent to ${chat}`);
    socket.to(chat).emit("receive_msg", payload);
  });
};

export const joinRoom_event = (socket: Socket) => {
  socket.on("join_room", (payload: { roomId: string }) => {
    const { roomId } = payload;
    // console.log(`${socket.id} joined ROOM: ${roomId}`);
    socket.join(roomId);
    socket.emit("join_room", `U've joined room ${roomId}.`);
  });
};

export const typing_event = (socket: Socket) => {
  socket.on("isTyping", (payload: { isTyping: boolean; roomId: string }) => {
    const { isTyping, roomId } = payload;
    if (isTyping) {
      console.log("typing...");
      socket.broadcast.to(roomId).emit("listen_typing", isTyping);
      return;
    } else {
      console.log("stop typing...");
      socket.broadcast.to(roomId).emit("listen_typing", isTyping);
    }
  });
};
