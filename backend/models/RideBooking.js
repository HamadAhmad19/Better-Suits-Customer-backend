const mongoose = require("mongoose");

const rideBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for now as user might not be logged in or we might just use phoneNumber
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    pickup: {
      latitude: Number,
      longitude: Number,
      address: String,
      name: String,
    },
    dropoff: {
      latitude: Number,
      longitude: Number,
      address: String,
      name: String,
    },
    rideType: {
      type: String, // Economy, Plus, Premium
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    distance: {
      type: String, // e.g., "5.2 km"
    },
    duration: {
      type: String, // e.g., "15 min"
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Stripe", "Wallet Credit", "Cash"],
    },
    preferences: {
      waitTime: String,
      luggage: Boolean,
      pet: Boolean,
      couponCode: String,
      giftCardCode: String,
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "confirmed", "completed", "cancelled"],
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RideBooking", rideBookingSchema);
