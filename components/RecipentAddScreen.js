import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Modal,
  FlatList,
  Image
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation,useRoute } from "@react-navigation/native";
// import RecipentScreen from './RecipentScreen';

const RecipentAddScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { pickup, dropoff } = route.params;
  // Form state
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [buildingNumber, setBuildingNumber] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  
  // Country selection state
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [countryCode, setCountryCode] = useState('+1');
  const [countryFlag, setCountryFlag] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Check if required fields are filled
  const isFormValid = name.trim() !== '' && addressLine1.trim() !== '';

  // Fetch countries data
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,idd');
        const result = await response.json();
        
        const countryData = result.map(country => {
          const name = country.name.common;
          const flag = country.flags.png;
          const root = country.idd?.root || "";
          const suffix = country.idd?.suffixes ? country.idd.suffixes[0] : "";
          const phoneCode = root + suffix;

          return { name, flag, phoneCode };
        })
        .filter(country => country.phoneCode) // Filter out countries without phone codes
        .sort((a, b) => a.name.localeCompare(b.name));

        setCountries(countryData);
        setFilteredCountries(countryData);
        
        // Set default to United States if available
        const usCountry = countryData.find(country => country.name === 'United States');
        if (usCountry) {
          setCountryCode(usCountry.phoneCode);
          setCountryFlag(usCountry.flag);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching countries:", error);
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Filter countries based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.phoneCode.includes(searchQuery)
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries(countries);
    }
  }, [searchQuery, countries]);

  const handleCountrySelect = (country) => {
    setCountryCode(country.phoneCode);
    setCountryFlag(country.flag);
    setCountryModalVisible(false);
    setSearchQuery('');
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
    >
      <Image source={{ uri: item.flag }} style={styles.flag} />
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.phoneCode}>{item.phoneCode}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipent's contact info</Text>
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {/* Name Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Name<Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999"
          />
        </View>

        {/* Phone Number Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone number</Text>
          <View style={styles.phoneInputContainer}>
            <TouchableOpacity 
              style={styles.countryCodeButton}
              onPress={() => setCountryModalVisible(true)}
            >
              {countryFlag ? (
                <Image source={{ uri: countryFlag }} style={styles.selectedFlag} />
              ) : (
                <Feather name="flag" size={20} color="#666" />
              )}
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Feather name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
            <TextInput
              style={[styles.textInput, styles.phoneInput]}
              placeholder="Enter phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Address Line 1 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Address Line 1<Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter address line 1"
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholderTextColor="#999"
          />
        </View>

        {/* Building and Apartment Numbers */}
        <View style={styles.rowContainer}>
          <View style={[styles.inputGroup, styles.flexInputGroup]}>
            <Text style={styles.label}>Building Number</Text>
            <TextInput
              style={styles.textInput2}
              placeholder="Building No."
              value={buildingNumber}
              onChangeText={setBuildingNumber}
              placeholderTextColor="#999"
            />
          </View>

          <View style={[styles.inputGroup, styles.flexInputGroup]}>
            <Text style={styles.label}>Apartment Number</Text>
            <TextInput
              style={styles.textInput2}
              placeholder="Apt. No."
              value={apartmentNumber}
              onChangeText={setApartmentNumber}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Instructions</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            placeholder="Enter instructions (optional)"
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
      <TouchableOpacity 
    style={[
      styles.continueButton,
      !isFormValid && styles.continueButtonDisabled
    ]}
    disabled={!isFormValid}
    onPress={() => {
      navigation.navigate('DeliveryRoute', {
        pickup: pickup, // Pass pickup
        dropoff: dropoff, // Pass dropoff
      });
    }}
  >
    <Text style={styles.continueButtonText}>Continue</Text>
  </TouchableOpacity>
      </View>

      {/* Country Selection Modal */}
      <Modal
        visible={countryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity 
              onPress={() => {
                setCountryModalVisible(false);
                setSearchQuery('');
              }}
            >
              <Feather name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search country..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>

          {/* Countries List */}
          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item.name}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
};

export default RecipentAddScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 60,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: 'red',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textInput2: {
    width: '75%',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  flexInputGroup: {
    flex: 1,
    marginBottom: 15,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    backgroundColor: '#fff',
    minWidth: 100,
  },
  selectedFlag: {
    width: 20,
    height: 20,
    marginRight: 8,
    borderRadius: 10,
  },
  countryCodeText: {
    fontSize: 16,
    marginRight: 8,
    color: '#333',
  },
  phoneInput: {
    flex: 1,
  },
  multilineInput: {
    height: 80,
  },
  // Updated button container and button styles
  buttonContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  continueButton: {
    backgroundColor: '#0254E8',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom:50,
  },
  continueButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  flag: {
    width: 30,
    height: 30,
    borderRadius: 14,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  phoneCode: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
});