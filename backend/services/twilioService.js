require('dotenv').config();
const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Validate Twilio credentials
if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error('⚠️ Twilio credentials are missing in .env file');
}

const client = twilio(accountSid, authToken);

/**
 * Send SMS via Twilio
 * @param {string} to - Recipient phone number (E.164 format: +1234567890)
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - Twilio message object
 */
const sendSMS = async (to, message) => {
    try {
        console.log(`📤 Sending SMS to ${to}`);

        const messageResult = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: to,
        });

        console.log(`✅ SMS sent successfully. SID: ${messageResult.sid}`);
        return {
            success: true,
            messageSid: messageResult.sid,
            status: messageResult.status,
        };
    } catch (error) {
        console.error(`❌ Twilio SMS Error:`, error.message);

        // Handle specific Twilio errors
        if (error.code === 21211) {
            throw new Error('Invalid phone number format. Please use E.164 format (+1234567890)');
        } else if (error.code === 21608) {
            throw new Error('This phone number is not verified for trial account');
        } else {
            throw new Error(`Failed to send SMS: ${error.message}`);
        }
    }
};

/**
 * Generate a random 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
    sendSMS,
    generateOTP,
};
