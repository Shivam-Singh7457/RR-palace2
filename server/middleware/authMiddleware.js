import User from "../models/User.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

export const protect = async (req, res, next) => {
  const { userId: clerkId } = req.auth;

  if (!clerkId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    let user = await User.findById(clerkId);

    if (!user) {
      console.log(`Creating new user: ${clerkId}`);

      const clerkUser = await clerkClient.users.getUser(clerkId);

      // ✅ Safe access
      const firstName = clerkUser.firstName || "";
      const lastName = clerkUser.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim() || "New Clerk User";

      const email =
        clerkUser.emailAddresses?.[0]?.emailAddress || `${clerkId}@example.com`;

      const image =
        clerkUser.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`;

      user = await User.create({
        _id: clerkUser.id,
        username: fullName,
        email,
        image,
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
