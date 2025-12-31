import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from "@react-navigation/native";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useAuth } from '../contexts/AuthContext';

const SettingScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;

  const announcements = [
    {
      id: '1',
      title: 'Language Settings',
      icon: 'globe'

    },
    {
      id: '2',
      title: 'Appearance',
      icon: 'paint-roller'

    },
    {
      id: '3',
      title: 'Map Settings',
      icon: 'map-marked'
    },

  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity>
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <FontAwesome5 name={item.icon} size={24} color="#2b6ef2" />
        </View>

        {/* <View style={{ flex: 1 }}> */}
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{item.title}</Text>

        </View>

        {/* </View> */}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
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

export default SettingScreen;

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
    marginLeft: 90,
  },

  card: {
    flexDirection: "row",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
