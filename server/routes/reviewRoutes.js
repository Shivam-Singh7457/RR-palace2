import express from "express";
import { 
    submitReview, 
    getAdminReviews, 
    updateReviewStatus, 
    getRoomReviews,
    getLatestReviews
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, submitReview);
router.get("/admin", protect, getAdminReviews);
router.put("/:id/status", protect, updateReviewStatus);
router.get("/room/:roomId", getRoomReviews);
router.get("/latest", getLatestReviews);

export default router;
