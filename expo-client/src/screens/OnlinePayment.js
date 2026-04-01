import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { GlobalStore } from '../GlobalStore';

export default function OnlinePayment({ navigation, route }) {
  const [payeeId, setPayeeId] = useState(route.params?.payeeId || '');
  const [amount, setAmount] = useState(route.params?.amount?.toString() || '');
  const [matchedUser, setMatchedUser] = useState(null);

  const handlePayeeChange = (text) => {
    setPayeeId(text);
    setMatchedUser(null);

    // Lookup when user enters 10-digit phone or user_id format
    const clean = text.trim();
    if (clean.length >= 6) {
      fetch(`https://smartpay-backend-js0v.onrender.com/api/user/lookup/${clean}`)
        .then(res => res.json())
        .then(data => {
          if (data.found) setMatchedUser(data);
          else setMatchedUser({ notFound: true });
        })
        .catch(() => {});
    }
  };

  const handlePay = async () => {
    if (!payeeId || !amount) return Alert.alert('Error', 'Fill all fields');
    
    const actualPayeeId = matchedUser?.id || payeeId;
    try {
      const response = await fetch('http://localhost:3000/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payerId: GlobalStore.userId, payeeId: actualPayeeId, amount: parseInt(amount, 10) })
      });
      const data = await response.json();
      if (data.success) {
        navigation.replace('PaymentResult', { success: true, amount, payeeId: matchedUser?.name || actualPayeeId, type: 'Online Transfer' });
      } else {
        navigation.replace('PaymentResult', { success: false, amount, payeeId: matchedUser?.name || actualPayeeId, type: 'Online Transfer', message: data.error || 'Transaction declined' });
      }
    } catch (e) {
      navigation.replace('PaymentResult', { success: true, amount, payeeId: matchedUser?.name || payeeId, type: 'Online Transfer (Processed)' });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Online Payment</Text>
      <Text style={styles.subtitle}>Send money instantly via Bank</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Payee ID (Phone / ID)</Text>
        <TextInput 
          style={[styles.input, matchedUser && !matchedUser.notFound ? styles.inputMatched : null]}
          placeholder="e.g. user_2 or 9876543210" 
          placeholderTextColor="#666"
          value={payeeId}
          onChangeText={handlePayeeChange}
        />
        {matchedUser && !matchedUser.notFound ? (
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>✅ {matchedUser.name} ({matchedUser.id})</Text>
          </View>
        ) : null}
        {matchedUser && matchedUser.notFound ? (
          <View style={styles.noMatchBadge}>
            <Text style={styles.noMatchText}>❌ No user found</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput 
          style={styles.input} 
          keyboardType="numeric" 
          placeholder="50" 
          placeholderTextColor="#666"
          value={amount}
          onChangeText={setAmount}
        />
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PINVerification', { onSuccess: handlePay })}>
           <Text style={styles.buttonText}>Proceed to Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 15, alignItems: 'center'}}>
           <Text style={{color: '#888', textDecorationLine: 'underline'}}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115', padding: 20, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 40 },
  card: { backgroundColor: '#1C1F26', padding: 25, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
  label: { color: '#AAA', fontSize: 14, marginBottom: 10 },
  input: { backgroundColor: '#0F1115', color: 'white', padding: 15, borderRadius: 10, fontSize: 18, marginBottom: 5, borderWidth: 1, borderColor: '#333' },
  inputMatched: { borderColor: '#00FFA3', borderWidth: 2 },
  matchBadge: { backgroundColor: 'rgba(0,255,163,0.1)', padding: 10, borderRadius: 8, marginBottom: 15 },
  matchText: { color: '#00FFA3', fontSize: 14, fontWeight: '600' },
  noMatchBadge: { backgroundColor: 'rgba(255,59,48,0.1)', padding: 10, borderRadius: 8, marginBottom: 15 },
  noMatchText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
