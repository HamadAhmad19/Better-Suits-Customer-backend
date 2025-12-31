


import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
// import { createUser } from '../services/firestoreService';

const PasswordScreen = () => {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();

  const { phoneNumber } = route.params || {};
  // Validation
  const hasMinLength = password.length >= 9 && password.length <= 64;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const validConditionCount =
    [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length >= 2;

  const isValid = hasMinLength && validConditionCount;
 
  const handleBtn = async () =>{
  if (!isValid) {
    Alert.alert("Invalid Password", "Please meet all password requirements.");
    return;
  }

  if (!phoneNumber) {
    Alert.alert("Error", "Phone number not found. Please go back and try again.");
    return;
  }

  try {
    navigation.navigate('AddData', { 
      phoneNumber, 
      password 
    });
  } catch (error) {
    Alert.alert("Error", "Failed to continue. Please try again.");
    console.error('Error creating user:', error);
  }
};

  return (
    <View style={styles.container}>
      {/* TOP SECTION */}
      
      <View style={styles.header}>
        <Feather
         style = {styles.arrowIcon}
          name="arrow-left"
          size={22}
          color="black"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Set Password</Text>
      </View>

      {/* PASSWORD FIELD */}
      <View style={styles.inputWrapper}>
        <Feather name="lock" size={20} color="#6E6E6E" />
        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry={!showPass}
          value={password}
          onChangeText={setPassword}
        />
        <Feather
          name={showPass ? "eye" : "eye-off"}
          size={20}
          color="#6E6E6E"
          onPress={() => setShowPass(!showPass)}
        />
      </View>

      {/* "No password" text */}
      {!password ? (
        <Text style={styles.errorText}>No password</Text>
      ) : (
        <Text style={{ height: 18 }}></Text>
      )}

      {/* VALIDATION SECTION */}
      <View style={{ marginTop: 5 }}>
        <View style={styles.ruleRow}>
          <Feather name="check-circle" size={17} color="#6E6E6E" />
          <Text style={styles.ruleText}>Between 9 and 64 characters</Text>
        </View>

        <View style={styles.ruleRow}>
          <Feather name="check-circle" size={17} color="#6E6E6E" />
          <Text style={styles.ruleText}>Include at least two of the following:</Text>
        </View>

        <Text style={styles.subBullet}>• Uppercase letters</Text>
        <Text style={styles.subBullet}>• Lowercase letters</Text>
        <Text style={styles.subBullet}>• Numbers</Text>
        <Text style={styles.subBullet}>• Special characters</Text>
      </View>

      {/* BUTTON */}
      <TouchableOpacity
        style={[styles.button, isValid ? styles.activeButton : styles.disabledButton]}
        disabled={!isValid}
      >
        <Text style={styles.buttonText} onPress={handleBtn}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "column",
    // alignItems: "center",
    justifyContent:'flex-start',
    paddingTop: 30,
    marginBottom: 20,
  },
  arrowIcon:{
    width:'100%',
    paddingLeft:5,
    paddingTop:30,
   textAlign:'left',
   marginBottom:30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "500",
    // marginLeft: 20,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F6FA",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 20,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },

  errorText: {
    color: "#D10000",
    textAlign: "right",
    marginTop: 5,
    marginRight: 5,
    fontSize: 13,
    fontWeight:'600',
  },

  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  ruleText: {
    marginLeft: 8,
    fontSize: 11,
    color: "#4f4f4f",
    fontWeight:'600',
  },

  subBullet: {
    marginLeft: 30,
    marginTop: 1,
    fontSize: 11,
    color: "#4f4f4f",
    fontWeight:'600',
  },

  button: {
    // backgroundColor: "#0066FF",
    paddingVertical: 12,
    borderRadius: 12,
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    marginBottom: 20,
  },
activeButton: {
    backgroundColor: "#0066FF",
  },
  disabledButton: {
    backgroundColor: "#A7C3FF",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
  },
});