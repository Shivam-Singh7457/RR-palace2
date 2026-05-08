import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import connectDB from "./configs/db.js";
import "./configs/passport.js"; // Initialize passport config
import connectCloudinary from "./configs/cloudinary.js";
import userRouter from "./routes/userRoutes.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import amenitiesRoutes from "./routes/amenitiesRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import authRouter from "./routes/authRoutes.js";
import { initCleanupTask } from "./utils/cleanupTask.js";

// ✅ Initialize Cloudinary and Cleanup
connectCloudinary();
initCleanupTask();

const app = express();
// ✅ CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "https://rr-palace2.vercel.app" // Direct production URL without slash
].map(url => url?.endsWith('/') ? url.slice(0, -1) : url).filter(Boolean);

// Also add the versions WITH slashes to be safe
const originsWithSlashes = allowedOrigins.map(url => `${url}/`);
const finalAllowedOrigins = [...new Set([...allowedOrigins, ...originsWithSlashes])];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || finalAllowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// ✅ Basic check route
app.get("/", (req, res) => res.send("API is working"));

// ✅ API Routes
app.use("/api/auth", authRouter);
app.use("/api/amenities", amenitiesRoutes);
app.use("/api/user", userRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/reviews", reviewRouter);

// ✅ Start Server after DB Connection
const startServer = async () => {
    try {
        await connectDB();
        const port = process.env.PORT || 5000;
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();