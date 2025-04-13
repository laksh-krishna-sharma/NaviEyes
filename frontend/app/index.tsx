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
      rate: 1.1,  
    });

    const timer = setTimeout(() => {
      Speech.speak('Hi user, your app is loaded succesfully', {
        voice: 'en-us-x-sfg#female_1-local',
        pitch: 0.8,  
        rate: 1.1,   
      } );

      setTimeout(() => {
        Speech.speak('I will now update you with features on the Home screen.', {
          voice: 'en-gb-x-sfg#female_1-local',
          pitch: 0.8,  
          rate: 1.1,   
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
        <Animatable.Image
          animation="zoomIn"
          duration={1500}
          source={require('../assets/images/logo.png')} 
          style={styles.logo}
        />

        <Animatable.Text
          animation="pulse"
          iterationCount="infinite"
          duration={1000}
          style={styles.loadingText}
        >
          Loading...
        </Animatable.Text>
      </View>
    </ImageBackground>
  );
}



const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(73, 68, 68, 0.5)',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    borderRadius: 75, 
    borderWidth: 2,   
    borderColor: '#fff', 
  },
  loadingText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '600',
  },
});
