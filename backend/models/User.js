const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    latitude: Number,
    longitude: Number,
    address: String,
    name: String,
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
    },
    homeLocation: {
      type: locationSchema,
      default: null,
    },
    workLocation: {
      type: locationSchema,
      default: null,
    },
    favorites: [
      {
        title: String,
        address: String,
        details: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isDeleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
