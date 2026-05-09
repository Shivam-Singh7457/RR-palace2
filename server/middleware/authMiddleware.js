import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    console.log("🎟️ Token found in Authorization header");
  } 
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("🍪 Token found in cookies");
  }

  if (!token) {
    console.warn("⚠️ No token provided in request");
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified for user ID:", decoded.id);

    // Get user from token
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
        console.warn("⚠️ User not found for verified token:", decoded.id);
        return res.status(401).json({ success: false, message: "User not found" });
    }

    // Support legacy req.auth for compatibility with controllers that use req.auth.userId
    req.auth = { userId: req.user._id.toString() };

    next();
  } catch (err) {
    console.error("🔴 Auth middleware error:", err.message);
    res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};
