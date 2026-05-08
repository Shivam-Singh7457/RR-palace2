import RoomLock from "../models/RoomLock.js";
import Room from "../models/Rooms.js";
import Booking from "../models/Booking.js";

/**
 * Locks a specific room for 5 minutes if it's available.
 */
export const lockRoom = async (req, res) => {
    try {
        const { roomId, checkIn, checkOut } = req.body;
        const userId = req.auth.userId; // Assuming Clerk Auth

        // 1. Check if the room is already booked for these dates
        const existingBooking = await Booking.findOne({
            room: roomId,
            status: { $nin: ["cancelled"] },
            $or: [
                { checkInDate: { $lt: new Date(checkOut) }, checkOutDate: { $gt: new Date(checkIn) } }
            ]
        });

        if (existingBooking) {
            return res.json({ success: false, message: "Room was just booked by another user." });
        }

        // 2. Check if the room is already locked by another user
        const existingLock = await RoomLock.findOne({
            room: roomId,
            user: { $ne: userId }
        });

        if (existingLock) {
            return res.json({ success: false, message: "Room is currently selected by another user." });
        }

        // 3. Create or update the lock
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        await RoomLock.findOneAndUpdate(
            { room: roomId, user: userId },
            { expiresAt },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: "Room locked for 5 minutes", expiresAt });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

/**
 * Unlocks a room manually (e.g., when user deselects or closes the page).
 */
export const unlockRoom = async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.auth.userId;

        await RoomLock.deleteOne({ room: roomId, user: userId });
        res.json({ success: true, message: "Room unlocked" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

/**
 * Checks if a specific room is currently locked.
 */
export const checkRoomLock = async (req, res) => {
    try {
        const { roomId } = req.params;
        const lock = await RoomLock.findOne({ room: roomId });
        res.json({ success: true, isLocked: !!lock, lock });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
