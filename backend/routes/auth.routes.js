const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// @route   POST /api/auth/send-otp
// @desc    Send OTP to phone number via Twilio
// @access  Public
router.post('/send-otp', authController.sendOtp);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for phone number
// @access  Public
router.post('/verify-otp', authController.verifyOtp);

// @route   POST /api/auth/check-phone
// @desc    Check if phone number exists
// @access  Public
router.post('/check-phone', authController.checkPhoneNumber);

// @route   POST /api/auth/signup
// @desc    Create new user
// @access  Public
router.post('/signup', authController.signup);

// @route   POST /api/auth/login
// @desc    Verify password and login
// @access  Public
router.post('/login', authController.login);

module.exports = router;
