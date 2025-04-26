import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { encode } from 'base64-arraybuffer';
import { router } from 'expo-router';

const VoiceScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [sound, setSound] = useState(null);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [hasSpokenPermissionGranted, setHasSpokenPermissionGranted] = useState(false);

  const voiceConfig = {
    voice: 'en-gb-x-sfg#female_1-local',
    pitch: 0.8,
    rate: 0.8,
  };

  const speak = (text) => {
    Speech.speak(text, {
      voice: voiceConfig.voice,
      pitch: voiceConfig.pitch,
      rate: voiceConfig.rate,
    });
  };

  useEffect(() => {
    if (!permissionResponse) {
      speak("Checking microphone permission");
      return;
    }

    if (permissionResponse.granted && !hasSpokenPermissionGranted) {
      speak("You are on the Voice to Text screen. Press the button in the center to start recording and ask your query. Once you finish, press the button again to stop recording.");
      setHasSpokenPermissionGranted(true);
    } else if (!permissionResponse.granted && !permissionRequested) {
      const message = "To use voice recording, we need your microphone permission. Please tap the button in the center of the screen "+
        "to allow access. This will open a permission dialog.";
      speak(message);
    }
  }, [permissionResponse, permissionRequested, hasSpokenPermissionGranted]);

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
    speak("Requesting microphone access. Please respond to the dialog.");
    
    const result = await requestPermission();
    if (!result.granted) {
      speak("Permission was not granted. You can try again or enable it in your device settings.");
      setPermissionRequested(false);
    }
  };

  const sendToBackend = async (uri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'recording.wav',
        type: 'audio/wav',
      });

      const response = await axios.post('https://532d-13-51-106-169.ngrok-free.app/interact/voice-query', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'arraybuffer',
      });

      const contentType = response.headers['content-type'];

      if (contentType.includes('application/json')) {
        const text = new TextDecoder().decode(response.data);
        const json = JSON.parse(text);
        await speak(json.text_response);
        await speak("Click the button on bottom left to ask another query or click the button on bottom right to go back to home.");
      } else if (contentType.includes('audio')) {
        const base64Audio = encode(response.data);
        const fileUri = FileSystem.documentDirectory + 'response.wav';
        await FileSystem.writeAsStringAsync(fileUri, base64Audio, { encoding: FileSystem.EncodingType.Base64 });

        const { sound: newSound } = await Audio.Sound.createAsync({ uri: fileUri });

        setSound(newSound);

        newSound.playAsync().then(() => {
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              speak("Click the button on bottom left to ask another query or click the button on bottom right to go back to home.");
            }
          });
        });
      } else {
        await speak("Unknown response type from server.");
      }
    } catch (error) {
      console.error('Error sending to backend or playing audio:', error);
      await speak('Failed to get a response from the server.');
    }
  };

  const startRecording = async () => {
    try {
      await stopAllAudio();

      if (permissionResponse?.status !== 'granted') {
        speak('Microphone permission is required! Please grant permission.');
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          speak('Microphone permission is required!');
          return;
        }
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      speak("Recording started. You may speak now.");

      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      speak("Failed to start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      speak("Recording stopped. Processing your query.");

      if (uri) await sendToBackend(uri);

      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
      speak("Failed to stop recording. Please try again.");
    }
  };

  const resetRecording = async () => {
    await stopAllAudio();
    speak("Ready to record another query.");
  };

  const goToHome = async () => {
    await stopAllAudio();
    router.push('/Screens/homescreen');
  };

  if (!permissionResponse) {
    return (
      <View style={styles.permissionLoadingContainer}>
        <Text style={styles.permissionLoadingText}>Checking permissions...</Text>
      </View>
    );
  }

  if (!permissionResponse.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>Microphone Access Needed</Text>
          <Text style={styles.permissionDescription}>
            To record voice queries, please allow microphone access
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handlePermissionRequest}
            disabled={permissionRequested}
          >
            <Text style={styles.permissionButtonText}>
              {permissionRequested ? 'Requesting...' : 'Enable Microphone'}
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
      <Text style={styles.title}>Voice to Text</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isRecording ? "Recording..." : "Press button to speak"}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.button, isRecording && styles.recordingButton]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Text>
      </TouchableOpacity>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.leftHalfTouchable} 
          onPress={resetRecording} 
          disabled={isRecording}
        />
        <TouchableOpacity 
          style={styles.rightHalfTouchable} 
          onPress={goToHome} 
          disabled={isRecording}
        />
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.resetButton} onPress={resetRecording} disabled={isRecording}>
            <Text style={styles.resetButtonText}>Record Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeButton} onPress={goToHome} disabled={isRecording}>
            <Text style={styles.resetButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#000' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    color: 'white' 
  },
  statusContainer: { 
    marginBottom: 30, 
    height: 30 
  },
  statusText: { 
    fontSize: 18, 
    color: 'white' 
  },
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    marginBottom: 30,
  },
  recordingButton: { 
    backgroundColor: '#64B5F6' 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  actionButtons: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    backgroundColor: '#34A853',
    paddingVertical: 14,
    paddingHorizontal:30,
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
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 30,
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
  permissionLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  permissionLoadingText: {
    color: 'white',
    fontSize: 18,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  permissionContent: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  permissionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#64B5F6',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  centerPermissionTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default VoiceScreen;