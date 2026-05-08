import Hotel from "../models/Hotel.js";
import {v2 as cloudinary} from "cloudinary";
import Room from "../models/Rooms.js";
import Booking from "../models/Booking.js";

export const createRoom= async (req,res)=>{
    try{
        const {roomType ,pricePerNight , amenities}=req.body;
        const hotel=await Hotel.findOne({
          $or: [
            { owner: req.auth.userId },
            { coOwners: req.auth.userId }
          ]
        });
        console.log("Authenticated user ID:", req.auth.userId);
        if(!hotel) return res.json({success:false , message: "No Hotel Found"});

        const uploadImages = req.files.map(async (file)=> {
            const response=await cloudinary.uploader.upload(file.path);
            return response.secure_url;
        })

        const images = await Promise.all(uploadImages)

        await Room.create({
            hotel:hotel._id,
            roomType,
            pricePerNight:+pricePerNight,
            amenities:JSON.parse(amenities),
            images,
        })
        res.json({ success: true,message: "Room created succesfully"})
    } catch (error) {
        res.json({success: false,message: error.message})
    }
}

export const getRoom = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;

    let bookedRooms = [];

    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);

      // Find rooms that have overlapping bookings
      bookedRooms = await Booking.find({
        status: { $nin: ["cancelled"] },
        $or: [
          { checkInDate: { $lt: end }, checkOutDate: { $gt: start } }
        ]
      }).distinct("room");
    }

    const rooms = await Room.find({ isAvailable: true })
      .populate({
        path: "hotel",
        populate: {
          path: "owner",
          select: "image",
        },
      })
      .sort({ createdAt: -1 });

    // Map rooms to include booking status
    const roomsWithStatus = rooms.map(room => ({
      ...room.toObject(),
      isBooked: false // or handle as before
    }));

    res.json({ success: true, rooms: roomsWithStatus });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getTopViewedRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isAvailable: true })
      .populate({
        path: "hotel",
        populate: {
          path: "owner",
          select: "image",
        },
      })
      .sort({ views: -1 });

    // Group by roomType and pick the top viewed for each
    const grouped = rooms.reduce((acc, room) => {
      if (!acc[room.roomType]) {
        acc[room.roomType] = room;
      }
      return acc;
    }, {});

    const uniqueTopRooms = Object.values(grouped).slice(0, 3);

    res.json({ success: true, rooms: uniqueTopRooms });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


export const getOwnerRoom = async (req, res) => {
  try {
    const hotelData = await Hotel.findOne({
      $or: [
        { owner: req.auth.userId },
        { coOwners: req.auth.userId },
      ],
    });

    if (!hotelData) {
      return res.status(404).json({ success: false, message: "No hotel found for this user." });
    }

    const rooms = await Room.find({ hotel: hotelData._id.toString() }).populate("hotel");

    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const toggleRoomAvailability= async (req,res)=>{
    try {
        const {roomId}=req.body;
        const roomData= await Room.findById(roomId);
        roomData.isAvailable = !roomData.isAvailable;
        await roomData.save();
        res.json({success:true,message: "Room Avail updated"});
    } catch (error) {
                res.json({success:false,message: error.message});

    }
}