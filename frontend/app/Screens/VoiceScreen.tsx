import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// const HOST_URL = Constants.expoConfig.extra.HOST_URL;

const VoiceScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const voiceConfig = {
    voice: 'en-gb-x-sfg#female_1-local',
    pitch: 0.8,
    rate: 1.1,
  };

  const speak = (text) => {
    Speech.speak(text, {
      voice: voiceConfig.voice,
      pitch: voiceConfig.pitch,
      rate: voiceConfig.rate,
    });
  };

  useEffect(() => {
    speak("You are on the Voice to Text screen. Press the button in the center to ask your query.");
    return () => Speech.stop();
  }, []);

  useEffect(() => {
    if (!permissionResponse) requestPermission();
  }, []);

  const sendToBackend = async (uri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'recording.wav',
        type: 'audio/wav',
      });

    //   const response = await axios.post(`${HOST_URL}/interact/voice-query`, formData, {
    //     headers: { 'Content-Type': 'multipart/form-data' },
    //     responseType: 'arraybuffer', // handle binary response
    //   });
    
    const response = await axios.post('https://ac93-2405-201-403e-a87c-a08c-3eb5-7f7c-55ea.ngrok-free.app/interact/voice-query', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'arraybuffer', // handle binary response
      });

      const contentType = response.headers['content-type'];

      if (contentType.includes('application/json')) {
        const text = new TextDecoder().decode(response.data);
        const json = JSON.parse(text);
        speak(json.text_response);
      } else if (contentType.includes('audio')) {
        const base64Audio = Buffer.from(response.data, 'binary').toString('base64');
        const fileUri = FileSystem.documentDirectory + 'response.wav';
        await FileSystem.writeAsStringAsync(fileUri, base64Audio, { encoding: FileSystem.EncodingType.Base64 });
        const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
        await sound.playAsync();
      } else {
        speak("Unknown response type from server.");
      }
    } catch (error) {
      console.error('Error sending to backend or playing audio:', error);
      speak('Failed to get a response from the server.');
    }
  };

  const startRecording = async () => {
    try {
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  statusContainer: { marginBottom: 30, height: 30 },
  statusText: { fontSize: 18, color: '#666' },
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
  },
  recordingButton: { backgroundColor: '#EA4335' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default VoiceScreen;
