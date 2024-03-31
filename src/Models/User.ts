import { Schema, Document, model, Model } from "mongoose";
import { string } from "zod";

interface UserDocument {
  name: string;
  email: string;
  password: string;
}

const userSchema = new Schema<UserDocument>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = model<UserDocument>("User", userSchema);

export { User };
