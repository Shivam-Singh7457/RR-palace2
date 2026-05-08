import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const roomSchema = new mongoose.Schema({});
const Room = mongoose.model("Room", roomSchema, "rooms");

const clearRooms = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const result = await Room.deleteMany({});
        console.log(`Deleted ${result.deletedCount} rooms.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

clearRooms();
