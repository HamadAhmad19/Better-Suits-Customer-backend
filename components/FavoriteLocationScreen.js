import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  getFavoriteLocations,
  deleteFavoriteLocation,
} from "../services/apiService";
import { useAuth } from "../contexts/AuthContext";

const FavoriteLocationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // const { phoneNumber } = route.params || {};
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch favorite locations from Firebase
  const fetchFavoriteLocations = async () => {
    try {
      setLoading(true);
      if (phoneNumber) {
        const locations = await getFavoriteLocations(phoneNumber);
        setFavoriteLocations(locations);
      }
    } catch (error) {
      console.error("Error fetching favorite locations:", error);
      Alert.alert("Error", "Failed to load favorite locations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Delete a favorite location
  const handleDeleteLocation = async (locationId) => {
    try {
      Alert.alert(
        "Delete Location",
        "Are you sure you want to delete this location?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deleteFavoriteLocation(phoneNumber, locationId);
              fetchFavoriteLocations(); // Refresh list
              Alert.alert("Success", "Location deleted successfully");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error deleting location:", error);
      Alert.alert("Error", "Failed to delete location");
    }
  };

  // Navigate to edit location
  const editLocation = (location) => {
    navigation.navigate("SelectLocation", {
      phoneNumber,
      editMode: true,
      locationData: location,
    });
  };

  // Refresh locations
  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavoriteLocations();
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchFavoriteLocations();
    });

    return unsubscribe;
  }, [navigation]);

  // Icon mapping for location types
  const getLocationIcon = (type) => {
    const iconMap = {
      Home: "home",
      Work: "briefcase",
      Partner: "heart",
      Gym: "dumbbell",
      "Parents' House": "users",
      Cafe: "coffee",
      Park: "tree",
      Other: "map-pin",
    };

    return iconMap[type] || "map-pin";
  };

  // Render location item
  const renderLocationItem = (location) => (
    <TouchableOpacity
      key={location._id || location.id}
      style={styles.locationCard}
      onPress={() => editLocation(location)}
      onLongPress={() => handleDeleteLocation(location._id || location.id)}
    >
      <View style={styles.locationHeader}>
        <View style={styles.locationIconContainer}>
          <Feather
            name={getLocationIcon(location.title)}
            size={20}
            color="#0254E8"
          />
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>{location.title}</Text>
          <Text style={styles.locationAddress} numberOfLines={2}>
            {location.address}
          </Text>
          {location.details && (
            <Text style={styles.locationDetails} numberOfLines={1}>
              {location.details}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => handleDeleteLocation(location._id || location.id)}
        >
          <Feather name="more-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("MapPage", { phoneNumber })}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorite locations</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#0254E8"]}
          />
        }
      >
        {/* Description Text */}
        <Text style={styles.description}>
          Save your favorite locations for quick access
        </Text>

        {/* Add New Location Card */}
        <TouchableOpacity
          style={styles.addBox}
          onPress={() => {
            navigation.navigate("SelectLocation", { phoneNumber });
          }}
        >
          <View style={styles.addIconContainer}>
            <Entypo name="circle-with-plus" size={24} color="#0254E8" />
          </View>
          <Text style={styles.addText}>Add new location</Text>
        </TouchableOpacity>

        {/* Saved Locations */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0254E8" />
            <Text style={styles.loadingText}>Loading locations...</Text>
          </View>
        ) : favoriteLocations.length > 0 ? (
          <View style={styles.locationsList}>
            <Text style={styles.sectionTitle}>Saved Locations</Text>
            {favoriteLocations.map(renderLocationItem)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="location-off" size={60} color="#ccc" />
            <Text style={styles.emptyStateTitle}>
              No favorite locations yet
            </Text>
            <Text style={styles.emptyStateText}>
              Add your frequently used locations for quick access
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default FavoriteLocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
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
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  addBox: {
    padding: 15,
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#F7F9FB",
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  addIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0254E8",
  },
  addText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0254E8",
    marginLeft: 15,
  },
  locationsList: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  locationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  locationDetails: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  moreButton: {
    padding: 5,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 30,
  },
});
