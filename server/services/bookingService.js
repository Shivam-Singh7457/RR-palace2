import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Room from "../models/Rooms.js";

/**
 * Normalizes a date to UTC midnight to ensure consistent availability checks.
 */
const normalizeToUTC = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Checks if a room is available for the given date range, considering both bookings and locks.
 */
export const checkRoomAvailability = async ({ checkInDate, checkOutDate, room }, session = null) => {
  const start = normalizeToUTC(checkInDate);
  const end = normalizeToUTC(checkOutDate);

  const query = {
    room,
    checkInDate: { $lt: end },
    checkOutDate: { $gt: start },
    status: { $nin: ["cancelled"] },
  };

  const bookings = await Booking.find(query).session(session);
  return bookings.length === 0;
};

/**
 * Creates a booking using a MongoDB transaction to prevent race conditions.
 */
export const createBookingService = async ({ user, room, checkInDate, checkOutDate, guests }) => {
  try {
    const roomData = await Room.findById(room).populate("hotel");
    if (!roomData) {
      throw new Error("Room not found");
    }
    if (!roomData.isAvailable) {
      throw new Error("Room booking is currently off for this room by the owner.");
    }

    const start = normalizeToUTC(checkInDate);
    const end = normalizeToUTC(checkOutDate);

    if (start >= end) {
      throw new Error("Check-out date must be after check-in date.");
    }

    const isAvailable = await checkRoomAvailability({ checkInDate: start, checkOutDate: end, room });
    if (!isAvailable) {
      throw new Error("Room is not available for the selected dates.");
    }

    const timeDiff = end.getTime() - start.getTime();
    const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    const totalPrice = roomData.pricePerNight * nights;

    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests,
      checkInDate: start,
      checkOutDate: end,
      totalPrice,
      status: "pending",
    });

    return { booking, roomData };
  } catch (error) {
    throw error;
  }
};
