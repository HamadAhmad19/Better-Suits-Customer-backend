import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserBookings,
  getUserAdvancedBookings,
  cancelAdvancedBooking,
} from "../services/apiService";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Octicons from "@expo/vector-icons/Octicons";
import Entypo from "@expo/vector-icons/Entypo";

const ScheduleRideScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;
  const { type } = useRoute().params || { type: "scheduled" }; // Default to scheduled

  const [scheduledRides, setScheduledRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideModalVisible, setRideModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  const fetchScheduledRides = async () => {
    if (phoneNumber) {
      try {
        let rides = [];
        if (type === "advanced") {
          rides = await getUserAdvancedBookings(phoneNumber);
        } else {
          rides = await getUserBookings(phoneNumber);
        }
        setScheduledRides(rides);
      } catch (error) {
        console.error("Error fetching scheduled rides:", error);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchScheduledRides();
      return () => { };
    }, [phoneNumber, type])
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateTime = (dateString) => {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
  };

  const handleRidePress = (ride) => {
    setSelectedRide(ride);
    setRideModalVisible(true);
  };

  const handleCancelReservation = () => {
    setRideModalVisible(false);
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (selectedRide) {
      try {
        const rideId = selectedRide._id || selectedRide.id;

        // Call the API to delete the booking permanently
        await cancelAdvancedBooking(rideId);
        console.log("✅ Advanced booking deleted:", rideId);

        // Remove from local state
        setScheduledRides((prev) =>
          prev.filter((ride) => (ride._id || ride.id) !== rideId)
        );

        Alert.alert("Success", "Ride cancelled successfully");
      } catch (error) {
        console.error("Error cancelling ride:", error);
        Alert.alert("Error", "Failed to cancel ride. Please try again.");
      } finally {
        setCancelModalVisible(false);
        setSelectedRide(null);
      }
    }
  };

  const renderRideItem = ({ item }) => (
    <TouchableOpacity
      style={styles.rideCard}
      onPress={() => handleRidePress(item)}
    >
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
              {formatDateTime(item.scheduledTime || item.createdAt)}
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
          <Text style={styles.dateText}>Cash</Text>
        </View>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.paymentBox}>
          <MaterialCommunityIcons name="cash" size={24} color="#0254E8" />
          <Text style={styles.paymentText}>{item.paymentMethod}</Text>
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
              {item.pickup?.address || "Pickup point"}
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
              {item.dropoff?.address || "Drop-off point"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === "advanced" ? "Advanced Bookings" : "Scheduled rides"}
        </Text>
      </View>

      {scheduledRides.length === 0 ? (
        /* Empty State */
        <View style={styles.center}>
          <Image
            source={require("../assets/calendar.png")}
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.noRidesText}>"No rides yet!"</Text>
        </View>
      ) : (
        /* Rides List */
        <FlatList
          data={scheduledRides}
          renderItem={renderRideItem}
          keyExtractor={(item) => (item._id || item.id)?.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => navigation.navigate("TaxiLater", { phoneNumber })}
        >
          <Text style={styles.orderText}>Order a ride</Text>
        </TouchableOpacity>
      </View>

      {/* Ride Details Modal (First Modal) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rideModalVisible}
        onRequestClose={() => setRideModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scheduled ride</Text>
              <TouchableOpacity onPress={() => setRideModalVisible(false)}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedRide && (
                <>
                  <View style={styles.modalSection}>
                    <View style={styles.modalDateTime}>
                      <View style={styles.dateCheck}>
                        <Feather name="calendar" size={18} color="#666" />
                        <Text style={styles.modalDateTimeText}>
                          {formatDateTime(
                            selectedRide.scheduledTime || selectedRide.createdAt
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.divider} />
                  <View style={styles.rideDetails}>
                    <View style={styles.paymentBox}>
                      <MaterialCommunityIcons
                        name="cash"
                        size={24}
                        color="#0254E8"
                      />
                      <Text style={styles.paymentText}>
                        {selectedRide.paymentMethod}
                      </Text>
                      <MaterialIcons
                        name="arrow-forward-ios"
                        size={15}
                        color="black"
                      />
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.modalSection1}>
                    <View style={styles.ImgContainer2}>
                      <Image
                        source={require("../assets/taxicar.png")}
                        style={styles.Img2}
                      />
                    </View>
                    <Text style={styles.rideTypeModal}>
                      {selectedRide.rideType || selectedRide.selectedRide}
                    </Text>
                    <Text style={styles.priceModal}>
                      €{parseFloat(selectedRide.price).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.modalSection2}>
                    <Octicons
                      name="location"
                      size={22}
                      color="blue"
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flexDirection: "column" }}>
                      <Text style={styles.sectionTitle}>Pick-up point</Text>
                      <Text style={styles.locationModal}>
                        {selectedRide.pickup?.address ||
                          "G86R+667 Kashif Ali Ghouri Park II-Block D1 Gulberg III, Lahore, Pakistan"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.modalSection2}>
                    <Octicons
                      name="location"
                      size={22}
                      color="red"
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flexDirection: "column" }}>
                      <Text style={styles.sectionTitle}>Drop-off point</Text>
                      <Text style={styles.locationModal}>
                        {selectedRide.dropoff?.address ||
                          "Plot 400-Block F Phase 1. Johar Town-"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelReservationButton}
                    onPress={handleCancelReservation}
                  >
                    <Text style={styles.cancelReservationText}>
                      Cancel reservation
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.canceledOverlay}>
          <View style={styles.canceledContainer}>
            <Entypo name="cross" size={50} color="red" />
            <View>
              <Text style={styles.canceledTitle}>Cancel ride</Text>
            </View>
            {/* Description */}
            <Text style={styles.canceledDescription}>
              Are you sure you want to cancel your ride?
            </Text>

            {/* Confirm Button */}
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.keepOrderButton]}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.keepOrderText}>Keep the order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmationButton, styles.cancelRideButton]}
                onPress={handleConfirmCancel}
              >
                <Text style={styles.cancelRideText}>Cancel the ride</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
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
    // padding: 16,
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
  rideTypeText: {
    fontSize: 12,
    color: "#0254E8",
    fontWeight: "600",
  },
  rideDetails: {
    flexDirection: "row",
    // justifyContent:'center',
    padding: 10,
    alignItems: "center",
    // marginBottom: 10,
    // backgroundColor:'#666',
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#a6a5a59a",
  },
  paymentBox: {
    flexDirection: "row",
    // justifyContent:'flex-start',
    alignItems: "center",
    // padding:5,
  },
  priceText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
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
    // alignItems: 'center',
  },
  picklabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    marginLeft: 30,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  pickupDot: {
    backgroundColor: "#0254E8",
  },
  dropoffDot: {
    backgroundColor: "#FF0000",
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  bottomButtonContainer: {
    width: "100%",
    paddingBottom: 20,
    marginBottom: 30,
  },
  orderButton: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    paddingVertical: 12,
    borderRadius: 7,
    alignItems: "center",
  },
  orderText: {
    color: "#0254E8",
    fontSize: 14,
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
    padding: 5,
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
  modalSection: {
    marginBottom: 16,
  },
  modalSection1: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // backgroundColor:'yellow',
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b9b9b9ab",
  },
  ImgContainer2: {
    width: 50,
    height: 50,
    // backgroundColor:"#fff",
    // padding:5,
    // borderRadius:8,
  },
  Img2: {
    width: "100%",
    height: "100%",
  },
  modalDateTime: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateCheck: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentCheck: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalDateTimeText: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  modalPaymentText: {
    fontSize: 16,
    color: "#00C851",
    marginLeft: 8,
    fontWeight: "600",
  },

  rideTypeModal: {
    fontSize: 16,
    fontWeight: "400",
    color: "#333",
    // marginBottom: 8,
  },
  priceModal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0254E8",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7b7b7bff",
    marginBottom: 8,
  },
  modalSection2: {
    marginBottom: 16,
    flexDirection: "row",
    marginLeft: 10,
    marginRight: 10,
  },
  locationModal: {
    fontSize: 16,
    color: "#000",
    // marginLeft: 10,
    marginRight: 20,
    lineHeight: 22,
  },
  cancelReservationButton: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#c4c2c2ff",
    marginBottom: 30,
  },
  cancelReservationText: {
    color: "#FF3B30",
    fontSize: 15,
    fontWeight: "600",
  },
  // Confirmation Modal Styles
  confirmationModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    alignItems: "center",
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  confirmationMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmationButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  confirmationButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 6,
    marginBottom: 30,
  },
  keepOrderButton: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  cancelRideButton: {
    backgroundColor: "#FF3B30",
  },
  keepOrderText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  cancelRideText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  canceledOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  canceledContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
  },

  canceledTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000",
    marginBottom: 25,
    textAlign: "center",
  },

  canceledDescription: {
    fontSize: 14,
    color: "#555",
    textAlign: "justify",
    marginBottom: 40,
    lineHeight: 24,
    letterSpacing: 0.3,
  },

  canceledButton: {
    width: "100%",
    backgroundColor: "#0057FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 30,
  },

  canceledButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});

export default ScheduleRideScreen;
