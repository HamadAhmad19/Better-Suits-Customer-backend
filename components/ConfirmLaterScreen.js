import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
  Animated,
  Image,
  Alert,
  TextInput,
  Share,
  Linking
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
const { width, height } = Dimensions.get('window');
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Entypo from '@expo/vector-icons/Entypo';
import { useAuth } from '../contexts/AuthContext';
// Dummy drivers data with locations and online status
const DUMMY_DRIVERS = [
  {
    id: '1',
    name: 'Rida Anjum',
    rating: 5.0,
    vehicle: 'Kia Optima - Black',
    plateNumber: '1234',
    image: require('../assets/user.png'),
    location: 'Kotlakhpat Railway Station',
    latitude: 31.5204,
    longitude: 74.3587,
    isOnline: true,
    distance: 1.2, // km
    rideType: 'Regular4',
    status: 'available'
  },
  {
    id: '2',
    name: 'Ali Khan',
    rating: 4.9,
    vehicle: 'Toyota Corolla - White',
    plateNumber: 'ABCD-789',
    image: require('../assets/user.png'),
    location: 'Johar Town',
    latitude: 31.4709,
    longitude: 74.2660,
    isOnline: true,
    distance: 2.5,
    rideType: 'Regular4',
    status: 'available'
  },
  {
    id: '3',
    name: 'Sara Ahmed',
    rating: 4.8,
    vehicle: 'Honda Civic - Silver',
    plateNumber: 'EFGH-456',
    image: require('../assets/user.png'),
    location: 'Hafeez Center',
    latitude: 31.4800,
    longitude: 74.2745,
    isOnline: true,
    distance: 3.1,
    rideType: 'Regular6',
    status: 'available'
  },
  {
    id: '4',
    name: 'Usman Malik',
    rating: 4.7,
    vehicle: 'Suzuki Alto - Red',
    plateNumber: 'IJKL-123',
    image: require('../assets/user.png'),
    location: 'Model Town',
    latitude: 31.4900,
    longitude: 74.2800,
    isOnline: true,
    distance: 4.0,
    rideType: 'Regular6',
    status: 'available'
  },
  {
    id: '5',
    name: 'Fatima Raza',
    rating: 4.9,
    vehicle: 'Toyota Prius - Blue',
    plateNumber: 'MNOP-987',
    image: require('../assets/user.png'),
    location: 'DHA Phase 5',
    latitude: 31.4600,
    longitude: 74.2900,
    isOnline: true,
    distance: 5.2,
    rideType: 'Regular6',
    status: 'available'
  }
];

const ConfirmLaterScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;
  const { pickup, dropoff, selectedRide, price, estimatedTime, estimatedDistance } = route.params;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(height));
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [rideStatus, setRideStatus] = useState('searching'); // searching, driver_found, driver_arrived, pickup_confirmed, en_route
  const [driverRequestTimer, setDriverRequestTimer] = useState(null);
  const [isRidePreferencesModalVisible, setIsRidePreferencesModalVisible] = useState(false);
  const [isModalCouponVisible, setIsModalCouponVisible] = useState(false);
  const [isCancelRideModalVisible, setIsCancelRideModalVisible] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState(null);
  const [isRideSafetyVisible, setIsRideSafetyVisible] = useState(false);
  const [isSOSModalVisible, setIsSOSModalVisible] = useState(false);
  const [isReportIssueVisible, setIsReportIssueVisible] = useState(false);

  const [issueSubject, setIssueSubject] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);

  // Input field for typing message
  const [typedMessage, setTypedMessage] = useState("");

  // All messages between you & driver
  const [messages, setMessages] = useState([
    { text: "Hello! Your trip is being prepared.", sender: "other" },
  ]);

  // Chat header info (optional)
  const [chatUserName, setChatUserName] = useState("Rida Anjum");
  const [chatUserNumber, setChatUserNumber] = useState("+923118417990");
  const [chatUserImage, setChatUserImage] = useState(require("../assets/user.png"));
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isPaymentConfirmationModalVisible, setIsPaymentConfirmationModalVisible] = useState(false);
  // For auto-scrolling
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const scrollViewRef = useRef();
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState('positive'); // 'positive' or 'negative'
  const [selectedWords, setSelectedWords] = useState([]);
  const [customFeedback, setCustomFeedback] = useState('');


  // Use the actual passed parameters or fallback to defaults
  const actualPickup = pickup || {
    latitude: 31.5204,
    longitude: 74.3587,
    name: "Kotlakhpat Railway Station"
  };
  const actualDropoff = dropoff || {
    latitude: 31.5495,
    longitude: 74.3436,
    name: "Lahore"
  };

  // Steps content - using actual parameters
  const steps = {
    1: {
      title: "Preparing your trip...",
      content: {
        dropoff: actualDropoff.name || "Dropoff Location",
        pickup: actualPickup.name || "Pickup Location",
      }
    },
    2: {
      title: "Searching for drivers...",
      subtitle: "Checking availability in your area",
      content: {
        locations: [actualPickup.name || "Pickup Location"]
      }
    },
    3: {
      title: "Contacting drivers...",
      subtitle: "Finding the nearest driver",
      content: {
        locations: [actualPickup.name || "Pickup Location"]
      }
    }
  };

  useEffect(() => {
    // Fit map to markers when component mounts
    if (mapRef.current) {
      mapRef.current.fitToCoordinates([actualPickup, actualDropoff], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }

    // Generate a simple straight line route for demonstration
    setRouteCoordinates([actualPickup, actualDropoff]);

    // Start the booking process
    startBookingProcess();

    return () => {
      if (driverRequestTimer) clearTimeout(driverRequestTimer);
    };
  }, []);

  const startBookingProcess = () => {
    // Step 1: Preparing trip
    setTimeout(() => setCurrentStep(2), 2000);

    // Step 2: Search for available drivers
    setTimeout(() => {
      setCurrentStep(3);
      findAvailableDrivers();
    }, 4000);

    // Step 3: Show modal with selected driver
    setTimeout(() => {
      setModalVisible(true);
      animateModalIn();
    }, 6000);
  };

  const findAvailableDrivers = () => {
    // Filter online drivers and sort by distance
    const filteredDrivers = DUMMY_DRIVERS
      .filter(driver => driver.rideType === selectedRide && driver.isOnline && driver.status === 'available')
      .sort((a, b) => a.distance - b.distance);

    setAvailableDrivers(filteredDrivers);

    // Select the closest driver
    if (filteredDrivers.length > 0) {
      const closestDriver = filteredDrivers[0];
      setSelectedDriver(closestDriver);
      setRideStatus('driver_found');

      // Simulate sending request to driver
      sendDriverRequest(closestDriver);
    } else {
      Alert.alert("No Drivers Available", "Please try again later.");
    }
  };

  const sendDriverRequest = (driver) => {
    // Simulate driver accepting request after 3 seconds
    const timer = setTimeout(() => {
      // Update driver status to accepted
      const updatedDriver = { ...driver, status: 'accepted' };
      setSelectedDriver(updatedDriver);
      setRideStatus('driver_accepted');

      // Show driver arrival after 5 seconds
      setTimeout(() => {
        setRideStatus('driver_arrived');
      }, 5000);

      // Show pickup confirmation after 8 seconds
      setTimeout(() => {
        setRideStatus('pickup_confirmed');
      }, 8000);
    }, 3000);

    setDriverRequestTimer(timer);
  };

  const animateModalIn = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const animateModalOut = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const getRouteMidPoint = () => {
    if (routeCoordinates.length < 2) return null;
    return {
      latitude: (actualPickup.latitude + actualDropoff.latitude) / 2,
      longitude: (actualPickup.longitude + actualDropoff.longitude) / 2,
    };
  };

  const shareTrip = async () => {
    try {
      await Share.share({
        message:
          `I am on my way to ${actualPickup.name}`,
      });
    } catch (error) {
      console.log(error);
    }
  };
  const sendMessage = () => {
    if (!typedMessage.trim()) return;

    setMessages(prev => [
      ...prev,
      { text: typedMessage, sender: "me" }
    ]);

    setTypedMessage("");
  };


  const positiveWords = [
    'Polite', 'Good Routing', 'Clean Car',
    'On-Time', 'Wore mask', 'Good Behaviour'
  ];

  const negativeWords = [
    'Unclean Car', 'Rude', 'Late',
    'Bad Routing', 'No Mask', 'Reckless Driving'
  ];

  // Handlers
  const handleStarPress = (starNumber) => {
    // Toggle functionality: if clicking the same star again, reset to 0
    if (starNumber === rating) {
      setRating(0);
    } else {
      setRating(starNumber);
    }
  };

  const toggleWordSelection = (word) => {
    if (selectedWords.includes(word)) {
      // Remove word if already selected
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      // Add word if not selected
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleSubmitFeedback = () => {
    const feedbackData = {
      rating,
      feedbackType,
      selectedWords,
      customFeedback
    };

    console.log('Feedback submitted:', feedbackData);

    // Submit to API or handle the data
    // Then close modal
    setIsReviewModalVisible(false);

    // Reset states for next time
    resetFeedbackStates();
    navigation.navigate('MapPage', { phoneNumber })
  };

  const resetFeedbackStates = () => {
    setRating(0);
    setFeedbackType('positive');
    setSelectedWords([]);
    setCustomFeedback('');
  };

  const renderStep1 = () => {
    const step = steps[1];
    return (
      <View style={styles.stepContainer1}>
        <View style={styles.handleBarContainer}>
          <View style={styles.handleBar} />
        </View>

        <Text style={styles.stepTitle1}>{step.title}</Text>

        {/* Dropoff Section */}
        <View style={styles.locationCard1}>
          <View style={styles.locationRow1}>
            <Text style={styles.locationDropText1}>Dropoff: {step.content.dropoff}</Text>
          </View>

          <View style={styles.divider1} />

          {/* Pickup Section */}
          <View style={styles.sectionHeader1}>
            <Feather name="navigation" size={19} color="#000" />
            <View style={styles.locationpickRow1}>
              <Text style={styles.sectionHeaderText1}>Pickup</Text>
              <Text style={styles.locationText1}>{step.content.pickup}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderStep2 = () => {
    const step = steps[2];
    return (
      <View style={styles.stepContainer2}>
        <View style={styles.handleBarContainer}>
          <View style={styles.handleBar} />
        </View>
        <Text style={styles.stepTitle2}>{step.title}</Text>
        <Text style={styles.stepSubtitle2}>{step.subtitle}</Text>

        <View style={styles.locationCard2}>
          <View style={styles.divider2} />

          {/* Pickup Section */}
          <View style={styles.sectionHeader2}>
            <Feather name="navigation" size={19} color="#000" />
            <View style={styles.locationpickRow2}>
              <Text style={styles.sectionHeaderText2}>Pickup</Text>
              <Text style={styles.locationText2}>{step.content.locations}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderStep3 = () => {
    const step = steps[3];
    return (
      <View style={styles.stepContainer2}>
        <View style={styles.handleBarContainer}>
          <View style={styles.handleBar} />
        </View>
        <Text style={styles.stepTitle2}>{step.title}</Text>
        <Text style={styles.stepSubtitle2}>{step.subtitle}</Text>

        {/* Available Drivers List */}
        {availableDrivers.length > 0 ? (
          <ScrollView
            horizontal={false}
            showsVerticalScrollIndicator={false}
            style={styles.driversSection}
          >
            <Text style={styles.driversCountText}>
              {availableDrivers.length} drivers available near you
            </Text>
            {availableDrivers.map((driver, index) => (
              <View key={driver.id} style={[
                styles.driverRow,
                selectedDriver?.id === driver.id && styles.selectedDriverRow
              ]}>
                <Image
                  source={driver.image}
                  style={styles.verySmallImage}
                />
                <View style={{ flexDirection: 'column', marginLeft: 15 }}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <Text style={styles.driverRating}>⭐ {driver.rating}</Text>
                  <Text style={styles.driverLocation}>{driver.location} • {driver.distance} km</Text>
                  <View style={styles.driverStatusContainer}>
                    <View style={[
                      styles.statusDot,
                      driver.isOnline ? styles.onlineDot : styles.offlineDot
                    ]} />
                    <Text style={styles.driverStatus}>
                      {driver.isOnline ? 'Online' : 'Offline'} • {driver.rideType}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noDriversText}>Searching for available drivers...</Text>
        )}

        {/* Locations */}
        <View style={styles.locationCard3}>
          <View style={styles.divider3} />

          {/* Pickup Section */}
          <View style={styles.sectionHeader3}>
            <Feather name="navigation" size={19} color="#000" />
            <View style={styles.locationpickRow3}>
              <Text style={styles.sectionHeaderText3}>Pickup</Text>
              <Text style={styles.locationText3}>{step.content.locations}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderRideStatus = () => {
    switch (rideStatus) {
      case 'searching':
        return null;

      case 'driver_found':
        return (
          <View style={styles.rideStatusCard}>
            <Text style={styles.rideStatusTitle}>Driver Found!</Text>
            <Text style={styles.rideStatusText}>
              {selectedDriver?.name} is {selectedDriver?.distance} km away
            </Text>
            <Text style={styles.rideStatusSubtext}>Sending request...</Text>
          </View>
        );

      case 'driver_accepted':
        // Show Picture 1: Driver accepted and heading to destination
        return (
          <View style={styles.pickupCard}>
            {/* Status and Time - AT THE TOP */}
            <View style={styles.pickupTimeContainer}>
              <Text style={styles.pickupStatusText}>Driver is estimated to arrive in:</Text>
              <Text style={styles.pickupMinutesText}>3 minutes</Text>
            </View>

            {/* Handle Bar - BELOW the time container */}
            <View style={styles.handleBarContainer}>
              <View style={styles.handleBar} />
            </View>

            {/* Driver Info */}
            <View style={styles.pickupDriverSection}>
              <Image
                source={selectedDriver?.image}
                style={styles.pickupDriverAvatar}
              />
              <View style={styles.pickupDriverInfo}>

                <View style={styles.driverTextContainer}>
                  <Text style={styles.pickupDriverNameLarge}>{selectedDriver?.name}</Text>
                  <Text style={styles.pickupDriverRatingBadge}>⭐{selectedDriver?.rating} ({selectedDriver?.rideType})</Text>

                </View>
                <View style={styles.driverIconsContainer}>
                  <TouchableOpacity
                    onPress={() => setIsMessageModalVisible(true)}
                    style={{ padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#b8b7b7ff', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="message" size={24} color="#0254E8" style={styles.icon} /></TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Linking.openURL(`tel:${phoneNumber}`);
                    }}
                    style={{ padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#b8b7b7ff', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <MaterialIcons name="call" size={24} color="#0254E8" /></TouchableOpacity>
                </View>
              </View>


            </View>

            <View style={styles.pickupDividerLine} />

            {/* Vehicle Info */}
            <View style={styles.vehicleContainer}>
              <View>
                <Text style={styles.pickupVehiclePlate}>{selectedDriver?.vehicle}</Text>
                <Text style={styles.vehicleNumber}>{selectedDriver?.plateNumber}</Text>
              </View>
              <View style={styles.ImgContainer}>
                <Image source={require("../assets/BookedCar.png")} style={styles.Img} />
              </View>
            </View>

            <View style={styles.pickupDividerLine} />

            {/* Payment Info */}
            <View style={styles.pickupPaymentRow}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="payment" size={24} color="#0254E8" style={{ marginRight: 5 }} />
                <Text style={styles.pickupPaymentMethod}>Cash</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.pickupPaymentAmount}>${price}</Text>
                <MaterialIcons name="arrow-forward-ios" size={20} color="#666" />
              </View>
            </View>

            <View style={styles.pickupDividerLine} />

            {/* Ride Options */}
            <View style={styles.pickupOptionsRow}>
              <TouchableOpacity
                style={{ flexDirection: 'row' }}
                onPress={() => setIsRidePreferencesModalVisible(true)}
              >
                <Ionicons name="settings" size={20} color="#0254E8" style={{ marginRight: 5 }} />
                <Text style={styles.pickupOptionItem}>Ride options</Text></TouchableOpacity>
              <View style={styles.pickupOptionSeparator} />
              <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => setIsRideSafetyVisible(true)}>
                <MaterialIcons name="safety-check" size={20} color="#0254E8" style={{ marginRight: 5 }} />
                <Text style={styles.pickupOptionItem}>Ride Safety</Text></TouchableOpacity>
            </View>
          </View>
        );

      case 'driver_arrived':
        // Show Picture 2: Driver arrived at pickup location
        return (
          <View style={styles.pickupCard}>
            {/* Status and Time - AT THE TOP */}
            <View style={styles.pickupTimeContainer}>
              <Text style={styles.pickupStatusText}>Driver is waiting for you</Text>
              {/* <Text style={styles.pickupMinutesText}>12 minutes</Text> */}
            </View>

            {/* Handle Bar - BELOW the time container */}
            <View style={styles.handleBarContainer}>
              <View style={styles.handleBar} />
            </View>

            {/* Driver Info */}
            <View style={styles.pickupDriverSection}>
              <Image
                source={selectedDriver?.image}
                style={styles.pickupDriverAvatar}
              />
              <View style={styles.pickupDriverInfo}>

                <View style={styles.driverTextContainer}>
                  <Text style={styles.pickupDriverNameLarge}>{selectedDriver?.name}</Text>
                  <Text style={styles.pickupDriverRatingBadge}>⭐{selectedDriver?.rating} ({selectedDriver?.rideType})</Text>

                </View>
                <View style={styles.driverIconsContainer}>
                  <TouchableOpacity
                    onPress={() => setIsMessageModalVisible(true)}
                    style={{ padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#b8b7b7ff', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="message" size={24} color="#0254E8" style={styles.icon} /></TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Linking.openURL(`tel:${phoneNumber}`);
                    }}
                    style={{ padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#b8b7b7ff', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="call" size={24} color="#0254E8" /></TouchableOpacity>
                </View>
              </View>


            </View>

            <View style={styles.pickupDividerLine} />

            {/* Vehicle Info */}
            <View style={styles.vehicleContainer}>
              <View>
                <Text style={styles.pickupVehiclePlate}>{selectedDriver?.vehicle}</Text>
                <Text style={styles.vehicleNumber}>{selectedDriver?.plateNumber}</Text>
              </View>
              <View style={styles.ImgContainer}>
                <Image source={require("../assets/BookedCar.png")} style={styles.Img} />
              </View>
            </View>

            <View style={styles.pickupDividerLine} />

            {/* Payment Info */}
            <View style={styles.pickupPaymentRow}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="payment" size={24} color="#0254E8" style={{ marginRight: 5 }} />
                <Text style={styles.pickupPaymentMethod}>Cash</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.pickupPaymentAmount}>${price}</Text>
                <MaterialIcons name="arrow-forward-ios" size={20} color="#666" />
              </View>
            </View>

            <View style={styles.pickupDividerLine} />

            {/* Ride Options */}
            <View style={styles.pickupOptionsRow}>
              <TouchableOpacity
                style={{ flexDirection: 'row' }}
                onPress={() => setIsRidePreferencesModalVisible(true)}
              >
                <Ionicons name="settings" size={20} color="#0254E8" style={{ marginRight: 5 }} />
                <Text style={styles.pickupOptionItem}>Ride options</Text></TouchableOpacity>
              <View style={styles.pickupOptionSeparator} />
              <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => setIsRideSafetyVisible(true)}>
                <MaterialIcons name="safety-check" size={20} color="#0254E8" style={{ marginRight: 5 }} />
                <Text style={styles.pickupOptionItem}>Ride Safety</Text></TouchableOpacity>
            </View>
          </View>
        );

      case 'pickup_confirmed':
        // Show Picture 3: Pickup confirmed, estimated arrival

        return (
          <View style={styles.pickupCard}>
            {/* Status and Time - AT THE TOP */}
            <View style={styles.pickupTimeContainer}>
              <Text style={styles.pickupStatusText}>Heading to the destination</Text>
              <Text style={styles.pickupMinutesText}>12 minutes</Text>
            </View>

            {/* Handle Bar - BELOW the time container */}
            <View style={styles.handleBarContainer}>
              <View style={styles.handleBar} />
            </View>

            {/* Driver Info */}
            <View style={styles.pickupDriverSection}>
              <Image
                source={selectedDriver?.image}
                style={styles.pickupDriverAvatar}
              />
              <View style={styles.pickupDriverInfo}>

                <View style={styles.driverTextContainer}>
                  <Text style={styles.pickupDriverNameLarge}>{selectedDriver?.name}</Text>
                  <Text style={styles.pickupDriverRatingBadge}>⭐{selectedDriver?.rating} ({selectedDriver?.rideType})</Text>

                </View>
                <View style={styles.driverIconsContainer}>
                  <TouchableOpacity
                    onPress={() => setIsMessageModalVisible(true)}
                    style={{ padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#b8b7b7ff', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="message" size={24} color="#0254E8" style={styles.icon} /></TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Linking.openURL(`tel:${phoneNumber}`);
                      console.log(phoneNumber);
                    }}
                    style={{ padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#b8b7b7ff', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="call" size={24} color="#0254E8" /></TouchableOpacity>
                </View>
              </View>


            </View>

            <View style={styles.pickupDividerLine} />

            {/* Vehicle Info */}
            <View style={styles.vehicleContainer}>
              <View>
                <Text style={styles.pickupVehiclePlate}>{selectedDriver?.vehicle}</Text>
                <Text style={styles.vehicleNumber}>{selectedDriver?.plateNumber}</Text>
              </View>
              <View style={styles.ImgContainer}>
                <Image source={require("../assets/BookedCar.png")} style={styles.Img} />
              </View>
            </View>

            <View style={styles.pickupDividerLine} />

            {/* Payment Info */}
            <View style={styles.pickupPaymentRow}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="payment" size={24} color="#0254E8" style={{ marginRight: 5 }} />
                <Text style={styles.pickupPaymentMethod}>Cash</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.pickupPaymentAmount}>${price}</Text>
                <MaterialIcons name="arrow-forward-ios" size={20} color="#666" />
              </View>
            </View>

            <View style={styles.pickupDividerLine} />

            {/* Ride Options */}
            <View style={styles.pickupOptionsRow}>
              <TouchableOpacity
                style={{ flexDirection: 'row' }}
                onPress={() => setIsRidePreferencesModalVisible(true)}
              >
                <Ionicons name="settings" size={20} color="#0254E8" style={{ marginRight: 5 }} />
                <Text style={styles.pickupOptionItem}>Ride options</Text></TouchableOpacity>
              <View style={styles.pickupOptionSeparator} />
              <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => setIsRideSafetyVisible(true)}>
                <MaterialIcons name="safety-check" size={20} color="#0254E8" style={{ marginRight: 5 }} />
                <Text style={styles.pickupOptionItem}>Ride Safety</Text></TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      // case 4: return renderRideStatus(); 
      // default: return renderRideStatus();
    }
  };
  const RidePreferencesModal = () => {
    const [waitTimeDropdown, setWaitTimeDropdown] = useState(false);
    const [selectedWaitTime, setSelectedWaitTime] = useState("Select");
    const waitTimeOptions = [
      'No wait time',
      '0-5 minutes',
      '5-10 minutes',
      '10-15 minutes',
      '15-20 minutes',
      '20-25 minutes'
    ];

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isRidePreferencesModalVisible}
        onRequestClose={() => setIsRidePreferencesModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            {/* Header with handle bar */}
            <View style={styles.modalHeader}>
              <View style={styles.handleBarContainer}>
                <View style={styles.handleBar} />
              </View>
              <Text style={styles.modalTitle}>Ride options</Text>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Wait Time Section with selectable options */}
              <View style={styles.sectionContainer}>
                <View style={styles.row}>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="access-time-filled" size={20} color="#0254E8" style={{ padding: 8, backgroundColor: '#f9f7f7ff', borderWidth: 1, borderColor: 'rgba(186, 184, 186, 0.5)', borderRadius: 8, marginRight: 5 }} />
                    <Text style={styles.label}>Wait Time</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setWaitTimeDropdown(!waitTimeDropdown)}
                  >
                    <Text style={styles.dropdownText}>{selectedWaitTime}</Text>
                    <Feather name="chevron-down" size={18} color="black" />
                  </TouchableOpacity>
                </View>

                {/* Dropdown options - positioned absolutely */}
                {waitTimeDropdown && (
                  <View style={styles.dropdownContainer}>
                    {waitTimeOptions.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedWaitTime(item);
                          setWaitTimeDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Menu Items - exactly like in the image */}
              <TouchableOpacity style={styles.menuItem} onPress={() => setIsModalCouponVisible(true)}>
                <MaterialCommunityIcons name="ticket-percent" size={20} color="#0254E8" style={{ padding: 8, backgroundColor: '#f9f7f7ff', borderWidth: 1, borderColor: 'rgba(186, 184, 186, 0.5)', borderRadius: 8, marginRight: 5 }} />
                <Text style={styles.menuItemText}>Coupon code</Text>

              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => setIsModalVisible(true)}>
                <FontAwesome5 name="gift" size={20} color="#0254E8" style={{ padding: 8, backgroundColor: '#f9f7f7ff', borderWidth: 1, borderColor: 'rgba(186, 184, 186, 0.5)', borderRadius: 8, marginRight: 5 }} />
                <Text style={styles.menuItemText}>Gift card code</Text>

              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => setIsCancelRideModalVisible(true)}>
                <MaterialIcons name="cancel" size={20} color="red" style={{ padding: 8, backgroundColor: '#f9f7f7ff', borderWidth: 1, borderColor: 'rgba(186, 184, 186, 0.5)', borderRadius: 8, marginRight: 5 }} />
                <Text style={styles.menuItemText}>Cancel ride</Text>

              </TouchableOpacity>

              {/* Go back button - last item */}
              <TouchableOpacity
                style={[styles.menuItem, styles.lastMenuItem]}
                onPress={() => setIsRidePreferencesModalVisible(false)}
              >
                <Text style={styles.menuItemTextLast}>Go back to ride</Text>

              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>


    );
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color="black" />
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 31.5204,
          longitude: 74.3587,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {/* Pickup Marker */}
        <Marker coordinate={actualPickup}>
          <View style={styles.markerContainer}>
            <Image
              source={require("../assets/pin-blue.png")}
              style={styles.markerImage}
              resizeMode="contain"
            />
            <View style={styles.markerLabel}>
              <Text style={styles.markerText}>Pickup</Text>
            </View>
          </View>
        </Marker>

        {/* Dropoff Marker */}
        <Marker coordinate={actualDropoff}>
          <View style={styles.markerContainer}>
            <Image
              source={require("../assets/pin-red.png")}
              style={styles.markerImage}
              resizeMode="contain"
            />
            <View style={styles.markerLabel}>
              <Text style={styles.markerText}>Dropoff</Text>
            </View>
          </View>
        </Marker>

        {/* Driver Marker (if driver is assigned) */}
        {selectedDriver && rideStatus !== 'searching' && (
          <Marker
            coordinate={{
              latitude: selectedDriver.latitude,
              longitude: selectedDriver.longitude
            }}
          >
            <View style={styles.driverMarkerContainer}>
              <Image
                source={require('../assets/carMap.png')}
                style={styles.driverMarkerImage}
              />
              {/* <View style={styles.driverMarkerLabel}>
                <Text style={styles.driverMarkerText}>Driver</Text>
              </View> */}
            </View>
          </Marker>
        )}

        {/* Estimated Time Marker */}
        {getRouteMidPoint() && (
          <Marker coordinate={getRouteMidPoint()} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.timeMarker}>
              <Text style={styles.timeText}>{estimatedTime}</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Progress Bar */}
      {rideStatus === 'searching' && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentStep / 3) * 100}%` }
            ]}
          />
        </View>
      )}

      {/* Ride Status Overlay (when driver is found) */}
      {rideStatus !== 'searching' ? (
        <View style={styles.rideStatusOverlay1}>
          {renderRideStatus()}
        </View>
      ) : (
        /* Content Overlay (during search) */
        <View style={styles.contentOverlay}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderCurrentStep()}
          </ScrollView>
        </View>
      )}

      {/* Results Modal */}


      <RidePreferencesModal />
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlayRedeem}>
          <View style={styles.modalContainerRedeem}>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeBtnRedeem}
              onPress={() => setIsModalVisible(false)}
            >
              <Feather name="x" size={22} color="#000" />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.modalIconRedeem}>
              <Feather name="gift" size={40} color="#0254E8" />
            </View>

            {/* Title */}
            <Text style={styles.modalTitleRedeem}>Redeem gift card</Text>
            <Text style={styles.modalSubtitleRedeem}>
              Enter your gift card code to redeem it.
            </Text>

            {/* Input */}
            <TextInput
              placeholder="Enter gift card code"
              style={styles.inputRedeem}
              placeholderTextColor="#aaa"
            />

            {/* Redeem Button */}
            <TouchableOpacity style={styles.redeemButtonRedeem}>
              <Text style={styles.redeemButtonTextRedeem}>Redeem</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelTextRedeem}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
      <Modal
        visible={isModalCouponVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalCouponVisible(false)}
      >
        <View style={styles.modalOverlayRedeem}>
          <View style={styles.modalContainerRedeem}>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeBtnRedeem}
              onPress={() => setIsModalCouponVisible(false)}
            >
              <Feather name="x" size={22} color="#000" />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.modalIconRedeem}>
              <MaterialCommunityIcons name="ticket-percent" size={40} color="#0254E8" />
            </View>

            {/* Title */}
            <Text style={styles.modalTitleRedeem}>Enter coupon</Text>
            <Text style={styles.modalSubtitleRedeem}>
              Insert your coupon code to be applied to prices
            </Text>

            {/* Input */}
            <TextInput
              placeholder="Enter coupon code"
              style={styles.inputRedeem}
              placeholderTextColor="#aaa"
            />

            {/* Redeem Button */}
            <TouchableOpacity style={styles.redeemButtonRedeem}>
              <Text style={styles.redeemButtonTextRedeem}>Apply</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity onPress={() => setIsModalCouponVisible(false)}>
              <Text style={styles.cancelTextRedeem}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
      <Modal
        visible={isCancelRideModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCancelRideModalVisible(false)}
      >
        <View style={styles.cancelRideOverlay}>
          <View style={styles.cancelRideContainer}>

            {/* Close button */}
            <TouchableOpacity
              style={styles.cancelCloseButton}
              onPress={() => setIsCancelRideModalVisible(false)}
            >
              <Feather name="x" size={22} color="#000" />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.cancelIconWrapper}>
              <Entypo name="circle-with-cross" size={40} color="#E84141" />
            </View>

            {/* Title */}
            <Text style={styles.cancelTitle}>Ride Cancellation</Text>
            <Text style={styles.cancelSubtitle}>
              Select a reason for cancellation
            </Text>

            {/* Radio Options */}
            {[
              "Safety Concerns",
              "Driver didn't show up",
              "Don't need a ride anymore",
              "Need to edit my ride details",
              "Drive/vehicle info didn't match",
              "Other reasons",
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.radioOption}
                onPress={() => setSelectedCancelReason(item)}
              >
                <Text style={styles.radioLabel}>{item}</Text>
                <View style={styles.radioCircle}>
                  {selectedCancelReason === item && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                styles.confirmCancelBtn,
                { backgroundColor: selectedCancelReason ? "#E84141" : "#ccc" }
              ]}
              disabled={!selectedCancelReason}
              onPress={() => {
                setIsCancelRideModalVisible(false);
                navigation.navigate("MapPage", { phoneNumber });
              }}
            >
              <Text style={styles.confirmCancelBtnText}>Confirm & Cancel Ride</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity onPress={() => setIsCancelRideModalVisible(false)}>
              <Text style={styles.cancelRideText}>Go back to ride</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>


      <Modal
        visible={isRideSafetyVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRideSafetyVisible(false)}
      >
        <View style={styles.rideSafetyOverlay}>
          <View style={styles.rideSafetyContainer}>

            {/* Safety Icon */}
            <View style={styles.rideSafetyIconWrapper}>
              <MaterialCommunityIcons name="shield" size={45} color="#0057FF" />
            </View>

            <Text style={styles.rideSafetyTitle}>Ride Safety</Text>

            {/* Option 1 */}
            <TouchableOpacity style={styles.rideSafetyOption} onPress={shareTrip}>
              <View style={styles.rideSafetyOptionIcon}>
                <MaterialCommunityIcons name="share-variant" size={22} color="#0057FF" />
              </View>
              <View>
                <Text style={styles.rideSafetyOptionTitle}>Share trip information</Text>
                <Text style={styles.rideSafetyOptionSubtitle}>
                  You can share your trip info with a friend
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.rideSafetyDivider} />

            {/* Option 2 */}
            <TouchableOpacity style={styles.rideSafetyOption} onPress={() => setIsSOSModalVisible(true)}
            >
              <View style={styles.rideSafetyOptionIcon}>
                <MaterialCommunityIcons name="shield-alert" size={22} color="#0057FF" />
              </View>
              <View>
                <Text style={styles.rideSafetyOptionTitle}>SOS</Text>
                <Text style={styles.rideSafetyOptionSubtitle}>
                  Let authorities know of an emergency
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.rideSafetyDivider} />

            {/* Option 3 */}
            <TouchableOpacity style={styles.rideSafetyOption} onPress={() => setIsReportIssueVisible(true)}>
              <View style={styles.rideSafetyOptionIcon}>
                <MaterialCommunityIcons name="alert" size={22} color="#0057FF" />
              </View>
              <View>
                <Text style={styles.rideSafetyOptionTitle}>Report an issue</Text>
                <Text style={styles.rideSafetyOptionSubtitle}>
                  Report a safety issue during your trip
                </Text>
              </View>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.rideSafetyBackButton}
              onPress={() => setIsRideSafetyVisible(false)}
            >
              <Text style={styles.rideSafetyBackText}>Go back to ride</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>


      <Modal
        visible={isSOSModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSOSModalVisible(false)}
      >
        <View style={styles.sosEmergencyOverlay}>
          <View style={styles.sosEmergencyContainer}>

            {/* Warning Icon */}
            <View style={styles.sosWarningIconWrapper}>
              <MaterialCommunityIcons name="shield" size={45} color="#FF3B30" />
            </View>

            <Text style={styles.sosEmergencyTitle}>SOS</Text>
            <Text style={styles.sosWarningText}>
              IMPORTANT: Please use this feature only in case of emergency.
              We will contact authorities on your behalf.
            </Text>

            {/* Cancel/Back Option */}
            <TouchableOpacity
              style={styles.sosCancelOption}
              onPress={() => setIsSOSModalVisible(false)}
            >

              <Text style={styles.sosCancelTitle}>Go back to ride</Text>

            </TouchableOpacity>



            {/* Confirm SOS Option */}
            <TouchableOpacity style={styles.sosConfirmOption}
              onPress={() => setIsSOSModalVisible(false)}
            >
              <Text style={styles.sosConfirmTitle}>Confirm & Send SOS</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      <Modal
        visible={isReportIssueVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsReportIssueVisible(false)}
      >
        <View style={styles.reportIssueOverlay}>
          <View style={styles.reportIssueContainer}>

            {/* Title + Close Button */}
            <View style={styles.reportIssueHeader}>
              <Text style={styles.reportIssueTitle}>Report an issue</Text>

              <TouchableOpacity
                onPress={() => setIsReportIssueVisible(false)}
                style={styles.reportIssueCloseBtn}
              >
                <MaterialCommunityIcons name="close" size={22} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Subject Input */}
            <TextInput
              placeholder="Enter the subject of the issue"
              placeholderTextColor="#666"
              style={styles.reportIssueInput}
            />

            {/* Description Input */}
            <TextInput
              placeholder="Describe the issue in detail"
              placeholderTextColor="#666"
              style={styles.reportIssueTextArea}
              multiline
            />

            {/* Bottom Submit Button */}
            <TouchableOpacity style={styles.reportIssueSubmitBtn}
              onPress={() => setIsReportIssueVisible(false)}
            >
              <Text style={styles.reportIssueSubmitText}>Report this issue</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
      {/* Message modal */}
      <Modal
        visible={isMessageModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsMessageModalVisible(false)}
      >
        <View style={styles.chatModalContainer}>

          {/* Header */}
          <View style={styles.chatModalHeader}>
            <TouchableOpacity onPress={() => setIsMessageModalVisible(false)}>
              <MaterialIcons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.chatModalHeaderUser}>
              <Image source={chatUserImage} style={styles.chatModalAvatar} />
              <View>
                <Text style={styles.chatModalName}>{chatUserName}</Text>
                <Text style={styles.chatModalNumber}>{chatUserNumber}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                Linking.openURL(`tel:${phoneNumber}`);
              }}
            >
              <MaterialIcons name="call" size={24} color="#0254E8" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatModalMessages}
            contentContainerStyle={{ paddingBottom: 80 }}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.chatBubble,
                  msg.sender === "me"
                    ? styles.chatBubbleRight
                    : styles.chatBubbleLeft
                ]}
              >
                <Text style={styles.chatBubbleText}>{msg.text}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={styles.chatInputRow}>
            <TextInput
              placeholder="Type a message"
              style={styles.chatInput}
              placeholderTextColor="#777"
              value={typedMessage}
              onChangeText={setTypedMessage}
            />

            <TouchableOpacity style={styles.chatSendBtn} onPress={sendMessage}>
              <MaterialIcons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

        </View>
      </Modal>
      <Modal
        visible={isPaymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.paymentOverlay}>
          <View style={styles.paymentContainer}>

            {/* Header */}
            <Text style={styles.paymentTitle}>Payment</Text>

            {/* Price Breakdown */}
            <View style={styles.paymentBreakdown}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Service Fee</Text>
                <Text style={styles.paymentValue}>$51.83</Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Service Option Fee</Text>
                <Text style={styles.paymentValue}>$0.00</Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Coupon Discount</Text>
                <Text style={styles.paymentDiscount}>-$0.00</Text>
              </View>

              <View style={styles.paymentDivider} />

              <View style={styles.paymentTotalRow}>
                <Text style={styles.paymentTotalLabel}>Total</Text>
                <Text style={styles.paymentTotalValue}>$51.83</Text>
              </View>
            </View>

            {/* Payment Option */}
            <View style={styles.paymentOption}>
              <View style={styles.paymentOptionLeft}>
                <View style={styles.paymentOptionCheckbox}>
                  <MaterialCommunityIcons name="cash" size={20} color="#fff" />
                </View>
                <Text style={styles.paymentOptionText}>Cash</Text>
              </View>
            </View>


            {/* Payment Button */}
            <View style={styles.paymentButtonContainer}>
              <TouchableOpacity
                style={styles.paymentConfirmButton}
                onPress={() => setIsPaymentConfirmationModalVisible(true)}
              >
                <Text style={styles.paymentConfirmText}>Confirm & pay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isPaymentConfirmationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPaymentConfirmationModalVisible(false)}
      >
        <View style={styles.paymentConfirmOverlay}>
          <View style={styles.paymentConfirmContainer}>

            <MaterialCommunityIcons name="cash" size={50} color="#0254E8" />
            <View>
              <Text style={styles.paymentConfirmTitle}>Cash payment</Text>
            </View>
            {/* Description */}
            <Text style={styles.paymentConfirmDescription}>
              Please proceed with the cash payment to the{"\n"}
              driver. The driver will confirm the payment once{"\n"}
              received.
            </Text>

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.paymentConfirmButton}
              onPress={() => {
                navigation.navigate('MapPage', { phoneNumber })
              }}
            >
              <Text style={styles.paymentConfirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      <Modal
        visible={isCancelModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCancelModalVisible(false)}
      >
        <View style={styles.canceledOverlay}>
          <View style={styles.canceledContainer}>

            <Entypo name="cross" size={50} color="#0254E8" />
            <View>
              <Text style={styles.canceledTitle}>Canceled</Text>
            </View>
            {/* Description */}
            <Text style={styles.canceledDescription}>
              Ride was canceled by the driver. You can request a new ride.
            </Text>

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.canceledButton}
              onPress={() => {
                navigation.navigate('MapPage', { phoneNumber })
              }}
            >
              <Text style={styles.canceledButtonText}>Ok</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      <Modal
        visible={isReviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsReviewModalVisible(false)}
      >
        <View style={styles.reviewOverlay}>
          <View style={styles.reviewContainer}>

            {/* Header */}
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewTitle}>Awesome trip with Rida Anjum</Text>
            </View>

            {/* Stars Rating */}
            <View style={styles.reviewStarsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleStarPress(star)}
                  style={styles.reviewStarButton}
                >
                  <MaterialCommunityIcons
                    name={star <= rating ? "star" : "star-outline"}
                    size={40}
                    color={star <= rating ? "#FFD700" : "#E0E0E0"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Positive/Negative Toggle Buttons */}
            <View style={styles.reviewToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.reviewToggleButton,
                  feedbackType === 'positive' && styles.reviewToggleButtonActive
                ]}
                onPress={() => setFeedbackType('positive')}
              >
                <Text style={[
                  styles.reviewToggleText,
                  feedbackType === 'positive' && styles.reviewToggleTextActive
                ]}>
                  Positive Points
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.reviewToggleButton,
                  feedbackType === 'negative' && styles.reviewToggleButtonActive
                ]}
                onPress={() => setFeedbackType('negative')}
              >
                <Text style={[
                  styles.reviewToggleText,
                  feedbackType === 'negative' && styles.reviewToggleTextActive
                ]}>
                  Negative Points
                </Text>
              </TouchableOpacity>
            </View>

            {/* Feedback Words Grid */}
            <View style={styles.reviewWordsContainer}>
              {feedbackType === 'positive' ? (
                <View style={styles.reviewWordsGrid}>
                  {positiveWords.map((word) => (
                    <TouchableOpacity
                      key={word}
                      style={[
                        styles.reviewWordButton,
                        selectedWords.includes(word) && styles.reviewWordButtonSelected
                      ]}
                      onPress={() => toggleWordSelection(word)}
                    >
                      <Text style={[
                        styles.reviewWordText,
                        selectedWords.includes(word) && styles.reviewWordTextSelected
                      ]}>
                        {word}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.reviewWordsGrid}>
                  {negativeWords.map((word) => (
                    <TouchableOpacity
                      key={word}
                      style={[
                        styles.reviewWordButton,
                        selectedWords.includes(word) && styles.reviewWordButtonSelected
                      ]}
                      onPress={() => toggleWordSelection(word)}
                    >
                      <Text style={[
                        styles.reviewWordText,
                        selectedWords.includes(word) && styles.reviewWordTextSelected
                      ]}>
                        {word}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Custom Feedback Input */}
            <View style={styles.reviewInputContainer}>
              <Text style={styles.reviewInputLabel}>Share your experience with us...</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Write additional feedback here..."
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={4}
                value={customFeedback}
                onChangeText={setCustomFeedback}
              />
            </View>

            {/* Submit Button */}
            <View style={styles.reviewButtonContainer}>
              <TouchableOpacity
                style={styles.reviewSubmitButton}
                onPress={handleSubmitFeedback}
              >
                <Text style={styles.reviewSubmitText}>Submit feedback</Text>
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  ImgContainer: {
    width: 70,
    height: 40,
  },
  Img: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 5,
    marginBottom: 5,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E5E5E5',
    width: '100%',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    zIndex: 1000,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0254E8',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  rideStatusOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 30,
  },
  CarDetail: {
    paddingVertical: 10,
  },
  // Ride Status Styles
  rideStatusCard: {
    backgroundColor: '#fff',
  },
  driverInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  driverImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  driverInfo: {
    flex: 1,
  },
  driverNameLarge: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  driverRatingLarge: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  vehicleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  rideInfo: {
    marginVertical: 15,
  },
  rideStatusTitleBlue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0254E8',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  timeTextLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 10,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  locationTextSmall: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  cashText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  rideOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  rideOptionsText: {
    fontSize: 14,
    color: '#666',
  },
  rideStatusCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
  },
  rideStatusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0254E8',
    marginBottom: 5,
  },
  rideStatusText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 5,
  },
  rideStatusSubtext: {
    fontSize: 14,
    color: '#666',
  },

  // Driver List Styles
  driversCountText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  noDriversText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 30,
  },
  driverLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  driverStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: '#4CAF50',
  },
  offlineDot: {
    backgroundColor: '#FF3B30',
  },
  driverStatus: {
    fontSize: 12,
    color: '#666',
  },
  selectedDriverRow: {
    backgroundColor: '#E8F4FF',
    borderRadius: 8,
    padding: 10,
  },

  // Marker Styles
  markerContainer: {
    alignItems: 'center',
  },
  driverMarkerContainer: {
    alignItems: 'center',
  },
  driverMarkerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  driverMarkerLabel: {
    backgroundColor: '#0254E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  driverMarkerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  markerImage: {
    width: 30,
    height: 30,
  },
  markerLabel: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
  },
  timeMarker: {
    // backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0254E8',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
  },
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSection5: {
    marginBottom: 20,
    flexDirection: 'row',
    marginRight: 15,

  },
  modalSection6: {
    marginBottom: 20,
    flexDirection: 'row',
    marginRight: 15,

  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  stepContainer4: {
    flex: 1,
  },

  stepTitle4: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  stepSubtitle4: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,

  },
  locationCard4: {

    // backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#dfddddff',

    borderRadius: 12,
    padding: 16,

  },
  locationRow4: {

    flexDirection: 'column',
    textAlign: 'center',
    // alignItems: 'center',
    marginBottom: 12,
  },
  locationText4: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
  },
  locationType4: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
    fontWeight: '500',
  },
  divider4: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
  sectionHeader4: {
    marginBottom: 12,
  },
  sectionHeaderText4: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  bookingsSection4: {
    marginTop: 10,
  },
  sectionTitle4: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  bookingsGrid4: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bookingsList4: {
    flexDirection: 'column',
  },
  bookingItem4: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    width: '50%',
  },
  bullet4: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    marginRight: 8,
    width: 10,
  },
  bookingText4: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  driversSection4: {
    marginBottom: 10,
  },
  driverRow4: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverName4: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  driverRating4: {
    fontSize: 14,
    color: '#666',
  },
  driverContactCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  driverContactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverContactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  driverContactBadge: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  priceDetails: {
    // backgroundColor: '#f8f8f8',
    borderRadius: 8,
    // padding: 12,
  },
  priceDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  stepContainer1: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  stepTitle1: {
    fontSize: 27,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
    padding: 10,
  },
  locationCard1: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  locationRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationpickRow1: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  locationText1: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  locationDropText1: {
    fontSize: 16,
    color: '#666',
  },
  divider1: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
  sectionHeader1: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderText1: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: '600',
    color: '#666',
  },

  // Step 2 & 3 styles
  stepContainer2: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  stepTitle2: {
    fontSize: 27,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
    padding: 10,
  },
  stepSubtitle2: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    marginLeft: 10,
  },
  locationCard2: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  locationpickRow2: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  locationText2: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  divider2: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
  sectionHeader2: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderText2: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: '600',
    color: '#666',
  },

  locationCard3: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginBottom: 50,
  },
  locationpickRow3: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  locationText3: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  divider3: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
  sectionHeader3: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderText3: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: '600',
    color: '#666',
  },

  // Driver row styles
  driversSection: {
    marginBottom: 10,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  driverRating: {
    fontSize: 14,
    color: '#666',
  },
  verySmallImage: {
    borderRadius: 30,
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
  },
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSection5: {
    marginBottom: 20,
    flexDirection: 'row',
    marginRight: 15,
  },
  modalSection6: {
    marginBottom: 20,
    flexDirection: 'row',
    marginRight: 15,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  locationCard4: {
    borderTopWidth: 1,
    borderTopColor: '#dfddddff',
    borderRadius: 12,
    padding: 16,
  },
  locationRow4: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  locationText4: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
  },
  locationType4: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
    fontWeight: '500',
  },
  divider4: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
  sectionTitle4: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  priceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  priceDetails: {
    borderRadius: 8,
  },
  priceDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sectionTitle7: {
    fontSize: 23,
    fontWeight: '600',
    color: '#000',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  spacer: {
    height: 12,
  },
  rideStatusOverlay1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,

  },
  pickupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    // paddingHorizontal: 20,
    paddingTop: 0, // Changed to 0 since header is at top
    // paddingBottom: 20,
    // marginHorizontal: 16,
    marginBottom: 20,
    paddingBottom: 40,
    // elevation: 5,
    overflow: 'hidden', // Ensures the black header corners stay rounded
  },

  pickupTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: 10, // Space before handle bar
  },

  handleBarContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },

  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
  },

  pickupStatusText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },

  pickupMinutesText: {
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#0254E8',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    color: '#fff',
  },

  pickupDriverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20, // Remove horizontal padding since card has it
  },

  pickupDriverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },

  pickupDriverInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  driverTextContainer: {
    flexDirection: 'column',
  },

  pickupDriverNameLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },

  pickupDriverRatingBadge: {
    fontSize: 14,
    color: '#666',
  },

  driverIconsContainer: {
    flexDirection: 'row',
    gap: 16,
  },

  icon: {
    marginRight: 4,
  },

  pickupDividerLine: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 16,
  },

  vehicleContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },

  pickupVehiclePlate: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },

  vehicleNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  pickupPaymentRow: {
    borderRadius: 10,
    marginLeft: 20,
    marginRight: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  pickupPaymentMethod: {
    fontSize: 16,
    color: '#0254E8',
    fontWeight: '500',
  },

  pickupPaymentAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0254E8',
    marginRight: 5,
  },

  pickupOptionsRow: {

    //  backgroundColor:'red',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    // paddingVertical: 30,

  },

  pickupOptionItem: {
    // marginBottom:30,
    fontSize: 14,
    color: '#0254E8',
    fontWeight: '500',
  },

  pickupOptionSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E5E5',
  },
  // Add these styles to your StyleSheet:
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    paddingTop: 10,
    paddingBottom: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 5,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionContainer: {
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 10,
    marginTop: 5,
    paddingLeft: 5,
  },
  waitTimeList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  waitTimeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  lastWaitTimeItem: {

    borderBottomWidth: 0,
  },
  waitTimeText: {
    fontSize: 16,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  lastMenuItem: {
    paddingHorizontal: 3,
    marginTop: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#E5E5E5',

  },
  menuItemTextLast: {
    fontSize: 16,
    color: '#0254E8',
    fontWeight: '600',
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },

  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: "space-between",
  },
  sectionContainer: {
    marginBottom: 5,
    minHeight: 40, // Add a minimum height to prevent layout shift
    zIndex: 1000,
  },
  dropdownContainer: {
    position: 'absolute', // Changed from relative to absolute
    top: 40, // Position below the dropdown button
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 5,
    width: "45%",
    elevation: 10, // Increased elevation
    zIndex: 1001, // Higher zIndex
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    paddingVertical: 10, // Increased padding for better touch area
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#000",
  },
  // Add a last item style
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  modalOverlayRedeem: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.29)',
    justifyContent: 'flex-end',
  },

  modalContainerRedeem: {
    backgroundColor: '#fff',
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },

  closeBtnRedeem: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },

  modalIconRedeem: {
    backgroundColor: '#E7EEFF',
    padding: 18,
    borderRadius: 50,
    marginTop: 20,
  },

  modalTitleRedeem: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  modalSubtitleRedeem: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },

  inputRedeem: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#F6F8FA',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    fontSize: 14,
    color: '#000',
  },

  redeemButtonRedeem: {
    width: '100%',
    backgroundColor: '#4D80FF',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',

  },

  redeemButtonTextRedeem: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',

  },

  cancelTextRedeem: {
    marginTop: 20,
    fontSize: 15,
    color: '#e80202ff',
    fontWeight: '600',
    marginBottom: 20,
  },
  cancelRideOverlay: {
    flex: 1,
    // backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  cancelRideContainer: {
    height: '80%',
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: "center",
    // elevation: 6,
  },

  cancelCloseButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#eee",
    padding: 6,
    borderRadius: 20,
  },

  cancelIconWrapper: {
    width: 65,
    height: 65,
    borderRadius: 40,
    backgroundColor: "#FFE5E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  cancelTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 7,
  },

  cancelSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },

  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    width: "100%",
    paddingVertical: 10,
  },

  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E84141",
    justifyContent: "center",
    alignItems: "center",
    // marginRight: 10,
  },

  radioDot: {
    width: 10,
    height: 10,
    backgroundColor: "#E84141",
    borderRadius: 5,
  },

  radioLabel: {
    fontSize: 14,
    color: "#333",
  },

  confirmCancelBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },

  confirmCancelBtnText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  cancelRideText: {
    marginTop: 15,
    fontSize: 15,
    color: "#000",
    marginBottom: 40,
  },
  rideSafetyOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },

  rideSafetyContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 25,
    paddingHorizontal: 22,
    alignItems: "center",
  },

  rideSafetyIconWrapper: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: "#E4EDFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  rideSafetyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 25,
  },

  rideSafetyOption: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  rideSafetyOptionIcon: {
    width: 42,
    height: 42,
    backgroundColor: "#F0F4FF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  rideSafetyOptionTitle: {
    fontSize: 15,
    color: "#000",
    fontWeight: "600",
  },

  rideSafetyOptionSubtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },

  rideSafetyDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#e6e6e6",
  },

  rideSafetyBackButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D3D3D3",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 30,
  },

  rideSafetyBackText: {
    fontSize: 16,
    textAlign: "center",
    color: "#0057FF",
    fontWeight: "600",
  },
  sosEmergencyOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  sosEmergencyContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 25,
    paddingHorizontal: 22,
    alignItems: "center",
  },

  sosWarningIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFE5E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  sosEmergencyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 14,
    textAlign: "center",
  },

  sosWarningText: {
    fontSize: 14,
    color: "#555",
    textAlign: 'justify',
    marginBottom: 30,
    lineHeight: 20,
    paddingHorizontal: 10,
  },

  sosCancelOption: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F0F4FF',
    borderRadius: 10,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
  },

  sosCancelIcon: {
    width: 44,
    height: 44,
    backgroundColor: "#F0F4FF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  sosCancelTitle: {
    fontSize: 14,
    color: "#0057FF",
    fontWeight: "600",
  },

  sosCancelSubtitle: {
    fontSize: 1,
    color: "#777",
    marginTop: 2,
  },

  sosDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#e6e6e6",
  },

  sosConfirmOption: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 25,
    // borderWidth:1,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    marginLeft: 10,
    marginRight: 10,
  },

  sosConfirmIcon: {
    width: 44,
    height: 44,
    backgroundColor: "#FFE5E5",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  sosConfirmTitle: {

    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
  },

  sosConfirmSubtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  reportIssueOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  reportIssueContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 20,
    minHeight: "70%",
  },

  /* Header */
  reportIssueHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  reportIssueTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  reportIssueCloseBtn: {
    position: "absolute",
    right: 0,
    padding: 6,
  },

  /* Inputs */
  reportIssueInput: {
    backgroundColor: "#e7e8eb97",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: "#000",
    marginBottom: 15,
  },

  reportIssueTextArea: {
    backgroundColor: "#e7e8eb97",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    height: 120,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#000",
    marginBottom: 30,
  },

  /* Submit Button */
  reportIssueSubmitBtn: {
    backgroundColor: "#fd0602ff",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 20,
  },

  reportIssueSubmitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  chatModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },

  chatModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  chatModalHeaderUser: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    flex: 1,
  },

  chatModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 50,
    marginRight: 12,
  },

  chatModalName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },

  chatModalNumber: {
    fontSize: 12,
    color: "#666",
  },

  chatModalMessages: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 10,
  },

  chatBubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginVertical: 5,
  },

  chatBubbleLeft: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA",
    borderTopLeftRadius: 0,
  },

  chatBubbleRight: {
    alignSelf: "flex-end",
    backgroundColor: "#0254E8",
    borderTopRightRadius: 0,
  },

  chatBubbleText: {
    color: "#fff",
    fontSize: 14,
  },

  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  chatInput: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
  },

  chatSendBtn: {
    width: 42,
    height: 42,
    backgroundColor: "#0254E8",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  paymentOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  paymentContainer: {
    height: '90%',
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 25,
    paddingHorizontal: 22,
  },

  paymentTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 25,
    textAlign: "center",
  },

  paymentBreakdown: {
    width: "100%",
    marginBottom: 25,
  },

  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  paymentLabel: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },

  paymentValue: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },

  paymentDiscount: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  paymentDivider: {
    height: 1,
    backgroundColor: "#e6e6e6",
    marginVertical: 15,
  },

  paymentTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  paymentTotalLabel: {
    fontSize: 18,
    color: "#000",
    fontWeight: "600",
  },

  paymentTotalValue: {
    fontSize: 27,
    color: "#0057FF",
    fontWeight: "800",
  },

  paymentOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 15,
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    marginBottom: 15,
  },

  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  paymentOptionCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: "#0057FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    // padding:15,
  },

  paymentOptionCheckmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  paymentOptionText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },

  paymentMethodText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 25,
  },
  paymentButtonContainer: {
    paddingVertical: 15,
    paddingHorizontal: 22,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    // Add safe area for iOS
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
  },
  paymentConfirmButton: {
    width: "100%",
    marginTop: 50,
    backgroundColor: "#0057FF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },

  paymentConfirmText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },

  paymentConfirmOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  paymentConfirmContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
  },

  paymentConfirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 25,
    textAlign: "center",
  },

  paymentConfirmDescription: {
    fontSize: 14,
    color: "#555",
    textAlign: "justify",
    marginBottom: 40,
    lineHeight: 24,
    letterSpacing: 0.3,
  },

  paymentConfirmButton: {
    width: "100%",
    backgroundColor: "#0057FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 30,
  },

  paymentConfirmButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
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
  reviewOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  reviewContainer: {
    width: "100%",
    height: "95%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    justifyContent: "space-between",
  },

  reviewHeader: {
    paddingTop: 30,
    alignItems: "center",
    marginBottom: 20,
  },

  reviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    lineHeight: 24,
  },

  reviewStarsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },

  reviewStarButton: {
    padding: 5,
    marginHorizontal: 5,
  },

  reviewToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    paddingHorizontal: 10,
  },

  reviewToggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 1,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
    // marginHorizontal: 5,
    alignItems: "center",
  },

  reviewToggleButtonActive: {
    borderColor: "#0057FF",
    backgroundColor: "#E8EEFF",
  },

  reviewToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  reviewToggleTextActive: {
    color: "#0057FF",
  },

  reviewWordsContainer: {
    flex: 1,
    marginBottom: 20,
  },

  reviewWordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },

  reviewWordButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
  },

  reviewWordButtonSelected: {
    borderColor: "#FFD700",
    backgroundColor: "#FFF9E6",
  },

  reviewWordText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },

  reviewWordTextSelected: {
    color: "#D4A017",
    fontWeight: "600",
  },

  reviewInputContainer: {
    marginBottom: 20,
  },

  reviewInputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    paddingLeft: 5,
  },

  reviewInput: {
    width: "100%",
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#F8F8F8",
    textAlignVertical: "top",
  },

  reviewButtonContainer: {
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingTop: 10,
  },

  reviewSubmitButton: {
    width: "100%",
    backgroundColor: "#0057FF",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  reviewSubmitText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
});

export default ConfirmLaterScreen;






