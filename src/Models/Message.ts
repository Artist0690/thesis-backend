import mongoose, {
  InferSchemaType,
  model,
  Model,
  Schema,
  Types,
} from "mongoose";

interface IMessage {
  sender: Types.ObjectId;
  content: string;
  chat: Types.ObjectId;
  readBy: Types.ObjectId[];
}

const MessageSchema = new Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      trim: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

type MessageType = InferSchemaType<typeof MessageSchema>;

const Message = model<MessageType>("Message", MessageSchema);

export default Message;
