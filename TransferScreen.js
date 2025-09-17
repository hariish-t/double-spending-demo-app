// app/screens/TransferScreen.js
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { WalletContext } from "../context/WalletContext";
import QRScanner from "../components/QRScanner";
import Colors from "../theme/colors";
import { formatCurrency } from "../utils/format";

const TransferScreen = () => {
  const {
    walletAddress,
    balance,
    sendOnline,
    sendBluetooth,
    pendingTransfers,
    confirmBluetoothTransfer,
    simulateDoubleSpending,
  } = useContext(WalletContext);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isQRVisible, setIsQRVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  /** Input Validation */
  const validateInputs = () => {
    const amt = parseFloat(amount);
    if (!recipient.trim()) return { valid: false, msg: "Recipient required." };
    if (isNaN(amt) || amt <= 0)
      return { valid: false, msg: "Enter a valid amount." };
    return { valid: true, amt };
  };

  /** Handle QR Scan */
  const handleQRScan = (address) => {
    setRecipient(address);
    setIsQRVisible(false);
  };

  /** Online Transfer */
  const handleSendOnline = async () => {
    const { valid, msg, amt } = validateInputs();
    if (!valid) return Alert.alert("Invalid Input", msg);

    setLoading(true);
    const success = await sendOnline(recipient.trim(), amt);
    setLoading(false);

    if (success) {
      Alert.alert("Success", `Sent ${formatCurrency(amt)} to ${recipient}`);
      setRecipient("");
      setAmount("");
    } else {
      Alert.alert("Failed", "Could not complete online transfer.");
    }
  };

  /** Bluetooth Transfer */
  const handleSendBluetooth = async () => {
    const { valid, msg, amt } = validateInputs();
    if (!valid) return Alert.alert("Invalid Input", msg);

    setLoading(true);
    const success = await sendBluetooth(recipient.trim(), amt);
    setLoading(false);

    if (success) {
      Alert.alert(
        "Pending",
        `Prepared ${formatCurrency(amt)} for Bluetooth transfer.\nConfirm later.`
      );
      setRecipient("");
      setAmount("");
    } else {
      Alert.alert("Failed", "Bluetooth transfer preparation failed.");
    }
  };

  /** Pending Transfer Renderer */
  const renderPendingTransfer = ({ item }) => (
    <View style={styles.pendingItem}>
      <Text style={styles.pendingText}>
        {formatCurrency(item.amount)} → {item.to} ({item.status})
      </Text>
      <View style={styles.pendingButtons}>
        {item.status === "pending" && (
          <>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => confirmBluetoothTransfer(item.id)}
            >
              <Text style={styles.btnText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.doubleBtn}
              onPress={() => simulateDoubleSpending(item.id)}
            >
              <Text style={styles.btnText}>Double Spend</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Wallet Info */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
        <Text style={styles.addressLabel}>Wallet Address</Text>
        <Text style={styles.addressValue}>{walletAddress}</Text>
      </View>

      {/* Recipient */}
      <Text style={styles.label}>Recipient Address</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Enter or scan QR"
          value={recipient}
          onChangeText={setRecipient}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => setIsQRVisible(true)}
        >
          <Text style={styles.qrText}>Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="0.0"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      {/* Actions */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.success }]}
          onPress={handleSendOnline}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Send Online</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.warning }]}
          onPress={handleSendBluetooth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Send Bluetooth</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Pending Bluetooth Transfers */}
      <View style={styles.pendingContainer}>
        <Text style={styles.sectionTitle}>Pending Bluetooth Transfers</Text>
        {pendingTransfers.length === 0 ? (
          <Text style={styles.noPending}>No pending transfers</Text>
        ) : (
          <FlatList
            data={pendingTransfers}
            keyExtractor={(item) => item.id}
            renderItem={renderPendingTransfer}
          />
        )}
      </View>

      {/* QR Scanner */}
      {isQRVisible && (
        <QRScanner onScan={handleQRScan} onClose={() => setIsQRVisible(false)} />
      )}
    </View>
  );
};

export default TransferScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  balanceCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  balanceLabel: { fontSize: 14, color: Colors.muted },
  balanceValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.success,
    marginVertical: 5,
  },
  addressLabel: { fontSize: 12, color: Colors.muted },
  addressValue: { fontSize: 12, color: Colors.text },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 15, color: Colors.text },
  row: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    marginLeft: 10,
    borderRadius: 8,
  },
  qrText: { color: "#fff", fontWeight: "bold" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  actionBtn: {
    flex: 0.48,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  pendingContainer: { flex: 1, marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  noPending: { fontStyle: "italic", color: Colors.muted },
  pendingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  pendingText: { flex: 1, fontSize: 14, color: Colors.text },
  pendingButtons: { flexDirection: "row" },
  confirmButton: {
    backgroundColor: Colors.success,
    padding: 8,
    borderRadius: 6,
    marginLeft: 5,
  },
  doubleBtn: {
    backgroundColor: Colors.danger,
    padding: 8,
    borderRadius: 6,
    marginLeft: 5,
  },
});
