import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from "@react-navigation/native";
import { useAuth } from '../contexts/AuthContext';

const AnnouncementScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;

  const announcements = [
    {
      id: '1',
      title: 'Hello',
      subtitle: 'Hi There',
      time: 'Saturday, 4:13 PM',
      ago: '2815h ago',
    },
    {
      id: '2',
      title: 'Holiday Offers',
      subtitle: 'Up to 25% Off',
      time: 'Sunday, 5:00 AM',
      ago: '3105h ago',
    },
    {
      id: '3',
      title: 'Special Drink',
      subtitle: 'Get Drinks at %20 Discount',
      time: 'Sunday, 5:00 AM',
      ago: '3105h ago',
    },
    {
      id: '4',
      title: 'Super Delicious',
      subtitle: 'Get Delicious burgers at %20 Discount',
      time: 'Sunday, 5:00 AM',
      ago: '3105h ago',
    },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name="check-decagram" size={28} color="#2b6ef2" />
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.ago}>{item.ago}</Text>
        </View>

        <Text style={styles.time}>{item.time}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
      </View>

      {/* Announcements List */}
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 20 }}
      />
    </View>
  );
};

export default AnnouncementScreen;

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
    marginLeft: 60,
  },

  card: {
    flexDirection: "row",
    paddingVertical: 15,

  },

  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  time: {
    fontSize: 12,
    color: "#555",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
    color: "#444",
  },
  ago: {
    fontSize: 12,
    color: "#666",
  },
});
