import crypto, { randomBytes } from "crypto";

export function generatePassphrase(length: number) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  let passphrase = "";

  const bytesNeeded = Math.ceil((length * Math.log2(charset.length)) / 8);

  const randomBytes = crypto.randomBytes(bytesNeeded);

  for (let i = 0; i < randomBytes.length; i++) {
    const randomIndex = randomBytes[i] % charset.length;
    passphrase += charset.charAt(randomIndex);
  }

  return passphrase;
}

export const get_AES_key = () => {
  return randomBytes(8).toString("hex");
};
