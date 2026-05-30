import * as Location from 'expo-location';
import * as Network from 'expo-network';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
} from 'react-native';
import { db } from '../database/db';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/syncStore';

// Approved species with their valid collection zones
const SPECIES_DATA = {
  'Ashwagandha': {
    scientificName: 'Withania somnifera',
    zones: ['Madhya Pradesh', 'Rajasthan', 'Gujarat', 'Maharashtra'],
  },
  'Tulsi': {
    scientificName: 'Ocimum sanctum',
    zones: ['Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'Karnataka'],
  },
  'Brahmi': {
    scientificName: 'Bacopa monnieri',
    zones: ['Kerala', 'Tamil Nadu', 'West Bengal', 'Assam'],
  },
  'Guduchi': {
    scientificName: 'Tinospora cordifolia',
    zones: ['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Andhra Pradesh'],
  },
  'Shatavari': {
    scientificName: 'Asparagus racemosus',
    zones: ['Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh', 'Himachal Pradesh'],
  },
};

export default function CollectionScreen({ navigation }) {
  const collector = useAuthStore(state => state.collector);
  const addPendingCollection = useSyncStore(state => state.addPendingCollection);

  const [species, setSpecies] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Check network status
  useEffect(() => {
    const checkNetwork = async () => {
      const networkState = await Network.getNetworkStateAsync();
      setIsOnline(networkState.isConnected && networkState.isInternetReachable);
    };
    checkNetwork();
  }, []);

  // Get current location
  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for collection recording');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        timestamp: new Date().toISOString(),
      });

      Alert.alert('📍 Location Captured', 
        `Lat: ${loc.coords.latitude.toFixed(6)}\nLon: ${loc.coords.longitude.toFixed(6)}\nAccuracy: ${loc.coords.accuracy.toFixed(0)}m`
      );
    } catch (error) {
      Alert.alert('Location Error', 'Could not get your location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Submit collection
  const handleSubmit = async () => {
    // Validation
    if (!species) {
      Alert.alert('Error', 'Please select a species');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Please capture your GPS location');
      return;
    }
    if (!photo) {
      Alert.alert('Error', 'Please capture a live photo of the collection');
      return;
    }
    if (!quantity) {
      Alert.alert('Error', 'Please enter quantity');
      return;
    }

    const collectionData = {
      id: `COL-${Date.now()}`,
      product_id: `${species.toUpperCase().slice(0, 4)}-${Date.now()}`,
      species: species,
      scientific_name: SPECIES_DATA[species]?.scientificName,
      gps: location,
      photo: photo.base64, // Including the base64 photo
      collector_id: collector?.id || 'UNKNOWN',
      quantity: parseFloat(quantity),
      unit: 'kg',
      notes: notes,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    setSubmitting(true);

    if (isOnline) {
      try {
        const response = await api.submitCollection(collectionData);
        if (response.success) {
          // Save to local SQLite as synced so it appears in History
          await db.saveCollection({ ...collectionData, status: 'synced' });
          await db.markSynced(collectionData.id, response.txId || response.id);
          
          if (Platform.OS === 'web') {
            window.alert('✅ Validated and recorded on the blockchain!');
            navigation.navigate('History');
          } else {
            Alert.alert(
              '✅ Collection Recorded',
              'Validated and recorded on the blockchain!',
              [{ text: 'View History', onPress: () => navigation.navigate('History') }]
            );
          }
        }
      } catch (error) {
        // API failed — save locally for later sync
        addPendingCollection(collectionData);
        if (Platform.OS === 'web') {
          window.alert('⏳ Could not reach server. Collection saved locally for later sync.');
          navigation.navigate('Pending');
        } else {
          Alert.alert(
            '⏳ Saved for Sync',
            'Could not reach server. Collection saved and will sync when online.',
            [{ text: 'View Pending', onPress: () => navigation.navigate('Pending') }]
          );
        }
      }
    } else {
      // Offline - save locally
      addPendingCollection(collectionData);
      if (Platform.OS === 'web') {
        window.alert('⏳ Offline Mode: Collection saved locally. Sync when you are back online.');
        navigation.navigate('Pending');
      } else {
        Alert.alert(
          '⏳ Saved Offline',
          'Collection saved locally. Sync when you\'re back online.',
          [{ text: 'View Pending', onPress: () => navigation.navigate('Pending') }]
        );
      }
    }

    setSubmitting(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Offline Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            📴 Offline Mode - Collection will be validated when synced
          </Text>
        </View>
      )}

      {/* Species Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Species *</Text>
        <View style={styles.speciesGrid}>
          {Object.keys(SPECIES_DATA).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.speciesChip, species === s && styles.speciesChipSelected]}
              onPress={() => setSpecies(s)}
            >
              <Text style={[styles.speciesChipText, species === s && styles.speciesChipTextSelected]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {species && (
          <Text style={styles.hint}>
            Scientific: {SPECIES_DATA[species].scientificName}
            {'\n'}Valid zones: {SPECIES_DATA[species].zones.join(', ')}
          </Text>
        )}
      </View>

      {/* GPS Location */}
      <View style={styles.section}>
        <Text style={styles.label}>GPS Location *</Text>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={getLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.locationButtonIcon}>📍</Text>
              <Text style={styles.locationButtonText}>
                {location ? 'Update Location' : 'Capture GPS Location'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        {location && (
          <View style={styles.locationDisplay}>
            <Text style={styles.locationText}>
              ✅ Location captured
            </Text>
            <Text style={styles.locationCoords}>
              Lat: {location.lat.toFixed(6)}
            </Text>
            <Text style={styles.locationCoords}>
              Lon: {location.lon.toFixed(6)}
            </Text>
            <Text style={styles.locationCoords}>
              Accuracy: {location.accuracy?.toFixed(0) || 'N/A'}m
            </Text>
          </View>
        )}
      </View>

      {/* Live Photo Capture */}
      <View style={styles.section}>
        <Text style={styles.label}>Live Photo *</Text>
        {Platform.OS === 'web' ? (
          <View style={[styles.cameraButton, { position: 'relative', overflow: 'hidden' }]}>
            {React.createElement('input', {
              type: 'file',
              accept: 'image/*',
              // Removed 'capture' attribute! Mobile browsers heavily block 'capture' on non-HTTPS local IP connections.
              // Leaving it blank forces the browser to open the native OS prompt: "Take Photo" or "Choose from Library"
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0.01,
                zIndex: 999,
                cursor: 'pointer'
              },
              onChange: (e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    setPhoto({ uri: evt.target.result, base64: evt.target.result.split(',')[1] });
                  };
                  reader.readAsDataURL(file);
                }
              }
            })}
            <View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.cameraButtonIcon}>📸</Text>
              <Text style={styles.cameraButtonText}>
                {photo ? 'Retake Photo' : 'Capture Live Photo'}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={async () => {
              try {
                const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
                if (!permissionResult.granted) {
                  Alert.alert('Permission Required', 'Please enable camera permissions in your browser/phone settings to take live photos.');
                  return;
                }

                const result = await ImagePicker.launchCameraAsync({
                  quality: 0.3,
                  base64: true,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                  setPhoto(result.assets[0]);
                }
              } catch (error) {
                console.error("Camera Launch Error: ", error);
                Alert.alert('Error', 'Failed to open the camera. Please try again.');
              }
            }}
          >
            <Text style={styles.cameraButtonIcon}>📸</Text>
            <Text style={styles.cameraButtonText}>
              {photo ? 'Retake Photo' : 'Capture Live Photo'}
            </Text>
          </TouchableOpacity>
        )}
        
        {photo && (
          <Image 
            source={{ uri: photo.uri }} 
            style={styles.photoPreview} 
          />
        )}
      </View>

      {/* Quantity */}
      <View style={styles.section}>
        <Text style={styles.label}>Quantity (kg) *</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Enter weight in kg"
          keyboardType="decimal-pad"
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isOnline ? '🔗 Submit to Blockchain' : '💾 Save Offline'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🛡️ GPS Validation</Text>
        <Text style={styles.infoText}>
          Your GPS coordinates will be validated by the blockchain smart contract using the Haversine formula. 
          If you're outside approved collection zones for the selected species, the collection will be rejected.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    alignItems: 'center',
  },
  offlineText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 16,
    paddingBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  speciesChipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  speciesChipText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  speciesChipTextSelected: {
    color: '#fff',
  },
  hint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 18,
  },
  locationButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  locationButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationDisplay: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
  },
  locationCoords: {
    fontSize: 14,
    color: '#047857',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cameraButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  cameraButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#10B981',
    margin: 16,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4338CA',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
  },
});
