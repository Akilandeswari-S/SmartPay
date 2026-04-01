import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GlobalStore } from '../GlobalStore';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetch(`http://localhost:3000/api/history/${GlobalStore.userId}`)
        .then(res => res.json())
        .then(data => {
          setHistory(data.history || []);
          setLoading(false);
        })
        .catch(e => {
          // Fallback demo transactions if backend unreachable
          setHistory([
            { id: 'demo_1', type: 'ONLINE', amount: 500, payerId: 'user_1', payeeId: 'user_2', timestamp: '2026-03-19T10:30:00' },
            { id: 'demo_2', type: 'ONLINE', amount: 200, payerId: 'user_2', payeeId: 'user_1', timestamp: '2026-03-19T11:45:00' },
            { id: 'demo_3', type: 'OFFLINE_BLE_SYNC', amount: 100, payerId: 'user_1', payeeId: 'user_2', timestamp: '2026-03-19T14:20:00' },
            { id: 'demo_4', type: 'SMS_FALLBACK', amount: 50, payerId: 'user_1', payeeId: 'user_2', timestamp: '2026-03-19T16:00:00' },
            { id: 'demo_5', type: 'ONLINE', amount: 750, payerId: 'user_2', payeeId: 'user_1', timestamp: '2026-03-18T09:15:00' },
          ]);
          setLoading(false);
        });
    }, [])
  );

  const getTypeLabel = (type) => {
    switch(type) {
      case 'ONLINE': return '🌐 Online';
      case 'OFFLINE_BLE_SYNC': return '📡 Bluetooth';
      case 'SMS_FALLBACK': return '📱 SMS';
      default: return type;
    }
  };

  const isSent = (item) => {
    return item.payerId === GlobalStore.userId || item.payerId === 'user_1';
  };

  const formatDate = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch(e) {
      return ts;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: '#888', marginTop: 15 }}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction History</Text>
      <Text style={styles.subtitle}>{history.length} transaction{history.length !== 1 ? 's' : ''}</Text>
      
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <FlatList 
          data={history}
          keyExtractor={item => item.id}
          renderItem={({item}) => {
            const sent = isSent(item);
            return (
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardIcon}>{sent ? '⬆️' : '⬇️'}</Text>
                </View>
                <View style={styles.cardCenter}>
                  <Text style={styles.cardTitle}>
                    {sent ? `To: ${item.payeeId}` : `From: ${item.payerId}`}
                  </Text>
                  <Text style={styles.cardSubtitle}>{getTypeLabel(item.type)} • {formatDate(item.timestamp)}</Text>
                </View>
                <Text style={[styles.amount, { color: sent ? '#FF3C3C' : '#00FFA3' }]}>
                  {sent ? '-' : '+'}₹{item.amount}
                </Text>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115', padding: 20, paddingTop: 50 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  card: { backgroundColor: '#1C1F26', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  cardLeft: { marginRight: 12 },
  cardIcon: { fontSize: 24 },
  cardCenter: { flex: 1 },
  cardTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { color: '#888', fontSize: 12, marginTop: 4 },
  amount: { fontSize: 18, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 50, marginBottom: 15 },
  emptyText: { color: '#888', fontSize: 16 },
  backButton: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  backButtonText: { color: '#888', fontSize: 16, fontWeight: 'bold' },
});
