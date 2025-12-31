import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import {
  getUserByPhoneNumber,
  getUserStats,
  updateUserProfile,
} from "../services/apiService";
import { useAuth } from "../contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { CommonActions } from "@react-navigation/native";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, login, logout } = useAuth();
  const phoneNumber = user?.phoneNumber;

  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    completedRides: 0,
    advancedBookings: 0,
    totalKilometers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    loadProfileData();
  }, [phoneNumber]);

  const loadProfileData = async () => {
    if (!phoneNumber) return;

    setLoading(true);
    try {
      const [userDataResult, statsResult] = await Promise.all([
        getUserByPhoneNumber(phoneNumber),
        getUserStats(phoneNumber),
      ]);

      // If user doesn't exist in MongoDB, create a fallback from AuthContext
      const userData = userDataResult || {
        phoneNumber: phoneNumber,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        profileImage: user?.profileImage || "",
      };

      setUserData(userData);
      setStats(statsResult);

      // Set form data
      setFirstName(userData?.firstName || "");
      setLastName(userData?.lastName || "");
      setEmail(userData?.email || "");
      setPhone(userData?.phoneNumber || phoneNumber);
      setProfileImage(userData?.profileImage || "");
    } catch (error) {
      console.error("Error loading profile:", error);
      // Even if there's an error, create a basic user object
      const fallbackUser = {
        phoneNumber: phoneNumber,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        profileImage: user?.profileImage || "",
      };
      setUserData(fallbackUser);
      setFirstName(fallbackUser.firstName);
      setLastName(fallbackUser.lastName);
      setEmail(fallbackUser.email);
      setPhone(phoneNumber);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    // Reset form data before opening modal
    setFirstName(userData?.firstName || "");
    setLastName(userData?.lastName || "");
    setEmail(userData?.email || "");
    setPhone(userData?.phoneNumber || phoneNumber);
    setProfileImage(userData?.profileImage || "");
    setEditModalVisible(true);
  };

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your photos");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setProfileImage(base64Image);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() && !lastName.trim()) {
      Alert.alert(
        "Validation Error",
        "Please enter at least a first name or last name"
      );
      return;
    }

    // Check if phone number is changing
    const phoneNumberChanged = phone.trim() !== phoneNumber;

    setSaving(true);
    try {
      const updatedUser = await updateUserProfile(phoneNumber, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
        profileImage: profileImage,
      });

      setUserData(updatedUser);

      // CRITICAL: Update AuthContext with new user data
      // This ensures all future API calls use the updated information
      await login(updatedUser);

      setEditModalVisible(false);

      // If phone number changed, show special message and force re-login
      if (phoneNumberChanged) {
        Alert.alert(
          "Phone Number Updated",
          "Your phone number has been updated successfully. Please log in again with your new number.",
          [
            {
              text: "OK",
              onPress: async () => {
                // Logout and navigate to login screen
                await logout();
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: "Home" }],
                  })
                );
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert("Success", "Profile updated successfully");
        // Reload data to ensure everything is in sync
        await loadProfileData();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0254E8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.topTitle}>
          <Feather
            name="arrow-left"
            size={20}
            color="black"
            style={styles.arrowIcon}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            {userData?.profileImage ? (
              <Image
                source={{ uri: userData.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <Feather name="user" size={40} color="#6E6E6E" />
            )}
          </View>
          <Text style={styles.userName}>
            {userData?.firstName} {userData?.lastName}
          </Text>
          <Text style={styles.userPhone}>{userData?.phoneNumber}</Text>
          <Text style={styles.userEmail}>
            {userData?.email || "No email provided"}
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Feather name="check-circle" size={28} color="#0254E8" />
            </View>
            <Text style={styles.statNumber}>{stats.completedRides}</Text>
            <Text style={styles.statLabel}>Completed Rides</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Feather name="calendar" size={28} color="#FF6B00" />
            </View>
            <Text style={styles.statNumber}>{stats.advancedBookings}</Text>
            <Text style={styles.statLabel}>Advanced Bookings</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Feather name="map" size={28} color="#00C851" />
            </View>
            <Text style={styles.statNumber}>{stats.totalKilometers} km</Text>
            <Text style={styles.statLabel}>Total Distance</Text>
          </View>
        </View>

        {/* Update Profile */}
        <TouchableOpacity style={styles.optionBox} onPress={handleEditProfile}>
          <View style={styles.icon}>
            <Feather name="edit-2" size={22} color="#0254E8" />
          </View>
          <Text style={styles.optionText}>Update Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionBox2}
          onPress={() => navigation.navigate("PaymentMethods", { phoneNumber })}
        >
          <View style={styles.icon}>
            <Feather name="credit-card" size={22} color="#0254E8" />
          </View>
          <Text style={styles.optionText}>Payment methods</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Profile Image */}
              <TouchableOpacity
                style={styles.imagePickerContainer}
                onPress={handlePickImage}
              >
                <View style={styles.imagePreview}>
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.previewImage}
                    />
                  ) : (
                    <Feather name="camera" size={40} color="#6E6E6E" />
                  )}
                </View>
                <Text style={styles.imagePickerText}>Tap to change photo</Text>
              </TouchableOpacity>

              {/* Form Inputs */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  topTitle: {
    flexDirection: "row",
    padding: 20,
    marginTop: 30,
    alignItems: "center",
  },
  title: {
    marginLeft: 30,
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  profileHeader: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginTop: 10,
  },
  userPhone: {
    fontSize: 14,
    color: "#6E6E6E",
    marginTop: 5,
  },
  userEmail: {
    fontSize: 13,
    color: "#999",
    marginTop: 3,
    fontStyle: "italic",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginBottom: 25,
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
  },
  statIconContainer: {
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000",
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#6E6E6E",
    textAlign: "center",
    fontWeight: "500",
  },
  updateButton: {
    flexDirection: "row",
    backgroundColor: "#0254E8",
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f1f1f1",
    borderColor: "#cfcfcf",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  optionBox: {
    flexDirection: "row",
    paddingVertical: 20,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#cfcfcf",
    alignItems: "center",
  },
  optionBox2: {
    flexDirection: "row",
    paddingVertical: 20,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#fff",
    alignItems: "center",
  },
  optionText: {
    fontSize: 15,
    marginLeft: 15,
    color: "#000",
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  modalContent: {
    padding: 20,
  },
  imagePickerContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 10,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  imagePickerText: {
    color: "#0254E8",
    fontSize: 14,
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#000",
  },
  saveButton: {
    backgroundColor: "#0254E8",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "500",
  },
});

export default ProfileScreen;
