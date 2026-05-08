import cron from "node-cron";
import Booking from "../models/Booking.js";

/**
 * Finds and removes bookings that have been in 'pending' status for more than 15 minutes.
 * This ensures that rooms aren't indefinitely blocked by abandoned checkout attempts.
 */
const cleanupGhostBookings = async () => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const result = await Booking.deleteMany({
      status: "pending",
      createdAt: { $lt: fifteenMinutesAgo },
      isPaid: false,
      upiSubmitted: false, // Ensure we don't delete if they submitted UPI but it's not verified yet
    });

    if (result.deletedCount > 0) {
      console.log(`[Cleanup Task] Removed ${result.deletedCount} ghost bookings.`);
    }
  } catch (error) {
    console.error("[Cleanup Task] Error during ghost booking cleanup:", error);
  }
};

/**
 * Initializes the cron job to run every 10 minutes.
 */
export const initCleanupTask = () => {
  console.log("[Cleanup Task] Initializing ghost booking cleanup job...");
  
  // Run once on startup to clean up any leftovers from previous session
  cleanupGhostBookings();

  // Schedule to run every 10 minutes
  cron.schedule("*/10 * * * *", () => {
    cleanupGhostBookings();
  });
};
