import User from "../models/User.js";

export const protect = async (req, res, next) => {
  const { userId: clerkId, sessionClaims } = req.auth;

  if (!clerkId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    let user = await User.findById(clerkId);

    if (!user) {
      console.log(`Creating new user: ${clerkId}`);

      user = await User.create({
        _id: clerkId,
        username: sessionClaims?.name || "New Clerk User",
        email: sessionClaims?.email_address || `${clerkId}@example.com`,
        image: sessionClaims?.picture || "https://ui-avatars.com/api/?name=User",  // ✅ Fallback image
        role: "user",
        recentSearchedCities: [],
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ success: false, message: "Failed to authenticate user" });
  }
};