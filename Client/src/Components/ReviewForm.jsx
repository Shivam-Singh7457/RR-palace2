import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const ReviewForm = ({ booking, onClose, onSuccess }) => {
    const { axios, getToken, user } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState(0);
    const [experience, setExperience] = useState("");
    const [qualityRatings, setQualityRatings] = useState({
        cleanliness: 0,
        comfort: 0,
        staff: 0,
        location: 0,
        valueForMoney: 0
    });

    const categories = [
        { key: "cleanliness", label: "Cleanliness" },
        { key: "comfort", label: "Comfort & Quality" },
        { key: "staff", label: "Staff Service" },
        { key: "location", label: "Location" },
        { key: "valueForMoney", label: "Value for Money" }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            return toast.error("Please provide an overall rating");
        }

        const missingQuality = Object.values(qualityRatings).some(v => v === 0);
        if (missingQuality) {
            return toast.error("Please fill in all quality categories");
        }

        setLoading(true);

        try {
            const token = await getToken();
            const { data } = await axios.post("/api/reviews", {
                bookingId: booking._id,
                rating,
                experience,
                qualityRatings,
                userName: user.fullName || user.username || "Guest User",
                userImage: user.imageUrl
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                onSuccess();
                onClose();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to submit review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-8 my-auto relative animate-in fade-in zoom-in duration-300">
                <button 
                    onClick={onClose}
                    className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center mb-6 sm:mb-8 mt-4 sm:mt-0">
                    <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-gray-900">Your Experience Matters</h2>
                    <p className="text-sm text-gray-500 mt-2 italic">How was your stay in Room {booking?.room?.roomType}?</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Overall Rating */}
                    <div className="flex flex-col items-center gap-3">
                        <p className="font-semibold text-gray-700">Overall Rating</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`text-3xl transition-all duration-200 ${star <= rating ? "text-orange-500 scale-110" : "text-gray-200 hover:text-orange-200"}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Ratings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl">
                        {categories.map((cat) => (
                            <div key={cat.key} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">{cat.label}</span>
                                    <span className="text-xs font-bold text-orange-600">{qualityRatings[cat.key]}/5</span>
                                </div>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setQualityRatings(prev => ({ ...prev, [cat.key]: s }))}
                                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= qualityRatings[cat.key] ? "bg-orange-500" : "bg-gray-200"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Feedback Text */}
                    <div className="space-y-2">
                        <label className="font-semibold text-gray-700 block">Describe your experience</label>
                        <textarea
                            required
                            rows="4"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            placeholder="Tell us what you loved or how we can improve..."
                            className="w-full border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-orange-200 transition-all resize-none"
                        ></textarea>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-4 rounded-xl font-semibold text-white transition-all shadow-lg shadow-orange-200/50 flex items-center justify-center gap-2 ${loading ? "bg-orange-300 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 active:scale-[0.98]"}`}
                        >
                            {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                            {loading ? "Submitting..." : "Post Review"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewForm;
