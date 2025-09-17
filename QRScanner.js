// app/components/QRScanner.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { X } from 'lucide-react';

const QRScanner = ({ onScan, onClose }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Camera Permission', 'Camera access is required for QR scanning.');
      }
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    // Validate address format (simple mock)
    if (!data.startsWith('0x')) {
      Alert.alert('Invalid QR Code', 'Scanned QR is not a valid wallet address.');
      setScanned(false);
      return;
    }

    onScan(data); // send scanned address to TransferScreen
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera. Please enable camera permission.</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Modal animationType="slide" transparent={false} visible={true}>
      <View style={styles.container}>
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <Text style={styles.title}>Scan Recipient QR</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <X size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.scannerFrame}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default QRScanner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeIcon: { padding: 5 },
  scannerFrame: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    marginVertical: 50,
    borderRadius: 12,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#00FF00',
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#00FF00',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#00FF00',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#00FF00',
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontWeight: 'bold' },
});
