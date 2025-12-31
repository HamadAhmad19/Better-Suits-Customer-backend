import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { checkPhoneNumberExists } from '../services/apiService';
import { sendOtp } from '../services/otpService';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Import your countries data
const countriesData = require('../countries.json');

const GetStartedScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [countryFlag, setCountryFlag] = useState('🇺🇸');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false); // Changed to false since we're using local data
  const [isPhoneInputFocused, setIsPhoneInputFocused] = useState(false);
  const [processing, setProcessing] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    // Process the countries data from the JSON file
    const processCountriesData = () => {
      try {
        // Transform the JSON data to match our expected format
        const countryData = countriesData.map(country => ({
          name: country.name,
          flag: country.flag, // Using emoji flags from your JSON
          phoneCode: country.dial_code,
          code: country.code
        }))
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

      } catch (error) {
        console.error("Error processing countries data:", error);
        // Fallback to sample data if JSON processing fails
        const fallbackCountries = [
          { name: 'United States', flag: '🇺🇸', phoneCode: '+1', code: 'US' },
          { name: 'United Kingdom', flag: '🇬🇧', phoneCode: '+44', code: 'GB' },
          { name: 'India', flag: '🇮🇳', phoneCode: '+91', code: 'IN' },
          { name: 'Canada', flag: '🇨🇦', phoneCode: '+1', code: 'CA' },
        ];
        setCountries(fallbackCountries);
        setFilteredCountries(fallbackCountries);

        // Set default
        setCountryCode('+1');
        setCountryFlag('🇺🇸');
      }
    };

    processCountriesData();
  }, []);

  // Filter countries based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries(countries);
    }
  }, [searchQuery, countries]);

  const handleCountrySelect = (country) => {
    setCountryCode(country.phoneCode);
    setCountryFlag(country.flag);
    setIsModalVisible(false);
    setSearchQuery('');
  };

  const handleSendCode = async () => {
    if (!isValidPhoneNumber()) return;

    setProcessing(true);
    try {
      const fullPhoneNumber = countryCode + phoneNumber;
      const phoneExists = await checkPhoneNumberExists(fullPhoneNumber);

      if (phoneExists) {
        // Phone exists, navigate to password screen
        console.log('Phone:', { fullPhoneNumber });
        navigation.navigate('UserPassword', { phoneNumber: fullPhoneNumber });
      } else {
        // New phone number, send OTP first
        const otpResult = await sendOtp(fullPhoneNumber);
        if (otpResult.success) {
          navigation.navigate('Otp', { phoneNumber: fullPhoneNumber });
        } else {
          Alert.alert('Error', otpResult.message);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check phone number. Please try again.');
      console.error('Error checking phone:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Skip');
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSearchQuery('');
  };

  const isValidPhoneNumber = () => {
    const fullNumber = countryCode + phoneNumber;

    try {
      const parsed = parsePhoneNumberFromString(fullNumber);
      return parsed ? parsed.isValid() : false;
    } catch {
      return false;
    }
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
    >
      <View style={styles.countryFlagContainer}>
        <Text style={styles.countryFlagEmoji}>{item.flag}</Text>
      </View>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCode}>{item.phoneCode}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={styles.topcontainer}>
          <Text style={styles.title}>Let's Get Started</Text>
          <Text style={styles.subtitle}>
            You are moments away from registering your account and enjoying comfortable rides.
          </Text>

          <View style={styles.phoneContainer}>
            <View style={styles.inputContainer}>
              {/* Country Code Button */}
              <TouchableOpacity
                style={styles.countryCodeButton}
                onPress={() => setIsModalVisible(true)}
              >
                <Text style={styles.flagIcon}>{countryFlag}</Text>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
              </TouchableOpacity>

              {/* Phone Number Input */}
              <TextInput
                style={[
                  styles.phoneInput,
                  isPhoneInputFocused && styles.phoneInputFocused
                ]}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                onFocus={() => setIsPhoneInputFocused(true)}
                onBlur={() => setIsPhoneInputFocused(false)}
                maxLength={15}
                placeholder="Phone number"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomcontainer}>
          {/* Send Code Button */}
          <TouchableOpacity
            style={[
              styles.sendCodeButton,
              (!isValidPhoneNumber() || processing) && styles.sendCodeButtonDisabled
            ]}
            onPress={handleSendCode}
            disabled={!isValidPhoneNumber() || processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendCodeText}>Send Code</Text>
            )}
          </TouchableOpacity>

          {/* Skip Option (uncomment if needed) */}
          {/* <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity> */}
        </View>

        {/* Country Code Modal */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select dial code</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search country name"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0254E8" />
                <Text style={styles.loadingText}>Loading countries...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredCountries}
                renderItem={renderCountryItem}
                keyExtractor={(item) => item.code}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No countries found</Text>
                  </View>
                }
              />
            )}
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
};

export default GetStartedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  topcontainer: {
    padding: 20,
    width: '100%',
    height: '50%',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontFamily: 'Arial',
    fontSize: 29,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'Arial',
    fontSize: 15,
    fontWeight: '300',
    color: '#666',
    marginBottom: 25,
    lineHeight: 20,
  },
  bottomcontainer: {
    width: '100%',
    height: '50%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    flex: 1,
    justifyContent: 'flex-end',
  },
  phoneContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 6,
    minWidth: 60,
  },
  flagIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginRight: 5,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  phoneInputFocused: {
    borderWidth: 1,
    borderColor: '#0254E8',
  },
  sendCodeButton: {
    backgroundColor: '#0254E8',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#0254E8',
    opacity: 0.6,
  },
  sendCodeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 30,
    backgroundColor: '#fff',
  },
  skipText: {
    color: '#000',
    fontWeight: "600",
    fontSize: 14,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#0254E8',
    fontSize: 16,
    fontWeight: '500',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countryFlagContainer: {
    marginRight: 12,
    width: 30,
    alignItems: 'center',
  },
  countryFlagEmoji: {
    fontSize: 24,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  countryCode: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});