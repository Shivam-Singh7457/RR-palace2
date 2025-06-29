import React, { useEffect, useState } from "react";
import Title from "../Components/Title";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const MyBookings = () => {
  const { axios, getToken, user } = useAppContext();
  const [bookings, setBookings] = useState([]);
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

  const cancelBooking = async (bookingId) => {
    try {
      const { data } = await axios.patch(`/api/bookings/user/cancel/${bookingId}`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Booking cancelled");
        fetchUserBookings(); // Refresh list
      } else {
        toast.error(data.message || "Cancellation failed");
      }
    } catch (err) {
      toast.error("Server error");
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
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                {/* Hotel Info */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <img
                    src={room?.images?.[0] || assets.defaultRoomImage}
                    alt="hotel-img"
                    className="w-full sm:w-40 h-32 object-cover rounded-lg shadow-sm"
                  />
                  <div className="flex flex-col gap-1">
                    <p className="font-playfair text-xl">
                      {hotel?.name || "RR Palace"}
                      <span className="block font-inter text-sm text-gray-500">
                        ({room?.roomType || "Room"})
                      </span>
                    </p>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <img
                        src={assets.locationIcon}
                        alt="location-icon"
                        className="w-4 h-4"
                      />
                      <span>{hotel?.address || "Address unavailable"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <img
                        src={assets.guestIcon}
                        alt="guest-icon"
                        className="w-4 h-4"
                      />
                      <span>Guests: {booking.guests || 1}</span>
                    </div>

                    <p className="text-base font-medium">
                      ₹ {booking.totalPrice || 0}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex flex-row justify-between md:flex-col md:justify-center md:gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Check-In</p>
                    <p className="text-gray-800 font-medium">
                      {booking.checkInDate
                        ? new Date(booking.checkInDate).toDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Check-Out</p>
                    <p className="text-gray-800 font-medium">
                      {booking.checkOutDate
                        ? new Date(booking.checkOutDate).toDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Payment + Cancel */}
                <div className="flex flex-col justify-between items-start md:items-center md:justify-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`h-3 w-3 rounded-full ${booking.isPaid ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <p
                      className={`font-semibold ${booking.isPaid ? "text-green-600" : "text-red-600"}`}
                    >
                      {booking.isPaid ? "Paid" : "Unpaid"}
                    </p>
                  </div>

                  {!booking.isPaid && (
                    <button
                      className="px-4 py-1.5 text-sm border border-orange-500 text-orange-600 rounded hover:bg-orange-50 transition"
                      onClick={() => navigate(`/contact?payment=true&bookingId=${booking._id}`)}
                    >
                      Pay Now
                    </button>
                  )}

                  {booking.status !== "cancelled" && (
                    <button
                      className="px-4 py-1.5 text-sm border border-red-500 text-red-600 rounded hover:bg-red-50 transition"
                      onClick={() => cancelBooking(booking._id)}
                    >
                      Cancel Booking
                    </button>
                  )}

                  {booking.status === "cancelled" && (
                    <p className="text-sm text-gray-500 italic">Cancelled</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyBookings;
