import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const roomSchema = new mongoose.Schema({
    roomNumber: String,
    roomType: String,
});

const Room = mongoose.model("Room", roomSchema);

const checkRooms = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const rooms = await Room.find();
        console.log("Room Inventory:");
        rooms.forEach(r => console.log(`No: ${r.roomNumber}, Type: ${r.roomType}`));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkRooms();
