import mongoose from "mongoose";

const roomLockSchema = new mongoose.Schema({
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    user: { type: String, required: true }, // Clerk User ID or Session ID
    expiresAt: { type: Date, required: true, index: { expires: 0 } } // TTL Index: record deleted when current time > expiresAt
}, { timestamps: true });

const RoomLock = mongoose.model("RoomLock", roomLockSchema);

export default RoomLock;
