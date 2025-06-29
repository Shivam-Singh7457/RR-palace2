import express from "express";
import { checkAvailabilityAPI, createBooking, getAllBookingsForAdmin, getHotelBookings, getUserBookings , markAsUnpaid, submitUPIReference , markAsPaid , deleteBooking , cancelBookingByUser} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const bookingRouter= express.Router();

bookingRouter.post('/check-availability', checkAvailabilityAPI);
bookingRouter.post('/book', protect, createBooking);
bookingRouter.get('/user', protect, getUserBookings);
bookingRouter.get('/hotel',protect, getHotelBookings);
bookingRouter.post("/submit-upi", protect, submitUPIReference);
bookingRouter.get("/all", protect , getAllBookingsForAdmin )
bookingRouter.patch("/:bookingId/mark-paid", protect, markAsPaid);
bookingRouter.patch("/:bookingId/mark-unpaid", protect, markAsUnpaid);
bookingRouter.delete("/:bookingId", protect, deleteBooking);
bookingRouter.patch("/user/cancel/:bookingId", protect, cancelBookingByUser);


export default bookingRouter;