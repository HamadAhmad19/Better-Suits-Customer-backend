import { api } from './apiService';

/**
 * Send OTP to phone number
 * @param {string} phoneNumber - Phone number in E.164 format (+1234567890)
 * @returns {Promise<Object>} - Response with success status
 */
export const sendOtp = async (phoneNumber) => {
    try {
        const response = await api.post(`/api/auth/send-otp`, {
            phoneNumber,
        });

        return {
            success: true,
            message: response.data.message || 'OTP sent successfully',
        };
    } catch (error) {
        console.error('Error sending OTP:', error);

        let errorMessage = error.response?.data?.message;
        if (!errorMessage) {
            if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                errorMessage = `Network Error. Check Wi-Fi. URL: ${api.defaults.baseURL}`;
            } else {
                errorMessage = error.message || 'Failed to send OTP. Please try again.';
            }
        }

        return {
            success: false,
            message: errorMessage,
        };
    }
};

/**
 * Verify OTP for phone number
 * @param {string} phoneNumber - Phone number in E.164 format (+1234567890)
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<Object>} - Response with success status
 */
export const verifyOtp = async (phoneNumber, otp) => {
    try {
        const response = await api.post(`/api/auth/verify-otp`, {
            phoneNumber,
            otp,
        });

        return {
            success: true,
            message: response.data.message || 'OTP verified successfully',
        };
    } catch (error) {
        console.error('Error verifying OTP:', error);

        const errorMessage = error.response?.data?.message || 'Failed to verify OTP. Please try again.';

        return {
            success: false,
            message: errorMessage,
        };
    }
};
