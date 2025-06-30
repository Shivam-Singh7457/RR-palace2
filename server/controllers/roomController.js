import Hotel from "../models/Hotel.js";
import {v2 as cloudinary} from "cloudinary";
import Room from "../models/Rooms.js";

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

export const getRoom= async (req,res)=>{
    try {
        const rooms=await Room.find({isAvailable: true}).populate({
            path: 'hotel' ,
            populate:{
                path:'owner',
                select: 'image'
            }
        }).sort({createdAt: -1})
        res.json({success:true,rooms});
    } catch (error) {
                res.json({success:false,message: error.message});

    }
}

export const getTopViewedRooms = async (req, res) => {
  try {
    let topRooms = await Room.find({ isAvailable: true })
      .populate({
        path: "hotel",
        populate: {
          path: "owner",
          select: "image",
        },
      })
      .sort({ views: -1 })
      .limit(3);

    if (topRooms.length === 0) {
      // fallback: return the cheapest room
      const cheapest = await Room.find({ isAvailable: true })
        .sort({ pricePerNight: 1 })
        .limit(1)
        .populate({
          path: "hotel",
          populate: {
            path: "owner",
            select: "image",
          },
        });

      topRooms = cheapest;
    }

    res.json({ success: true, rooms: topRooms });
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