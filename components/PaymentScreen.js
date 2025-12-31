import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useAuth } from '../contexts/AuthContext';

const PaymentMethodsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;
  const [isPaymentMethodModalVisible, setIsPaymentMethodModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment methods</Text>
      </View>

      <TouchableOpacity
        style={styles.addBox}
        onPress={() => setIsPaymentMethodModalVisible(true)}
      >
        <AntDesign name="plus" size={18} color="blue" />
        <Text style={styles.addText}>Add New Payment Method</Text>
      </TouchableOpacity>

      <Modal
        visible={isPaymentMethodModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPaymentMethodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addPaymentModal}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setIsPaymentMethodModalVisible(false)}
            >
              <Feather name="x" size={22} color="#000" />
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.addPaymentTitle}>Add payment method</Text>

            {/* Stripe Option */}
            <TouchableOpacity style={styles.paymentOption}>
              <Feather name="credit-card" size={22} color="#0254E8" />
              <Text style={styles.paymentText}>Stripe</Text>
              <Feather name="check-circle" size={22} color="#0254E8" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            {/* Instruction - Centered */}
            <View style={styles.paymentNoteContainer}>
              <Text style={styles.paymentNote}>
                You will be redirected to the payment gateway to complete the process.
              </Text>
            </View>

            {/* Bottom Buttons Container */}
            <View style={styles.paymentBottomContainer}>
              {/* Submit */}
              <TouchableOpacity style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                style={styles.paymentCancelBtn}
                onPress={() => setIsPaymentMethodModalVisible(false)}
              >
                <Text style={styles.paymentCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 80, // Adjusted for better centering
  },
  addBox: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 40,
    backgroundColor: '#F7F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  addText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6E6E6E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.29)',
    justifyContent: 'flex-end',
  },
  addPaymentModal: {
    backgroundColor: '#fff',
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    justifyContent: 'space-between',
  },
  // Added missing close button style
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  addPaymentTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F6F8FA',
    borderWidth: 1,
    borderColor: '#0254E8',
    padding: 14,
    borderRadius: 10,
    marginTop: 25,
  },
  paymentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginLeft: 10,
  },
  paymentNoteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  paymentNote: {
    fontSize: 13,
    textAlign: 'center',
    color: '#444',
    lineHeight: 18,
  },
  paymentBottomContainer: {
    marginTop: 'auto',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#0254E8',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  paymentCancelBtn: {
    alignItems: 'center',
  },
  paymentCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0254E8',
  },
});

export { PaymentMethodsScreen };