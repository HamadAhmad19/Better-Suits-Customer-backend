
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
// import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
const HomeScreen = () => {
   const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {/* Top Car Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={require("../assets/Car6.png")}
          style={styles.image}
          resizeMode="cover"
        />

      
        <LinearGradient
          colors={["transparent", "white"]}
          style={styles.gradient}
        />
      </View>

      {/* Bottom White Section */}
      <View style={styles.bottomContainer}>
        <Text style={styles.title}>Welcome to Five Stars Galway Taxis!</Text>
        <Text style={styles.subtitle}>
          Taxi service designed for your comfort. Enjoy trips with your favorite
          drivers and select your ride preferences
        </Text>

        <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate("Started")}>
          <Text style={styles.startButtonText}>Let's Get Started</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity onPress={() => navigation.navigate("Skip")}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  imageContainer: {
    flex: 0.7,
    // width:'120%',
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  gradient: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 130,
  },

  bottomContainer: {
    paddingTop: 10,
    flex: 0.4,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingHorizontal: 23,
    justifyContent: "center",
    paddingBottom: 30,
    opacity: 1,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 10,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 26,
    lineHeight: 22,
  },

  startButton: {
    backgroundColor: "#0254E8",
    borderRadius: 8,
    width: "100%",
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 10,
  },

  startButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  skipText: {
    color: "#0254E8",
    fontSize: 15,
    fontWeight: "500",
  },
});