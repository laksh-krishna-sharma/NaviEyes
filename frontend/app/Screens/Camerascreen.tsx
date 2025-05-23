import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, Dimensions } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import axios from 'axios';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

  export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const speak = (text: string) => {
    Speech.speak(text, {
      voice: 'en-gb-x-sfg#female_1-local',
      pitch: 0.8,
      rate: 0.8,
    });
  };

  useEffect(() => {
    if (!permission) {
      speak('Checking camera permission');
      return;
    }

    if (permission.granted) {
      speak('You are on the camera screen. Press the large button at the bottom to take a picture.');
    } else if (!permissionRequested) {
      const message = 'To use the camera, we need your camera permission. Please tap the button in the center of the screen to allow access.';
      speak(message);
    }
  }, [permission, permissionRequested]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      Speech.stop();
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

  const handlePermissionRequest = async () => {
    setPermissionRequested(true);
    await stopAllAudio();
    speak('Requesting camera access. Please respond to the dialog.');

    const result = await requestPermission();
    if (!result.granted) {
      speak('Permission was not granted. You can try again or enable it in your device settings.');
      setPermissionRequested(false);
    }
  };

  const takeAndSendPhoto = async () => {
    if (cameraRef.current) {
      try {
        await stopAllAudio();
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          setPhotoUri(photo.uri);
          speak('Photo taken. Now analyzing the image.');
          await sendPhotoToBackend(photo.uri);
        } else {
          speak('Could not capture photo.');
        }
      } catch (error) {
        console.error('Photo capture error:', error);
        speak('Failed to take a photo.');
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
        'https://532d-13-51-106-169.ngrok-free.app/image_analyze/describe-image-audio',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (res.data) {
        const maxLength = 1000;
        const cleanedText = res.data.slice(0, maxLength).replace(/[^a-zA-Z0-9\s]/g, '');
        speak(cleanedText);
        speak('Image analysis complete. Click the button on bottom left to take another photo. Or click the button on bottom right to go back to home.');
      } else {
        speak('No description received.');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      speak('Image analysis failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCamera = async () => {
    await stopAllAudio();
    setPhotoUri(null);
    setIsProcessing(false);
    speak('Ready to take another photo.');
  };

  const goToHome = async () => {
    await stopAllAudio();
    router.push('/Screens/homescreen');
  };

  if (!permission) {
    return (
      <View style={styles.permissionLoadingContainer}>
        <Text style={styles.permissionLoadingText}>Checking permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionDescription}>
            To take photos, please allow camera access
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handlePermissionRequest}
            disabled={permissionRequested}
          >
            <Text style={styles.permissionButtonText}>
              {permissionRequested ? 'Requesting...' : 'Enable Camera'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.centerPermissionTouchable}
          onPress={handlePermissionRequest}
          disabled={permissionRequested}
        />
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
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetCamera}
                disabled={isProcessing}
              >
                <Text style={styles.resetButtonText}>Take Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.homeButton}
                onPress={goToHome}
                disabled={isProcessing}
              >
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: height * 0.05,
  },
  captureButton: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: (width * 0.25) / 2,
    backgroundColor: '#7B4DFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: width * 0.05,
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  preview: {
    width: width,
    height: height * 0.75,
    resizeMode: 'cover',
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: width * 0.05,
    paddingHorizontal: width * 0.1,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#34A853',
    paddingVertical: height * 0.02,
    borderRadius: 30,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  homeButton: {
    flex: 1,
    backgroundColor: '#EA4335',
    paddingVertical: height * 0.02,
    borderRadius: 30,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  permissionLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  permissionLoadingText: {
    color: 'white',
    fontSize: width * 0.045,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.1,
  },
  permissionContent: {
    alignItems: 'center',
  },
  permissionTitle: {
    color: 'white',
    fontSize: width * 0.06,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: height * 0.02,
  },
  permissionDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: width * 0.04,
    textAlign: 'center',
    marginBottom: height * 0.04,
  },
  permissionButton: {
    backgroundColor: '#7B4DFF',
    borderRadius: 30,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.2,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  centerPermissionTouchable: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
});