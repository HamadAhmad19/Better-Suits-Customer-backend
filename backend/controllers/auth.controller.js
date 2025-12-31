const User = require("../models/User");
const { sendSMS, generateOTP } = require("../services/twilioService");

// In-memory OTP storage (for production, use Redis or database)
// Structure: { phoneNumber: { otp: '123456', expiresAt: timestamp, used: false } }
const otpStorage = new Map();

// OTP expiration time in milliseconds (5 minutes)
const OTP_EXPIRATION_TIME = 5 * 60 * 1000;

// Check if phone number exists
exports.checkPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const user = await User.findOne({ phoneNumber });

    res.json({
      success: true,
      exists: !!user,
    });
  } catch (error) {
    console.error("Error checking phone number:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Send OTP to phone number
exports.sendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + OTP_EXPIRATION_TIME;

    // Store OTP in memory
    otpStorage.set(phoneNumber, {
      otp,
      expiresAt,
      used: false,
    });

    console.log(`📱 Generated OTP for ${phoneNumber}: ${otp} (expires at ${new Date(expiresAt).toISOString()})`);

    // Send OTP via Twilio
    try {
      const message = `Your verification code is: ${otp}. This code will expire in 5 minutes.`;
      await sendSMS(phoneNumber, message);

      res.json({
        success: true,
        message: "OTP sent successfully",
      });
    } catch (twilioError) {
      // Remove OTP from storage if SMS fails
      otpStorage.delete(phoneNumber);

      return res.status(500).json({
        success: false,
        message: twilioError.message || "Failed to send OTP",
      });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    // Check if OTP exists for this phone number
    const storedOtpData = otpStorage.get(phoneNumber);

    if (!storedOtpData) {
      return res.status(400).json({
        success: false,
        message: "No OTP found for this phone number. Please request a new OTP.",
      });
    }

    // Check if OTP has expired
    if (Date.now() > storedOtpData.expiresAt) {
      otpStorage.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Check if OTP has already been used
    if (storedOtpData.used) {
      return res.status(400).json({
        success: false,
        message: "OTP has already been used. Please request a new OTP.",
      });
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // Mark OTP as used
    storedOtpData.used = true;
    otpStorage.set(phoneNumber, storedOtpData);

    console.log(`✅ OTP verified successfully for ${phoneNumber}`);

    // Delete OTP after successful verification (optional, for cleanup)
    setTimeout(() => otpStorage.delete(phoneNumber), 60000); // Delete after 1 minute

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// User signup
exports.signup = async (req, res) => {
  try {
    const userData = req.body;

    if (!userData.phoneNumber || !userData.password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      phoneNumber: userData.phoneNumber,
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this phone number already exists",
      });
    }

    // Create new user
    const newUser = new User({
      ...userData,
      profileCompleted: true,
    });

    await newUser.save();

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// User login - verify password and auto-create if needed
exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required",
      });
    }

    let user = await User.findOne({ phoneNumber });

    // If user doesn't exist in MongoDB, create them
    if (!user) {
      console.log(`Creating new user in MongoDB for phone: ${phoneNumber}`);
      user = new User({
        phoneNumber,
        password,
        profileCompleted: false,
      });
      await user.save();
      console.log(`User created successfully: ${phoneNumber}`);
    } else {
      // Verify password for existing users
      if (user.password !== password) {
        return res.status(401).json({
          success: false,
          message: "Invalid password",
        });
      }
    }

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
