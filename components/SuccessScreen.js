// import React, { useEffect } from "react";
// import { View, Text, StyleSheet, Image, TouchableOpacity, BackHandler} from "react-native";
// import { useNavigation,useRoute } from "@react-navigation/native";

// const SuccessScreen = () => {
//   const navigation = useNavigation();
//    const route = useRoute();

//   const { phoneNumber } = route.params || {};

//   useEffect(() => {
//     const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
//       return true; // Prevent going back
//     });

//     return () => backHandler.remove();
//   }, []);

//   const handleContinue = () => {
//     console.log('Phone:',{phoneNumber})
//     navigation.navigate("MapPage", { phoneNumber });
//   };

//   return (
//     <View style={styles.container}>

//       {/* Success Icon */}
//       <View style={styles.iconContainer}>
//         <View style={styles.circle}>
//           <Text style={styles.check}>✔</Text>
//         </View>
//       </View>

//       {/* Text Section */}
//       <Text style={styles.title}>Signed in successfully!</Text>
//       <Text style={styles.subtitle}>You can now start using the app</Text>

//       {/* Continue Button */}
//       <TouchableOpacity style={styles.button} onPress={handleContinue}>
//         <Text style={styles.buttonText}>Continue</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default SuccessScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 20,
//   },

//   iconContainer: {
//     marginBottom: 15,
//     width: 70,
//   height: 70,
//   backgroundColor: "#ebfcf2", // light green like screenshot
//   borderRadius: 55,
//   alignItems: "center",
//   justifyContent: "center",

//   },

//   circle: {
//     width: 50,
//     height: 50,
//     backgroundColor: "#b8f5d1",
//     borderRadius: 40,
//     alignItems: "center",
//     justifyContent: "center",


//   },

//   check: {
//     fontSize: 20,
//     color: "#22C55E",
//     fontWeight: "bold",
//   },

//   title: {
//     fontSize: 21,
//     fontWeight: "700",
//     marginTop: 10,
//   },

//   subtitle: {
//     fontSize: 14,
//     color: "#7C7C7C",
//     marginTop: 5,
//   },

//   button: {
//     backgroundColor: "#0066FF",
//     paddingVertical: 14,
//     borderRadius: 12,
//     marginBottom:20,
//     width: "100%",
//     position: "absolute",
//     bottom: 40,
//     left: 20,
//     right: 20,
//   },

//   buttonText: {
//     color: "#fff",
//     fontSize: 16,
//     textAlign: "center",
//     fontWeight: "500",
//   },
// });











import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, BackHandler } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from '../contexts/AuthContext';
const SuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, login } = useAuth();
  const { phoneNumber } = route.params || {};

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent going back
    });

    return () => backHandler.remove();
  }, []);

  // const handleContinue = () => {
  //   console.log('Phone:',{phoneNumber})
  //   navigation.navigate("MapPage", { phoneNumber });
  // };

  const handleContinue = async () => {
    // Only login if not already logged in
    if (!user && phoneNumber) {
      await login({ phoneNumber });
    }
    navigation.navigate('MapPage');
  };

  return (
    <View style={styles.container}>

      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.circle}>
          <Text style={styles.check}>✔</Text>
        </View>
      </View>

      {/* Text Section */}
      <Text style={styles.title}>Signed in successfully!</Text>
      <Text style={styles.subtitle}>You can now start using the app</Text>

      {/* Continue Button */}
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SuccessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  iconContainer: {
    marginBottom: 15,
    width: 70,
    height: 70,
    backgroundColor: "#ebfcf2", // light green like screenshot
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",

  },

  circle: {
    width: 50,
    height: 50,
    backgroundColor: "#b8f5d1",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",


  },

  check: {
    fontSize: 20,
    color: "#22C55E",
    fontWeight: "bold",
  },

  title: {
    fontSize: 21,
    fontWeight: "700",
    marginTop: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "#7C7C7C",
    marginTop: 5,
  },

  button: {
    backgroundColor: "#0066FF",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
});
