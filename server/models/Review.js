import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: {
        type: String, // Clerk User ID
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userImage: {
        type: String
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
        unique: true // One review per booking
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    experience: {
        type: String, // Overall feedback
        required: true
    },
    qualityRatings: {
        cleanliness: { type: Number, min: 1, max: 5 },
        comfort: { type: Number, min: 1, max: 5 },
        staff: { type: Number, min: 1, max: 5 },
        location: { type: Number, min: 1, max: 5 },
        valueForMoney: { type: Number, min: 1, max: 5 }
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
