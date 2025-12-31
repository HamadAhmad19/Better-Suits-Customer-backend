import { database } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// Check if phone number exists in database
export const checkPhoneNumberExists = async (phoneNumber) => {
  try {
    const usersRef = collection(database, "users");
    const q = query(usersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking phone number:", error);
    return false;
  }
};

// Get user by phone number
export const getUserByPhoneNumber = async (phoneNumber) => {
  try {
    const usersRef = collection(database, "users");
    const q = query(usersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

// Create new user with phone number and password
export const createFullUser = async (userData) => {
  try {
    const usersRef = collection(database, "users");
    const newUserRef = doc(usersRef);

    await setDoc(newUserRef, {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileCompleted: true,
    });

    return { id: newUserRef.id, ...userData };
  } catch (error) {
    console.error("Error creating full user:", error);
    throw error;
  }
};

// Update user profile data
export const updateUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(database, "users", userId);

    const updateData = {
      ...userData,
      updatedAt: new Date(),
    };

    await updateDoc(userRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const deleteUserProfile = async (userId) => {
  try {
    const userRef = doc(database, "users", userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Verify password
export const verifyPassword = async (phoneNumber, password) => {
  try {
    const user = await getUserByPhoneNumber(phoneNumber);
    if (user && user.password === password) {
      return user;
    }
    return null;
  } catch (error) {
    console.error("Error verifying password:", error);
    return null;
  }
};

export const getUserSavedLocations = async (phoneNumber) => {
  try {
    const usersRef = collection(database, "users");
    const q = query(usersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      return {
        home: userData.homeLocation || null,
        work: userData.workLocation || null,
      };
    }
    return { home: null, work: null };
  } catch (error) {
    console.error("Error getting saved locations:", error);
    return { home: null, work: null };
  }
};

// Save home location
export const saveHomeLocation = async (phoneNumber, locationData) => {
  try {
    const usersRef = collection(database, "users");
    const q = query(usersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userRef = doc(database, "users", userDoc.id);

      await updateDoc(userRef, {
        homeLocation: {
          ...locationData,
          savedAt: new Date(),
        },
        updatedAt: new Date(),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error saving home location:", error);
    throw error;
  }
};

// Save work location
export const saveWorkLocation = async (phoneNumber, locationData) => {
  try {
    const usersRef = collection(database, "users");
    const q = query(usersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userRef = doc(database, "users", userDoc.id);

      await updateDoc(userRef, {
        workLocation: {
          ...locationData,
          savedAt: new Date(),
        },
        updatedAt: new Date(),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error saving work location:", error);
    throw error;
  }
};

// Delete home location
export const deleteHomeLocation = async (phoneNumber) => {
  try {
    const usersRef = collection(database, "users");
    const q = query(usersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userRef = doc(database, "users", userDoc.id);

      await updateDoc(userRef, {
        homeLocation: null,
        updatedAt: new Date(),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting home location:", error);
    throw error;
  }
};

// Delete work location
export const deleteWorkLocation = async (phoneNumber) => {
  try {
    const usersRef = collection(database, "users");
    const q = query(usersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userRef = doc(database, "users", userDoc.id);

      await updateDoc(userRef, {
        workLocation: null,
        updatedAt: new Date(),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting work location:", error);
    throw error;
  }
};

// --- Scheduled Rides (ridebookings) ---
export const getUserScheduledRides = async (phoneNumber) => {
  try {
    const ridesRef = collection(database, "ridebookings");
    // Assuming 'phoneNumber' or 'userId' is the field to query by.
    // Adjust 'phoneNumber' if the field name in ridebookings is different (e.g., 'userPhone', 'userId').
    const q = query(ridesRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    const rides = [];
    querySnapshot.forEach((doc) => {
      rides.push({ id: doc.id, ...doc.data() });
    });

    // Sort by scheduledTime if needed, assuming ISO string or timestamp
    // rides.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

    return rides;
  } catch (error) {
    console.error("Error fetching scheduled rides:", error);
    return [];
  }
};

export const cancelScheduledRide = async (rideId) => {
  try {
    const rideRef = doc(database, "ridebookings", rideId);
    await deleteDoc(rideRef);
    return true;
  } catch (error) {
    console.error("Error cancelling scheduled ride:", error);
    throw error;
  }
};

// --- Advanced Bookings (advancedbookings) ---
export const getUserAdvancedBookings = async (phoneNumber) => {
  try {
    const bookingsRef = collection(database, "advancedbookings");
    const q = query(bookingsRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    return bookings;
  } catch (error) {
    console.error("Error fetching advanced bookings:", error);
    return [];
  }
};

// --- Favorite Locations Link to User (users/{userId}/favorites) ---

const getUserDocId = async (phoneNumber) => {
  const usersRef = collection(database, "users");
  const q = query(usersRef, where("phoneNumber", "==", phoneNumber));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  }
  return null;
};

export const addFavoriteLocation = async (phoneNumber, locationData) => {
  try {
    const userId = await getUserDocId(phoneNumber);
    if (!userId) throw new Error("User not found via phone number");

    const favoritesRef = collection(database, "users", userId, "favorites");

    const newLocation = {
      ...locationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addDoc(favoritesRef, newLocation);
    return true;
  } catch (error) {
    console.error("Error adding favorite location:", error);
    throw error;
  }
};

export const getFavoriteLocations = async (phoneNumber) => {
  try {
    const userId = await getUserDocId(phoneNumber);
    if (!userId) return [];

    const favoritesRef = collection(database, "users", userId, "favorites");
    const querySnapshot = await getDocs(favoritesRef);

    const locations = [];
    querySnapshot.forEach((doc) => {
      locations.push({ id: doc.id, ...doc.data() });
    });

    // Sort by createdAt desc
    locations.sort((a, b) => {
      const dateA = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt);
      return dateB - dateA;
    });

    return locations;
  } catch (error) {
    console.error("Error getting favorite locations:", error);
    return [];
  }
};

export const updateFavoriteLocation = async (
  phoneNumber,
  locationId,
  locationData
) => {
  try {
    const userId = await getUserDocId(phoneNumber);
    if (!userId) throw new Error("User not found");

    const favRef = doc(database, "users", userId, "favorites", locationId);
    await updateDoc(favRef, {
      ...locationData,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error updating favorite location:", error);
    throw error;
  }
};

export const deleteFavoriteLocation = async (phoneNumber, locationId) => {
  try {
    const userId = await getUserDocId(phoneNumber);
    if (!userId) throw new Error("User not found");

    const favRef = doc(database, "users", userId, "favorites", locationId);
    await deleteDoc(favRef);
    return true;
  } catch (error) {
    console.error("Error deleting favorite location:", error);
    throw error;
  }
};
