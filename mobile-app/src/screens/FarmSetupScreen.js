import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function FarmSetupScreen({ navigation }) {
  const collector = useAuthStore(state => state.collector);
  const updateCollector = useAuthStore(state => state.updateCollector);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // If they already have photos, pre-load them conceptually or just let them overwrite
    if (collector?.farm_photos && collector.farm_photos.length > 0) {
      setPhotos(collector.farm_photos.map(base64 => ({ base64, uri: `data:image/jpeg;base64,${base64}` })));
    }
  }, [collector]);

  const pickImages = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Need gallery permissions to select farm photos.');
          return;
        }
      }

      // For web, if allowsMultipleSelection fails, they might have to select one by one.
      // But standard expo-image-picker supports multiple selection on modern web.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 3, // Reduced from 5 to prevent OOM
        quality: 0.1,      // Drastically lower quality for mobile web stability
        base64: true,
      });

      if (!result.canceled && result.assets) {
        // Filter out any assets that failed to generate base64
        const validAssets = result.assets.filter(a => a.base64);
        const newPhotos = [...photos, ...validAssets].slice(0, 3);
        setPhotos(newPhotos);
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') window.alert('Failed to open image picker');
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleUpload = async () => {
    if (photos.length < 2) {
      const msg = 'Please upload at least 2 photos of your farm.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Photos Needed', msg);
      return;
    }

    setUploading(true);
    try {
      // Capture Master GPS for the farm
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;

      // Validate all photos have base64 data
      const base64Array = photos.map(p => p.base64).filter(b => b);
      if (base64Array.length === 0) throw new Error("No image data found. Try selecting photos again.");
      
      await api.uploadFarmPhotos(collector.id, base64Array, { latitude, longitude });
      
      // Update local state
      updateCollector({ 
        farm_photos: base64Array,
        farm_location: { latitude, longitude }
      });

      if (Platform.OS === 'web') {
        window.alert('✅ Farm Verified! Your reference photos are saved.');
        navigation.navigate('Home');
      } else {
        Alert.alert('✅ Farm Verified', 'Your reference photos are saved.', [
          { text: 'OK', onPress: () => navigation.navigate('Home') }
        ]);
      }
    } catch (error) {
      console.error('Upload failed', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Check connection.';
      if (Platform.OS === 'web') window.alert(`Upload failed: ${errorMsg}`);
      else Alert.alert('Upload Failed', `Could not save farm photos: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Visual Farm Verification</Text>
        <Text style={styles.subtitle}>
          To ensure supply chain authenticity, please upload 3-5 photos of your farm. 
          The aggregator will visually compare these against future crop collections.
        </Text>
      </View>

      <View style={styles.photoGrid}>
        {photos.map((photo, idx) => (
          <View key={idx} style={styles.photoContainer}>
            <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(idx)}>
              <Text style={styles.removeBtnText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < 5 && (
          <TouchableOpacity style={styles.addBtn} onPress={pickImages}>
            <Text style={styles.addBtnIcon}>+</Text>
            <Text style={styles.addBtnText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.counterText}>{photos.length}/5 Photos Selected</Text>

      <TouchableOpacity 
        style={[styles.submitBtn, photos.length < 3 && styles.submitBtnDisabled]}
        onPress={handleUpload}
        disabled={uploading || photos.length < 3}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Save Farm Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    backgroundColor: '#EEF2FF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4338CA',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4F46E5',
    lineHeight: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  photoContainer: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addBtn: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
    borderWidth: 2,
    borderColor: '#818CF8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnIcon: {
    fontSize: 32,
    color: '#6366F1',
    marginBottom: 4,
  },
  addBtnText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  counterText: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 20,
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
