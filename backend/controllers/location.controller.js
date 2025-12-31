const User = require("../models/User");

// Get user's saved locations (home and work)
exports.getSavedLocations = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      locations: {
        home: user.homeLocation || null,
        work: user.workLocation || null,
      },
    });
  } catch (error) {
    console.error("Error getting saved locations:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Save home location
exports.saveHomeLocation = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const locationData = req.body;

    const user = await User.findOneAndUpdate(
      { phoneNumber },
      {
        homeLocation: {
          ...locationData,
          savedAt: new Date(),
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      location: user.homeLocation,
    });
  } catch (error) {
    console.error("Error saving home location:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Save work location
exports.saveWorkLocation = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const locationData = req.body;

    const user = await User.findOneAndUpdate(
      { phoneNumber },
      {
        workLocation: {
          ...locationData,
          savedAt: new Date(),
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      location: user.workLocation,
    });
  } catch (error) {
    console.error("Error saving work location:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete home location
exports.deleteHomeLocation = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    const user = await User.findOneAndUpdate(
      { phoneNumber },
      {
        homeLocation: null,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Home location deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting home location:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete work location
exports.deleteWorkLocation = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    const user = await User.findOneAndUpdate(
      { phoneNumber },
      {
        workLocation: null,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Work location deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting work location:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get favorite locations
exports.getFavorites = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Filter out soft-deleted favorites
    const activeFavorites = (user.favorites || []).filter(
      (fav) => !fav.isDeleted
    );

    res.json({ success: true, favorites: activeFavorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Add favorite location
exports.addFavorite = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const locationData = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.favorites.push(locationData);
    await user.save();

    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update favorite location
exports.updateFavorite = async (req, res) => {
  try {
    const { phoneNumber, id } = req.params;
    const locationData = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const favoriteIndex = user.favorites.findIndex(
      (fav) => fav._id.toString() === id
    );
    if (favoriteIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Favorite location not found" });
    }

    user.favorites[favoriteIndex] = {
      ...user.favorites[favoriteIndex]._doc,
      ...locationData,
    };
    await user.save();

    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    console.error("Error updating favorite:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Soft delete favorite location
exports.deleteFavorite = async (req, res) => {
  try {
    const { phoneNumber, id } = req.params;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const favoriteIndex = user.favorites.findIndex(
      (fav) => fav._id.toString() === id
    );

    if (favoriteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Favorite location not found",
      });
    }

    // Soft delete: set isDeleted to true
    user.favorites[favoriteIndex].isDeleted = true;
    await user.save();

    // Return only active favorites
    const activeFavorites = user.favorites.filter((fav) => !fav.isDeleted);

    res.json({ success: true, favorites: activeFavorites });
  } catch (error) {
    console.error("Error deleting favorite:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
