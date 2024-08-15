import { Socket } from "socket.io";
import z, { ZodError } from "zod";
import { ChatSchema, MessageSchema } from "../zod/chatSchema";
import { UserSchema } from "../zod/userSchema";

type Chat = z.infer<typeof ChatSchema>;
type Message = z.infer<typeof MessageSchema>;
type User = z.infer<typeof UserSchema>;

export const setup_event = (socket: Socket) => {
  socket.on("setup", (payload: { userId: string }) => {
    const { userId } = payload;
    socket.join(userId);
    console.log(`user joined ${userId}`);
    socket.emit("setup", `You've joined your own room: ${userId}`);
  });
};

export const connect_event = (socket: Socket) => {
  socket.emit("connection", "U've just connected socket IO.");
};

export const chat_event = (socket: Socket) => {
  socket.on("chat", (payload: Message & { receiver: string }) => {
    try {
      const { content, receiver } = payload;
      console.log(`${content} sent to ${receiver}`);
      const newMessage = MessageSchema.parse(payload);

      socket.in(receiver).emit("receive_msg", newMessage);
    } catch (error) {
      if (error instanceof ZodError) {
        console.log(error.message);
        return;
      }
      console.log("Socket failed to send message.");
    }
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
    console.log("someone is typing in room ", roomId);
    isTyping ? console.log("typing...") : console.log("stop typing...");
    socket.broadcast.to(roomId).emit("listen_typing", isTyping);
  });
};

export const test_event = (socket: Socket) => {
  socket.on("test", (payload: { userId: string }) => {
    const { userId } = payload;
    console.log("test event: userId: ", userId);
    socket.to(userId).emit("test", "test event ");
  });
};
