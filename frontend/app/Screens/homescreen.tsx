import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Greetings from Visionvoice!</Text>

      <TouchableOpacity
        style={[styles.button, styles.buttonUp]}
        onPress={() => router.push('/Screens/Camerascreen')}>
        <Text style={styles.buttonText}>Press Here</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonDown]}
        onPress={() => router.push('/Screens/Camerascreen')}>
        <Text style={styles.buttonText}>Press Here</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 100,
  },
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#AB8BFF',
  },
  buttonUp: {
    position: 'absolute',
    top: 50,
  },
  buttonDown: {
    position: 'absolute',
    bottom: 50,
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
