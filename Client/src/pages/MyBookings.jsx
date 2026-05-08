import React, { useEffect, useState } from "react";
import Title from "../Components/Title";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ReviewForm from "../Components/ReviewForm";

const MyBookings = () => {
  const { axios, getToken, user } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const navigate = useNavigate();

  const fetchUserBookings = async () => {
    try {
      const { data } = await axios.get("/api/bookings/user", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setBookings(data.bookings);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const cancelBooking = async () => {
    if (!bookingToCancel) return;
    try {
      setCancelLoading(true);
      const { data } = await axios.patch(`/api/bookings/user/cancel/${bookingToCancel}`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Booking cancelled");
        fetchUserBookings(); // Refresh list
        setShowCancelConfirmation(false);
      } else {
        toast.error(data.message || "Cancellation failed");
      }
    } catch (err) {
      toast.error("Server error");
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchUserBookings();
  }, [user]);

  return (
    <div className="py-28 md:pb-36 px-4 md:px-16 lg:px-24 xl:px-32 bg-gray-50 min-h-screen">
      <Title
        title="My Bookings"
        subTitle="Manage your bookings with ease"
        align="left"
      />

      <div className="max-w-6xl mt-8 space-y-6 text-gray-800">
        {bookings.length === 0 && (
          <div className="text-center text-gray-500 mt-10 text-lg">
            No bookings found.
          </div>
        )}

        {bookings.map((booking) => {
          const room = booking?.room;
          const hotel = booking?.hotel;

          return (
            <div
              key={booking._id}
              className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${booking.status === "cancelled" ? "opacity-60" : ""}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-5 md:p-8">
                {/* Hotel Info */}
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-5">
                  <img
                    src={room?.images?.[0] || assets.defaultRoomImage}
                    alt="hotel-img"
                    className="w-full sm:w-48 lg:w-full xl:w-48 h-40 sm:h-36 lg:h-48 xl:h-36 object-cover rounded-2xl shadow-sm"
                  />
                  <div className="flex flex-col justify-center gap-1.5">
                    <p className={`font-playfair text-xl md:text-2xl font-bold ${booking.status === "cancelled" ? "line-through text-gray-400" : "text-gray-900"}`}>
                      {room?.roomType || "Room"}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <img
                        src={assets.locationIcon}
                        alt="location-icon"
                        className="w-3.5 h-3.5 opacity-60"
                      />
                      <span className="truncate max-w-[200px]">{hotel?.address || "Address unavailable"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <img
                        src={assets.guestsIcon}
                        alt="guest-icon"
                        className="w-3.5 h-3.5 opacity-60"
                      />
                      <span>Guests: {booking.guests || 1}</span>
                    </div>

                    <p className={`text-lg font-bold mt-1 ${booking.status === "cancelled" ? "line-through text-gray-400" : "text-black"}`}>
                      ₹ {booking.totalPrice || 0}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex flex-row sm:flex-col justify-around sm:justify-center border-y md:border-y-0 md:border-x border-gray-100 py-4 md:py-0 px-4 md:px-8 gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Check-In</p>
                    <p className={`text-sm md:text-base font-semibold ${booking.status === "cancelled" ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {booking.checkInDate
                        ? new Date(booking.checkInDate).toDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Check-Out</p>
                    <p className={`text-sm md:text-base font-semibold ${booking.status === "cancelled" ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {booking.checkOutDate
                        ? new Date(booking.checkOutDate).toDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Payment + Cancel */}
                <div className="flex flex-col sm:flex-row lg:flex-col justify-center items-center gap-3 w-full lg:w-auto">
                  <div className="flex items-center gap-2 text-sm bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${booking.isPaid ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                    ></div>
                    <p
                      className={`font-bold uppercase tracking-wider text-[10px] ${booking.isPaid ? "text-green-600" : "text-red-600"}`}
                    >
                      {booking.isPaid ? "Paid" : "Unpaid"}
                    </p>
                  </div>

                  {!booking.isPaid && booking.status !== "cancelled" && (
                    <button
                      className="w-full sm:w-auto lg:w-full px-6 py-2 text-sm bg-black text-white rounded-xl hover:bg-gray-900 transition shadow-lg active:scale-95"
                      onClick={() => navigate(`/contact?payment=true&bookingId=${booking._id}`)}
                    >
                      Pay Now
                    </button>
                  )}

                  {booking.status !== "cancelled" && new Date(booking.checkInDate) >= new Date().setHours(0,0,0,0) && (
                    <button
                      className="w-full sm:w-auto lg:w-full px-6 py-2 text-sm border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition active:scale-95"
                      onClick={() => {
                        setBookingToCancel(booking._id);
                        setShowCancelConfirmation(true);
                      }}
                    >
                      Cancel
                    </button>
                  )}

                  {booking.status === "cancelled" && (
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest bg-gray-100 px-4 py-1 rounded-full">Cancelled</p>
                  )}

                  {booking.status !== "cancelled" && new Date(booking.checkOutDate) <= new Date() && (
                    <button
                      className="w-full sm:w-auto lg:w-full px-6 py-2 text-sm bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition shadow-lg active:scale-95"
                      onClick={() => {
                        setSelectedBookingForReview(booking);
                        setShowReviewForm(true);
                      }}
                    >
                      Rate & Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Cancel Booking?</h2>
              <p className="text-gray-500">Do you really want to cancel this booking? This action cannot be undone.</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={cancelBooking}
                disabled={cancelLoading}
                className={`w-full bg-red-600 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${cancelLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-red-700 shadow-md active:scale-[0.98]"}`}
              >
                {cancelLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {cancelLoading ? "Cancelling..." : "Yes, Cancel Booking"}
              </button>
              <button 
                onClick={() => !cancelLoading && setShowCancelConfirmation(false)}
                disabled={cancelLoading}
                className={`w-full text-gray-500 py-2 text-sm font-medium transition-colors ${cancelLoading ? "opacity-50 cursor-not-allowed" : "hover:text-gray-800"}`}
              >
                No, Keep My Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && selectedBookingForReview && (
        <ReviewForm 
          booking={selectedBookingForReview}
          onClose={() => setShowReviewForm(false)}
          onSuccess={fetchUserBookings}
        />
      )}
    </div>
  );
};

export default MyBookings;
