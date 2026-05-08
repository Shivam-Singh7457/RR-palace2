import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Room from "../models/Rooms.js";

// @desc    Submit a new review
// @route   POST /api/reviews
// @access  Private
export const submitReview = async (req, res) => {
    try {
        const { bookingId, rating, experience, qualityRatings, userName, userImage } = req.body;
        const userId = req.auth.userId;

        // Verify booking exists and belongs to user
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.json({ success: false, message: "Booking not found" });
        }

        // Check if user already reviewed this booking
        const existingReview = await Review.findOne({ booking: bookingId });
        if (existingReview) {
            return res.json({ success: false, message: "You have already reviewed this booking" });
        }

        const newReview = new Review({
            user: userId,
            userName,
            userImage,
            room: booking.room,
            booking: bookingId,
            rating,
            experience,
            qualityRatings,
        });

        await newReview.save();

        res.json({ success: true, message: "Review submitted successfully! It will be visible after approval." });
    } catch (error) {
        console.error("Error submitting review:", error);
        res.json({ success: false, message: error.message });
    }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/admin
// @access  Private (Admin)
export const getAdminReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate("room", "roomType roomNumber images")
            .sort({ createdAt: -1 });
        
        res.json({ success: true, reviews });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// @desc    Update review status (Approve/Reject)
// @route   PUT /api/reviews/:id/status
// @access  Private (Admin)
export const updateReviewStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!["approved", "rejected"].includes(status)) {
            return res.json({ success: false, message: "Invalid status" });
        }

        const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
        
        if (!review) {
            return res.json({ success: false, message: "Review not found" });
        }

        res.json({ success: true, message: `Review ${status} successfully`, review });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// @desc    Get approved reviews for a room
// @route   GET /api/reviews/room/:roomId
// @access  Public
export const getRoomReviews = async (req, res) => {
    try {
        const { roomId } = req.params;
        const reviews = await Review.find({ room: roomId, status: "approved" })
            .sort({ createdAt: -1 });
        
        res.json({ success: true, reviews });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// @desc    Get latest approved reviews for home page
// @route   GET /api/reviews/latest
// @access  Public
export const getLatestReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ status: "approved" })
            .populate("room", "roomType")
            .sort({ createdAt: -1 })
            .limit(6);
        
        res.json({ success: true, reviews });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
