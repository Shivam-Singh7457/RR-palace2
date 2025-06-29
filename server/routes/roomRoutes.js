import express from "express";
import { createRoom, getOwnerRoom, getRoom, toggleRoomAvailability, getTopViewedRooms } from "../controllers/roomController.js";
import upload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const roomRouter = express.Router();

roomRouter.post('/',upload.array("images", 4), protect , createRoom)
roomRouter.get('/',getRoom)
roomRouter.get('/owner',protect,getOwnerRoom)
roomRouter.post('/toggle-availability',protect,toggleRoomAvailability)
roomRouter.get("/top-viewed", getTopViewedRooms);


export default roomRouter;