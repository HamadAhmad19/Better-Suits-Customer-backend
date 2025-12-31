

import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Feather from '@expo/vector-icons/Feather';
import { sendOtp, verifyOtp } from '../services/otpService';
const OtpCodeScreen = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(45);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber } = route.params || {};
  // ✅ derived boolean to check if all fields are filled
  const isOtpComplete = otp.every((digit) => digit !== "");

  useEffect(() => {
    const interval = setInterval(() => {
      if (timer > 0) setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text, index) => {
    if (/^[0-9]?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text && index < 5) inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleResend = async () => {
    setLoading(true);
    const result = await sendOtp(phoneNumber);
    setLoading(false);

    if (result.success) {
      setTimer(45);
      Alert.alert("Success", "OTP sent successfully");
    } else {
      Alert.alert("Error", result.message);
    }
  };

  const handleContinue = async () => {
    const enteredOtp = otp.join("");

    if (!isOtpComplete) {
      Alert.alert("Incomplete Code", "Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    const result = await verifyOtp(phoneNumber, enteredOtp);
    setLoading(false);

    if (result.success) {
      navigation.navigate('Password', { phoneNumber });
    } else {
      Alert.alert("Invalid Code", result.message);
    }
  };

  return (
    <View style={styles.topContainer}>
      <View style={styles.container}>

        <Feather name="arrow-left" size={20} color="black" style={styles.arrowIcon} onPress={() => {
          navigation.navigate('Started');
        }} />
        <Text style={styles.title}>Enter code</Text>
        <Text style={styles.subtitle}>
          A verification code has been sent to your phone number
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.otpInput}
              keyboardType="numeric"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              ref={(ref) => (inputs.current[index] = ref)}
            />
          ))}
        </View>



        {timer > 0 ? (
          <Text style={styles.resendText}>Resend code in {timer} seconds</Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text style={[styles.resendText, { color: "#0066FF" }]}>Resend Code</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomContainer}>
        {/* ✅ Disabled until all 6 digits are filled */}
        <TouchableOpacity
          style={[styles.button, isOtpComplete && !loading ? styles.activeButton : styles.disabledButton]}
          disabled={!isOtpComplete || loading}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Continue'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { navigation.navigate('Started') }}>
          <Text style={styles.changeNumber}>Change Number</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 50,
  },
  topContainer: {

    width: '100%',
    height: '50%',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'flex-start',
  },
  arrowIcon: {
    width: '100%',
    paddingLeft: 5,
    paddingTop: 30,
    textAlign: 'left',
    marginBottom: 30,

  },
  title: {
    fontSize: 29,
    fontWeight: "600",
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 15,
    alignSelf: "flex-start",
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginBottom: 25,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    textAlign: "center",
    fontSize: 20,
    marginRight: 6,
  },
  demoText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  resendText: {
    marginTop: 30,
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 30,
  },
  bottomContainer: {
    width: '100%',
    height: '50%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    flex: 1,
    justifyContent: 'flex-end',
  },
  button: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 25,
  },
  activeButton: {
    backgroundColor: "#0066FF",
  },
  disabledButton: {
    backgroundColor: "#A7C3FF",
  },
  buttonText: {
    width: '100%',
    textAlign: 'center',
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  changeNumber: {
    color: "#000",
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 30,
    textAlign: 'center'
  },
});

export default OtpCodeScreen;
