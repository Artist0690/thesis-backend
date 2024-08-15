import mongoose, { InferSchemaType, model, Schema, Types } from "mongoose";

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
  },
  { timestamps: true }
);

type MessageType = InferSchemaType<typeof MessageSchema>;

const Message = model<MessageType>("Message", MessageSchema);

export default Message;
