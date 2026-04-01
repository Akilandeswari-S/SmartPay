import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { GlobalStore } from '../GlobalStore';

export default function SMSSimulation({ navigation }) {
  const [payeeId, setPayeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [matchedUser, setMatchedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (text) => {
    setPayeeId(text);
    setMatchedUser(null);

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

  const handleSendSMS = () => {
    const amountNum = parseFloat(amount);
    if (!payeeId || isNaN(amountNum) || amountNum <= 0) {
      return Alert.alert('Error', 'Enter details first.');
    }
    if (amountNum > 2000) {
      return Alert.alert('Offline Limit Exceeded', 'The maximum allowed limit for an offline SMS transaction is ₹2,000. Please enter a lower amount.');
    }
    setLoading(true);
    const resolvedPayeeId = matchedUser?.id || payeeId;
    fetch('https://smartpay-backend-js0v.onrender.com/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payerId: GlobalStore.userId,
        payeeId: resolvedPayeeId,
        amount: amountNum,
        nonce: `sms_${Date.now()}`,
        signature: 'SIMULATED_SMS_SIG',
        timestamp: new Date().toISOString(),
      }),
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          navigation.replace('PaymentResult', { success: true, amount: amountNum.toString(), payeeId: matchedUser?.name || payeeId, type: 'SMS Fallback' });
        } else {
          Alert.alert('Transfer Failed', data.error || 'Something went wrong.');
        }
      })
      .catch(() => {
        setLoading(false);
        Alert.alert('Network Error', 'Could not reach the server.');
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SMS Fallback</Text>
      <Text style={styles.subtitle}>No Bluetooth? Send payment data via SMS</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Payee Phone Number or User ID</Text>
        <TextInput 
          style={[styles.input, matchedUser && !matchedUser.notFound ? styles.inputMatched : null]}
          placeholder="e.g. 9876543210 or user_2" 
          placeholderTextColor="#666"
          value={payeeId}
          onChangeText={handlePhoneChange}
        />
        {matchedUser && !matchedUser.notFound ? (
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>✅ {matchedUser.name} ({matchedUser.id})</Text>
          </View>
        ) : null}
        {matchedUser && matchedUser.notFound ? (
          <View style={styles.noMatchBadge}>
            <Text style={styles.noMatchText}>❌ No user found with this number</Text>
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
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PINVerification', { onSuccess: handleSendSMS })}>
           <Text style={styles.buttonText}>Generate & Send SMS</Text>
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
  subtitle: { fontSize: 16, color: '#FF9500', marginBottom: 40 },
  card: { backgroundColor: '#1C1F26', padding: 25, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
  label: { color: '#AAA', fontSize: 14, marginBottom: 10 },
  input: { backgroundColor: '#0F1115', color: 'white', padding: 15, borderRadius: 10, fontSize: 18, marginBottom: 5, borderWidth: 1, borderColor: '#333' },
  inputMatched: { borderColor: '#00FFA3', borderWidth: 2 },
  matchBadge: { backgroundColor: 'rgba(0,255,163,0.1)', padding: 10, borderRadius: 8, marginBottom: 15 },
  matchText: { color: '#00FFA3', fontSize: 14, fontWeight: '600' },
  noMatchBadge: { backgroundColor: 'rgba(255,59,48,0.1)', padding: 10, borderRadius: 8, marginBottom: 15 },
  noMatchText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },
  button: { backgroundColor: '#FF9500', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
