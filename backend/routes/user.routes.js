const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// @route   GET /api/users/phone/:phoneNumber
// @desc    Get user by phone number
// @access  Public
router.get("/phone/:phoneNumber", userController.getUserByPhone);

// @route   PUT /api/users/:userId
// @desc    Update user profile
// @access  Public
router.put("/:userId", userController.updateProfile);

// @route   DELETE /api/users/:userId
// @desc    Delete user account
// @access  Public
router.delete("/:userId", userController.deleteProfile);

// @route   GET /api/users/:phoneNumber/stats
// @desc    Get user statistics (completed rides, advanced bookings, total km)
// @access  Public
router.get("/:phoneNumber/stats", userController.getUserStats);

// @route   PUT /api/users/:phoneNumber/profile
// @desc    Update user profile by phone number
// @access  Public
router.put("/:phoneNumber/profile", userController.updateUserProfile);

module.exports = router;
