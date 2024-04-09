const crypto = require("crypto");

const algorithm = "aes-256-ecb";
const secretKey = Buffer.from(
  "a64c0629e72a0329527c62020685f093f13a4def364e92efaed63909f6613a7d",
  "hex"
);

// Function to encrypt text
function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, secretKey, null); // ECB doesn't use an IV
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// Function to decrypt text
function decrypt(encryptedText) {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, null); // ECB doesn't use an IV
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { encrypt, decrypt };
