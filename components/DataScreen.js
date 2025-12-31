

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  BackHandler
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import { createFullUser } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
const DataScreen = () => {


  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber, password } = route.params || {};
  const { login } = useAuth(); // Get login function
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [processing, setProcessing] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent going back
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    setIsFormValid(validateForm());
  }, [firstName, lastName, email, gender]);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!firstName || !lastName || !email || !gender) return false;
    if (!emailRegex.test(email)) return false;

    return true;
  };


  const handleBtn = async () => {
    if (!firstName || !lastName || !email || !gender) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setProcessing(true);
    try {
      const userData = {
        phoneNumber,
        password,
        firstName,
        lastName,
        email,
        gender,

      };

      await createFullUser(userData);

      navigation.navigate("SuccessLogin", { phoneNumber });

      await login(userData);
    } catch (error) {
      Alert.alert("Error", "Failed to save profile. Please try again.");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* TOP SECTION */}

      <View style={styles.header}>
        <Feather
          style={styles.arrowIcon}
          name="arrow-left"
          size={22}
          color="black"
          onPress={() => navigation.navigate('Started')}
        />
        <Text style={styles.headerTitle}>Enter name</Text>
      </View>

      {/* PASSWORD FIELD */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="First Name"
          placeholderTextColor={"#8E8E8E"}
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Last Name"
          placeholderTextColor={"#8E8E8E"}
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
        />
      </View>
      <View style={[
        styles.inputWrapper,
        emailError ? { borderColor: "red", borderWidth: 1 } : {}
      ]}>

        <TextInput
          placeholder="Email"
          placeholderTextColor={"#8E8E8E"}
          style={styles.input}
          value={email}
          onChangeText={(text) => {
            setEmail(text);

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(text)) {
              setEmailError("Invalid email format");
            } else {
              setEmailError("");
            }
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {emailError ? (
        <Text style={{ color: "red", marginBottom: 10 }}>{emailError}</Text>
      ) : null}

      <View style={styles.radioBtn}>
        <TouchableOpacity style={styles.radioContainer} onPress={() => setGender('male')}>
          <View style={[styles.radio, gender === 'male' && styles.radioSelected]} />
          <Text style={styles.radioText}>Male</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.radioContainer} onPress={() => setGender('female')}>
          <View style={[styles.radio, gender === 'female' && styles.radioSelected]} />
          <Text style={styles.radioText}>Female</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.radioContainer} onPress={() => setGender('neutral')}>
          <View style={[styles.radio, gender === 'neutral' && styles.radioSelected]} />
          <Text style={styles.radioText}>Neutral/Unknown</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          isFormValid ? styles.activeButton : styles.disabledButton,
          { opacity: processing ? 0.7 : 1 }
        ]}
        onPress={handleBtn}
        disabled={!isFormValid || processing}
      >
        <Text style={styles.buttonText}>
          {processing ? "Saving..." : "Save changes"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default DataScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "column",
    // alignItems: "center",
    justifyContent: 'flex-start',
    paddingTop: 30,
    marginBottom: 20,
  },
  arrowIcon: {
    width: '100%',
    paddingLeft: 5,
    paddingTop: 30,
    textAlign: 'left',
    marginBottom: 30,
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
    paddingHorizontal: 4,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 20,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },

  radioBtn: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  radio: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#8E8E8E',
    borderRadius: 10,
    marginHorizontal: 10,
  },
  radioText: {
    color: '#000',
    fontSize: 17,
  },
  radioSelected: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
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
