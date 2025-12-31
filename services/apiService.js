import axios from "axios";
import { API_URL } from "@env";

// Use the API_URL from environment variable
const BACKEND_URL = API_URL || "http://10.0.2.2:6000"; // Android emulator default; for real device use ngrok API_URL

// Debug: Log the API URL being used
console.log("🔗 API_URL from .env:", API_URL);
if (!API_URL) {
  console.warn(
    "⚠️  API_URL is missing. Run `npm run dev` to start ngrok + update .env automatically, or set API_URL in .env."
  );
}
console.log("🔗 Using BACKEND_URL:", BACKEND_URL);

// Create axios instance with base URL
export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000, // Increased timeout for ngrok
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("🚀 API baseURL configured:", api.defaults.baseURL);

// Add request interceptor for better logging
api.interceptors.request.use(
  (config) => {
    console.log(
      `📤 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url
      }`
    );
    return config;
  },
  (error) => {
    console.error("📤 Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ API Response: ${response.config.url} - Status: ${response.status}`
    );
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("⏱️ Request timeout - Server took too long to respond");
    } else if (
      error.code === "ERR_NETWORK" ||
      error.message === "Network Error"
    ) {
      console.error("🌐 Network Error - Cannot reach server at:", BACKEND_URL);
      console.error("💡 Troubleshooting:");
      console.error(
        "   1. Is the backend server running? (npm start in backend folder)"
      );
      console.error(
        "   2. Is ngrok running? (npm run ngrok in backend folder)"
      );
      console.error("   3. Did you update .env with the ngrok URL?");
      console.error("   4. Did you restart the Expo app after updating .env?");
    } else if (error.response) {
      console.error(`❌ Server Error: ${error.response.status}`);
      console.error(
        "🔍 Error Body:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error("❌ Unknown Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// Test API connection
export const testConnection = async () => {
  try {
    const response = await api.get("/health");
    console.log("✅ Backend connection successful!");
    return true;
  } catch (error) {
    console.error("❌ Backend connection failed:", error.message);
    return false;
  }
};

// Check if phone number exists in database
export const checkPhoneNumberExists = async (phoneNumber) => {
  try {
    const response = await api.post("/api/auth/check-phone", { phoneNumber });
    return response.data.exists;
  } catch (error) {
    console.error("Error checking phone number:", error);
    return false;
  }
};

// Get user by phone number
export const getUserByPhoneNumber = async (phoneNumber) => {
  try {
    const response = await api.get(`/api/users/phone/${phoneNumber}`);
    return response.data.user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

// Create new user with phone number and password
export const createFullUser = async (userData) => {
  try {
    const response = await api.post("/api/auth/signup", userData);
    return response.data.user;
  } catch (error) {
    console.error("Error creating full user:", error);
    throw error;
  }
};

// Delete user profile
export const deleteUserProfile = async (userId) => {
  try {
    await api.delete(`/api/users/${userId}`);
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Verify password
export const verifyPassword = async (phoneNumber, password) => {
  try {
    const response = await api.post("/api/auth/login", {
      phoneNumber,
      password,
    });
    return response.data.user;
  } catch (error) {
    console.error("Error verifying password:", error);
    return null;
  }
};

// Get user's saved locations (home and work)
export const getUserSavedLocations = async (phoneNumber) => {
  try {
    const response = await api.get(`/api/locations/${phoneNumber}`);
    return response.data.locations;
  } catch (error) {
    console.error("Error getting saved locations:", error);
    return { home: null, work: null };
  }
};

// Save home location
export const saveHomeLocation = async (phoneNumber, locationData) => {
  try {
    await api.put(`/api/locations/${phoneNumber}/home`, locationData);
    return true;
  } catch (error) {
    console.error("Error saving home location:", error);
    throw error;
  }
};

// Save work location
export const saveWorkLocation = async (phoneNumber, locationData) => {
  try {
    await api.put(`/api/locations/${phoneNumber}/work`, locationData);
    return true;
  } catch (error) {
    console.error("Error saving work location:", error);
    throw error;
  }
};

// Delete home location
export const deleteHomeLocation = async (phoneNumber) => {
  try {
    await api.delete(`/api/locations/${phoneNumber}/home`);
    return true;
  } catch (error) {
    console.error("Error deleting home location:", error);
    throw error;
  }
};

// Delete work location
export const deleteWorkLocation = async (phoneNumber) => {
  try {
    await api.delete(`/api/locations/${phoneNumber}/work`);
    return true;
  } catch (error) {
    console.error("Error deleting work location:", error);
    throw error;
  }
};

// Create booking
export const createBooking = async (bookingData) => {
  try {
    console.log("📤 Creating booking with data:", bookingData);
    const response = await api.post("/api/bookings/create", bookingData);
    console.log("✅ Booking created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    throw error;
  }
};

// Create advanced booking
export const createAdvancedBooking = async (bookingData) => {
  try {
    console.log("📤 Creating advanced booking with data:", bookingData);
    const response = await api.post("/api/bookings/advanced", bookingData);
    console.log("✅ Advanced booking created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating advanced booking:", error);
    throw error;
  }
};

// Get user bookings
export const getUserBookings = async (phoneNumber) => {
  try {
    const response = await api.get(`/api/bookings/${phoneNumber}`);
    return response.data.bookings;
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return [];
  }
};

// Get user advanced bookings
export const getUserAdvancedBookings = async (phoneNumber) => {
  try {
    const response = await api.get(`/api/bookings/advanced/${phoneNumber}`);
    return response.data.bookings;
  } catch (error) {
    console.error("Error fetching advanced bookings:", error);
    return [];
  }
};

// Cancel/Delete Booking (Hard Delete)
export const cancelBooking = async (bookingId) => {
  try {
    console.log(`🗑️ Deleting booking with ID: ${bookingId}`);
    const response = await api.delete(`/api/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting booking:", error);
    throw error;
  }
};

// Cancel/Delete Advanced Booking (Hard Delete)
export const cancelAdvancedBooking = async (bookingId) => {
  try {
    console.log(`🗑️ Deleting advanced booking with ID: ${bookingId}`);
    const response = await api.delete(`/api/bookings/advanced/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting advanced booking:", error);
    throw error;
  }
};

// Get favorite locations
export const getFavoriteLocations = async (phoneNumber) => {
  try {
    const response = await api.get(`/api/locations/${phoneNumber}/favorites`);
    return response.data.favorites;
  } catch (error) {
    console.error("Error fetching favorite locations:", error);
    return [];
  }
};

// Add favorite location
export const addFavoriteLocation = async (phoneNumber, locationData) => {
  try {
    await api.post(`/api/locations/${phoneNumber}/favorites`, locationData);
    return true;
  } catch (error) {
    console.error("Error adding favorite location:", error);
    throw error;
  }
};

// Update favorite location
export const updateFavoriteLocation = async (
  phoneNumber,
  locationId,
  locationData
) => {
  try {
    await api.put(
      `/api/locations/${phoneNumber}/favorites/${locationId}`,
      locationData
    );
    return true;
  } catch (error) {
    console.error("Error updating favorite location:", error);
    throw error;
  }
};

// Delete favorite location
export const deleteFavoriteLocation = async (phoneNumber, locationId) => {
  try {
    await api.delete(`/api/locations/${phoneNumber}/favorites/${locationId}`);
    return true;
  } catch (error) {
    console.error("Error deleting favorite location:", error);
    throw error;
  }
};

// Get user statistics
export const getUserStats = async (phoneNumber) => {
  try {
    const response = await api.get(`/api/users/${phoneNumber}/stats`);
    return response.data.stats;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { completedRides: 0, advancedBookings: 0, totalKilometers: 0 };
  }
};

// Update user profile
export const updateUserProfile = async (phoneNumber, profileData) => {
  try {
    const response = await api.put(
      `/api/users/${phoneNumber}/profile`,
      profileData
    );
    return response.data.user;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Update booking preferences (wait time, coupon code, gift card code)
export const updateBookingPreferences = async (bookingId, preferences) => {
  try {
    console.log(`📝 Updating booking ${bookingId} preferences:`, preferences);
    const response = await api.put(`/api/bookings/${bookingId}/preferences`, {
      preferences,
    });
    console.log("✅ Preferences updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating booking preferences:", error);
    throw error;
  }
};
