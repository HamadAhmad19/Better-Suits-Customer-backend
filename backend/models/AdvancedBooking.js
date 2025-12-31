const mongoose = require('mongoose');

const advancedBookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    phoneNumber: {
        type: String,
        required: true
    },
    pickup: {
        latitude: Number,
        longitude: Number,
        address: String,
        name: String
    },
    dropoff: {
        latitude: Number,
        longitude: Number,
        address: String,
        name: String
    },
    rideType: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    distance: {
        type: String
    },
    duration: {
        type: String
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Stripe', 'Wallet Credit', 'Cash']
    },
    preferences: {
        waitTime: String,
        luggage: Boolean,
        pet: Boolean,
        couponCode: String,
        giftCardCode: String
    },
    scheduledTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        default: 'scheduled',
        enum: ['scheduled', 'confirmed', 'completed', 'cancelled']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AdvancedBooking', advancedBookingSchema);
