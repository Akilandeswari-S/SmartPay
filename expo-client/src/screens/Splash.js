import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    // Simulate initial authentication check or network load
    const timer = setTimeout(() => {
      navigation.replace('Login'); // Navigate to Login automatically after 2.5 seconds
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SmartPay</Text>
      <Text style={styles.subtitle}>Secure Hybrid Offline Wallet</Text>
      <ActivityIndicator size="large" color="#00FFA3" style={{ marginTop: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#00FFA3',
    letterSpacing: 2
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
    letterSpacing: 1
  }
});
