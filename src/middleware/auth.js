// src/middleware/auth.js
import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "Not authorized: no token provided" });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      // Helpful logs for debugging. Remove or reduce in production.
      console.error("JWT verify error:", err.name, err.message);
      if (err.name === "TokenExpiredError") return res.status(401).json({ message: "Token expired" });
      return res.status(401).json({ message: "Invalid token" });
    }

    // Support different claim names just in case
    const userId = decoded?.id || decoded?.userId || decoded?._id;
    if (!userId) return res.status(401).json({ message: "Invalid token payload" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
