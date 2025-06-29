import mongoose from "mongoose";

const amenitiesSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    uploadedBy: { type: String }, // Optional: Clerk user ID or name
  },
  { timestamps: true }
);

export default mongoose.model("Amenity", amenitiesSchema);
