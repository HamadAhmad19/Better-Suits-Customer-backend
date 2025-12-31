
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
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
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
const { width } = Dimensions.get('window');
import Entypo from '@expo/vector-icons/Entypo';
import DeliveryScreen from './DeliveryScreen';


const DeliveryRouteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { pickup, dropoff } = route.params;
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [selectedRide, setSelectedRide] = useState('Economy');
  const [estimatedTime, setEstimatedTime] = useState('15 min');
  const [estimatedDistance, setEstimatedDistance] = useState('0 km');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Select payment method');
  const mapRef = useRef(null);

  // Ride prices based on type (per km)
  const rideRates = {
    Economy: { base: 40, perKm: 10, multiplier: 1 },
    Plus: { base: 70, perKm: 20, multiplier: 1.8 },
    Premium: { base: 90, perKm: 30, multiplier: 2.5 }
  };

  const [prices, setPrices] = useState({
    Economy: '55.16',
    Plus: '106.92',
    Premium: '137.90'
  });

  useEffect(() => {
    if (pickup && dropoff) {
      calculateRoute();
      fitMapToMarkers();
    }
  }, [pickup, dropoff]);

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
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      // Fallback to straight line
      setRouteCoordinates([pickup, dropoff]);
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
        edgePadding: { top: 50, right: 50, bottom: 400, left: 50 },
        animated: true,
      });
    }
  };

  const handleBookNow = () => {
    Alert.alert(
      'Confirm Ride',
      `Book ${selectedRide} ride for $${prices[selectedRide]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            Alert.alert('Success', 'Your ride has been booked!');
          }
        }
      ]
    );
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentModalVisible(false);
  };

  const rideOptions = [
    {
      id: 'Bike Courier',
      title: 'Economy 3',
      subtitle: 'Lightweight, fast city delivery',
      price: prices.Economy,
      source:require("../assets/deliver.png"),
    },
    {
      id: 'Bike with Box',
      title: 'Plus 4',
      subtitle: 'Safe delivery for small parcels',
      price: prices.Plus,
      source:require("../assets/deliver.png"),
    },
    {
      id: 'Pickup Truck',
      title: 'Premium 5',
      subtitle: 'Flexible for large loads',
      price: prices.Premium,
      source:require("../assets/pickup-truck.png"),
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

  return (
    <View style={styles.container}>
      {/* Map View */}
       <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Entypo name="cross" size={22} color="black" />
              </TouchableOpacity>
              
            </View>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={MAP_CONFIG.region}
      >
        {pickup && (
          <Marker
            coordinate={pickup}
            title="Pick-up"
            pinColor="blue"
          />
        )}
        {dropoff && (
          <Marker
            coordinate={dropoff}
            title="Drop-off"
            pinColor="red"
          />
        )}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#0254E8"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Ride Options */}
      <View style={styles.rideOptionsContainer}>
        <View 
          showsHorizontalScrollIndicator={false}
          style={styles.rideOptionsScroll}
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
              <View style={{flexDirection:'row',justifyContent:'space-around' }}>
                <Image source={ride.source} style={styles.Img}/>
                <View style={{flexDirection:'column'}}>
                  <Text style={[
                    styles.rideTitle,
                    selectedRide === ride.id && styles.rideTitleSelected
                  ]}>
                    {ride.title}
                  </Text>
                  <Text style={[
                    styles.rideSubtitle,
                    selectedRide === ride.id && styles.rideSubtitleSelected
                  ]}>
                    {ride.subtitle}
                  </Text>
                </View>
                <Text style={[
                  styles.ridePrice,
                  selectedRide === ride.id && styles.ridePriceSelected
                ]}>
                  ${ride.price}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <View style={styles.sectionDivider} />
          <TouchableOpacity 
            style={styles.paymentOption}
            onPress={() => setPaymentModalVisible(true)}
          >
            <View style={{flexDirection:'row'}}>
              <FontAwesome name="credit-card" size={20} color="#0254E8" style={{marginRight:10}}/>
              <Text style={styles.paymentText}>{selectedPaymentMethod}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Ride Preferences */}
        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>Ride Preferences</Text>
          <TouchableOpacity style={styles.preferenceOption}>
            <Text style={styles.preferenceText}>Coupon code</Text>
          </TouchableOpacity>
        </View>

        {/* Book Now Button */}
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={handleBookNow}
        >
          <Text style={styles.bookButtonText}>Book now</Text>
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
                      <Feather name={method.icon} size={20} color="white" />
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
            <TouchableOpacity>
            <View style={styles.paymentMethodInfo1}>
            <View style={styles.plusIcon}>
            <Entypo name="circle-with-plus" size={20} color="#0254E8" /></View>
                      <Text style={styles.paymentMethodName1 }>Add New Payment Method
                      </Text>
                    </View>
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
      paddingBottom: 15,
      
      
     
    },
    backButton: {
        marginTop:10,
        padding:4,
        backgroundColor:'#f2f2f2',
        borderRadius:5,
      marginRight: 15,
    },
  
  map: {
    flex: 1,
  },
  locationCard: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0254E8',
    marginTop: 8,
    marginRight: 12,
  },
  dropoffDot: {
    backgroundColor: '#FF3B30',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  locationArea: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  locationAreaSubtitle: {
    fontSize: 11,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 10,
    marginLeft: 20,
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
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  Img:{
    width:45,
    height:45,
  },
  rideOptionsScroll: {
    marginBottom: 20,
  },
  rideOption: {
    width:'100%',
    
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 5,
    marginRight: 12,
    borderWidth: 1,
    borderColor:'rgba(229, 229, 229, 0.59)',
    marginBottom:5,
  },
  rideOptionSelected: {
    borderColor: '#0254E8',
  },
  rideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  rideSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  ridePrice: {
    fontSize: 17,
    fontWeight:'600',
    color:  '#0254E8',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0254E8',
    marginBottom: 10,
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
    borderRadius:5,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth:1,
    borderColor:'#E5E5E5',
    paddingHorizontal:12,
  },
  paymentText: {
    fontSize: 16,
    color: '#000',
  },
  preferencesSection: {
    marginBottom: 15,
    flexDirection:'row',
    justifyContent: 'space-between',
  },
  preferenceOption: {},
  preferenceText: {
    fontSize: 14,
    fontWeight:'600',
    color: '#0254E8',
  },
  bookButton: {
    backgroundColor: '#0254E8',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom:30,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    height: '70%',
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
    marginLeft:60,
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
    width: 20,
    height: 20,
    // borderRadius: 20,
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

  paymentMethodInfo1:{
    flexDirection: 'row',
    padding:20,
   alignItems:'center',
   borderTopWidth:1,
   borderTopColor:'#E5E5E5',
   marginBottom:15,
   
  },
  paymentMethodName1:{
    fontSize: 16,
    fontWeight: '500',
    marginLeft:15,
    color: '#000',
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 2,
  },
  plusIcon:{
    backgroundColor:'#f2f2f2',
    paddingVertical:8,
    paddingHorizontal:10,
    borderRadius:7,
   borderWidth:1,
   borderColor:'#E5E5E5',
  }, 
});

export default DeliveryRouteScreen;