const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

router.post("/create", bookingController.createBooking);
router.post("/advanced", bookingController.createAdvancedBooking);
router.get("/:phoneNumber", bookingController.getUserBookings);
router.get("/advanced/:phoneNumber", bookingController.getUserAdvancedBookings);
router.put("/:id/preferences", bookingController.updateBookingPreferences);
router.delete("/:id", bookingController.deleteBooking);
router.delete("/advanced/:id", bookingController.deleteAdvancedBooking);

module.exports = router;
