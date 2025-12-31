import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { GOOGLE_MAPS_API_KEY, MAP_CONFIG } from '../config/map';
import axios from 'axios';
import { createAdvancedBooking } from '../services/apiService';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
const { width, height } = Dimensions.get('window');
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
const RouteLaterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;
  const { pickup, dropoff, scheduledTime, selectedDate, selectedTime } = route.params;
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [selectedRide, setSelectedRide] = useState('Regular4');
  const [estimatedTime, setEstimatedTime] = useState('15 min');
  const [estimatedDistance, setEstimatedDistance] = useState('0 km');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Select payment method');
  const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [waitTime, setWaitTime] = useState(null);
  const [luggage, setLuggage] = useState(false);
  const [pet, setPet] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [isModalGiftCardVisible, setIsModalGiftCardVisible] = useState(false);
  const [waitTimeDropdownVisible, setWaitTimeDropdownVisible] = useState(false);
  const [pickupScreenPosition, setPickupScreenPosition] = useState(null);
  const [dropoffScreenPosition, setDropoffScreenPosition] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState(MAP_CONFIG.region);
  const [userLocation, setUserLocation] = useState(null);
  const waitTimeOptions = [
    "No wait time",
    "0-5 minutes",
    "5-10 minutes",
    "10-15 minutes",
    "15-20 minutes",
    "20-25 minutes",
    "25-30 minutes"
  ];

  const mapRef = useRef(null);

  // Ride prices based on type (per km)
  const rideRates = {
    Regular4: { base: 40, perKm: 15, multiplier: 1 },
    Regular6: { base: 70, perKm: 25, multiplier: 1.8 },
    Regular8: { base: 90, perKm: 35, multiplier: 2.5 },
    Wheelchair: { base: 100, perKm: 45, multiplier: 3.5 },
  };

  const [prices, setPrices] = useState({
    Regular4: '55.16',
    Regular6: '106.92',
    Regular8: '137.90',
    Wheelchair: '169.90',
  });
  useEffect(() => {
    if (pickup && dropoff) {
      calculateRoute();
    }
  }, [pickup, dropoff]);

  useEffect(() => {
    if (mapReady && pickup && dropoff) {
      updateMarkerPositions();
    }
  }, [mapReady, region, pickup, dropoff]);

  const calculateRoute = async () => {
    try {
      const origin = `${pickup.latitude},${pickup.longitude}`;
      const destination = `${dropoff.latitude},${dropoff.longitude}`;

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.data.routes.length > 0) {
        const points = response.data.routes[0].overview_polyline.points;
        const coordinates = decodePolyline(points);
        setRouteCoordinates(coordinates);

        // Calculate estimated time and distance
        const leg = response.data.routes[0].legs[0];
        setEstimatedTime(leg.duration.text);
        setEstimatedDistance(leg.distance.text);
        calculatePrices(leg.distance.value);

        // Fit map after a short delay
        setTimeout(() => {
          fitMapToMarkers();
        }, 300);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      setRouteCoordinates([pickup, dropoff]);
      setTimeout(() => {
        fitMapToMarkers();
      }, 300);
    }
  };

  const formatDateTimeDisplay = () => {
    if (!scheduledTime) return null;

    try {
      const date = new Date(scheduledTime);
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      return `${formattedDate} at ${formattedTime}`;
    } catch (error) {
      if (selectedDate && selectedTime) {
        return `${selectedDate} at ${selectedTime}`;
      }
      return null;
    }
  };

  const decodePolyline = (t) => {
    let points = [];
    let index = 0, len = t.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }
    return points;
  };

  const calculatePrices = (distanceMeters) => {
    const distanceKm = distanceMeters / 1000;

    const newPrices = {};
    Object.keys(rideRates).forEach(rideType => {
      const rate = rideRates[rideType];
      const price = rate.base + (distanceKm * rate.perKm);
      newPrices[rideType] = price.toFixed(2);
    });

    setPrices(newPrices);
  };

  const fitMapToMarkers = () => {
    if (pickup && dropoff && mapRef.current) {
      mapRef.current.fitToCoordinates([pickup, dropoff], {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  };

  const updateMarkerPositions = () => {
    if (mapRef.current && pickup && dropoff) {
      mapRef.current.pointForCoordinate(pickup).then(point => {
        setPickupScreenPosition({
          x: point.x,
          y: point.y - 60,
        });
      }).catch(error => {
        console.error('Error getting pickup position:', error);
      });

      mapRef.current.pointForCoordinate(dropoff).then(point => {
        setDropoffScreenPosition({
          x: point.x,
          y: point.y - 60,
        });
      }).catch(error => {
        console.error('Error getting dropoff position:', error);
      });
    }
  };

  const handleBookNow = () => {
    if (!selectedPaymentMethod || selectedPaymentMethod === 'Select payment method') {
      Alert.alert('Payment Method Required', 'Please select a payment method before booking.');
      return;
    }

    Alert.alert(
      'Confirm Ride',
      `Book ${selectedRide} ride for â‚¬${prices[selectedRide]}?\n\nScheduled for: ${formatDateTimeDisplay()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const bookingData = {
                phoneNumber: phoneNumber,
                pickup: pickup,
                dropoff: dropoff,
                rideType: selectedRide,
                price: parseFloat(prices[selectedRide]),
                distance: estimatedDistance,
                duration: estimatedTime,
                paymentMethod: selectedPaymentMethod,
                scheduledTime: scheduledTime,
                preferences: {
                  waitTime: waitTime,
                  luggage: luggage,
                  pet: pet,
                  couponCode: couponCode,
                  giftCardCode: giftCardCode
                },
                // Add legacy fields if needed by backend, though model uses scheduledTime
                selectedDate: selectedDate,
                selectedTime: selectedTime
              };

              console.log('ðŸ“¤ Submitting advanced booking...', bookingData);
              const response = await createAdvancedBooking(bookingData);

              if (response.success) {
                Alert.alert(
                  'Booking Confirmed!',
                  `Your ${selectedRide} ride has been pre-booked successfully!`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        navigation.navigate('MapPage', {
                          pickup: pickup,
                          dropoff: dropoff,
                          selectedRide: selectedRide,
                          phoneNumber: phoneNumber,
                          price: prices[selectedRide],
                          estimatedTime: estimatedTime,
                          estimatedDistance: estimatedDistance,
                          scheduledTime: scheduledTime,
                          selectedDate: selectedDate,
                          selectedTime: selectedTime,
                          bookingId: response.bookingId
                        })
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Booking Error', response.message || 'Failed to book ride');
              }
            } catch (error) {
              console.error('âŒ Advanced Booking failed:', error);
              Alert.alert(
                'Connection Error',
                'Failed to connect to server. Please ensure:\nâ€¢ Backend is running\nâ€¢ Internet connection is stable'
              );
            }
          }
        }
      ]
    );
  };
  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentModalVisible(false);
  };

  const getRouteMidPoint = () => {
    if (routeCoordinates.length === 0) return null;
    const midIndex = Math.floor(routeCoordinates.length / 2);
    return routeCoordinates[midIndex];
  };

  const handleMapReady = () => {
    setMapReady(true);
    fitMapToMarkers();
  };

  const handleRegionChangeComplete = (region) => {
    setRegion(region);
  };

  const calculateLabelOpacity = (yPosition) => {
    const ridePanelTop = height * 0.4;
    const fadeStart = ridePanelTop - 100;

    if (yPosition < fadeStart) return 1;
    if (yPosition > ridePanelTop) return 0;

    return 1 - ((yPosition - fadeStart) / (ridePanelTop - fadeStart));
  };

  const rideOptions = [
    {
      id: 'Regular4',
      title: 'Regular - 4 Seater',
      subtitle: 'in 13 min . 4 ',
      price: prices.Regular4,
      source: require("../assets/BookedCar2.png"),
    },
    {
      id: 'Regular6',
      title: 'Regular - 6 Seater',
      subtitle: 'in 13 min . 6 ',
      price: prices.Regular6,
      source: require("../assets/BookedCar2.png"),
    },
    {
      id: 'Regular8',
      title: 'Regular - 8 Seater',
      subtitle: 'in 13 min . 8 ',
      price: prices.Regular8,
      source: require("../assets/BookedCar2.png"),
    },
    {
      id: 'Wheelchair',
      title: 'Wheelchair',
      subtitle: 'in 13 min . 8 ',
      price: prices.Wheelchair,
      source: require("../assets/BookedCar2.png"),
    },
  ];

  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Stripe',
      icon: 'credit-card',
      color: '#635BFF'
    },
    {
      id: 'wallet',
      name: 'Wallet Credit',
      subtitle: 'Insufficient wallet credit',
      icon: 'wallet',
      color: '#FF6B35'
    },
    {
      id: 'cash',
      name: 'Cash',
      icon: 'dollar-sign',
      color: '#00C851'
    },
  ];
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to use this feature');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      // Optional: center map immediately
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Unable to get your current location');
    }
  };

  // Then update your centerOnUserLocation function
  const centerOnUserLocation = async () => {
    if (!userLocation) {
      await getUserLocation();
    } else {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('TaxiLater', { phoneNumber })} style={styles.backButton}>
          <Entypo name="cross" size={22} color="black" />
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={MAP_CONFIG.region}
        onMapReady={handleMapReady}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {pickup && (
          <Marker coordinate={pickup}>
            <View style={{ width: 30, height: 30 }}>
              <Image
                source={require("../assets/pin-blue.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </View>
          </Marker>
        )}

        {dropoff && (
          <Marker coordinate={dropoff}>
            <View style={{ width: 30, height: 30 }}>
              <Image
                source={require("../assets/pin-red.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </View>
          </Marker>
        )}

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#000"
            strokeWidth={4}
          />
        )}

        {routeCoordinates.length > 0 && (
          <Marker
            coordinate={getRouteMidPoint()}
            anchor={{ x: 0.5, y: 1.5 }}
          >
            <View style={styles.timeLabel}>
              <Text style={styles.timeLabelText}>
                {estimatedTime}
              </Text>
            </View>
          </Marker>
        )}
      </MapView>
      <TouchableOpacity
        style={styles.floatingLocationButton}
        onPress={centerOnUserLocation}
      >
        <Feather name="navigation" size={22} color="#6E6E6E" />
      </TouchableOpacity>
      {/* Location Labels */}
      {pickupScreenPosition && (
        <View
          style={[
            styles.locationLabelContainer,
            styles.pickupLabelContainer,
            {
              left: pickupScreenPosition.x - 75,
              top: pickupScreenPosition.y,

              zIndex: pickupScreenPosition.y > height * 0.4 ? 0 : 999,
            }
          ]}
        >
          <View style={[styles.locationLabel, styles.pickupLabel]}>
            <MaterialIcons
              name="arrow-back-ios"
              style={{ borderRightWidth: 1, borderRightColor: '#777' }}
              size={22}
              color="black"
              onPress={() => navigation.navigate('TaxiLater')}
            />
            <Text
              style={styles.locationLabelText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {pickup.name || 'Pickup Location'}
            </Text>
          </View>
        </View>
      )}

      {dropoffScreenPosition && (
        <View
          style={[
            styles.locationLabelContainer,
            styles.dropoffLabelContainer,
            {
              left: dropoffScreenPosition.x - 75,
              top: dropoffScreenPosition.y,

              zIndex: dropoffScreenPosition.y > height * 0.4 ? 0 : 999,
            }
          ]}
        >
          <View style={[styles.locationLabel, styles.dropoffLabel]}>
            <MaterialIcons
              name="arrow-back-ios"
              style={{ borderRightWidth: 1, borderRightColor: '#777' }}
              size={22}
              color="black"
              onPress={() => navigation.navigate('TaxiLater')}
            />
            <Text
              style={styles.locationLabelText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {dropoff.name || 'Dropoff Location'}
            </Text>
          </View>
        </View>
      )}

      {/* Ride Options Panel */}
      <View style={styles.rideOptionsContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.rideOptionsScroll}
          horizontal={false}
        >
          {rideOptions.map((ride) => (
            <TouchableOpacity
              key={ride.id}
              style={[
                styles.rideOption,
                selectedRide === ride.id && styles.rideOptionSelected
              ]}
              onPress={() => setSelectedRide(ride.id)}
            >
              <View style={styles.rideOptionContent}>
                <Image source={ride.source} style={styles.Img} />
                <View style={styles.rideInfo}>
                  <Text style={[
                    styles.rideTitle,
                    selectedRide === ride.id && styles.rideTitleSelected
                  ]}>
                    {ride.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[
                      styles.rideSubtitle,
                      selectedRide === ride.id && styles.rideSubtitleSelected
                    ]}>
                      {ride.subtitle}
                    </Text>
                    <Ionicons name="person" size={12} color="#c2c2c2f1" />
                  </View>
                </View>
                <Text style={[
                  styles.ridePrice,
                  selectedRide === ride.id && styles.ridePriceSelected
                ]}>
                  €{ride.price}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <View style={styles.sectionDivider} />
          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => setPaymentModalVisible(true)}
          >
            <View style={{ flexDirection: 'row' }}>
              <FontAwesome name="credit-card" size={20} color="#0254E8" style={{ marginRight: 10 }} />
              <Text style={styles.paymentText}>{selectedPaymentMethod}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Ride Preferences */}
        <View style={styles.preferencesSection}>
          <TouchableOpacity
            style={styles.preferenceOption}
            onPress={() => setPreferencesModalVisible(true)}
          >
            <Text style={styles.preferenceText}>Ride Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.preferenceOption}
            onPress={() => setCouponModalVisible(true)}
          >
            <Text style={styles.preferenceText}>Coupon code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.preferenceOption}
            onPress={() => setIsModalGiftCardVisible(true)}
          >
            <Text style={styles.preferenceText}>Gift Card code</Text>
          </TouchableOpacity>
        </View>

        {/* Scheduled Time */}
        {scheduledTime && (
          <View style={styles.scheduledTimeContainer}>
            <View style={styles.scheduledTimeHeader}>
              <Feather name="clock" size={18} color="#0254E8" />
              <Text style={styles.scheduledTimeTitle}>Scheduled Pickup</Text>
            </View>
            <Text style={styles.scheduledTimeText}>
              {formatDateTimeDisplay()}
            </Text>
            <TouchableOpacity
              style={styles.changeTimeButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.changeTimeText}>Change time</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Book Now Button */}
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookNow}
        >
          <Text style={styles.bookButtonText}>Pre-Book now</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Method Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select payment method</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Feather name="x" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.paymentMethodsList}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={styles.paymentMethodItem}
                  onPress={() => handlePaymentMethodSelect(method.name)}
                >
                  <View style={styles.paymentMethodLeft}>
                    <View style={[styles.paymentIcon, { backgroundColor: method.color }]}>
                      <FontAwesome5 name={method.icon} size={20} color="white" />
                    </View>
                    <View style={styles.paymentMethodInfo}>
                      <Text style={styles.paymentMethodName}>{method.name}</Text>
                      {method.subtitle && (
                        <Text style={styles.paymentMethodSubtitle}>{method.subtitle}</Text>
                      )}
                    </View>
                  </View>
                  {selectedPaymentMethod === method.name && (
                    <Feather name="check" size={20} color="#0254E8" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Gift Card Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalGiftCardVisible}
        onRequestClose={() => setIsModalGiftCardVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Gift Card</Text>
              <TouchableOpacity onPress={() => setIsModalGiftCardVisible(false)}>
                <Feather name="x" size={22} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 15,
                }}
                placeholder="Enter gift card code"
                value={giftCardCode}
                onChangeText={setGiftCardCode}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: '#0254E8',
                  padding: 15,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={() => setIsModalGiftCardVisible(false)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Preferences Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={preferencesModalVisible}
        onRequestClose={() => setPreferencesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ride Preferences</Text>
              <TouchableOpacity onPress={() => setPreferencesModalVisible(false)}>
                <Feather name="x" size={22} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 20 }}>

              {/* WAIT TIME */}
              <View>
                <TouchableOpacity
                  style={styles.prefRow}
                  onPress={() => setWaitTimeDropdownVisible(!waitTimeDropdownVisible)}
                >
                  <Text style={styles.prefLabel}>Wait time</Text>
                  <Text style={styles.prefSelect}>{waitTime ? waitTime : "Select"}</Text>
                </TouchableOpacity>

                {waitTimeDropdownVisible && (
                  <View style={styles.dropdownBox}>
                    {waitTimeOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setWaitTime(option);
                          setWaitTimeDropdownVisible(false);
                        }}
                      >
                        <Text style={styles.dropdownText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.prefDivider} />

              {/* LUGGAGE */}
              <TouchableOpacity
                style={styles.prefRow}
                onPress={() => setLuggage(!luggage)}
              >
                <Text style={styles.prefLabel}>Luggage</Text>
                <Feather
                  name={luggage ? "check-square" : "square"}
                  size={22}
                  color="#0254E8"
                />
              </TouchableOpacity>

              <View style={styles.prefDivider} />

              {/* PET */}
              <TouchableOpacity
                style={styles.prefRow}
                onPress={() => setPet(!pet)}
              >
                <Text style={styles.prefLabel}>Pet</Text>
                <Feather
                  name={pet ? "check-square" : "square"}
                  size={22}
                  color="#0254E8"
                />
              </TouchableOpacity>

            </View>

            <TouchableOpacity
              style={styles.prefApplyButton}
              onPress={() => setPreferencesModalVisible(false)}
            >
              <Text style={styles.prefApplyText}>Apply</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* Coupon Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={couponModalVisible}
        onRequestClose={() => setCouponModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter coupon</Text>
              <TouchableOpacity onPress={() => setCouponModalVisible(false)}>
                <Feather name="x" size={22} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={{
              textAlign: 'center',
              marginBottom: 15,
              color: '#888'
            }}>
              Insert your coupon code to be applied to prices
            </Text>

            <View style={styles.couponInputBox}>
              <FontAwesome5 name="ticket-alt" size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Enter coupon code"
                value={couponCode}
                onChangeText={setCouponCode}
                style={{ flex: 1 }}
              />
            </View>

            <TouchableOpacity
              style={styles.couponApplyButton}
              onPress={() => setCouponModalVisible(false)}
            >
              <Text style={styles.couponApplyText}>Apply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCouponModalVisible(false)}
            >
              <Text style={{
                textAlign: 'center',
                color: 'red',
                marginTop: 10,
                fontWeight: '500'
              }}>
                Cancel
              </Text>
            </TouchableOpacity>

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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 5,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  backButton: {
    marginTop: 10,
    padding: 4,
    borderRadius: 5,
    marginRight: 15,
  },
  map: {
    flex: 1,
  },

  // Location Labels Container
  locationLabelContainer: {
    position: 'absolute',
    zIndex: 999,
    alignItems: 'center',
  },

  // Pickup Label styling
  pickupLabelContainer: {
    alignItems: 'center',
    marginTop: 40,
  },

  // Dropoff Label styling
  dropoffLabelContainer: {
    alignItems: 'center',
    marginTop: 40,
  },

  locationLabel: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 150,
    maxWidth: 200,
  },

  pickupLabel: {
    borderColor: '#0254E8',
    backgroundColor: 'white',
  },

  dropoffLabel: {
    borderColor: '#FF0000',
    backgroundColor: 'white',
  },

  locationLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginLeft: 5,
  },

  rideOptionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '65%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // elevation: 10,
    zIndex: 999,
    elevation: 999,
  },
  rideOptionsScroll: {
    marginBottom: 20,
  },
  rideOption: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 229, 0.59)',
    marginBottom: 6,
  },
  rideOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rideInfo: {
    flexDirection: 'column',
    flex: 1,
    marginLeft: 10,
  },
  Img: {
    width: 50,
    height: 38,
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  rideSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  ridePrice: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0254E8',
  },
  rideOptionSelected: {
    borderColor: '#0254E8',
    backgroundColor: '#f0f7ff',
  },
  rideTitleSelected: {
    color: '#0254E8',
  },
  rideSubtitleSelected: {
    color: '#0254E8',
  },
  ridePriceSelected: {
    color: '#0254E8',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginBottom: 10,
  },
  paymentSection: {
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 5,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 12,
  },
  paymentText: {
    fontSize: 16,
    color: '#000',
  },
  preferencesSection: {
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  preferenceOption: {},
  preferenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0254E8',
  },
  scheduledTimeContainer: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0254E8',
  },
  scheduledTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduledTimeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0254E8',
    marginLeft: 8,
  },
  scheduledTimeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  changeTimeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0254E8',
  },
  changeTimeText: {
    fontSize: 14,
    color: '#0254E8',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#0254E8',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  timeLabel: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  timeLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0254E8'
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(239, 237, 237, 0.87)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginLeft: 60,
  },
  closeButton: {
    padding: 4,
  },
  paymentMethodsList: {
    maxHeight: 400,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flexDirection: 'column',
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 2,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  prefLabel: {
    fontSize: 16,
    color: '#000',
  },
  prefSelect: {
    fontSize: 15,
    color: '#666',
  },
  prefDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  prefApplyButton: {
    backgroundColor: '#0254E8',
    padding: 15,
    borderRadius: 10,
    margin: 20,
  },
  prefApplyText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  couponInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  couponApplyButton: {
    backgroundColor: '#0254E8',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  couponApplyText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
  dropdownBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    marginTop: -5,
    marginBottom: 10,
    overflow: "hidden"
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },
  dropdownText: {
    fontSize: 15,
    color: "#000",
  },
  floatingLocationButton: {
    position: 'absolute',
    bottom: height * 0.75, // Position it above the service container
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
});

export default RouteLaterScreen;
