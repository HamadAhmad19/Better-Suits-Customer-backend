

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation,useRoute} from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { GOOGLE_MAPS_API_KEY, MAP_CONFIG } from '../config/map';
import Entypo from '@expo/vector-icons/Entypo';

const DeliveryScreen = () => {
  const navigation = useNavigation();
const route = useRoute();
  const [pickup, setPickup] = useState('');
  
  const [activeField, setActiveField] = useState(null); // 'pickup' | 'dropoff' | null

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDropoff, setSelectedDropoff] = useState(null);

  const mapRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we have new pickup/dropoff data from the Pickup/Dropoff screens
      if (route.params?.selectedPickup) {
        setSelectedPickup(route.params.selectedPickup);
        setPickup(route.params.pickupName || '');
      }
      if (route.params?.selectedDropoff) {
        setSelectedDropoff(route.params.selectedDropoff);
        setDropoff(route.params.dropoffName || '');
      }
    });
  
    return unsubscribe;
  }, [navigation, route.params]);

  // helper: call Places Autocomplete
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
        // not OK: show empty or log error
        console.log('Places Autocomplete error:', json.status, json.error_message);
        setSearchResults([]);
      }
    } catch (error) {
      console.log('Autocomplete fetch error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // debounce wrapper
  const onChangeTextDebounced = (text, field) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (field === 'pickup') {
      setPickup(text);
    } else {
      setDropoff(text);
    }

    setActiveField(field);

    debounceRef.current = setTimeout(() => {
      fetchAutocomplete(text);
    }, 350);
  };

  // fetch place details by place_id, then handle selection
  const fetchPlaceDetailsAndSelect = async (placeId, field) => {
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

        if (field === 'pickup') {
          setSelectedPickup(location);
          setPickup(formatted_address);
          setSearchResults([]);
          // animate map
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }, 500);
          }
          // navigate to Pickup screen
          navigation.navigate('Pickup', {
            selectedLocation: location,
            locationName: formatted_address,
          });
        } else {
          setSelectedDropoff(location);
          setDropoff(formatted_address);
          setSearchResults([]);
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }, 500);
          }
          // navigate to Dropoff screen
          navigation.navigate('Dropoff', {
            selectedLocation: location,
            locationName: formatted_address,
          });
        }
      } else {
        console.log('Place details error:', json.status, json.error_message);
      }
    } catch (error) {
      console.log('fetchPlaceDetailsAndSelect error:', error);
    }
  };

  // render one search result row
  const renderResultItem = ({ item }) => {
    const mainText = item.structured_formatting?.main_text || item.description;
    const secondaryText = item.structured_formatting?.secondary_text || '';

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => fetchPlaceDetailsAndSelect(item.place_id, activeField || 'pickup')}
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
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      
     <View style={styles.header}>
    <TouchableOpacity onPress={() => navigation.goBack()}>
        <Entypo name="cross" size={22} color="black" />
    </TouchableOpacity>
        <Text style={styles.title}>Sender's Address</Text>
        </View>
        {/* Pickup input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <Feather name="circle" size={16} color="#0254E8" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter pick-up point"
            value={pickup}
            onChangeText={(t) => onChangeTextDebounced(t, 'pickup')}
            onFocus={() => {
              setActiveField('pickup');
              if (pickup.length > 2) fetchAutocomplete(pickup);
            }}
          />
          <TouchableOpacity style={styles.mapButton}>
            <Text style={styles.mapButtonText}>Map</Text>
          </TouchableOpacity>
        </View>

        {/* Dropoff input */}
       

       
        <Text style={styles.resultsTitle}>Search Results</Text>
        {/* Search Results */}
        { (searchResults.length > 0 || isSearching) && (
          <View style={styles.resultsContainer}>
        

            {isSearching ? (
              <ActivityIndicator size="small" style={{ marginVertical: 8 }} />
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.place_id}
                renderItem={renderResultItem}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 250 }}
              />
            )}

            {/* static example items you had earlier (optional quick-picks) */}
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() =>
                fetchPlaceDetailsAndSelect(
                  // example place id not guaranteed; using coordinates via fake details
                  // to keep behavior same as before, we'll directly build a fake result:
                  // But to keep consistency, we call a function that directly sets selection:
                  // Using closure below
                  null,
                  'pickup'
                )
              }
            >
             
            </TouchableOpacity>
          </View>
        )}

        {/* Confirm Button */}
        <View style={styles.confirmWrapper}>
        <TouchableOpacity
  style={[
    styles.confirmButton,
    (!selectedPickup) && styles.confirmButtonDisabled,
  ]}
  onPress={() => {
    if (selectedPickup) {
      navigation.navigate('Sender', {
        pickup: selectedPickup, // Pass pickup location
      });
    }
  }}
  disabled={!selectedPickup}
>
  <Text style={styles.confirmButtonText}>Confirm</Text>
</TouchableOpacity>
</View>
 </KeyboardAvoidingView>
 </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
     padding: 20,
     marginTop:30,
  backgroundColor: '#fff',
  paddingTop: Platform.OS === 'android' ? 20 : 0,
  paddingHorizontal: 20,
  },
header: {
   
    alignContent:'center',
      flexDirection: "row",
     alignItems:'center',
      marginBottom: 30,
    },
   
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginLeft:60,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
    backgroundColor: '#f5f5f5',
    borderRadius:10,
    padding:10,
    paddingHorizontal:5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    
    paddingVertical: 10,
    fontSize: 16,
    paddingRight: 50,
  },
  mapButton: {
    position: 'absolute',
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    // backgroundColor: '#f8f8f8',
    borderRadius: 6,
    borderLeftWidth: 1,
    
    borderLeftColor: '#E5E5E5',
  },
  mapButtonText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  addStopButton: {
    paddingVertical: 12,
    // alignItems: 'center',
  
    marginBottom: 30,
  },
  addStopText: {
    color: '#0254E8',
    fontSize: 16,
    fontWeight: '500',
  },
  resultsContainer: {
    marginBottom:20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    
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
  checkboxChecked: {
    backgroundColor: '#0254E8',
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
  resultText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
confirmWrapper: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  paddingHorizontal: 20, // only horizontal
 
  paddingBottom: 40, // smaller bottom padding
  backgroundColor: 'white',
},

  confirmButton: {
    backgroundColor: '#0254E8',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DeliveryScreen;
