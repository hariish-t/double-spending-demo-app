// app/screens/WelcomeScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { WalletContext } from '../context/WalletContext';
import { Ionicons } from '@expo/vector-icons';

const WelcomeScreen = ({ navigation }) => {
  const {
    walletAddress,
    balance,
    notifications,
    generateWalletAddress,
  } = useContext(WalletContext);

  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    // Show last 5 notifications
    setRecentNotifications(notifications.slice(0, 5));
  }, [notifications]);

  const handleGenerateNewWallet = () => {
    Alert.alert(
      'Generate New Wallet',
      'Are you sure you want to generate a new wallet? Your current data will be reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: () => {
            generateWalletAddress();
            Alert.alert('Wallet Generated', 'A new wallet has been created.');
          },
        },
      ]
    );
  };

  const renderNotification = ({ item }) => (
    <View style={styles.notificationItem}>
      <Ionicons
        name={item.method === 'online' ? 'cloud-outline' : 'bluetooth-outline'}
        size={20}
        color={item.type === 'received' ? '#4CAF50' : '#F44336'}
        style={{ marginRight: 10 }}
      />
      <Text style={styles.notificationText}>
        {item.type === 'received' ? 'Received' : 'Sent'} {item.amount} coins
        {item.method === 'online' ? ' online' : ' via Bluetooth'} from{' '}
        {item.from.slice(0, 6)}...
      </Text>
      <Text style={styles.notificationDate}>{item.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Wallet Info */}
      <View style={styles.walletCard}>
        <Text style={styles.title}>My Wallet</Text>
        <Text style={styles.address}>{walletAddress || 'Loading...'}</Text>
        <Text style={styles.balance}>Balance: {balance} coins</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleGenerateNewWallet}
        >
          <Text style={styles.buttonText}>Generate New Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Transfer')}
        >
          <Text style={styles.navButtonText}>Send Coins</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('ActivityLogs')}
        >
          <Text style={styles.navButtonText}>Transaction History</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Notifications */}
      <View style={styles.notificationsContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentNotifications.length === 0 ? (
          <Text style={styles.noNotifications}>No recent activity</Text>
        ) : (
          <FlatList
            data={recentNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
          />
        )}
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    padding: 20,
  },
  walletCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  address: { fontSize: 14, color: '#ccc', marginBottom: 10 },
  balance: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  button: {
    marginTop: 15,
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },

  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  navButtonText: { color: '#1E1E1E', fontWeight: 'bold', fontSize: 16 },

  notificationsContainer: {
    flex: 1,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  noNotifications: { color: '#777', fontStyle: 'italic' },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  notificationText: { fontSize: 14, flex: 1 },
  notificationDate: { fontSize: 10, color: '#999', marginLeft: 5 },
});
