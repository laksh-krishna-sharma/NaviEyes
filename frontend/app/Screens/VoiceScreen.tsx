import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

const VoiceScreen = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    const voiceConfig = {
        voice: 'en-gb-x-sfg#female_1-local',
        pitch: 0.8,
        rate: 1.1,
    };

    const speak = (text: string) => {
        Speech.speak(text, {
            voice: voiceConfig.voice,
            pitch: voiceConfig.pitch,
            rate: voiceConfig.rate,
        });
    };

    useEffect(() => {
        const welcomeMessage = "You are on the Voice to Text screen. Press the button in the center to ask your query.";
        speak(welcomeMessage);

        return () => {
            Speech.stop();
        };
    }, []);

    useEffect(() => {
        if (!permissionResponse) {
            requestPermission();
        }
    }, []);

    const startRecording = async () => {
        try {
            if (permissionResponse?.status !== 'granted') {
                speak('Microphone permission is required!');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            speak("Recording started. You may speak now.");

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

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
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            const uri = recording.getURI();

            // TODO: Send recording to backend
            // Example: await sendToBackend(uri);
            // speak("Sending your recording to the server.");

            speak("Recording stopped. Processing your query.");

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

            {/* TODO: Display backend response here */}
            {/* <Text style={styles.responseText}>{responseFromBackend}</Text> */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
   
    statusContainer: {
        marginBottom: 30,
        height: 30,
    },
    statusText: {
        fontSize: 18,
        color: '#666',
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
    },
    recordingButton: {
        backgroundColor: '#EA4335',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    responseText: {
        marginTop: 40,
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});

export default VoiceScreen;