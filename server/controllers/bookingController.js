import Booking from "../models/Booking.js";
import Room from "../models/Rooms.js";
import Hotel from "../models/Hotel.js";
import transporter from "../configs/nodemailer.js";

const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
  try {
    const bookings = await Booking.find({
      room,
      checkInDate: { $lte: checkOutDate },
      checkOutDate: { $gte: checkInDate },
      status: { $nin: ["cancelled"] }, // ✅ Ignore cancelled/rejected
    });
    return bookings.length === 0;
  } catch (error) {
    console.log("Availability check error:", error.message);
    return false;
  }
};

export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
    res.json({ success: true, isAvailable });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { room, checkInDate, checkOutDate, guests } = req.body;
    const user = req.user._id;

    const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
    if (!isAvailable) {
      return res.json({ success: false, message: "Room is not available" });
    }

    const roomData = await Room.findById(room).populate("hotel");
    if (!roomData) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    let totalPrice = roomData.pricePerNight;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    totalPrice *= nights;

    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests,
      checkInDate,
      checkOutDate,
      totalPrice,
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: req.user.email,
      subject: "Hotel Booking Details",
      html: `
        <h2>Your Booking Details</h2>
        <p>Dear ${req.user.username},</p>
        <p>Thank you for booking! Here are your details:</p>
        <ul>
          <li><strong>Booking ID:</strong> ${booking._id}</li>
          <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
          <li><strong>Location:</strong> ${roomData.hotel.address}</li>
          <li><strong>Check-In:</strong> ${booking.checkInDate.toDateString()}</li>
          <li><strong>Check-Out:</strong> ${booking.checkOutDate.toDateString()}</li>
          <li><strong>Booking Amount:</strong> ${process.env.currency || "₹"} ${booking.totalPrice}</li>
        </ul>
        <p>We look forward to welcoming you!</p>
        <p>If you have any questions, feel free to reach out.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Booking created successfully", booking });
  } catch (error) {
    console.error("Create booking error:", error);
    res.json({ success: false, message: "Booking creation failed" });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const user = req.user._id;
    const bookings = await Booking.find({ user }).populate("room hotel").sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch user bookings" });
  }
};

export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.auth.userId });

    if (!hotel) {
      return res.json({ success: false, message: "No hotel found" });
    }

    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel user")
      .sort({ createdAt: -1 });

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);

    res.json({
      success: true,
      dashboardData: {
        totalBookings,
        totalRevenue,
        bookings,
      },
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch hotel bookings" });
  }
};

export const submitUPIReference = async (req, res) => {
  try {
    const { bookingId, upiRef } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.upiRefNumber = upiRef;
    booking.upiSubmitted = true;

    await booking.save();

    res.status(200).json({ success: true, message: "UPI reference saved" });
  } catch (error) {
    console.error("Error saving UPI ref:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllBookingsForAdmin = async (req, res) => {
  try {
    const { status, isPaid, search, checkInDate } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (isPaid === "true" || isPaid === "false") filter.isPaid = isPaid === "true";
    if (checkInDate) filter.checkInDate = { $gte: new Date(checkInDate) };

    const userFilter = search
      ? {
          $or: [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const matchedUsers = search
      ? await User.find(userFilter).select("_id")
      : [];

    if (search && matchedUsers.length > 0) {
      filter.user = { $in: matchedUsers.map((u) => u._id) };
    } else if (search) {
      return res.status(200).json({ success: true, bookings: [] });
    }

    const bookings = await Booking.find(filter)
      .populate("user", "username email")
      .populate("room", "roomType")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching admin bookings:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const markAsPaid = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("room")
      .populate("hotel")
      .populate("user");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.isPaid = true;
    booking.paymentMethod = "UPI";
    await booking.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: booking.user.email,
      subject: "Payment Confirmed – RR Palace",
      html: `
        <h2>Payment Confirmation</h2>
        <p>Dear ${booking.user.username},</p>
        <p>We have received your payment successfully.</p>
        <ul>
          <li><strong>Booking ID:</strong> ${booking._id}</li>
          <li><strong>Hotel Name:</strong> ${booking.hotel.name}</li>
          <li><strong>Location:</strong> ${booking.hotel.address}</li>
          <li><strong>Check-In:</strong> ${new Date(booking.checkInDate).toDateString()}</li>
          <li><strong>Check-Out:</strong> ${new Date(booking.checkOutDate).toDateString()}</li>
          <li><strong>Amount Paid:</strong> ₹ ${booking.totalPrice}</li>
        </ul>
        <p>Thank you for choosing us. We look forward to your stay!</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Marked as paid and email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to mark as paid" });
  }
};

export const markAsUnpaid = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking)
      return res.status(404).json({ success: false, message: "Booking not found" });

    booking.isPaid = false;
    booking.paymentMethod = "Pay At Hotel";
    booking.status = "pending";
    await booking.save();

    res.json({ success: true, message: "Booking marked as unpaid" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to mark as unpaid" });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("user")
      .populate("room")
      .populate("hotel");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: booking.user.email,
      subject: "Booking Rejected – RR Palace",
      html: `
        <h2>Your Booking Has Been Rejected</h2>
        <p>Dear ${booking.user.username},</p>
        <p>We're sorry to inform you that your booking has been rejected.</p>
        <ul>
          <li><strong>Booking ID:</strong> ${booking._id}</li>
          <li><strong>Hotel:</strong> ${booking.hotel.name}</li>
          <li><strong>Room:</strong> ${booking.room.roomType}</li>
          <li><strong>Check-In:</strong> ${new Date(booking.checkInDate).toDateString()}</li>
          <li><strong>Check-Out:</strong> ${new Date(booking.checkOutDate).toDateString()}</li>
        </ul>
        <p>If you have any questions, feel free to contact us.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    await Booking.findByIdAndDelete(req.params.bookingId);

    res.json({ success: true, message: "Booking rejected and deleted, email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete booking" });
  }
};

export const cancelBookingByUser = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ success: true, message: "Booking cancelled" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Cancellation failed" });
  }
};
