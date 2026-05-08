import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log("✅ Database connected successfully"));
        mongoose.connection.on('error', (err) => console.error("❌ MongoDB connection error:", err));

        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        // Clean the URI - remove trailing slash if present to avoid double slash
        const cleanUri = uri.endsWith('/') ? uri.slice(0, -1) : uri;

        await mongoose.connect(`${cleanUri}/hotel-booking`, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 10
        });
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        // Don't throw here, let startServer handle it
        throw error;
    }
}


export default connectDB;