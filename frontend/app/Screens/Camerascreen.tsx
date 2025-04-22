import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Audio from 'expo-av';
import axios from 'axios';
import * as Speech from 'expo-speech';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);

  const speak = (text: string) => {
    Speech.speak(text, {
      voice: 'en-gb-x-sfg#female_1-local',
      pitch: 0.8,
      rate: 1.1,
    });
  };

  useEffect(() => {
    if (permission?.granted) {
      speak("You are on the camera screen. Press the large button at the bottom to take a picture.");
    }
    return () => Speech.stop();
  }, [permission]);

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          setPhotoUri(photo.uri);
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
        'https://b5ab-2405-201-403e-a87c-a08c-3eb5-7f7c-55ea.ngrok-free.app/image_analyze/image-to-speech',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, responseType: 'json' }
      );

      const { tts_audio_url, description } = res.data;

      if (tts_audio_url) {
        setTtsAudioUrl(tts_audio_url);
        await playTts(tts_audio_url);
      } else if (description) {
        speak(description);
      } else {
        speak("No description found.");
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      speak("Image analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const playTts = async (url: string) => {
    try {
      await Audio.Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
      await sound.playAsync();
    } catch (e) {
      try {
        const filename = url.split('/').pop()?.split('?')[0];
        const localFile = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.downloadAsync(url, localFile);
        const { sound } = await Audio.Audio.Sound.createAsync({ uri: localFile });
        await sound.playAsync();
      } catch (err) {
        console.error('Fallback audio failed:', err);
        speak("Could not play the audio.");
      }
    }
  };

  const resetCamera = () => {
    setPhotoUri(null);
    setIsProcessing(false);
    setTtsAudioUrl(null);
    speak("Ready to take another photo.");
  };

  useEffect(() => {
    if (photoUri && !isProcessing) {
      speak("Photo taken. Analyzing...");
      sendPhotoToBackend(photoUri);
    }
  }, [photoUri]);

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
          <TouchableOpacity style={styles.resetButton} onPress={resetCamera} disabled={isProcessing}>
            <Text style={styles.resetButtonText}>Take Another</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePhoto}
            >
              <Text style={styles.captureButtonText}>Capture</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  camera: { flex: 1 },
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
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
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
  resetButton: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: '#34A853',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
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
  }
});
