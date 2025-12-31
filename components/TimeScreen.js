import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const TimeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;

  // Get parameters from previous screen
  const { pickup, dropoff } = route.params || {};

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState('11');
  const [selectedMinute, setSelectedMinute] = useState('20');
  const [selectedPeriod, setSelectedPeriod] = useState('pm');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialize with current date
  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
  }, []);

  // Date formatting
  const formatDate = (date) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Generate time slots for minutes
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Generate hours for 12-hour format
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  // Generate next 90 days for date selection
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 90; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const dateOptions = generateDateOptions();

  const handleContinue = () => {
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    // Create the selected date-time
    const selectedDateTime = new Date(selectedDate);
    let hour = parseInt(selectedHour);

    // Convert to 24-hour format
    if (selectedPeriod === 'pm' && hour < 12) hour += 12;
    if (selectedPeriod === 'am' && hour === 12) hour = 0;

    selectedDateTime.setHours(hour, parseInt(selectedMinute), 0, 0);

    // Navigate to RouteLaterScreen with all data
    navigation.navigate('RouteLater', {
      pickup: pickup,
      dropoff: dropoff,
      phoneNumber: phoneNumber,
      scheduledTime: selectedDateTime.toISOString(),
      selectedDate: formatDate(selectedDate),
      selectedTime: `${selectedHour}:${selectedMinute} ${selectedPeriod}`
    });
  };

  // Render time picker modal
  const renderTimePickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showTimePicker}
      onRequestClose={() => setShowTimePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.timePickerModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose pickup time</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
              <Entypo name="cross" size={22} color="black" />
            </TouchableOpacity>
          </View>

          <View style={styles.timePickerContainer}>
            {/* Hours */}
            <ScrollView
              style={styles.timeColumn}
              showsVerticalScrollIndicator={false}
              snapToInterval={40}
            >
              {hours.map((hour) => (
                <TouchableOpacity
                  key={`hour-${hour}`}
                  style={[
                    styles.timeOption,
                    selectedHour === hour && styles.timeOptionSelected
                  ]}
                  onPress={() => setSelectedHour(hour)}
                >
                  <Text style={[
                    styles.timeOptionText,
                    selectedHour === hour && styles.timeOptionTextSelected
                  ]}>
                    {hour}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.timeSeparator}>:</Text>

            {/* Minutes */}
            <ScrollView
              style={styles.timeColumn}
              showsVerticalScrollIndicator={false}
              snapToInterval={40}
            >
              {minutes.map((minute) => (
                <TouchableOpacity
                  key={`minute-${minute}`}
                  style={[
                    styles.timeOption,
                    selectedMinute === minute && styles.timeOptionSelected
                  ]}
                  onPress={() => setSelectedMinute(minute)}
                >
                  <Text style={[
                    styles.timeOptionText,
                    selectedMinute === minute && styles.timeOptionTextSelected
                  ]}>
                    {minute}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* AM/PM */}
            <View style={styles.periodColumn}>
              <TouchableOpacity
                style={[
                  styles.periodOption,
                  selectedPeriod === 'am' && styles.periodOptionSelected
                ]}
                onPress={() => setSelectedPeriod('am')}
              >
                <Text style={[
                  styles.periodText,
                  selectedPeriod === 'am' && styles.periodTextSelected
                ]}>
                  a.m.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodOption,
                  selectedPeriod === 'pm' && styles.periodOptionSelected
                ]}
                onPress={() => setSelectedPeriod('pm')}
              >
                <Text style={[
                  styles.periodText,
                  selectedPeriod === 'pm' && styles.periodTextSelected
                ]}>
                  p.m.
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.okButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render date picker modal
  const renderDatePickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showDatePicker}
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Entypo name="cross" size={22} color="black" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.dateList}>
            {dateOptions.map((date, index) => (
              <TouchableOpacity
                key={`date-${index}`}
                style={[
                  styles.dateOption,
                  selectedDate &&
                  date.toDateString() === selectedDate.toDateString() &&
                  styles.dateOptionSelected
                ]}
                onPress={() => {
                  setSelectedDate(date);
                  setShowDatePicker(false);
                }}
              >
                <Text style={[
                  styles.dateOptionText,
                  selectedDate &&
                  date.toDateString() === selectedDate.toDateString() &&
                  styles.dateOptionTextSelected
                ]}>
                  {date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Entypo name="cross" size={22} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Choose a pickup time</Text>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Book a trip from 20 minutes to 90 days in advance
        </Text>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date</Text>
          <TouchableOpacity
            style={styles.selectionBox}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.selectionText}>
              {formatDate(selectedDate)}
            </Text>
            <Feather name="calendar" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pickup time</Text>
          <TouchableOpacity
            style={styles.selectionBox}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.timeText}>
              {selectedHour}:{selectedMinute} {selectedPeriod}
            </Text>
            <Feather name="clock" size={20} color="#666" />
          </TouchableOpacity>
          <Text style={styles.timezoneNote}>
            Time zone is based on pickup location
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Airport Prebook Promise */}
        <View style={styles.promiseSection}>
          <Text style={styles.promiseTitle}>Airport Prebook Promise</Text>
          <Text style={styles.promiseText}>
            Get up to 50€ in vouchers if your airport prebook doesn't go as planned.
            <Text style={styles.learnMoreText}> Learn more</Text>
          </Text>
        </View>

        {/* Cancel Policy */}
        <View style={styles.policySection}>
          <Text style={styles.policyText}>
            Cancel for free up to 1 hour before pickup
          </Text>
          <Text style={styles.learnMoreText}>Learn more</Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedDate && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedDate}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderTimePickerModal()}
      {renderDatePickerModal()}
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginLeft: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  selectionBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  selectionText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  timezoneNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 20,
  },
  promiseSection: {
    marginBottom: 25,
  },
  promiseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  promiseText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  policySection: {
    marginBottom: 20,
  },
  policyText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 5,
  },
  learnMoreText: {
    color: '#0254E8',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  continueButton: {
    backgroundColor: '#0254E8',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timePickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.7,
  },
  datePickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    height: 200,
  },
  timeColumn: {
    width: 80,
    height: '100%',
  },
  timeOption: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  timeOptionSelected: {
    backgroundColor: '#0254E8',
    borderRadius: 8,
  },
  timeOptionText: {
    fontSize: 20,
    color: '#666',
  },
  timeOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 24,
    color: '#000',
    marginHorizontal: 10,
    fontWeight: '600',
  },
  periodColumn: {
    width: 80,
    marginLeft: 10,
  },
  periodOption: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  periodOptionSelected: {
    backgroundColor: '#0254E8',
  },
  periodText: {
    fontSize: 16,
    color: '#666',
  },
  periodTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  okButton: {
    flex: 1,
    padding: 15,
    marginLeft: 10,
    borderRadius: 12,
    backgroundColor: '#0254E8',
    alignItems: 'center',
  },
  okButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  dateList: {
    maxHeight: 300,
  },
  dateOption: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  dateOptionSelected: {
    backgroundColor: '#f0f7ff',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#000',
  },
  dateOptionTextSelected: {
    color: '#0254E8',
    fontWeight: '600',
  },
});

export default TimeScreen;