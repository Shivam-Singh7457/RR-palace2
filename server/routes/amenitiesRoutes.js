import express from "express";
import multer from "multer";
import { uploadAmenityImages, getAmenityImages , deleteAmenity} from "../controllers/amenitiesController.js";
import { protect } from "../middleware/authMiddleware.js"; // Clerk-based auth
const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.get("/", getAmenityImages); // Public route
router.post("/upload", protect, upload.array("images", 10), uploadAmenityImages); // Authenticated upload
router.delete("/:id", protect, deleteAmenity); 

export default router;
