import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import { GOOGLE_MAPS_API_KEY, MAP_CONFIG } from '../config/map';
import { useAuth } from '../contexts/AuthContext';
const DropoffScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;

  // Get all the params - including pickup data
  const {
    selectedLocation: initialLocation,
    locationName: initialLocationName,
    selectedPickup,
    pickupName,

  } = route.params || {};

  console.log('DropoffScreen params:', route.params);

  const [searchQuery, setSearchQuery] = useState(initialLocationName || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [mapRegion, setMapRegion] = useState(
    initialLocation ? {
      latitude: initialLocation.latitude,
      longitude: initialLocation.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    } : MAP_CONFIG.region
  );
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const mapRef = useRef(null);
  const debounceRef = useRef(null);

  // Function to get address from coordinates (reverse geocoding)
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      setIsLoadingAddress(true);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=en`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.status === 'OK' && json.results.length > 0) {
        const address = json.results[0].formatted_address;
        setSearchQuery(address);

        const location = {
          latitude,
          longitude,
          address: address,
          name: address,
        };

        setSelectedLocation(location);
        return address;
      }
    } catch (error) {
      console.log('Reverse geocoding error:', error);
    } finally {
      setIsLoadingAddress(false);
    }
    return null;
  };

  // Handle map region change (when user drags the map)
  const handleMapDrag = (region) => {
    setMapRegion(region);
  };

  // Handle marker drag end
  const handleMarkerDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    getAddressFromCoordinates(latitude, longitude);

    // Update map region to center on the new marker position
    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    setMapRegion(newRegion);
  };

  // Handle map press to move marker
  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    getAddressFromCoordinates(latitude, longitude);

    // Update map region to center on the new marker position
    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    setMapRegion(newRegion);
  };

  // Fetch autocomplete results
  const fetchAutocomplete = async (input) => {
    if (!input || input.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${GOOGLE_MAPS_API_KEY}&components=country:pk&language=en`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.status === 'OK') {
        setSearchResults(json.predictions);
      } else {
        console.log('Places Autocomplete error:', json.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.log('Autocomplete fetch error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  const onChangeTextDebounced = (text) => {
    setSearchQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAutocomplete(text);
    }, 350);
  };

  // Fetch place details and update selection
  const fetchPlaceDetailsAndSelect = async (placeId) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        placeId
      )}&key=${GOOGLE_MAPS_API_KEY}&language=en&fields=geometry,formatted_address,name`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.status === 'OK' && json.result) {
        const { geometry, formatted_address, name } = json.result;
        const location = {
          latitude: geometry.location.lat,
          longitude: geometry.location.lng,
          address: formatted_address,
          name: name || formatted_address,
        };

        setSelectedLocation(location);
        setSearchQuery(formatted_address);
        setSearchResults([]);

        // Update map region
        const newRegion = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };

        setMapRegion(newRegion);
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 500);
        }
      }
    } catch (error) {
      console.log('fetchPlaceDetailsAndSelect error:', error);
    }
  };

  // Handle confirm button press
  const handleConfirm = () => {
    if (selectedLocation) {
      // Navigate back to Taxi screen with both pickup and dropoff data
      navigation.navigate('Taxi', {
        selectedDropoff: selectedLocation,
        dropoffName: searchQuery,
        phoneNumber: phoneNumber,
        // Preserve the existing pickup data
        selectedPickup: selectedPickup,
        pickupName: pickupName
      });
    }
  };

  // Render search result item
  const renderResultItem = ({ item }) => {
    const mainText = item.structured_formatting?.main_text || item.description;
    const secondaryText = item.structured_formatting?.secondary_text || '';

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => fetchPlaceDetailsAndSelect(item.place_id)}
      >
        <View style={styles.checkboxContainer}>
          <View style={[styles.checkbox, styles.checkboxUnchecked]} />
        </View>
        <View style={styles.resultTextContainer}>
          <Text style={styles.resultMainText}>{mainText}</Text>
          <Text style={styles.resultSecondaryText}>{secondaryText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Entypo name="cross" size={22} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Drag the map to select location</Text>
      </View>

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={handleMapDrag}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
      >
        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
            title="Drop-off Point"
            description="Drag to move or tap on map"
            pinColor="#FF3B30"
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
          />
        )}
      </MapView>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          📍 Drag the marker or tap on map to change location
        </Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <Text style={styles.locationText}>
          {isLoadingAddress ? 'Getting address...' : (selectedLocation ? selectedLocation.address : 'Select a location')}
        </Text>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location"
              value={searchQuery}
              onChangeText={onChangeTextDebounced}
              placeholderTextColor="#999"
            />
            {isLoadingAddress && (
              <ActivityIndicator size="small" color="#FF3B30" />
            )}
          </View>

          {/* Search Results */}
          {(searchResults.length > 0 || isSearching) && (
            <View style={styles.resultsContainer}>
              {isSearching ? (
                <ActivityIndicator size="small" style={styles.loader} />
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.place_id}
                  renderItem={renderResultItem}
                  keyboardShouldPersistTaps="handled"
                  style={styles.resultsList}
                />
              )}
            </View>
          )}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedLocation || isLoadingAddress) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedLocation || isLoadingAddress}
        >
          <Text style={styles.confirmButtonText}>
            {isLoadingAddress ? 'Getting Location...' : 'Confirm drop-off'}
          </Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  map: {
    flex: 1,
  },
  instructions: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  searchSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  resultsContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  resultsList: {
    flex: 1,
  },
  loader: {
    marginVertical: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxUnchecked: {
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  resultTextContainer: {
    flex: 1,
  },
  resultMainText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  resultSecondaryText: {
    fontSize: 12,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#0254E8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DropoffScreen;