import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import z from "zod";
import { User } from "../Models/User";
import bcrypt from "bcrypt";

const login = async (req: Request, res: Response) => {
  const zodLoginPayload = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  const loginPayload = zodLoginPayload.safeParse(req.body);
  if (!loginPayload.success) {
    return res.status(403).json({ message: "All fields are required." });
  }

  const { email, password } = loginPayload.data;

  // console.log("log in status ", email, password);

  const foundUser = await User.findOne({ email: email });

  // wrong email
  if (!foundUser) {
    return res.status(401).json({ message: "Invalid Email or password." });
  }

  // user exist and check password

  const correctPwd = await bcrypt.compare(password, foundUser.password);

  // wrong password
  if (!correctPwd) {
    return res.status(401).json({ message: "Invalid Email or password." });
  }

  const accessToken = jwt.sign(
    {
      UserInfo: {
        email: foundUser.email,
        id: foundUser.id,
      },
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: "10m" }
  );

  const refreshToken = jwt.sign(
    {
      UserInfo: {
        email: foundUser.email,
        id: foundUser.id,
      },
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" }
  );

  res.cookie("refresh", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  console.log("access token is sent via login process.");
  res.status(200).json({
    accessToken,
    email: foundUser.email,
    name: foundUser.name,
    id: foundUser.id,
  });
};

const register = async (req: Request, res: Response) => {
  const zodRegisterPayload = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
    rsa_public_key: z.string(),
  });

  const registerPayload = zodRegisterPayload.safeParse(req.body);
  console.log("request: ", registerPayload);

  if (!registerPayload.success) {
    return res.status(403).json({ message: "All fields are required." });
  }

  const { email, name, password } = registerPayload.data;

  const existUser = await User.findOne({ email: email });

  if (existUser) {
    return res.status(403).json({ message: "Email has already been used." });
  }

  const createUser = await User.create(registerPayload.data);

  if (!createUser) {
    return res.status(400).json({ message: "Failed to register." });
  }

  // encrypt username with public key 🔓

  res.status(200).json({
    name: createUser.name,
    email: createUser.email,
    id: createUser.id,
  });
};

const refresh = async (req: Request, res: Response) => {
  const cookies = req.cookies;

  if (!cookies) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const refreshToken = cookies.refresh;

  // console.log("refresh token inside cookie :", cookies);

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as string,
    async (err: jwt.VerifyErrors | null, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden verify error" });
      }

      // console.log(decoded);

      const foundUser = await User.findOne({
        email: decoded.UserInfo.email as string,
      });

      if (!foundUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id, name, email } = foundUser;

      const accessToken = jwt.sign(
        {
          UserInfo: {
            email: email,
            id: id,
          },
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: "10m" }
      );

      res.status(200).json({ accessToken: accessToken });
    }
  );
};

const check = async (req: Request, res: Response) => {
  const cookies = req.cookies;

  if (!cookies) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const refreshToken = cookies.refresh;

  // console.log("request cookie :", cookies);

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as string,
    async (err: jwt.VerifyErrors | null, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden verify error" });
      }

      // console.log(decoded);

      const foundUser = await User.findOne({
        email: decoded.UserInfo.email as string,
      });

      if (!foundUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id, name, email } = foundUser;

      const accessToken = jwt.sign(
        {
          UserInfo: {
            email: email,
          },
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: "10s" }
      );

      res.status(200).json({ accessToken: accessToken, _id: id, name, email });
    }
  );
};

export { login, register, refresh, check };
