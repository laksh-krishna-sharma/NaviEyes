import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Audio from 'expo-av';
import axios from 'axios';
import * as Speech from 'expo-speech';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const navigation = useNavigation();
  const [sound, setSound] = useState<Audio.Sound | null>(null); // Track audio playback

  const speak = (text: string) => {
    Speech.speak(text, {
      voice: 'en-gb-x-sfg#female_1-local',
      pitch: 0.8,
      rate: 0.8,
    });
  };

  useEffect(() => {
    if (permission?.granted) {
      speak("You are on the camera screen. Press the large button at the bottom to take a picture.");
    }
    return () => {
      Speech.stop();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [permission]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const stopAllAudio = async () => {
    try {
      Speech.stop();
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const takeAndSendPhoto = async () => {
    if (cameraRef.current) {
      try {
        await stopAllAudio(); // Stop any ongoing speech/audio before taking photo
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          setPhotoUri(photo.uri);
          speak("Photo taken. Sending to server...");
          await sendPhotoToBackend(photo.uri);
        } else {
          speak("Could not capture photo.");
        }
      } catch (error) {
        console.error('Photo capture error:', error);
        speak("Failed to take a photo.");
      }
    }
  };

  const sendPhotoToBackend = async (uri: string) => {
    setIsProcessing(true);

    const formData = new FormData();
    const filename = uri.split('/').pop()!;
    const fileType = filename.split('.').pop()?.toLowerCase() || 'jpeg';

    formData.append('file', {
      uri,
      name: filename,
      type: `image/${fileType}`,
    } as any);

    try {
      const res = await axios.post(
        'http://13.51.106.169:8000/image_analyze/describe-image-audio',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (res.data) {
        const cleanedText = res.data.replace(/[^a-zA-Z0-9\s]/g, '');
        speak(cleanedText);
        speak("Image analysis complete. Click the button on bottom left to take another photo or click the button on bottom right to go back to home.");
      } else {
        speak("No description received.");
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      speak("Image analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCamera = async () => {
    await stopAllAudio();
    setPhotoUri(null);
    setIsProcessing(false);
    speak("Ready to take another photo.");
  };

  const goToHome = async () => {
    await stopAllAudio();
    router.push('/Screens/homescreen');
  };

  if (!permission) return <View style={styles.container}><Text>Loading permissions...</Text></View>;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera access required</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          {isProcessing && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Analyzing...</Text>
            </View>
          )}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.leftHalfTouchable} 
              onPress={resetCamera} 
              disabled={isProcessing}
            />
            <TouchableOpacity 
              style={styles.rightHalfTouchable} 
              onPress={goToHome} 
              disabled={isProcessing}
            />
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.resetButton} onPress={resetCamera} disabled={isProcessing}>
                <Text style={styles.resetButtonText}>Take Another</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.homeButton} onPress={goToHome} disabled={isProcessing}>
                <Text style={styles.resetButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takeAndSendPhoto}>
              <Text style={styles.captureButtonText}>Capture</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center',backgroundColor: '#000' },
  camera: { flex: 1, backgroundColor: '#000' },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    shadowRadius: 10,
    shadowColor: '#000',
    backgroundColor: '#7B4DFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '80%',
    resizeMode: 'cover',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    gap: 16,
  },
  resetButton: {
    backgroundColor: '#34A853',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  homeButton: {
    backgroundColor: '#EA4335',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    textAlign: 'center',
    fontSize: 16,
    padding: 16,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    height: 60, 
  },
  leftHalfTouchable: {
    position: 'absolute',
    left: 0,
    width: '50%',
    height: '100%',
    zIndex: 2,
  },
  rightHalfTouchable: {
    position: 'absolute',
    right: 0,
    width: '50%',
    height: '100%',
    zIndex: 2,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 16,
    zIndex: 1,
  },
});
