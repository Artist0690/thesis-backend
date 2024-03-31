import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import z from "zod";
import { User } from "../Models/User";

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

  // wrong password
  if (password !== foundUser.password) {
    return res.status(401).json({ message: "Invalid Email or password." });
  }

  const accessToken = jwt.sign(
    {
      UserInfo: {
        name: foundUser.email,
      },
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: "10s" }
  );

  const refreshToken = jwt.sign(
    {
      UserInfo: {
        email: foundUser.email,
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
  res.status(200).json({ accessToken, email: email });
};

const register = async (req: Request, res: Response) => {
  const zodRegisterPayload = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
  });

  const registerPayload = zodRegisterPayload.safeParse(req.body);

  if (!registerPayload.success) {
    return res.status(403).json({ message: "All fields are required." });
  }

  const { email, name, password } = registerPayload.data;

  const existUser = await User.findOne({ email: email });

  if (existUser) {
    return res.status(403).json({ message: "Email have already been used." });
  }

  const createUser = await User.create(registerPayload.data);

  if (!createUser) {
    res.status(400).json({ message: "Failed to register." });
  }

  res.status(200).json(createUser);
};

const refresh = async (req: Request, res: Response) => {
  const cookies = req.cookies;

  if (!cookies) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const refreshToken = cookies.refresh;

  console.log("request cookie :", cookies);

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

      const accessToken = jwt.sign(
        {
          UserInfo: {
            email: foundUser.email,
          },
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: "10s" }
      );

      res.json({ accessToken });
    }
  );
};

export { login, register, refresh };
