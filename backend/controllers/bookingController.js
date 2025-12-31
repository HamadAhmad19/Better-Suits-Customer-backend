const RideBooking = require("../models/RideBooking");

exports.createBooking = async (req, res) => {
  try {
    const {
      phoneNumber,
      pickup,
      dropoff,
      rideType,
      price,
      distance,
      duration,
      paymentMethod,
      preferences,
    } = req.body;

    // Validation
    if (!phoneNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }
    if (!pickup || !dropoff) {
      return res.status(400).json({
        success: false,
        message: "Pickup and Dropoff locations are required",
      });
    }
    if (!rideType || !price) {
      return res
        .status(400)
        .json({ success: false, message: "Ride details are incomplete" });
    }
    if (!paymentMethod) {
      return res
        .status(400)
        .json({ success: false, message: "Payment method is required" });
    }

    const newBooking = new RideBooking({
      phoneNumber,
      pickup,
      dropoff,
      rideType,
      price,
      distance,
      duration,
      paymentMethod,
      preferences,
      status: "pending",
    });

    await newBooking.save();

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      bookingId: newBooking._id,
      booking: newBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

const AdvancedBooking = require("../models/AdvancedBooking");

exports.createAdvancedBooking = async (req, res) => {
  try {
    const {
      phoneNumber,
      pickup,
      dropoff,
      rideType,
      price,
      distance,
      duration,
      paymentMethod,
      scheduledTime,
      preferences,
    } = req.body;

    // Validation
    if (!phoneNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }
    if (!pickup || !dropoff) {
      return res.status(400).json({
        success: false,
        message: "Pickup and Dropoff locations are required",
      });
    }
    if (!rideType || !price) {
      return res
        .status(400)
        .json({ success: false, message: "Ride details are incomplete" });
    }
    if (!paymentMethod) {
      return res
        .status(400)
        .json({ success: false, message: "Payment method is required" });
    }
    if (!scheduledTime) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time is required for advanced booking",
      });
    }

    const newBooking = new AdvancedBooking({
      phoneNumber,
      pickup,
      dropoff,
      rideType,
      price,
      distance,
      duration,
      paymentMethod,
      scheduledTime,
      preferences,
      status: "scheduled",
    });

    await newBooking.save();

    res.status(201).json({
      success: true,
      message: "Advanced booking created successfully",
      bookingId: newBooking._id,
      booking: newBooking,
    });
  } catch (error) {
    console.error("Create advanced booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create advanced booking",
      error: error.message,
    });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const bookings = await RideBooking.find({ phoneNumber }).sort({
      createdAt: -1,
    });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings" });
  }
};

exports.getUserAdvancedBookings = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const bookings = await AdvancedBooking.find({ phoneNumber }).sort({
      scheduledTime: 1,
    });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching advanced bookings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch advanced bookings" });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBooking = await RideBooking.findByIdAndDelete(id);

    if (!deletedBooking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    res.json({
      success: true,
      message: "Booking permanently deleted",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete booking" });
  }
};

exports.deleteAdvancedBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBooking = await AdvancedBooking.findByIdAndDelete(id);

    if (!deletedBooking) {
      return res
        .status(404)
        .json({ success: false, message: "Advanced booking not found" });
    }

    res.json({
      success: true,
      message: "Advanced booking permanently deleted",
    });
  } catch (error) {
    console.error("Error deleting advanced booking:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete advanced booking" });
  }
};

// Update booking preferences (wait time, coupon code, gift card code)
exports.updateBookingPreferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: "Preferences object is required",
      });
    }

    const updatedBooking = await RideBooking.findByIdAndUpdate(
      id,
      { preferences: preferences },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      message: "Preferences updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update preferences",
      error: error.message,
    });
  }
};
