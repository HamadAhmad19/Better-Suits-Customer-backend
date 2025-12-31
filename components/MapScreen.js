import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Image,
  Dimensions,
  Alert,
  Platform,
  BackHandler,
  PanResponder,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation, useRoute } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AntDesign from "@expo/vector-icons/AntDesign";
import {
  getUserSavedLocations,
  deleteHomeLocation,
  deleteWorkLocation,
  getUserByPhoneNumber,
} from "../services/apiService";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { GOOGLE_MAPS_API_KEY } from "../config/map";
import { useAuth } from "../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
const { width, height } = Dimensions.get("window");

const MapScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // const { phoneNumber } = route.params || {};
  const { user, logout } = useAuth();
  const phoneNumber = user?.phoneNumber;
  const [locationPermission, setLocationPermission] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedService, setSelectedService] = useState("Taxi");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [savedLocations, setSavedLocations] = useState({
    home: null,
    work: null,
  });
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const mapRef = useRef(null);

  // Add new animated values for the service container
  const panelHeight = useRef(new Animated.Value(height * 0.5)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        // Calculate new height (current height - dy)
        const newHeight = height * 0.5 - gestureState.dy;

        // Constrain height between min and max values
        const constrainedHeight = Math.max(
          height * 0.25,
          Math.min(height * 0.85, newHeight)
        );

        panelHeight.setValue(constrainedHeight);
      },
      onPanResponderRelease: (event, gestureState) => {
        const currentHeight = panelHeight._value;

        if (currentHeight < height * 0.55) {
          // Snap to minimized position
          Animated.spring(panelHeight, {
            toValue: height * 0.5,
            useNativeDriver: false,
            tension: 50,
            friction: 10,
          }).start();
        } else if (currentHeight > height * 0.65) {
          // Snap to maximized position
          Animated.spring(panelHeight, {
            toValue: height * 0.95,
            useNativeDriver: false,
            tension: 50,
            friction: 10,
          }).start();
        } else {
          // Snap to default position
          Animated.spring(panelHeight, {
            toValue: height * 0.5,
            useNativeDriver: false,
            tension: 50,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        return true; // Prevent going back
      }
    );

    return () => backHandler.remove();
  }, []);

  // Fetch user data when component mounts
  useEffect(() => {
    if (phoneNumber) {
      fetchUserData();
    }
    checkLocationPermission();
  }, [phoneNumber]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const user = await getUserByPhoneNumber(phoneNumber);
      if (user) {
        setUserData(user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };
  // useEffect(() => {
  //   if (phoneNumber) {
  //     loadSavedLocations();
  //     fetchUserData();
  //   }
  //   checkLocationPermission();
  // }, [phoneNumber]);
  useEffect(() => {
    const initApp = async () => {
      if (phoneNumber) {
        await Promise.all([fetchUserData(), loadSavedLocations()]);
      }

      // Check if modal has been shown before
      const hasModalBeenShown = await AsyncStorage.getItem(
        "locationModalShown"
      );

      if (!hasModalBeenShown) {
        // Only show modal if it hasn't been shown before
        setShowPermissionModal(true);
      } else {
        // If modal was shown before, just check permission
        await checkLocationPermission();
      }
    };

    initApp();
  }, [phoneNumber]);

  // Add this function to load saved locations
  const loadSavedLocations = async () => {
    try {
      setIsLoadingLocations(true);
      const locations = await getUserSavedLocations(phoneNumber);
      setSavedLocations(locations);
    } catch (error) {
      console.error("Error loading saved locations:", error);
    } finally {
      setIsLoadingLocations(false);
    }
  };
  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status === "granted") {
        getUserLocation();
        return;
      }

      // Don't show modal here - it will be handled by the initApp logic
      // Only request permission if needed (silent check)
      if (status !== "granted") {
        // Optionally request permission silently
        const result = await Location.requestForegroundPermissionsAsync();
        if (result.status === "granted") {
          getUserLocation();
        }
      }
    } catch (error) {
      console.error("Error checking location permission:", error);
    }
  };

  const getUserLocation = async () => {
    try {
      // Check if location services are available
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services to use this app",
          [{ text: "OK" }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000, // 10 second timeout
      });

      const { latitude, longitude } = location.coords;
      setUserLocation({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
      // Provide fallback coordinates for emulator
      setUserLocation({
        latitude: 31.5204,
        longitude: 74.3587,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      Alert.alert(
        "Location Error",
        "Using default location. Please check your location settings.",
        [{ text: "OK" }]
      );
    }
  };

  const handlePermission = async (permissionType) => {
    setShowPermissionModal(false); // Hide modal

    // Mark that modal has been shown
    await AsyncStorage.setItem("locationModalShown", "true");

    if (permissionType === "DENY") {
      Alert.alert("Location Denied", "Enable in Settings anytime");
      return;
    }

    try {
      const result = await Location.requestForegroundPermissionsAsync();

      if (result.status === "granted") {
        setLocationPermission("granted");
        getUserLocation();
      } else {
        Alert.alert("Permission Needed", "Location required for app to work");
      }
    } catch (error) {
      console.error("Permission error:", error);
    }
  };

  const toggleSidebar = () => {
    if (sidebarVisible) {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setSidebarVisible(false));
    } else {
      setSidebarVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear the modal flag on logout
            await AsyncStorage.removeItem("locationModalShown");

            await logout(); // ✅ Clears AuthContext + AsyncStorage

            // ✅ Navigate to ROOT navigator's Auth flow ONLY
            const rootNav = navigation.getParent();
            if (rootNav) {
              rootNav.navigate("Home");
            }
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      // Handle Firestore timestamp or string date
      const date =
        typeof dateString === "string"
          ? new Date(dateString)
          : dateString.toDate();

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getInitials = () => {
    if (!userData) return "US";
    const { firstName, lastName } = userData;
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    return "US";
  };

  const getUserDisplayName = () => {
    if (!userData) return "User";
    const { firstName, lastName } = userData;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return "User";
  };

  const handleAboutPress = () => {
    toggleSidebar();
    setShowAboutModal(true);
  };

  const closeAboutModal = () => {
    setShowAboutModal(false);
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        // Get the most relevant address (usually the first one)
        const address = data.results[0].formatted_address;
        return address;
      }
      return "Current Location";
    } catch (error) {
      console.error("Google reverse geocoding error:", error);
      return "Current Location";
    }
  };

  const handleWhereToPress = async () => {
    if (userLocation) {
      try {
        // Get the actual address name from coordinates using Google API
        const addressName = await getAddressFromCoordinates(
          userLocation.latitude,
          userLocation.longitude
        );

        // Create a location object with the actual address
        const currentLocation = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: addressName,
          name: addressName,
        };

        navigation.navigate("Taxi", {
          phoneNumber,
          defaultPickup: currentLocation,
        });
      } catch (error) {
        console.error("Error getting address:", error);
        // Fallback: navigate with basic location info
        const fallbackLocation = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: "Current Location",
          name: "Current Location",
        };
        navigation.navigate("Taxi", {
          phoneNumber,
          defaultPickup: fallbackLocation,
        });
      }
    } else {
      navigation.navigate("Taxi", { phoneNumber });
    }
  };

  const handleLaterPress = async () => {
    if (userLocation) {
      try {
        // Get the actual address name from coordinates using Google API
        const addressName = await getAddressFromCoordinates(
          userLocation.latitude,
          userLocation.longitude
        );

        // Create a location object with the actual address
        const currentLocation = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: addressName,
          name: addressName,
        };

        navigation.navigate("TaxiLater", {
          phoneNumber,
          defaultPickup: currentLocation,
        });
      } catch (error) {
        console.error("Error getting address:", error);
        // Fallback: navigate with basic location info
        const fallbackLocation = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: "Current Location",
          name: "Current Location",
        };
        navigation.navigate("TaxiLater", {
          phoneNumber,
          defaultPickup: fallbackLocation,
        });
      }
    } else {
      navigation.navigate("TaxiLater", { phoneNumber });
    }
  };
  const handleDeleteHome = async () => {
    Alert.alert(
      "Delete Home Location",
      "Are you sure you want to delete your saved home location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteHomeLocation(phoneNumber);
              if (success) {
                setSavedLocations((prev) => ({ ...prev, home: null }));
                Alert.alert("Success", "Home location deleted");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete home location");
            }
          },
        },
      ]
    );
  };

  const handleDeleteWork = async () => {
    Alert.alert(
      "Delete Work Location",
      "Are you sure you want to delete your saved work location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteWorkLocation(phoneNumber);
              if (success) {
                setSavedLocations((prev) => ({ ...prev, work: null }));
                Alert.alert("Success", "Work location deleted");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete work location");
            }
          },
        },
      ]
    );
  };

  // Update the HandleHome function to handle both save and navigate
  const HandleHome = async () => {
    // Navigate to SaveHome screen to allow user to save or edit home location
    if (userLocation) {
      try {
        const addressName = await getAddressFromCoordinates(
          userLocation.latitude,
          userLocation.longitude
        );

        const currentLocation = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: addressName,
          name: addressName,
        };

        navigation.navigate("SaveHome", {
          phoneNumber,
          defaultPickup: savedLocations.home ? { ...savedLocations.home, address: savedLocations.home.address || "Home" } : currentLocation,
        });
      } catch (error) {
        console.error("Error getting address:", error);
        const fallbackLocation = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: "Current Location",
          name: "Current Location",
        };
        navigation.navigate("SaveHome", {
          phoneNumber,
          defaultPickup: savedLocations.home ? { ...savedLocations.home, address: savedLocations.home.address || "Home" } : fallbackLocation,
        });
      }
    } else {
      navigation.navigate("SaveHome", { phoneNumber, defaultPickup: savedLocations.home });
    }
  };

  // Update the HandleWork function similarly
  const HandleWork = async () => {
    // Navigate to SaveWork screen to allow user to save or edit work location
    if (userLocation) {
      try {
        const addressName = await getAddressFromCoordinates(
          userLocation.latitude,
          userLocation.longitude
        );

        const currentLocation = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: addressName,
          name: addressName,
        };

        navigation.navigate("SaveWork", {
          phoneNumber,
          defaultPickup: savedLocations.work ? { ...savedLocations.work, address: savedLocations.work.address || "Work" } : currentLocation,
        });
      } catch (error) {
        console.error("Error getting address:", error);
        const fallbackLocation = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: "Current Location",
          name: "Current Location",
        };
        navigation.navigate("SaveWork", {
          phoneNumber,
          defaultPickup: savedLocations.work ? { ...savedLocations.work, address: savedLocations.work.address || "Work" } : fallbackLocation,
        });
      }
    } else {
      navigation.navigate("SaveWork", { phoneNumber, defaultPickup: savedLocations.work });
    }
  };
  const centerOnUserLocation = async () => {
    try {
      if (userLocation) {
        // Animate to current user location
        mapRef.current?.animateToRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } else {
        // Try to get current location if not available
        await getUserLocation();
      }
    } catch (error) {
      console.error("Error centering on location:", error);
      Alert.alert("Error", "Unable to get your current location");
    }
  };
  const menuItems = [
    { icon: "user", label: "Profile", screen: "Profile" },
    { icon: "bell", label: "Announcements", screen: "Announcements" },
    { icon: "credit-card", label: "Wallet", screen: "Wallet" },
    { icon: "heart", label: "Favorite locations", screen: "Favorites" },
    {
      icon: "clock",
      label: "Scheduled rides",
      screen: "Scheduled",
      params: { type: "advanced" },
    },
    { icon: "list", label: "Ride History", screen: "History" },
  ];

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        provider={MapView.PROVIDER_GOOGLE}
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 31.5204,
          longitude: 74.3587,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        region={userLocation}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="You are here"
          />
        )}
      </MapView>

      <TouchableOpacity
        style={styles.floatingLocationButton}
        onPress={centerOnUserLocation}
      >
        <Feather name="navigation" size={22} color="#6E6E6E" />
      </TouchableOpacity>
      {/* Header with Menu Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <Feather name="menu" size={22} color="#6E6E6E" />
        </TouchableOpacity>
        <View style={styles.menu2BTN}>
          <TouchableOpacity
            style={[styles.menuButton, styles.calenderBtn]}
            onPress={() => {
              navigation.navigate("Scheduled", {
                phoneNumber,
                type: "advanced",
              });
            }}
          >
            <FontAwesome5 name="calendar-alt" size={22} color="#6E6E6E" />
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.menuButton}  onPress={()=>{
            navigation.navigate('ActiveDelivery');
          }}>
            <AntDesign name="code-sandbox" size={22} color="#6E6E6E" />
          </TouchableOpacity> */}
          {/* <TouchableOpacity 
              style={[styles.menuButton, styles.locationButton]} 
              onPress={centerOnUserLocation}
            >
              <Feather name="navigation" size={22} color="#6E6E6E" />
            </TouchableOpacity> */}
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Draggable Service Container */}
      <Animated.View style={[styles.serviceContainer, { height: panelHeight }]}>
        {/* Handle Bar with PanResponder */}
        <View style={styles.handleBarContainer} {...panResponder.panHandlers}>
          <View style={styles.handleBar} />
        </View>

        {/* Input Box - Where to */}
        <View style={styles.inputBox}>
          <View style={styles.inputContent}>
            <TouchableOpacity
              style={styles.inputLeft}
              onPress={handleWhereToPress}
            >
              <View style={styles.homeIcon}>
                <Feather name="search" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.inputLabel}>Where to?</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.later} onPress={handleLaterPress}>
              <Feather name="calendar" size={20} color="#000" />
              <Text style={styles.inputLabel1}>Later</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Home Button */}
        <TouchableOpacity
          onPress={HandleHome}
          onLongPress={savedLocations.home ? handleDeleteHome : null}
          delayLongPress={1000}
        >
          <View style={styles.inputLeft2}>
            <View style={styles.homeIcon2}>
              <Feather name="home" size={25} color="#000" />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.inputLabel2}>Home</Text>
              <Text style={styles.inputSubtext2}>
                {isLoadingLocations
                  ? "Loading..."
                  : savedLocations.home
                    ? savedLocations.home.address?.substring(0, 30) +
                    (savedLocations.home.address?.length > 30 ? "..." : "")
                    : "Set Home address"}
              </Text>
              {savedLocations.home && (
                <Text style={styles.deleteHintText}>Long press to delete</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Work Button with long press for delete */}
        <TouchableOpacity
          onPress={HandleWork}
          onLongPress={savedLocations.work ? handleDeleteWork : null}
          delayLongPress={1000}
        >
          <View style={styles.inputLeft2}>
            <View style={styles.homeIcon2}>
              <MaterialIcons name="work-outline" size={25} color="#000" />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.inputLabel2}>Work</Text>
              <Text style={styles.inputSubtext2}>
                {isLoadingLocations
                  ? "Loading..."
                  : savedLocations.work
                    ? savedLocations.work.address?.substring(0, 30) +
                    (savedLocations.work.address?.length > 30 ? "..." : "")
                    : "Set Work address"}
              </Text>
              {savedLocations.work && (
                <Text style={styles.deleteHintText}>Long press to delete</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Location Permission Modal */}
      <Modal
        visible={showPermissionModal}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.permissionModal}>
            <Text style={styles.permissionTitle}>
              Allow Five Stars Galway Taxis to access this device's location?
            </Text>
            <Text style={styles.permissionText}>
              We need your location to show nearby taxis and provide better
              service.
            </Text>

            <TouchableOpacity
              style={styles.permissionButton}
              onPress={() => handlePermission("WHILE_USING_APP")}
            >
              <Text style={styles.permissionButtonText}>
                WHILE USING THE APP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.permissionButton}
              onPress={() => handlePermission("ONLY_THIS_TIME")}
            >
              <Text style={styles.permissionButtonText}>ONLY THIS TIME</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.permissionButton, styles.denyButton]}
              onPress={() => handlePermission("DENY")}
            >
              <Text style={styles.denyButtonText}>DENY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sidebar Menu */}
      {sidebarVisible && (
        <TouchableOpacity
          style={styles.sidebarOverlay}
          onPress={toggleSidebar}
          activeOpacity={1}
        />
      )}

      <Animated.View
        style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
      >
        {/* User Profile Section */}
        <View style={styles.userSection}>
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
          <View style={styles.userInfo}>
            {loading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : userData ? (
              <>
                <Text style={styles.userName}>{getUserDisplayName()}</Text>
                <Text style={styles.userPhone}>
                  {userData.phoneNumber || phoneNumber}
                </Text>
              </>
            ) : (
              <Text style={styles.noDataText}>No user data available</Text>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuItems}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                toggleSidebar();
                navigation.navigate(`${item.screen}`, {
                  phoneNumber,
                  ...item.params,
                });
              }}
            >
              <Feather name={item.icon} size={20} color="#6E6E6E" />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.menuItem} onPress={handleAboutPress}>
            <Feather name="info" size={20} color="#6E6E6E" />
            <Text style={styles.menuItemText}>About</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#6E6E6E" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeAboutModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aboutModal}>
            <Image
              source={require("../assets/download1.png")}
              style={styles.img1}
            />
            <Text style={styles.aboutTitle}>Five Stars Galway Taxis</Text>
            <View>
              <Text style={styles.versionText}>
                v 1.0 (powered by 5 stars galway taxis Ltd.)
              </Text>

              <Text style={styles.copyrightText}>
                Copyright © Five Stars Taxis, All rights reserved.
              </Text>
            </View>
            <View style={styles.separator} />
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeAboutModal}
              >
                <Text style={styles.closeButtonText}>Close</Text>
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
  },
  map: {
    width: "100%",
    height: "70%",
  },
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menu2BTN: {
    width: "100%",
    paddingRight: 40,
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  calenderBtn: {
    marginRight: 10,
  },
  locationButton: {
    marginLeft: 10, // Add some spacing from the calendar button
  },

  calenderBtn: {
    marginRight: 10,
  },
  placeholder: {
    width: 40,
  },
  // Updated Service Container Styles for draggable panel
  serviceContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 999,
    elevation: 999,
    // elevation: 10,
    minHeight: height * 0.5,
    maxHeight: height * 1.0,

  },
  handleBarContainer: {
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 5,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
  },
  inputBox: {
    backgroundColor: "#ecebeba2",
    borderRadius: 35,
    padding: 12,
    marginBottom: 15,
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0066FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  later: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  inputLabel1: {
    fontSize: 15,
    marginLeft: 6,
    fontWeight: "500",
    color: "#000",
    marginBottom: 2,
  },
  inputLeft2: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  homeIcon2: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  inputLabel2: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  inputSubtext2: {
    fontSize: 14,
    color: "#0066FF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  permissionModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    margin: 20,
    width: width - 40,
    alignItems: "center",
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#000",
  },
  permissionText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  permissionButton: {
    width: "100%",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0254E8",
  },
  denyButton: {
    borderBottomWidth: 0,
    marginTop: 5,
  },
  denyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
  },
  sidebarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 300,
    height: "100%",
    backgroundColor: "white",
    zIndex: 1001,
    paddingTop: 20,
  },
  userSection: {
    marginBottom: 30,
    paddingTop: 60,
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 10,
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    marginRight: 15,
  },
  avatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  userDetails: {
    marginTop: 8,
  },
  userDetail: {
    fontSize: 12,
    color: "#666",
    marginBottom: 3,
  },
  detailLabel: {
    fontWeight: "600",
    color: "#333",
  },
  completedText: {
    color: "#22C55E",
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  noDataText: {
    fontSize: 14,
    color: "#999",
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  menuItemText: {
    fontSize: 16,
    color: "#6E6E6E",
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 16,
    color: "#6E6E6E",
    marginLeft: 15,
    fontWeight: "400",
  },
  aboutModal: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    margin: 40,
    width: width - 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  img1: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#000",
  },
  versionText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  copyrightText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  separator: {
    width: "100%",
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0254E8",
  },
  avatarCircle: {
    width: 40,
    height: 40,
    // borderRadius: 50,
    borderRadius: 30,
    // backgroundColor: '#fff',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    marginRight: 10,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  floatingLocationButton: {
    position: "absolute",
    bottom: height * 0.55, // Position it above the service container
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
});

export default MapScreen;
