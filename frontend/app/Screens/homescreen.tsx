import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.topButton]}
        onPress={() => router.push('/Screens/Camerascreen')}>
        <FontAwesome name="camera" size={50} color="#fff" />
        <Text style={styles.buttonText}>Camera</Text>
      </TouchableOpacity>

      <View style={styles.centerTextContainer}>
        <Text style={styles.centerText}>Greetings  from  NaviEyes !</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.bottomButton]}
        onPress={() => router.push('/Screens/Camerascreen')}>
        <FontAwesome name="microphone" size={50} color="#000" />
        <Text style={[styles.buttonText, { color: '#000' }]}>Microphone</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  button: {
    width: '90%',
    alignSelf: 'center',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    paddingVertical: 30,
    marginVertical: 10,
  },
  topButton: {
    flex: 1,
    backgroundColor: '#AB8BFF',
    marginTop: 20,
  },
  bottomButton: {
    flex: 1,
    backgroundColor: '#ADD8E6',
    marginBottom: 20,
  },
  centerTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#fff',
  },
});
