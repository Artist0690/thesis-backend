import mongoose, { Schema, Document, model, Model, Models } from "mongoose";
import bcrypt from "bcrypt";
import { NextFunction } from "express";
import { Type } from "typescript";

interface IUser {
  name: string;
  email: string;
  password: string;
  rsa_public_key: string;
}

interface IUserMethods extends IUser, mongoose.Document {
  matchPassword: (enteredPassword: string) => Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, IUserMethods, UserModel>(
  {
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
    rsa_public_key: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (this: IUserMethods, next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const User = model<IUser>("User", userSchema);

export { User };
