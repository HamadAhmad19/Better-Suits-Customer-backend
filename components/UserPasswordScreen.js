

import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import { verifyPassword } from '../services/apiService';
import { sendOtp } from '../services/otpService';

const UserPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber } = route.params || {};

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleContinue = async () => {
    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    setProcessing(true);
    try {
      const user = await verifyPassword(phoneNumber, password);
      if (user) {
        console.log(phoneNumber)
        navigation.navigate("SuccessLogin", { phoneNumber });
      } else {
        Alert.alert("Error", "Invalid password");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to verify password. Please try again.");
      console.error('Error verifying password:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUseOtp = async () => {
    setProcessing(true);
    try {
      const otpResult = await sendOtp(phoneNumber);
      if (otpResult.success) {
        navigation.navigate('Otp2', { phoneNumber });
      } else {
        Alert.alert('Error', otpResult.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      console.error('Error sending OTP:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={22} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Enter password</Text>
      <Text style={styles.subtitle}>Please enter your password to continue</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter password"
          secureTextEntry={!passwordVisible}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          <Feather name={passwordVisible ? "eye" : "eye-off"} size={22} color="#6E6E6E" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.button, { opacity: (password && !processing) ? 1 : 0.5 }]}
          disabled={!password || processing}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>
            {processing ? "Verifying..." : "Continue"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.otpButton}
          onPress={handleUseOtp}
          disabled={processing}
        >
          <Text style={styles.otpText}>{processing ? "Sending OTP..." : "Use OTP instead"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  backBtn: {
    marginBottom: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "#7C7C7C",
    marginBottom: 30,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F4F8",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
  },

  input: {
    flex: 1,
    fontSize: 16,
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 50,
  },
  button: {
    backgroundColor: "#0066FF",
    paddingVertical: 15,
    borderRadius: 12,
    // marginTop: 250,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  otpButton: {
    marginTop: 25,
    alignItems: "center",
  },

  otpText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "500",
  },
});
