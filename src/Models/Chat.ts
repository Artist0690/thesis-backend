import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";
import { boolean } from "zod";

const ChatSchema = new Schema(
  {
    users: [
      {
        userInfo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        passphrase: {
          type: String,
          default: null,
        },
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Message",
    },
  },
  { timestamps: true }
);

export type ChatModelSchema = InferSchemaType<typeof ChatSchema>;

const Chat = mongoose.model("Chat", ChatSchema);

export default Chat;
