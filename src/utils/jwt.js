// src/utils/jwt.js
import jwt from "jsonwebtoken";

const getSecret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) {
    // throw so misconfiguration fails fast if env wasn't loaded
    throw new Error("FATAL: JWT_SECRET is not set in environment");
  }
  return s;
};

const EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

export const signToken = (payload) => {
  const SECRET = getSecret();
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
};

export const verifyToken = (token) => {
  const SECRET = getSecret();
  return jwt.verify(token, SECRET);
};
