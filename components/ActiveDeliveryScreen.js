import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from "@react-navigation/native";
import { useAuth } from '../contexts/AuthContext';
const ActiveDeliveryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Deliveries</Text>
      </View>

      {/* Center Content */}
      <View style={styles.center}>
        <Image
          source={require('../assets/calendar.png')} // <--- your image here
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.noRidesText}>“ No rides yet! ”</Text>
      </View>

      {/* Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.orderButton} onPress={() => navigation.goBack()}>
          <Text style={styles.orderText}>Order a ride</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

export default ActiveDeliveryScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },

  image: {
    width: 120,
    height: 120,
    opacity: 0.9,
  },

  noRidesText: {
    fontSize: 17,
    marginTop: 25,
    color: "#555",

  },

  bottomButtonContainer: {
    width: "100%",
    paddingBottom: 20,
    marginBottom: 30,
  },

  orderButton: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingVertical: 12,
    borderRadius: 7,
    alignItems: "center",
  },

  orderText: {
    color: "#0254E8",
    fontSize: 14,
    fontWeight: "600",
  },
});
