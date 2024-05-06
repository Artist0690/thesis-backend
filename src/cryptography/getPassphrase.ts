import crypto from "crypto";

// Function to generate a cryptographically secure random passphrase
export function generatePassphrase(length: number) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  let passphrase = "";

  // Calculate the number of bytes needed to generate the passphrase
  const bytesNeeded = Math.ceil((length * Math.log2(charset.length)) / 8);

  // Generate cryptographically secure random bytes
  const randomBytes = crypto.randomBytes(bytesNeeded);

  // Convert random bytes into characters from the charset
  for (let i = 0; i < randomBytes.length; i++) {
    const randomIndex = randomBytes[i] % charset.length;
    passphrase += charset.charAt(randomIndex);
  }

  return passphrase;
}
