import { v2 as cloudinary } from "cloudinary";
import Amenity from "../models/Amenities.js";

// Upload Amenity Images - Public for logged-in users
export const uploadAmenityImages = async (req, res) => {
  try {
    const uploaded = req.files.map(async (file) => {
      const response = await cloudinary.uploader.upload(file.path);

      return await Amenity.create({
        imageUrl: response.secure_url,
        uploadedBy: req.user?._id || "anonymous", // Optional
      });
    });

    const uploadedImages = await Promise.all(uploaded);

    res.json({ success: true, data: uploadedImages });
  } catch (error) {
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