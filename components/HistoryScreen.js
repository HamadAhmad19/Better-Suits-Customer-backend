import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserBookings,
  getUserAdvancedBookings,
} from "../services/apiService";

const HistoryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;

  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState([]);

  const fetchRides = async () => {
    if (!phoneNumber) return;

    setLoading(true);
    try {
      // Fetch both standard and advanced bookings
      const [standardBookings, advancedBookings] = await Promise.all([
        getUserBookings(phoneNumber),
        getUserAdvancedBookings(phoneNumber),
      ]);
      const allRides = [
        ...(standardBookings || []).map((b) => ({ ...b, type: "Standard" })),
        ...(advancedBookings || []).map((b) => ({ ...b, type: "Advanced" })),
      ];

      // Filter for completed rides only
      const completedRides = allRides.filter(
        (ride) => ride.status === "completed"
      );
      completedRides.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.bookingDate || a.scheduledTime);
        const dateB = new Date(b.createdAt || b.bookingDate || b.scheduledTime);
        return dateB - dateA;
      });

      setRides(completedRides);
    } catch (error) {
      console.error("Error fetching ride history:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRides();
    }, [phoneNumber])
  );

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr} ${timeStr}`;
  };

  const renderRideItem = ({ item }) => {
    return (
      <View style={styles.rideCard}>
        <View style={styles.rideHeader}>
          <View style={styles.rideDateTime}>
            <View style={styles.ImgContainer}>
              <Image
                source={require("../assets/taxicar.png")}
                style={styles.Img}
              />
            </View>
            <View style={{ flexDirection: "column" }}>
              <Text style={styles.dateText}>
                {formatDateTime(
                  item.createdAt || item.bookingDate || item.scheduledTime
                )}
              </Text>
              <Text style={styles.dateText}>
                {item.rideType || item.selectedRide}
              </Text>
            </View>
          </View>
          <View style={styles.rideTypeBadge}>
            <Text style={styles.dateText}>
              €{parseFloat(item.price).toFixed(2)}
            </Text>
            <Text style={styles.dateText}>{item.paymentMethod || "Cash"}</Text>
          </View>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.paymentBox}>
            <MaterialCommunityIcons name="cash" size={24} color="#0254E8" />
            <Text style={styles.paymentText}>
              {item.paymentMethod || "Cash"}
            </Text>
            <MaterialIcons name="arrow-forward-ios" size={15} color="black" />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.locationSection}>
          <View style={styles.locationRow}>
            <Text style={styles.picklabel}>Pick-up point</Text>
            <View style={{ flexDirection: "row" }}>
              <Octicons
                name="location"
                size={22}
                color="blue"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.locationText} numberOfLines={3}>
                {item.pickup?.name || item.pickup?.address || "Pickup point"}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Text style={styles.picklabel}>Drop-off point</Text>
            <View style={{ flexDirection: "row" }}>
              <Octicons
                name="location"
                size={22}
                color="red"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.locationText} numberOfLines={3}>
                {item.dropoff?.name ||
                  item.dropoff?.address ||
                  "Drop-off point"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride History</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0254E8" />
        </View>
      ) : rides.length === 0 ? (
        <View style={styles.center}>
          <Image
            source={require("../assets/calendar.png")}
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.noRidesText}>“ No completed rides yet! ”</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          renderItem={renderRideItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  image: {
    width: 120,
    height: 120,
    opacity: 0.9,
  },
  noRidesText: {
    fontSize: 17,
    marginTop: 25,
    color: "#555",
  },
  listContainer: {
    paddingBottom: 20,
  },
  rideCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rideHeader: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#0284d6",
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
  },
  ImgContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    padding: 5,
    borderRadius: 8,
  },
  Img: {
    width: "100%",
    height: "100%",
  },
  rideDateTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 6,
    fontWeight: "500",
  },
  rideTypeBadge: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  rideDetails: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#a6a5a59a",
  },
  paymentBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentText: {
    fontSize: 15,
    color: "#000",
    marginLeft: 6,
    marginRight: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginVertical: 12,
  },
  locationSection: {
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  locationRow: {
    flexDirection: "column",
    marginBottom: 5,
  },
  picklabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    marginLeft: 30,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
});
