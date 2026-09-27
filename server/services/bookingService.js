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

  let matchingRooms = [];

  if (room && mongoose.Types.ObjectId.isValid(room)) {
    const specificRoom = await Room.findOne({ _id: room, isAvailable: true }).populate("hotel");
    if (specificRoom) {
      matchingRooms = [specificRoom];
    }
  } else {
    if (room && typeof room === "string" && room.trim() !== "") {
      const trimmed = room.trim();
      // Try exact case-insensitive match first so "Double Bed" doesn't catch "Twin Double Bed"
      const exactMatchRooms = await Room.find({ roomType: { $regex: `^${trimmed}$`, $options: "i" }, isAvailable: true }).populate("hotel");
      if (exactMatchRooms.length > 0) {
        matchingRooms = exactMatchRooms;
      } else {
        matchingRooms = await Room.find({ roomType: { $regex: trimmed, $options: "i" }, isAvailable: true }).populate("hotel");
      }
    } else {
      matchingRooms = await Room.find({ isAvailable: true }).populate("hotel");
    }
  }

  if (matchingRooms.length === 0) {
    return {
      isAvailable: false,
      availableCount: 0,
      totalMatching: 0,
      availableRooms: [],
      bookedRooms: []
    };
  }

  const targetRoomIds = matchingRooms.map((r) => r._id.toString());

  const query = {
    room: { $in: targetRoomIds },
    checkInDate: { $lt: end },
    checkOutDate: { $gt: start },
    status: { $nin: ["cancelled"] },
  };

  const existingBookings = await Booking.find(query).session(session);
  const bookedRoomIds = new Set(existingBookings.map((b) => b.room.toString()));

  const availableRooms = matchingRooms.filter((r) => !bookedRoomIds.has(r._id.toString()));
  const bookedRooms = matchingRooms.filter((r) => bookedRoomIds.has(r._id.toString()));

  return {
    isAvailable: availableRooms.length > 0,
    availableCount: availableRooms.length,
    totalMatching: matchingRooms.length,
    availableRooms: availableRooms.map((r) => ({
      room_id: r._id.toString(),
      room_type: r.roomType,
      price_per_night: r.pricePerNight,
      amenities: r.amenities || [],
      is_available: true
    })),
    bookedRooms: bookedRooms.map((r) => ({
      room_id: r._id.toString(),
      room_type: r.roomType,
      price_per_night: r.pricePerNight,
      amenities: r.amenities || [],
      is_available: false
    }))
  };
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

    const availResult = await checkRoomAvailability({ checkInDate: start, checkOutDate: end, room });
    const isAvailable = typeof availResult === "boolean" ? availResult : availResult.isAvailable;
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
