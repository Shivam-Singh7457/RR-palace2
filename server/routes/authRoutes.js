import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getUserProfile,
    forgotPassword,
    verifyOTP,
    resetPassword
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Email/Password Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/profile", protect, getUserProfile);

// Password Reset Routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Google OAuth Routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login", session: false }),
    (req, res) => {
        // Successful authentication, redirect home or send token
        const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        });

        // Set cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        // Redirect to frontend with token (optional, or just use cookie)
        // Usually, for SPAs, you might redirect to a specific URL that handles the login success
        res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/login-success?token=${token}`);
    }
);

export default router;
