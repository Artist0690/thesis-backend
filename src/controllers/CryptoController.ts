import { Request, Response } from "express";
import z from "zod";
import forge from "node-forge";
import { encrypt_rsa_key } from "../cryptography/rsa_crypto";

const encrypt_process = async (req: Request, res: Response) => {
  const RequestPayloadSchema = z.object({
    plaintext: z.string(),
    public_key: z.string(),
  });

  const request_payload = req.body;

  const Zcheck = RequestPayloadSchema.safeParse(request_payload);

  if (!Zcheck.success) {
    return res.status(403).json({ message: "All fields are required." });
  }

  const { plaintext, public_key } = Zcheck.data;
  // encrypt plaintext using public key
  // const rsa = new NodeRSA();
  // const cipher = rsa.encryptStringWithRsaPublicKey({
  //   text: plaintext,
  //   publicKey: public_key,
  // });

  const appendix = "server encrypt this message.";
  const cipher = encrypt_rsa_key(plaintext + appendix, public_key);

  console.log("encrypted :", cipher);

  res.status(200).json({
    cipher: cipher,
    message: "ok",
  });
};

export { encrypt_process };
