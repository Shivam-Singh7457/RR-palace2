import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Room from "../models/Rooms.js";
import Booking from "../models/Booking.js";

const inspectDB = async () => {
    try {
        const cleanUri = process.env.MONGODB_URI.endsWith('/') ? process.env.MONGODB_URI.slice(0, -1) : process.env.MONGODB_URI;
        await mongoose.connect(`${cleanUri}/hotel-booking`);
        console.log("Connected to MongoDB (hotel-booking)");

        const rooms = await Room.find({});
        console.log(`\n--- ALL ROOMS (${rooms.length}) ---`);
        rooms.forEach(r => {
            console.log(`ID: ${r._id} | Type: "${r.roomType}" | Price: ${r.pricePerNight} | AvailableFlag: ${r.isAvailable}`);
        });

        const bookings = await Booking.find({});
        console.log(`\n--- ALL BOOKINGS (${bookings.length}) ---`);
        bookings.forEach(b => {
            console.log(`Booking ID: ${b._id} | Room: "${b.room}" | CheckIn: ${b.checkInDate} | CheckOut: ${b.checkOutDate} | Status: "${b.status}"`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

inspectDB();
