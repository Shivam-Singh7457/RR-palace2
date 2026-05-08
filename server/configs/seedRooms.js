import Room from "../models/Rooms.js";
import Hotel from "../models/Hotel.js";

const roomsToSeed = [
    // Double AC (Balcony): 2 units
    { roomNumber: "101", roomType: "Double AC", hasBalcony: true, pricePerNight: 3500, amenities: ["AC", "TV", "WiFi", "Balcony"] },
    { roomNumber: "102", roomType: "Double AC", hasBalcony: true, pricePerNight: 3500, amenities: ["AC", "TV", "WiFi", "Balcony"] },

    // Double Standard: 4 units (2 with balcony, 2 without)
    { roomNumber: "201", roomType: "Double Standard", hasBalcony: true, pricePerNight: 2500, amenities: ["TV", "WiFi", "Balcony"] },
    { roomNumber: "202", roomType: "Double Standard", hasBalcony: true, pricePerNight: 2500, amenities: ["TV", "WiFi", "Balcony"] },
    { roomNumber: "203", roomType: "Double Standard", hasBalcony: false, pricePerNight: 2200, amenities: ["TV", "WiFi"] },
    { roomNumber: "204", roomType: "Double Standard", hasBalcony: false, pricePerNight: 2200, amenities: ["TV", "WiFi"] },

    // Single AC: 4 units
    { roomNumber: "301", roomType: "Single AC", hasBalcony: false, pricePerNight: 2000, amenities: ["AC", "TV", "WiFi"] },
    { roomNumber: "302", roomType: "Single AC", hasBalcony: false, pricePerNight: 2000, amenities: ["AC", "TV", "WiFi"] },
    { roomNumber: "303", roomType: "Single AC", hasBalcony: false, pricePerNight: 2000, amenities: ["AC", "TV", "WiFi"] },
    { roomNumber: "304", roomType: "Single AC", hasBalcony: false, pricePerNight: 2000, amenities: ["AC", "TV", "WiFi"] },

    // Single Standard: 4 units
    { roomNumber: "401", roomType: "Single Standard", hasBalcony: false, pricePerNight: 1200, amenities: ["TV", "WiFi"] },
    { roomNumber: "402", roomType: "Single Standard", hasBalcony: false, pricePerNight: 1200, amenities: ["TV", "WiFi"] },
    { roomNumber: "403", roomType: "Single Standard", hasBalcony: false, pricePerNight: 1200, amenities: ["TV", "WiFi"] },
    { roomNumber: "404", roomType: "Single Standard", hasBalcony: false, pricePerNight: 1200, amenities: ["TV", "WiFi"] },
];

export const seedRooms = async () => {
    try {
        const hotel = await Hotel.findOne(); // Assuming single hotel for now
        if (!hotel) {
            console.log("No hotel found, skipping room seeding.");
            return;
        }

        for (const roomData of roomsToSeed) {
            const existingRoom = await Room.findOne({ roomNumber: roomData.roomNumber });
            if (!existingRoom) {
                await Room.create({
                    ...roomData,
                    hotel: hotel._id,
                    images: ["https://res.cloudinary.com/drz9z7n8y/image/upload/v1740638760/room_default.jpg"], // Placeholder
                });
                console.log(`Seeded room ${roomData.roomNumber}`);
            }
        }
    } catch (error) {
        console.error("Room seeding error:", error);
    }
};
