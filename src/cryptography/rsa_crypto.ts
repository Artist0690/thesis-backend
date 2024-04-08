import forge from "node-forge";

export const encrypt_rsa_key = (text: string, pem: string) => {
  const pubKey = forge.pki.publicKeyFromPem(pem);
  const cipher = pubKey.encrypt(text, "RSA-OAEP");
  return cipher;
};
