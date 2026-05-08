import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Required for email login
  googleId: { type: String }, // Required for google login
  image: { type: String },

  role: { type: String, enum: ["user", "hotelOwner"], default: "user" },

  resetPasswordOTP: { type: String },
  resetPasswordOTPExpires: { type: Date },

  recentSearchedCities: [{ type: String }],
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);
export default User;