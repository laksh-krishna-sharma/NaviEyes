import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as Speech from 'expo-speech'; 

export default function HomeScreen() {
  const router = useRouter();
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    const speak = (text: string) => {
      Speech.speak(text, {
        voice: 'en-gb-x-sfg#female_1-local',
        pitch: 0.8,
        rate: 0.8,
      });
    };

    speak("You are on the Home screen. Press the button at the top to access the camera. Press the button at the bottom to use the voice-to-text feature.");

    return () => {
      Speech.stop();
    };
  }, []);

  const handleButtonPress = (screen: string) => {
    Speech.stop();
    router.push(screen);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.topHalfTouchable}
        onPress={() => handleButtonPress('/Screens/Camerascreen')}
      >
        <View style={[styles.button, styles.topButton]}>
          <View style={styles.buttonContent}>
            <FontAwesome name="camera" size={60} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Camera</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomHalfTouchable}
        onPress={() => handleButtonPress('/Screens/VoiceScreen')}
      >
        <View style={[styles.button, styles.bottomButton]}>
          <View style={styles.buttonContent}>
            <FontAwesome name="microphone" size={60} color="#1a1a1a" style={styles.icon} />
            <Text style={[styles.buttonText, { color: '#1a1a1a' }]}>Microphone</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.centerTextContainer}>
        <Text style={styles.centerText}>Greetings from NaviEyes!</Text>
        <View style={styles.divider} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
  },
  topHalfTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
    paddingBottom: 20,
    zIndex: 1,
  },
  bottomHalfTouchable: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-start',
    paddingTop: 20,
    zIndex: 1,
  },
  button: {
    width: 200,
    height: 400,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignSelf: 'center',
  },
  topButton: {
    backgroundColor: '#7B4DFF',
    height: 200,
    width: 350,
  },
  bottomButton: {
    backgroundColor: '#64B5F6',
    height: 200,
    width: 350,

  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  centerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 26,
    fontWeight: '600',
    marginTop: 15,
    color: '#fff',
    letterSpacing: 0.5,
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  divider: {
    height: 2,
    width: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 10,
  },
});