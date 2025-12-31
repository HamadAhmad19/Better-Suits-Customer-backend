const User = require("../models/User");

// Get user by phone number
exports.getUserByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Don't allow updating certain fields directly
    delete updateData._id;
    delete updateData.createdAt;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete user profile
exports.deleteProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    const RideBooking = require("../models/RideBooking");
    const AdvancedBooking = require("../models/AdvancedBooking");

    // Count completed rides from both collections
    const completedRidesCount = await RideBooking.countDocuments({
      phoneNumber,
      status: "completed",
    });

    const completedAdvancedCount = await AdvancedBooking.countDocuments({
      phoneNumber,
      status: "completed",
    });

    const totalCompletedRides = completedRidesCount + completedAdvancedCount;

    // Count active advanced bookings (not completed or cancelled)
    const advancedBookingsCount = await AdvancedBooking.countDocuments({
      phoneNumber,
      status: { $nin: ["completed", "cancelled"] },
    });

    // Calculate total kilometers
    const completedRides = await RideBooking.find({
      phoneNumber,
      status: "completed",
      distance: { $exists: true },
    });

    const completedAdvanced = await AdvancedBooking.find({
      phoneNumber,
      status: "completed",
      distance: { $exists: true },
    });

    let totalKilometers = 0;

    // Parse distance strings like "5.2 km" or "500 m"
    [...completedRides, ...completedAdvanced].forEach((ride) => {
      if (ride.distance) {
        const distStr = ride.distance.toString().toLowerCase();
        if (distStr.includes("km")) {
          const km = parseFloat(distStr.replace(/[^0-9.]/g, ""));
          if (!isNaN(km)) totalKilometers += km;
        } else if (distStr.includes("m")) {
          const m = parseFloat(distStr.replace(/[^0-9.]/g, ""));
          if (!isNaN(m)) totalKilometers += m / 1000; // Convert meters to km
        }
      }
    });

    res.json({
      success: true,
      stats: {
        completedRides: totalCompletedRides,
        advancedBookings: advancedBookingsCount,
        totalKilometers: Math.round(totalKilometers * 10) / 10, // Round to 1 decimal
      },
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update user profile by phone number
exports.updateUserProfile = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const updateData = req.body;

    // Don't allow updating certain fields directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.password; // Don't allow password update via this endpoint

    // Check if phone number is being updated
    const isPhoneNumberUpdate = updateData.phoneNumber && updateData.phoneNumber !== phoneNumber;
    let cascadeResults = null;

    if (isPhoneNumberUpdate) {
      // Store old phone number for cascade updates
      const oldPhoneNumber = phoneNumber;
      const newPhoneNumber = updateData.phoneNumber;

      console.log(`📞 Phone number update detected: ${oldPhoneNumber} -> ${newPhoneNumber}`);

      // Update the user first
      const user = await User.findOneAndUpdate(
        { phoneNumber: oldPhoneNumber },
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Cascade update to related collections
      const RideBooking = require("../models/RideBooking");
      const AdvancedBooking = require("../models/AdvancedBooking");

      // Update all ride bookings
      const rideBookingUpdate = await RideBooking.updateMany(
        { phoneNumber: oldPhoneNumber },
        { $set: { phoneNumber: newPhoneNumber } }
      );

      // Update all advanced bookings
      const advancedBookingUpdate = await AdvancedBooking.updateMany(
        { phoneNumber: oldPhoneNumber },
        { $set: { phoneNumber: newPhoneNumber } }
      );

      cascadeResults = {
        rideBookingsUpdated: rideBookingUpdate.modifiedCount,
        advancedBookingsUpdated: advancedBookingUpdate.modifiedCount,
        totalBookingsUpdated: rideBookingUpdate.modifiedCount + advancedBookingUpdate.modifiedCount
      };

      console.log(`✅ Cascade update completed:`, cascadeResults);

      // Return user without password
      const userResponse = user.toObject();
      delete userResponse.password;

      return res.json({
        success: true,
        user: userResponse,
        message: "Profile and all related bookings updated successfully",
        cascadeUpdate: cascadeResults
      });
    } else {
      // Normal update without phone number change
      const user = await User.findOneAndUpdate(
        { phoneNumber },
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Return user without password
      const userResponse = user.toObject();
      delete userResponse.password;

      return res.json({
        success: true,
        user: userResponse,
        message: "Profile updated successfully",
      });
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

