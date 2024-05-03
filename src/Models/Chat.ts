import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";
import { boolean } from "zod";

interface IChat {
  chatName: string;
  isGroupChat: boolean;
  users: Types.ObjectId[];
  latestMessage: Types.ObjectId;
  groupAdmin: Types.ObjectId;
}

const ChatSchema = new Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
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
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export type ChatModelSchema = InferSchemaType<typeof ChatSchema>;

const Chat = mongoose.model("Chat", ChatSchema);

export default Chat;
