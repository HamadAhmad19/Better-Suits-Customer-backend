import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  getUserByPhoneNumber,
  updateUserProfile,
  deleteUserProfile,
} from "../services/apiService";
import { useAuth } from "../contexts/AuthContext";

const ProfileInfoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // const { phoneNumber } = route.params;
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;
  const [userData, setUserData] = useState({});
  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Request permissions on component mount
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== "granted" || libraryStatus !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Sorry, we need camera and gallery permissions to make this work!",
          [{ text: "OK" }]
        );
      }
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const user = await getUserByPhoneNumber(phoneNumber);
        if (user) {
          setUserData(user);
        } else {
          Alert.alert("Error", "User not found");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error loading user:", error);
        Alert.alert("Error", "Failed to load user data");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [phoneNumber]);

  const startEditing = (field) => {
    setEditField(field);
    setTempValue(userData[field] || "");
  };

  const cancelEdit = () => {
    setEditField(null);
    setTempValue("");
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Account?",
      "Are you sure you want to delete your account permanently?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUserProfile(userData.id);
              Alert.alert("Deleted", "Your account has been removed.");
              navigation.replace("Home");
            } catch (err) {
              console.error("Delete error:", err);
              Alert.alert("Error", "Unable to delete account.");
            }
          },
        },
      ]
    );
  };

  const saveEdit = async () => {
    if (!userData.id) {
      Alert.alert("Error", "User ID not found");
      return;
    }

    // Basic validation for email
    if (editField === "email" && tempValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(tempValue)) {
        Alert.alert("Invalid Email", "Please enter a valid email address");
        return;
      }
    }

    const updated = { ...userData, [editField]: tempValue };

    try {
      await updateUserProfile(userData.id, updated);
      setUserData(updated);
      setEditField(null);
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Could not update profile.");
    }
  };

  const pickImage = async () => {
    try {
      // Check permissions again before opening
      const permissionResult =
        await ImagePicker.getMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        const newPermission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!newPermission.granted) {
          Alert.alert(
            "Permission Denied",
            "Gallery access is required to select photos."
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images", // Correct property value
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await uploadToBackend(imageUri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to open gallery. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      // Check camera permissions
      const permissionResult = await ImagePicker.getCameraPermissionsAsync();

      if (!permissionResult.granted) {
        const newPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!newPermission.granted) {
          Alert.alert(
            "Permission Denied",
            "Camera access is required to take photos."
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("Camera result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await uploadToBackend(imageUri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  const handleAvatarPress = () => {
    if (userData?.profileImage) {
      setShowImageOptions(true);
    } else {
      pickImage();
    }
  };

  const uploadToBackend = async (imageUri) => {
    if (!userData.phoneNumber) {
      Alert.alert("Error", "Phone number not found");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      const filename = imageUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("file", {
        uri: imageUri,
        type: type,
        name: filename || "profile.jpg",
      });

      // Include phoneNumber for backend file naming
      formData.append("phoneNumber", userData.phoneNumber);

      // Get the backend URL from environment or use the current API URL
      const API_URL = process.env.API_URL || "http://10.0.2.2:6000";
      const uploadUrl = `${API_URL}/api/upload/profile`;

      console.log("Uploading to:", uploadUrl);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();
      console.log("Backend upload response:", data);

      if (data.success && data.filePath) {
        // Construct full URL for the image
        const imageUrl = `${API_URL}${data.filePath}`;
        await saveImageUrl(imageUrl);
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload Error", "Could not upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };


  const saveImageUrl = async (url) => {
    try {
      const updated = { ...userData, profileImage: url };
      await updateUserProfile(userData.id, updated);
      setUserData(updated);
      Alert.alert("Success", "Profile picture updated!");
    } catch (e) {
      console.error("Save image error:", e);
      Alert.alert("Error", "Could not save image to profile.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2E6BFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile info</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Avatar - Centered Container */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={handleAvatarPress}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="large" color="#2E6BFF" />
          ) : userData?.profileImage ? (
            <Image
              source={{ uri: userData.profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <Feather name="user" size={55} color="#6E6E6E" />
          )}

          <View style={styles.addIconWrapper}>
            <Feather name="plus" size={18} color="#000" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* First Name */}
        <Text style={styles.labelTop}>First Name</Text>
        {editField === "firstName" ? (
          <View style={styles.editBox}>
            <Feather name="user" size={22} color="#6E6E6E" />
            <TextInput
              value={tempValue}
              onChangeText={setTempValue}
              style={styles.textInput}
              autoFocus
              placeholder="Enter first name"
            />
            <TouchableOpacity onPress={cancelEdit}>
              <Feather name="x" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={saveEdit}>
              <Feather name="check" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.displayRow}
            onPress={() => startEditing("firstName")}
          >
            <View style={styles.rowLeft}>
              <Feather name="user" size={22} color="#6E6E6E" />
              <Text style={styles.infoText}>
                {userData.firstName || "Not set"}
              </Text>
            </View>
            <Feather name="edit" size={20} color="#6E6E6E" />
          </TouchableOpacity>
        )}

        <View style={styles.line} />

        {/* Last Name */}
        <Text style={styles.labelTop}>Last Name</Text>
        {editField === "lastName" ? (
          <View style={styles.editBox}>
            <Feather name="user" size={22} color="#6E6E6E" />
            <TextInput
              value={tempValue}
              onChangeText={setTempValue}
              style={styles.textInput}
              autoFocus
              placeholder="Enter last name"
            />
            <TouchableOpacity onPress={cancelEdit}>
              <Feather name="x" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={saveEdit}>
              <Feather name="check" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.displayRow}
            onPress={() => startEditing("lastName")}
          >
            <View style={styles.rowLeft}>
              <Feather name="user" size={22} color="#6E6E6E" />
              <Text style={styles.infoText}>
                {userData.lastName || "Not set"}
              </Text>
            </View>
            <Feather name="edit" size={20} color="#6E6E6E" />
          </TouchableOpacity>
        )}

        <View style={styles.line} />

        {/* Email */}
        <Text style={styles.labelTop}>E-mail</Text>
        {editField === "email" ? (
          <View style={styles.editBox}>
            <Feather name="mail" size={22} color="#6E6E6E" />
            <TextInput
              value={tempValue}
              onChangeText={setTempValue}
              style={styles.textInput}
              autoFocus
              keyboardType="email-address"
              placeholder="Enter email"
            />
            <TouchableOpacity onPress={cancelEdit}>
              <Feather name="x" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={saveEdit}>
              <Feather name="check" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.displayRow}
            onPress={() => startEditing("email")}
          >
            <View style={styles.rowLeft}>
              <Feather name="mail" size={22} color="#6E6E6E" />
              <Text style={styles.infoText}>{userData.email || "Not set"}</Text>
            </View>
            <Feather name="edit" size={20} color="#6E6E6E" />
          </TouchableOpacity>
        )}

        {/* Delete Account Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* Image Options Modal */}
      <Modal transparent visible={showImageOptions} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowImageOptions(false);
                setTimeout(() => pickImage(), 300); // Small delay for modal to close
              }}
            >
              <Text style={styles.modalText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowImageOptions(false);
                setTimeout(() => takePhoto(), 300); // Small delay for modal to close
              }}
            >
              <Text style={styles.modalText}>Take Photo</Text>
            </TouchableOpacity>

            {userData?.profileImage && (
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={async () => {
                  setShowImageOptions(false);
                  try {
                    await updateUserProfile(userData.id, {
                      profileImage: null,
                    });
                    setUserData({ ...userData, profileImage: null });
                    Alert.alert("Success", "Profile picture removed!");
                  } catch (error) {
                    console.error("Remove photo error:", error);
                    Alert.alert("Error", "Could not remove photo.");
                  }
                }}
              >
                <Text style={[styles.modalText, { color: "red" }]}>
                  Remove Photo
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={styles.modalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
  },
  avatarCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#F4F6FA",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 65,
  },
  addIconWrapper: {
    position: "absolute",
    bottom: 5,
    right: 1,
    width: 30,
    height: 30,
    backgroundColor: "#F4F6FA",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  card: {
    backgroundColor: "#F7F9FB",
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  labelTop: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
    marginTop: 10,
  },
  displayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginTop: 5,
  },
  editBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#2E6BFF",
    borderRadius: 12,
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: 5,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
    paddingVertical: 8,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  line: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 10,
  },
  deleteButton: {
    marginTop: 25,
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteText: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",

    paddingVertical: 9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 30,
  },
  modalText: {
    fontSize: 17,
    textAlign: "center",
    fontWeight: "500",
  },
});
