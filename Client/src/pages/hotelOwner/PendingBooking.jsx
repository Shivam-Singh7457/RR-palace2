import React, { useEffect, useState } from "react";
import Title from "../../Components/Title";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const PendingBookings = () => {
  const { axios, getToken } = useAppContext();
  const [bookings, setBookings] = useState([]);

  const fetchPendingBookings = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("/api/bookings/all?status=pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data.bookings);
    } catch (err) {
      toast.error("Failed to fetch pending bookings");
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const token = await getToken();
      if (newStatus === "cancelled") {
        // Delete the booking from DB
        const res = await axios.delete(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          toast.success("Booking rejected and deleted");
        } else {
          toast.error(res.data.message || "Deletion failed");
        }
      } else {
        // Confirm the booking
        const res = await axios.patch(
          `/api/bookings/${bookingId}/mark-paid`,
          { status: newStatus },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.data.success) {
          toast.success(`Booking ${newStatus}`);
        } else {
          toast.error(res.data.message || "Update failed");
        }
      }
      fetchPendingBookings();
    } catch (err) {
      toast.error("Failed to update booking status");
    }
  };

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  return (
    <div>
      <Title
        align="left"
        font="outfit"
        title="Pending Bookings"
        subTitle="Review new booking requests and choose to confirm or reject them."
      />

      <div className="w-full overflow-x-auto border border-gray-300 rounded-lg max-h-[500px] overflow-y-scroll">
        <table className="w-full">
          <thead className="bg-gray-50 text-sm text-left">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Check In</th>
              <th className="px-4 py-3">Check Out</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-5 text-center text-gray-500">
                  No pending bookings.
                </td>
              </tr>
            ) : (
              bookings.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-3 text-gray-700">{item.user?.username || "N/A"}</td>
                  <td className="px-4 py-3 text-gray-700">{item.room?.roomType || "N/A"}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(item.checkInDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(item.checkOutDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-700 flex gap-2">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md"
                      onClick={() => handleStatusUpdate(item._id, "confirmed")}
                    >
                      Confirm
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                      onClick={() => handleStatusUpdate(item._id, "cancelled")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingBookings;
