import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, Image } from 'react-native';
import * as Animatable from 'react-native-animatable';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    Speech.speak('Welcome user, please wait a moment until the app loads.', {
      voice: 'en-gb-x-sfg#female_1-local',
      pitch: 0.8,
      rate: 0.8,
    });

    const timer = setTimeout(() => {
      Speech.speak('Hi user, your app is loaded successfully', {
        voice: 'en-us-x-sfg#female_1-local',
        pitch: 0.8,
        rate: 0.8,
      });

      setTimeout(() => {
        Speech.speak('I will now update you with features on the Home screen. To access the camera, tap the button at the top of the screen. To use the voice-to-text feature, tap the button at the bottom of the screen.', {
          voice: 'en-gb-x-sfg#female_1-local',
          pitch: 0.8,
          rate: 0.8,
        });

        router.replace('/Screens/homescreen');
      }, 2000);

    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ImageBackground
      source={require('../assets/images/bg.png')}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Animatable.View 
          animation="zoomIn"
          duration={1500}
          style={styles.logoContainer}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/images/eye.jpg')}
              style={styles.logo}
            />
            <View style={styles.logoGlow} />
          </View>
        </Animatable.View>

        <Animatable.Text
          animation="fadeInUp"
          duration={1000}
          delay={800}
          style={styles.appName}
        >
          NaviEyes
        </Animatable.Text>

        <Animatable.View
          animation="fadeIn"
          duration={1200}
          delay={1500}
          style={styles.loadingContainer}
        >
          <Text style={styles.loadingText}>Loading App...</Text>
          <View style={styles.progressBar}>
            <Animatable.View 
              animation="slideInRight"
              duration={2500}
              style={styles.progressFill}
            />
          </View>
        </Animatable.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 24,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(1, 0, 66, 0.3)',
    zIndex: 1,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  loadingContainer: {
    width: '80%',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(1, 0, 66, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: '#64D2FF',
    borderRadius: 3,
  },
});