import { v2 as cloudinary } from "cloudinary";
import Amenity from "../models/Amenities.js";

// Upload Amenity Images - Public for logged-in users
export const uploadAmenityImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.json({ success: false, message: "No images provided" });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "amenities" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);

    const savedImages = await Promise.all(
      results.map((result) =>
        Amenity.create({
          imageUrl: result.secure_url,
          uploadedBy: req.user?._id || "anonymous",
        })
      )
    );

    res.json({ success: true, data: savedImages });
  } catch (error) {
    console.error("🔴 Cloudinary Upload Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get All Amenities - Public Route
export const getAmenityImages = async (req, res) => {
  try {
    const amenities = await Amenity.find().sort({ createdAt: -1 });
    res.json({ success: true, data: amenities });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Delete Amenity
export const deleteAmenity = async (req, res) => {
  try {
    const { id } = req.params;
    const amenity = await Amenity.findById(id);
    if (!amenity) return res.json({ success: false, message: "Amenity not found" });

    // Optional: delete from Cloudinary (if needed)
    const publicId = amenity.imageUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId);

    await Amenity.findByIdAndDelete(id);

    res.json({ success: true, message: "Amenity deleted" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};