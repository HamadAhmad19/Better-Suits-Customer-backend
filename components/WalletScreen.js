

import React, { useState } from 'react';

import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation, useRoute } from "@react-navigation/native";
import EvilIcons from '@expo/vector-icons/EvilIcons';
import Entypo from '@expo/vector-icons/Entypo';
import { useAuth } from '../contexts/AuthContext';

const WalletScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const phoneNumber = user?.phoneNumber;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddCreditModalVisible, setIsAddCreditModalVisible] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [isPaymentMethodModalVisible, setIsPaymentMethodModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        {/* <TouchableOpacity>
          <EvilIcons name="clock" size={30} color="black" />
        </TouchableOpacity> */}
      </View>

      {/* Total Balance Section */}
      <View style={styles.balanceSection}>
        <View style={styles.walletIcon}>
          <Entypo name="wallet" size={24} color="#fff" style={styles.walletImg} />
          <Text style={styles.header1}>Wallet</Text>
        </View>
        <View style={styles.label}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>$0.00</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {/* Redeem gift card */}
        <TouchableOpacity style={styles.menuItem} onPress={() => setIsModalVisible(true)}>
          <View style={styles.menuIconContainer}>
            <Feather name="gift" size={20} color="#0254E8" />
          </View>
          <Text style={styles.menuText}>Redeem gift card</Text>
        </TouchableOpacity>

        {/* Payment Method Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Payment Method</Text>
        </View>

        {/* Add payment method */}
        <TouchableOpacity style={styles.menuItem} onPress={() => setIsPaymentMethodModalVisible(true)}>
          <View style={styles.menuIconContainer}>
            <Entypo name="wallet" size={20} color="#0254E8" />
          </View>
          <Text style={styles.menuText}>Add payment method</Text>

        </TouchableOpacity>
      </View>

      {/* Add credit button at bottom */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.addCreditButton}
          onPress={() => setIsAddCreditModalVisible(true)}
        >
          <Entypo name="circle-with-plus" size={20} color="#fff" />
          <Text style={styles.addCreditText}>Add credit</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setIsModalVisible(false)}
            >
              <Feather name="x" size={22} color="#000" />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.modalIcon}>
              <Feather name="gift" size={40} color="#0254E8" />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Redeem gift card</Text>
            <Text style={styles.modalSubtitle}>
              Enter your gift card code to redeem it.
            </Text>

            {/* Input */}
            <TextInput
              placeholder="Enter gift card code"
              style={styles.input}
              placeholderTextColor="#aaa"
            />

            {/* Redeem Button */}
            <TouchableOpacity style={styles.redeemButton}>
              <Text style={styles.redeemButtonText}>Redeem</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* ADD CREDIT MODAL */}
      <Modal
        visible={isAddCreditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddCreditModalVisible(false)}
      >
        <View style={styles.addCreditModalOverlay}>
          <View style={styles.addCreditModalContainer}>
            <View style={{ flex: 1 }}>

              <ScrollView showsVerticalScrollIndicator={false}>



                {/* Close Button */}
                <TouchableOpacity
                  style={styles.addCreditCloseBtn}
                  onPress={() => setIsAddCreditModalVisible(false)}
                >
                  <Feather name="x" size={24} color="#000" />
                </TouchableOpacity>

                {/* Title */}
                <Text style={styles.addCreditTitle}>Add balance</Text>

                {/* Amount Buttons */}
                <Text style={styles.addCreditPaymentTitle1}>Select amount</Text>
                <View style={styles.addCreditAmountRow}>
                  <TouchableOpacity
                    style={[styles.addCreditAmountBox, selectedAmount === 10 && styles.boxSelected]}
                    onPress={() => setSelectedAmount(10)}
                  >
                    <Text style={styles.addCreditAmountText}>$10.00</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.addCreditAmountBox, selectedAmount === 20 && styles.boxSelected]}
                    onPress={() => setSelectedAmount(20)}
                  >
                    <Text style={styles.addCreditAmountText}>$20.00</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.addCreditAmountBox, selectedAmount === 50 && styles.boxSelected]}
                    onPress={() => setSelectedAmount(50)}
                  >
                    <Text style={styles.addCreditAmountText}>$50.00</Text>
                  </TouchableOpacity>
                </View>

                {/* Custom Amount */}
                <Text style={styles.addCreditPaymentTitle2}>Enter amount</Text>
                <View style={styles.addCreditCustomAmountBox}>
                  <TouchableOpacity
                    style={styles.addCreditPlusMinusBtn}
                    onPress={() => setSelectedAmount(Math.max(selectedAmount - 1, 1))}
                  >
                    <Feather name="minus" size={14} color="#000" />
                  </TouchableOpacity>

                  <Text style={styles.addCreditNumber}>{selectedAmount}</Text>

                  <TouchableOpacity
                    style={styles.addCreditPlusMinusBtn}
                    onPress={() => setSelectedAmount(selectedAmount + 1)}
                  >
                    <Feather name="plus" size={14} color="#000" />
                  </TouchableOpacity>
                </View>

                {/* Payment Method */}
                <Text style={styles.addCreditPaymentTitle}>Select payment method</Text>

                <TouchableOpacity style={styles.addCreditPaymentBox}>
                  <Feather name="credit-card" size={22} color="#0254E8" />
                  <Text style={styles.addCreditPaymentText}>Stripe</Text>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity style={styles.menuItem3}
                onPress={() => setIsPaymentMethodModalVisible(true)}
              >
                <View style={styles.menuIconContainer}>
                  <Entypo name="wallet" size={20} color="#0254E8" />
                </View>
                <Text style={styles.menuText}>Add payment method</Text>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity style={styles.addCreditConfirmBtn}>
                <Text style={styles.addCreditConfirmText}>Confirm & pay</Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity onPress={() => setIsAddCreditModalVisible(false)}>
                <Text style={styles.addCreditCancelText}>Cancel</Text>
              </TouchableOpacity>

            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isPaymentMethodModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPaymentMethodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addPaymentModal}>

            {/* Close */}
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

