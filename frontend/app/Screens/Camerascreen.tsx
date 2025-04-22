import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';                           // NEW
import { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
  /* ───────────────────────── state ───────────────────────── */
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isTaking, setIsTaking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);          // NEW
  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();
  const soundRef = useRef<Audio.Sound | null>(null);              // NEW

  /* ──────────────────────── helpers ──────────────────────── */
  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      setIsTaking(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      if (photo?.uri) setPhotoUri(photo.uri);
    } finally {
      setIsTaking(false);
    }
  };

  const uploadAndPlay = async () => {
    if (!photoUri) return;
    try {
      setIsUploading(true);

      /* 1. read file → base64 string */
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      /* 2. POST to the backend */
      const res = await axios.post(
        'https://localhost:8000/image_analyze/image-to-speech',
        { image: base64 },
        { responseType: 'arraybuffer' }         // receive raw bytes
      );

      /* 3. Write the WAV bytes to a temporary file */
      const wavPath = `${FileSystem.cacheDirectory}tts-${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(
        wavPath,
        Buffer.from(res.data).toString('base64'),
        { encoding: FileSystem.EncodingType.Base64 }
      );

      /* 4. Play it */
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync({ uri: wavPath });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (err) {
      console.error('Upload / audio error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  /* ─────────────────────── side‑effects ───────────────────── */
  useEffect(() => {
    // auto‑snap every 2 s if camera is open
    if (permission?.granted && !photoUri && !isTaking) {
      const t = setTimeout(takePhoto, 2000);
      return () => clearTimeout(t);
    }
  }, [permission, photoUri, isTaking]);

  useEffect(() => {
    return () => {
      // cleanup sound on unmount
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  /* ───────────────────────── UI ───────────────────────── */
  if (!permission) return <View />;
  if (!permission.granted)
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );

  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          <View style={styles.optionButtons}>
            <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.optionButton}>
              <Text style={styles.text}>Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={uploadAndPlay}
              style={[styles.optionButton, isUploading && { opacity: 0.4 }]}
              disabled={isUploading}
            >
              <Text style={styles.text}>{isUploading ? 'Uploading…' : 'Done'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          <TouchableOpacity
            style={[styles.button, { marginTop: Platform.OS === 'ios' ? 50 : 20 }]}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          >
            <Text style={styles.text}>Flip</Text>
          </TouchableOpacity>
        </CameraView>
      )}
    </View>
  );
}

/* ───────────── styles (unchanged) ───────────── */
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  message: { textAlign: 'center', paddingBottom: 10 },
  camera: { flex: 1 },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  preview: { width: '100%', height: '80%', resizeMode: 'cover' },
  optionButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingVertical: 20 },
  optionButton: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  button: { alignSelf: 'flex-end', alignItems: 'center' },
  text: { fontSize: 18, fontWeight: 'bold', color: 'white' },
});
