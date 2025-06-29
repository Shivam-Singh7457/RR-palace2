import React, { useEffect, useState } from "react";
import Title from "../../Components/Title";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const AdminBookings = () => {
  const { axios, getToken } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("");
  const [isPaid, setIsPaid] = useState("");
  const [search, setSearch] = useState("");
  const [checkInDate, setCheckInDate] = useState("");

  const formatDate = (date) => new Date(date).toISOString().split("T")[0];

  const fetchBookings = async () => {
    try {
      const token = await getToken();
      const query = new URLSearchParams();

      if (status) query.append("status", status);
      if (isPaid) query.append("isPaid", isPaid);
      if (search) query.append("search", search);
      if (checkInDate) query.append("checkInDate", checkInDate);

      const res = await axios.get(`/api/bookings/all?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(res.data.bookings);
    } catch (err) {
      toast.error("Failed to fetch bookings");
    }
  };

  const handleTogglePaid = async (bookingId, paidStatus) => {
    try {
      const token = await getToken();
      const endpoint = paidStatus ? "mark-unpaid" : "mark-paid";
      const res = await axios.patch(`/api/bookings/${bookingId}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.success) {
        await fetchBookings();
        toast.success(paidStatus ? "Marked as unpaid" : "Marked as paid");
      } else {
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (err) {
      console.log(err.message)
      toast.error("Failed to update payment status");
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [status, isPaid, search, checkInDate]);

  return (
    <div>
      <Title
        align="left"
        font="outfit"
        title="All Bookings"
        subTitle="Filter and view all bookings with UPI reference and payment status."
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={isPaid}
          onChange={(e) => setIsPaid(e.target.value)}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">All Payment</option>
          <option value="true">Paid</option>
          <option value="false">Unpaid</option>
        </select>

        <input
          type="text"
          placeholder="Search by customer"
          className="border px-3 py-2 rounded-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          className="border px-3 py-2 rounded-md"
          value={checkInDate}
          onChange={(e) => setCheckInDate(e.target.value)}
        />
      </div>

      {/* Bookings Table */}
      <div className="w-full overflow-x-auto border border-gray-300 rounded-lg max-h-[500px] overflow-y-scroll">
        <table className="w-full">
          <thead className="bg-gray-50 text-sm text-left">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Check In</th>
              <th className="px-4 py-3">Check Out</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">UPI Ref</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-5 text-center text-gray-500">
                  No bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-3 text-gray-700">{item.user?.username || "N/A"}</td>
                  <td className="px-4 py-3 text-gray-700">{item.room?.roomType || "N/A"}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(item.checkInDate)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(item.checkOutDate)}</td>
                  <td className="px-4 py-3 text-gray-700">{item.status}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <button
                      className={`text-xs px-2 py-1 rounded-full mx-auto ${item.isPaid ? "bg-green-200 text-green-700" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"}`}
                      onClick={() => handleTogglePaid(item._id, item.isPaid)}
                    >
                      {item.isPaid ? "Mark as Unpaid" : "Mark as Paid"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {item.upiRefNumber ? (
                      <span className="text-blue-800 font-medium">{item.upiRefNumber}</span>
                    ) : (
                      "-"
                    )}
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

export default AdminBookings;
