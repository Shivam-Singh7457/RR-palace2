import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhooks from "./controllers/clerkWebhooks.js";
import userRouter from "./routes/userRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import amenitiesRoutes from "./routes/amenitiesRoutes.js";

// ✅ Initialize DB and Cloudinary
connectDB();
connectCloudinary();

const app = express();
app.use(cors());

// 🔁 Use raw parser ONLY for Clerk Webhook
app.use("/api/clerk", clerkWebhooks);

// ✅ JSON body for other routes
app.use(express.json());
app.use(clerkMiddleware());





// ✅ Basic check route
app.get("/", (req, res) => res.send("API is working"));

// ✅ API Routes
app.use("/api/amenities", amenitiesRoutes);
app.use("/api/user", userRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

// ✅ Listen on Render-supplied port or default to 5000
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
