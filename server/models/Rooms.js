import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    hotel: {type: String ,ref : "Hotel" ,required: true},
    roomType: {type: String ,required: true},
    pricePerNight: {type: Number ,required: true},
    amenities: {type: Array ,required: true},
    images: [{type: String }],
    views: { type: Number, default: 0 },
    isAvailable: {type: Boolean ,default: true},

},{timestamps: true});

const Room= mongoose.model("Room", roomSchema);

export default Room;