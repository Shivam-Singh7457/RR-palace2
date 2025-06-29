import User from "../models/User.js";

export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId; // comes from Clerk middleware
    const user = await User.findById(userId); // fetch full document

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { role, recentSearchedCities } = user;
    res.json({ success: true, role, recentSearchedCities });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const storeRecentSearchedCities = async (req, res) => {
  try {
    const { recentSearchedCity } = req.body;
    const user = req.user;

    if (user.recentSearchedCities.includes(recentSearchedCity)) {
      return res.json({ success: true, message: "City already in recent list" });
    }

    if (user.recentSearchedCities.length < 3) {
      user.recentSearchedCities.push(recentSearchedCity);
    } else {
      user.recentSearchedCities.shift();
      user.recentSearchedCities.push(recentSearchedCity);
    }

    await user.save();
    res.json({ success: true, message: "City added" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};