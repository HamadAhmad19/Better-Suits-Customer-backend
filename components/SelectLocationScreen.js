import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  addFavoriteLocation,
  updateFavoriteLocation,
} from "../services/apiService";
import { database } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const SelectLocationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;
  const {
    editMode = false,
    locationData = null,
    pickup, // This comes from SelectFavoriteScreen
  } = route.params;

  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(
    editMode ? locationData?.title : ""
  );
  const [address, setAddress] = useState(editMode ? locationData?.address : "");
  const [details, setDetails] = useState(editMode ? locationData?.details : "");
  const [saving, setSaving] = useState(false);

  // Map coordinates from pickup or existing data
  const [mapRegion, setMapRegion] = useState(
    pickup
      ? {
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }
      : editMode && locationData?.coordinates
      ? {
          latitude: locationData.coordinates.latitude,
          longitude: locationData.coordinates.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }
      : {
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }
  );

  const addressTitles = [
    { title: "Home", icon: "home", iconType: "feather" },
    { title: "Work", icon: "briefcase", iconType: "feather" },
    { title: "Partner", icon: "heart", iconType: "feather" },
    { title: "Gym", icon: "dumbbell", iconType: "material-community" },
    { title: "Parents' House", icon: "users", iconType: "feather" },
    { title: "Cafe", icon: "coffee", iconType: "feather" },
    { title: "Park", icon: "tree", iconType: "material-community" },
    { title: "Other", icon: "map-pin", iconType: "feather" },
  ];

  // Initialize with pickup data
  useEffect(() => {
    if (pickup) {
      setAddress(pickup.address || pickup.name || "");
      setMapRegion({
        latitude: pickup.latitude,
        longitude: pickup.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [pickup]);

  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };

  const handleTitleSelect = (title) => {
    setSelectedTitle(title);
    setDropdownVisible(false);
  };

  // Save favorite location to Firebase
  const saveFavoriteLocation = async () => {
    if (!selectedTitle || !address) {
      Alert.alert(
        "Error",
        "Please select a title and ensure address is selected"
      );
      return;
    }

    try {
      setSaving(true);

      const locationDoc = {
        title: selectedTitle,
        address: address,
        details: details,
        coordinates: {
          latitude: mapRegion.latitude,
          longitude: mapRegion.longitude,
        },
      };

      if (editMode && (locationData?.id || locationData?._id)) {
        // Update existing location
        await updateFavoriteLocation(
          phoneNumber,
          locationData._id || locationData.id,
          locationDoc
        );
        Alert.alert("Success", "Location updated successfully");
      } else {
        // Add new location
        await addFavoriteLocation(phoneNumber, locationDoc);
        Alert.alert("Success", "Location saved successfully");
      }

      // Navigate back to favorite locations
      navigation.navigate("Favorites", { phoneNumber });
    } catch (error) {
      console.error("Error saving favorite location:", error);
      Alert.alert("Error", "Failed to save location. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleWork = () => {
    navigation.navigate("SelectFavorite", {
      phoneNumber,
      ...(address && { initialSearch: address }),
    });
  };

  const getIconComponent = (item) => {
    const iconProps = {
      size: 20,
      color: "#666",
      style: { marginRight: 12 },
    };

    switch (item.iconType) {
      case "feather":
        return <Feather name={item.icon} {...iconProps} />;
      case "material-community":
        return <MaterialCommunityIcons name={item.icon} {...iconProps} />;
      case "material":
        return <MaterialIcons name={item.icon} {...iconProps} />;
      case "font-awesome":
        return <FontAwesome name={item.icon} {...iconProps} />;
      default:
        return <Feather name={item.icon} {...iconProps} />;
    }
  };

  const getSelectedIcon = () => {
    const selectedItem = addressTitles.find(
      (item) => item.title === selectedTitle
    );
    if (selectedItem) {
      return getIconComponent(selectedItem);
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Favorites", { phoneNumber })}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editMode ? "Edit Location" : "Create a favorite location"}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Select Section */}
        <View style={styles.section}>
          {/* Dropdown Trigger */}
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={toggleDropdown}
          >
            <View style={styles.dropdownTriggerContent}>
              {selectedTitle && getSelectedIcon()}
              <Text
                style={
                  selectedTitle ? styles.selectedText : styles.placeholderText
                }
              >
                {selectedTitle || "Select"}
              </Text>
            </View>
            <Feather
              name={isDropdownVisible ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>

          {/* Address Display (read-only) */}
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Address"
              placeholderTextColor={"#8E8E8E"}
              style={styles.input}
              value={address}
              editable={false}
            />
            <TouchableOpacity
              style={styles.editAddressButton}
              onPress={handleWork}
            >
              <Feather name="edit-2" size={16} color="#0254E8" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Details (optional)"
              placeholderTextColor={"#8E8E8E"}
              style={styles.input}
              value={details}
              onChangeText={setDetails}
              multiline={true}
            />
          </View>
        </View>

        {/* MapView Section */}
        <View style={styles.mapContainer}>
          <View style={styles.locationHeader}>
            <Entypo name="location-pin" size={26} color="#666" />
            <Text style={styles.locationHeaderText}>Location Preview</Text>
          </View>
          <MapView
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            <Marker
              coordinate={{
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
              }}
              title="Selected Location"
              description={address}
            />
          </MapView>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!selectedTitle || !address || saving) && styles.saveButtonDisabled,
          ]}
          onPress={saveFavoriteLocation}
          disabled={!selectedTitle || !address || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {editMode ? "Update Location" : "Save Location"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            <ScrollView style={styles.dropdownList}>
              {addressTitles.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => handleTitleSelect(item.title)}
                >
                  <View style={styles.dropdownItemContent}>
                    {getIconComponent(item)}
                    <Text style={styles.dropdownItemText}>{item.title}</Text>
                  </View>
                  {selectedTitle === item.title && (
                    <Feather name="check" size={16} color="#0254E8" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default SelectLocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 20,
  },
  section: {
    marginBottom: 20,
  },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
  },
  dropdownTriggerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedText: {
    fontSize: 16,
    color: "#000",
  },
  placeholderText: {
    fontSize: 16,
    color: "#999",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F6FA",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  editAddressButton: {
    padding: 5,
  },
  mapContainer: {
    height: 300,
    marginBottom: 30,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  locationHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
    backgroundColor: "#F7F9FB",
  },
  locationHeaderText: {
    fontSize: 16,
    color: "#666",
    marginLeft: 5,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: "#fff",
    marginBottom: 50,
  },
  saveButton: {
    backgroundColor: "#0254E8",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "90%",
    maxHeight: "60%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownList: {
    padding: 10,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#000",
  },
});
