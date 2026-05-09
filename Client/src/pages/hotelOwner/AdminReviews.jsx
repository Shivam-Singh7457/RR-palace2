import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const AdminReviews = () => {
    const { axios, getToken } = useAppContext();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingId, setLoadingId] = useState(null);

    const fetchReviews = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get("/api/reviews/admin", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setReviews(data.reviews);
            }
        } catch (error) {
            toast.error("Failed to fetch reviews");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            setLoadingId(id);
            const token = await getToken();
            const { data } = await axios.put(`/api/reviews/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                toast.success(data.message);
                fetchReviews();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Operation failed");
        } finally {
            setLoadingId(null);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-playfair font-bold text-gray-900">Guest Reviews</h1>
                    <p className="text-gray-500 mt-1">Manage and moderate guest feedback</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {reviews.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400">No reviews yet.</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                                {/* Left: User & Room Info */}
                                <div className="md:w-64 space-y-4 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <img src={review.userImage || "https://via.placeholder.com/40"} alt={review.userName} className="w-12 h-12 rounded-full border-2 border-orange-100" />
                                        <div>
                                            <p className="font-bold text-gray-900">{review.userName}</p>
                                            <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-orange-50 rounded-2xl p-4 space-y-2">
                                        <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Room Details</p>
                                        <p className="font-semibold text-gray-800">{review.room?.roomType}</p>
                                        <p className="text-sm text-gray-600">No. {review.room?.roomNumber}</p>
                                    </div>

                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                                        review.status === "approved" ? "bg-green-100 text-green-600" :
                                        review.status === "rejected" ? "bg-red-100 text-red-600" :
                                        "bg-yellow-100 text-yellow-600"
                                    }`}>
                                        {review.status}
                                    </div>
                                </div>

                                {/* Right: Ratings & Comments */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex text-orange-500 text-xl">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <span key={s}>{s <= review.rating ? "★" : "☆"}</span>
                                            ))}
                                        </div>
                                        <span className="text-gray-400">|</span>
                                        <p className="font-medium text-gray-900 italic">"{review.experience}"</p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                        {Object.entries(review.qualityRatings || {}).map(([key, value]) => (
                                            <div key={key} className="text-center p-2 rounded-xl bg-gray-50">
                                                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                <p className="text-sm font-bold text-gray-800">{value}/5</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Admin Actions */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                                        {review.status !== "approved" && (
                                            <button 
                                                onClick={() => !loadingId && handleStatusUpdate(review._id, "approved")}
                                                disabled={!!loadingId}
                                                className={`px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition shadow-lg shadow-green-100 flex items-center gap-2 ${loadingId === review._id ? "opacity-70 cursor-not-allowed" : ""}`}
                                            >
                                                {loadingId === review._id && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                                {loadingId === review._id ? "..." : "Approve"}
                                            </button>
                                        )}
                                        {review.status !== "rejected" && (
                                            <button 
                                                onClick={() => !loadingId && handleStatusUpdate(review._id, "rejected")}
                                                disabled={!!loadingId}
                                                className={`px-6 py-2 bg-white text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-50 transition flex items-center gap-2 ${loadingId === review._id ? "opacity-70 cursor-not-allowed" : ""}`}
                                            >
                                                {loadingId === review._id && <div className="w-3 h-3 border-2 border-red-100/30 border-t-red-600 rounded-full animate-spin"></div>}
                                                {loadingId === review._id ? "..." : "Reject"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminReviews;
