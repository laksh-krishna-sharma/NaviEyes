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
    speak("You are on the Voice to Text screen. Press the button in the center to start recording and ask your query. Once you finish, press the button again to stop recording.");
    return () => {
      Speech.stop();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);


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

  const sendToBackend = async (uri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'recording.wav',
        type: 'audio/wav',
      });

      const response = await axios.post('http://13.51.106.169:8000/interact/voice-query', formData, {
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

        await new Promise((resolve) => {
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              resolve();
            }
          });
        });

        await newSound.playAsync();

        await speak("Click the button on bottom left to ask another query or click the button on bottom right to go back to home.");
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
      await stopAllAudio(); // Stop any ongoing speech/audio before recording
      
      if (permissionResponse?.status !== 'granted') {
        speak('Microphone permission is required!');
        return;
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
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    height: 60, // Match your button height
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
    gap: 12,
    zIndex: 1,
    justifyContent: 'center',
  }
});

export default VoiceScreen;