import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { GlobalStore } from '../GlobalStore';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetch(`https://smartpay-backend-js0v.onrender.com/api/user/profile/${GlobalStore.userId}`)
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch profile", err);
          setLoading(false);
        });
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{profile?.name || 'Not Set'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email Address</Text>
          <Text style={styles.value}>{profile?.email || 'Not Set'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Mobile Number</Text>
          <Text style={styles.value}>{profile?.phone || 'Not Set'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date of Birth</Text>
          <Text style={styles.value}>{profile?.dob || 'Not Set'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>KYC Status</Text>
          <Text style={[styles.value, { color: profile?.kycStatus === 'VERIFIED' ? '#00FFA3' : '#FF3B30' }]}>
            {profile?.kycStatus || 'PENDING'}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={() => navigation.navigate('EditProfile', { profile })}
      >
        <Text style={styles.primaryButtonText}>Edit Profile Details</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => navigation.navigate('BankLink')}
      >
        <Text style={styles.secondaryButtonText}>Manage Linked Banks</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 30, alignItems: 'center'}}>
        <Text style={{color: '#888', textDecorationLine: 'underline'}}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115', padding: 20, justifyContent: 'center' },
  center: { flex: 1, backgroundColor: '#0F1115', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 20 },
  card: { backgroundColor: '#1C1F26', padding: 25, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginBottom: 30 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  label: { color: '#AAA', fontSize: 16 },
  value: { color: 'white', fontSize: 16, fontWeight: '500' },
  primaryButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#1C1F26', padding: 18, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  secondaryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
