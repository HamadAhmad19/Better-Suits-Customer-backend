

import React, { useState, useEffect, useRef } from 'react';
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
  BackHandler
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from '@expo/vector-icons/AntDesign';
import { getUserByPhoneNumber } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const SkipScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // const { phoneNumber } = route.params || {};
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;

  const [locationPermission, setLocationPermission] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedService, setSelectedService] = useState('Taxi');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const slideAnim = useRef(new Animated.Value(-300)).current;
  const mapRef = useRef(null);
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent going back
    });

    return () => backHandler.remove();
  }, []);
  // Fetch user data when component mounts
  useEffect(() => {

    checkLocationPermission();
  }, []);



  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status === 'granted') {
        setShowPermissionModal(false);
        getUserLocation();
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const getUserLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
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
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your current location');
    }
  };

  const handlePermission = async (permissionType) => {
    if (permissionType === 'DENY') {
      setLocationPermission('denied');
      setShowPermissionModal(false);
      Alert.alert(
        'Location Access Denied',
        'You can enable location access in your device settings to get better service.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      let result;
      if (permissionType === 'WHILE_USING_APP') {
        result = await Location.requestForegroundPermissionsAsync();
      } else if (permissionType === 'ONLY_THIS_TIME' && Platform.OS === 'android') {
        result = await Location.requestForegroundPermissionsAsync();
      }

      if (result?.status === 'granted') {
        setLocationPermission('granted');
        setShowPermissionModal(false);
        getUserLocation();
      } else {
        setLocationPermission('denied');
        setShowPermissionModal(false);
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => navigation.navigate('Home')
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      // Handle Firestore timestamp or string date
      const date = typeof dateString === 'string'
        ? new Date(dateString)
        : dateString.toDate();

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getInitials = () => {
    if (!userData) return 'US';
    const { firstName, lastName } = userData;
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    return 'US';
  };

  const getUserDisplayName = () => {
    if (!userData) return 'User';
    const { firstName, lastName } = userData;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return 'User';
  };
  const handleAboutPress = () => {
    toggleSidebar();
    setShowAboutModal(true);
  };

  const closeAboutModal = () => {
    setShowAboutModal(false);
  };
  const menuItems = [

    { icon: 'log-in', label: 'Sign in/ Sign up', screen: 'Started' },
    { icon: 'settings', label: 'Settings', screen: 'Settings' },

  ];

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 31.5204,
          longitude: 74.3587,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        region={userLocation}
        showsUserLocation={locationPermission === 'granted'}
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

      {/* Header with Menu Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <Feather name="menu" size={22} color="#6E6E6E" />
        </TouchableOpacity>
        <View style={styles.menu2BTN}>
          <TouchableOpacity style={[styles.menuButton, styles.calenderBtn]} onPress={toggleSidebar}>
            <FontAwesome5 name="calendar-alt" size={22} color="#6E6E6E" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
            <AntDesign name="code-sandbox" size={22} color="#6E6E6E" />
          </TouchableOpacity>
        </View>
        <View style={styles.placeholder} />
      </View>



      {/* Service Selection */}
      <View style={styles.serviceContainer}>
        <View style={{ alignItems: 'center' }}>
          <AntDesign name="line" size={30} color="#6E6E6E" />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 15, }}>Where are you going?</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={[
              styles.serviceButton, styles.taxiButton
              // selectedService === 'Taxi' && styles.serviceButtonActive
            ]}
            onPress={() => navigation.navigate('Taxi', { phoneNumber })}
          >
            <Text style={[
              styles.serviceText
              // selectedService === 'Taxi' && styles.serviceTextActive
            ]}>
              Taxi
            </Text>
            <Image
              source={require("../assets/taxi.png")}
              style={styles.serviceIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.serviceButton,
              styles.deliveryButton
              // selectedService === 'Delivery' && styles.serviceButtonActive
            ]}
            onPress={() => setSelectedService('Delivery')}
          >
            <Text style={[
              styles.serviceText,
              // selectedService === 'Delivery' && styles.serviceTextActive
            ]}>
              Delivery
            </Text>
            <Image
              source={require("../assets/deliver.png")}
              style={styles.deliveryIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

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
              Allow BetterTaxi to access this device's location?
            </Text>
            <Text style={styles.permissionText}>
              We need your location to show nearby taxis and provide better service.
            </Text>

            <TouchableOpacity
              style={styles.permissionButton}
              onPress={() => handlePermission('WHILE_USING_APP')}
            >
              <Text style={styles.permissionButtonText}>WHILE USING THE APP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.permissionButton}
              onPress={() => handlePermission('ONLY_THIS_TIME')}
            >
              <Text style={styles.permissionButtonText}>ONLY THIS TIME</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.permissionButton, styles.denyButton]}
              onPress={() => handlePermission('DENY')}
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
        style={[
          styles.sidebar,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        {/* User Profile Section */}
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Feather name='user' size={22} color="#6E6E6E" />
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
                navigation.navigate(`${item.screen}`, { phoneNumber });
              }}
            >
              <Feather name={item.icon} size={20} color="#6E6E6E" />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleAboutPress}
          >
            <Feather name="info" size={20} color="#6E6E6E" />
            <Text style={styles.menuItemText}>About</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}

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
              source={require('../assets/download.png')}
              style={styles.img1}
            />
            <Text style={styles.aboutTitle}>BetterTaxi</Text>
            <View>
              <Text style={styles.versionText}>
                5.1.9 (Build 513, Built 28 days ago, Flutter 3.35.2)
              </Text>

              <Text style={styles.copyrightText}>
                Copyright © Lume Agency, All rights reserved.
              </Text>
            </View>
            <View style={styles.separator} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', }}>
              <TouchableOpacity
                style={styles.viewLicensesButton}
                onPress={() => {
                  // Add your licenses navigation here
                  console.log('View licenses pressed');
                }}
              >
                <Text style={styles.viewLicensesText}>View licenses</Text>
              </TouchableOpacity>

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
    backgroundColor: '#fff',

  },
  map: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menu2BTN: {
    width: '100%',
    paddingRight: 40,
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  calenderBtn: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    color: '#666',
    fontSize: 16,
  },
  serviceContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '40%',
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 17,
    paddingTop: 5,
    paddingLeft: 15,
    paddingRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,

  },
  taxiButton: {
    marginRight: 5,
    backgroundColor: '#f2f2f2', // Yellow background for taxi
  },
  deliveryButton: {
    backgroundColor: '#f2f2f2', // Green background for delivery
  },
  serviceButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceButtonActive: {
    backgroundColor: '#0254E8',
  },
  serviceText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginRight: 20,
  },
  serviceIcon: {
    width: 30,
    height: 30,
  },
  deliveryIcon: {
    width: 40,
    height: 40,
  },
  serviceTextActive: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    width: width - 40,
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#000',
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  permissionButton: {
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0254E8',
  },
  denyButton: {
    borderBottomWidth: 0,
    marginTop: 5,
  },
  denyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 20,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: '100%',
    backgroundColor: 'white',
    zIndex: 21,
    paddingTop: 20,
  },
  userSection: {
    marginBottom: 30,
    paddingTop: 60,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  userDetails: {
    marginTop: 8,
  },
  userDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  completedText: {
    color: '#22C55E',
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  menuItemText: {
    fontSize: 16,
    color: '#6E6E6E',
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 16,
    color: '#6E6E6E',
    marginLeft: 15,
    fontWeight: '400',
  },
  aboutModal: {
    backgroundColor: 'white',
    borderRadius: 12,

    padding: 20,
    margin: 40,
    width: width - 40,
    alignItems: 'center',
    shadowColor: '#000',
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
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,

    color: '#000',
  },
  versionText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  copyrightText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  viewLicensesButton: {

    alignItems: 'flex-end',
    justifyContent: 'space-between',

  },
  viewLicensesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0254E8',
  },
  closeButton: {

    //   paddingVertical: 12,
    alignItems: 'center',
    //   backgroundColor: '#f8f8f8',
    borderRadius: 8,
    //   marginTop: 8,
    marginLeft: 50,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0254E8',
  },
});

export default SkipScreen;