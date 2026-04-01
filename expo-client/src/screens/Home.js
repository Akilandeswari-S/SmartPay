import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GlobalStore } from '../GlobalStore';

export default function HomeScreen({ navigation }) {
  const [onlineBalance, setOnlineBalance] = useState(25000);
  const [offlineBalance, setOfflineBalance] = useState(2000);
  const [userName, setUserName] = useState('Alice');
  const [userId, setUserId] = useState('');

  useFocusEffect(
    useCallback(() => {
      setUserId(GlobalStore.userId || 'user_1');
      fetch(`https://smartpay-backend-js0v.onrender.com/api/user/wallet/${GlobalStore.userId}`)
        .then(res => res.json())
        .then(data => {
          setOnlineBalance(data.onlineBalance || 0);
          setOfflineBalance(data.offlineBalance || 0);
        })
        .catch(e => { setOnlineBalance(25000); setOfflineBalance(2000); });
      fetch(`http://localhost:3000/api/user/profile/${GlobalStore.userId}`)
        .then(res => res.json())
        .then(data => {
          setUserName(data.name || 'User');
        })
        .catch(e => { setUserName('Alice'); });
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>SmartPay</Text>
        <TouchableOpacity style={styles.profileBadge} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileBadgeText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.userCard}>
          <Text style={styles.userGreeting}>Hello, {userName || 'User'} 👋</Text>
          <Text style={styles.userIdText}>Account ID: {userId}</Text>
        </View>

        
        <View style={styles.gridRow}>
          <View style={[styles.balanceBox, { borderColor: '#007AFF', backgroundColor: 'rgba(0,122,255,0.05)' }]}>
            <Text style={styles.balanceLabel}>Online</Text>
            <Text style={styles.balanceAmount}>₹{onlineBalance}</Text>
          </View>
          <View style={[styles.balanceBox, { borderColor: '#00FFA3', backgroundColor: 'rgba(0,255,163,0.05)' }]}>
            <Text style={styles.balanceLabel}>Offline</Text>
            <Text style={styles.balanceAmount}>₹{offlineBalance}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.transferBtn} onPress={() => navigation.navigate('HybridWallet')}>
          <Text style={styles.transferBtnText}>⇌ Make a Self Transfer</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Main Hub</Text>
        
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.cardOnline} onPress={() => navigation.navigate('OnlinePayment')}>
            <Text style={styles.cardEmoji}>🌐</Text>
            <Text style={styles.cardTitle}>Online Transfer</Text>
            <Text style={styles.cardSub}>Instant Bank-to-Bank</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardOffline} onPress={() => navigation.navigate('OfflineMenu')}>
            <Text style={styles.cardEmoji}>📡</Text>
            <Text style={styles.cardTitle}>Offline Payment</Text>
            <Text style={styles.cardSub}>Bluetooth & SMS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridBlock} onPress={() => navigation.navigate('QRScanner')}>
            <Text style={styles.gridText}>📱 Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridBlock} onPress={() => navigation.navigate('GenerateQR')}>
            <Text style={styles.gridText}>🖼️ My QR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridBlock} onPress={() => navigation.navigate('History')}>
            <Text style={styles.gridText}>📜 History</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Tools</Text>

        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.toolBlock} onPress={() => navigation.navigate('BankLink')}>
            <Text style={styles.toolText}>🏦 Linked Banks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBlock} onPress={() => navigation.navigate('USSD')}>
            <Text style={styles.toolText}>📶 USSD Test</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBlock} onPress={() => navigation.navigate('PINVerification')}>
            <Text style={styles.toolText}>🔒 PIN Security</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
           <Text style={styles.logoutText}>Log Out Securely</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  profileBadge: { backgroundColor: '#1C1F26', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  profileBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  userCard: { backgroundColor: '#1C1F26', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  userGreeting: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  userIdText: { color: '#00FFA3', fontSize: 14, fontWeight: '600' },
  balanceBox: { flex: 1, padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  balanceLabel: { color: '#888', fontSize: 14, textTransform: 'uppercase', marginBottom: 5 },
  balanceAmount: { color: 'white', fontSize: 26, fontWeight: '800' },
  transferBtn: { backgroundColor: '#1C1F26', padding: 15, borderRadius: 12, alignItems: 'center', borderColor: '#333', borderWidth: 1, marginBottom: 30 },
  transferBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 15 },
  cardOnline: { flex: 1, backgroundColor: 'rgba(0, 122, 255, 0.1)', borderColor: '#007AFF', borderWidth: 1, padding: 20, borderRadius: 16 },
  cardOffline: { flex: 1, backgroundColor: 'rgba(0, 255, 163, 0.1)', borderColor: '#00FFA3', borderWidth: 1, padding: 20, borderRadius: 16 },
  cardEmoji: { fontSize: 32, marginBottom: 10 },
  cardTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  cardSub: { color: '#888', fontSize: 12 },
  gridBlock: { flex: 1, backgroundColor: '#1C1F26', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  gridText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  toolBlock: { flex: 1, backgroundColor: '#1C1F26', paddingVertical: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  toolText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  logoutBtn: { marginTop: 40, alignItems: 'center' },
  logoutText: { color: '#888', textDecorationLine: 'underline', fontSize: 16 }
});