export default WalletScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    // justifyContent: '',
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 30,
  },
  header1: {
    fontSize: 17,
    fontWeight: "700",
    color: '#fff',
    marginLeft: 10,
  },
  walletImg: {
    padding: 8,
    backgroundColor: '#0284d6',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
  },
  walletIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceSection: {
    backgroundColor: '#0284d6',
    marginTop: 20,
    borderRadius: 14,
    marginBottom: 20,
    width: '100%',
    height: 160,
    padding: 20,

    justifyContent: 'space-between',
  },
  label: {
    marginTop: 20,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 2,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  menuContainer: {
    flex: 1,
  },
  sectionHeader: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
  },
  sectionHeaderText: {
    fontSize: 17,
    color: '#000',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  bottomContainer: {
    paddingVertical: 20,
  },
  addCreditButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    backgroundColor: '#0254E8',
    borderRadius: 8,
    marginBottom: 30,
  },
  addCreditText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.29)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: '#fff',
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },

  closeBtn: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },

  modalIcon: {
    backgroundColor: '#E7EEFF',
    padding: 18,
    borderRadius: 50,
    marginTop: 20,
  },

  modalTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  modalSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },

  input: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#F6F8FA',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    fontSize: 14,
    color: '#000',
  },

  redeemButton: {
    width: '100%',
    backgroundColor: '#4D80FF',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',

  },

  redeemButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',

  },

  cancelText: {
    marginTop: 20,
    fontSize: 15,
    color: '#0254E8',
    fontWeight: '600',
    marginBottom: 20,
  },
  // ADD CREDIT MODAL STYLES
  addCreditModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },

  addCreditModalContainer: {
    backgroundColor: '#fff',
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '100%',
  },

  addCreditCloseBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },

  addCreditTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    alignSelf: 'center',
  },

  addCreditAmountRow: {
    flexDirection: 'row',
    marginTop: 25,
    justifyContent: 'space-between'
  },

  addCreditAmountBox: {
    paddingVertical: 10,
    paddingHorizontal: 27,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ccc',

  },

  addCreditAmountBoxSelected: {
    paddingVertical: 10,
    paddingHorizontal: 27,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#6e6e6e',

  },

  addCreditAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  addCreditAmountTextSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  addCreditCustomAmountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
    marginTop: 25,
    padding: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'space-between',
  },

  addCreditPlusMinusBtn: {
    padding: 4,
    backgroundColor: '#e6e6e6',
    borderRadius: 10,
  },

  addCreditNumber: {
    marginHorizontal: 25,
    fontSize: 18,
    fontWeight: '700',
  },
  addCreditPaymentTitle1: {
    marginTop: 25,
    fontSize: 16,
    fontWeight: '600',
  },
  addCreditPaymentTitle2: {
    marginTop: 25,
    fontSize: 14,
    fontWeight: '600',
  },
  addCreditPaymentTitle: {
    marginTop: 25,
    fontSize: 16,
    fontWeight: '600',
  },

  addCreditPaymentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },

  addCreditPaymentText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },

  addCreditConfirmBtn: {
    marginTop: 25,
    backgroundColor: '#0254E8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  addCreditConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  menuItem3: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addCreditCancelText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000',
  },
  fixedBottomButtons: {
    paddingTop: 10,
    paddingBottom: 25,
    backgroundColor: '#fff',
  },
  boxSelected: {
    backgroundColor: '#e0e0e0',
    borderColor: '#6e6e6e',
    borderWidth: 1,
  },
  addPaymentModal: {
    backgroundColor: '#fff',
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    justifyContent: 'space-between', // This helps push content to top and bottom
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

  // New container for centered payment note
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

  // New container for bottom buttons
  paymentBottomContainer: {
    marginTop: 'auto', // Pushes to bottom
    //   paddingBottom: 10,
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

  // New style for cancel button in payment modal
  paymentCancelBtn: {
    alignItems: 'center',

    //   paddingVertical: 10,
  },

  paymentCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0254E8',
  },
});