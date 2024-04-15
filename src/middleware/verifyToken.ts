import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestHeader = req.headers.authorization;

  // console.log("request header :", requestHeader);
  if (!requestHeader || !requestHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const accessToken = requestHeader.split(" ")[1];
  console.log({ accessToken });

  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string;

  jwt.verify(accessToken, accessTokenSecret, (error, decoded: any) => {
    if (error) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // some logic 📌
    // set user id to request object
    req.user = { id: decoded.UserInfo.id };
    console.log(req.user);
    next();
  });
};
