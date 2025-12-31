const express = require("express");
const router = express.Router();
const locationController = require("../controllers/location.controller");

// @route   GET /api/locations/:phoneNumber
// @desc    Get user's saved locations (home and work)
// @access  Public
router.get("/:phoneNumber", locationController.getSavedLocations);

// @route   PUT /api/locations/:phoneNumber/home
// @desc    Save home location
// @access  Public
router.put("/:phoneNumber/home", locationController.saveHomeLocation);

// @route   PUT /api/locations/:phoneNumber/work
// @desc    Save work location
// @access  Public
router.put("/:phoneNumber/work", locationController.saveWorkLocation);

// @route   DELETE /api/locations/:phoneNumber/home
// @desc    Delete home location
// @access  Public
router.delete("/:phoneNumber/home", locationController.deleteHomeLocation);

// @route   DELETE /api/locations/:phoneNumber/work
// @desc    Delete work location
// @access  Public
router.delete("/:phoneNumber/work", locationController.deleteWorkLocation);

// Favorites Routes
router.get("/:phoneNumber/favorites", locationController.getFavorites);
router.post("/:phoneNumber/favorites", locationController.addFavorite);
router.put("/:phoneNumber/favorites/:id", locationController.updateFavorite);
router.delete("/:phoneNumber/favorites/:id", locationController.deleteFavorite);

module.exports = router;
