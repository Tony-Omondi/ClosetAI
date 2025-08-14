import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { Feather, AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';

const BASE_URL = 'http://192.168.88.66:8000';

const Profile = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    location: '',
    profile_picture: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/login');
          return;
        }
        
        setIsLoading(true);
        const response = await fetch(`${BASE_URL}/api/auth/profile/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const data = await response.json();
        
        setProfile(data);
        setFormData({
          full_name: data.profile.full_name || '',
          age: data.profile.age || '',
          gender: data.profile.gender || '',
          location: data.profile.location || '',
          profile_picture: null,
        });

        // For React Native, you might want to use a different geolocation approach
        // like expo-location instead of the browser's navigator.geolocation
      } catch (err) {
        setError('Failed to load profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setFormData({ ...formData, profile_picture: result.assets[0] });
    }
  };

  const handleSubmit = async () => {
    setError('');
    setMessage('');

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }

      const data = new FormData();
      data.append('full_name', formData.full_name);
      data.append('age', formData.age);
      data.append('gender', formData.gender);
      data.append('location', formData.location);
      if (formData.profile_picture) {
        data.append('profile_picture', {
          uri: formData.profile_picture.uri,
          name: formData.profile_picture.fileName || 'profile.jpg',
          type: formData.profile_picture.type || 'image/jpeg',
        });
      }

      const response = await fetch(`${BASE_URL}/api/auth/profile/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: data,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const responseData = await response.json();
      setProfile({ ...profile, profile: responseData });
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const profilePictureUrl = profile?.profile?.profile_picture 
    ? profile.profile.profile_picture.startsWith('http') 
      ? profile.profile.profile_picture 
      : `${BASE_URL}${profile.profile.profile_picture}`
    : null;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Mobile Sidebar Toggle */}
      <TouchableOpacity 
        style={styles.sidebarToggle}
        onPress={toggleSidebar}
      >
        <Feather name={isSidebarOpen ? 'x' : 'menu'} size={24} color="black" />
      </TouchableOpacity>

      {/* Sidebar */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isSidebarOpen}
        onRequestClose={toggleSidebar}
      >
        <View style={styles.sidebar}>
          <View style={styles.sidebarContent}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/closetai-logo.jpg')}
                style={styles.logo}
              />
            </View>

            {/* User Profile */}
            <TouchableOpacity style={styles.profileContainer}>
              {profilePictureUrl ? (
                <Image 
                  source={{ uri: profilePictureUrl }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profileInitial}>
                    {profile?.profile?.full_name?.[0] || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.profileText}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {profile?.profile?.full_name || 'User'}
                </Text>
                <Text style={styles.profileLink}>View profile</Text>
              </View>
            </TouchableOpacity>

            {/* Navigation */}
            <View style={styles.navContainer}>
              <TouchableOpacity 
                style={styles.navItem}
                onPress={() => {
                  router.push('/dashboard');
                  toggleSidebar();
                }}
              >
                <Feather name="home" size={20} color="#6b7280" />
                <Text style={styles.navText}>Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.navItem}
                onPress={() => {
                  router.push('/closet');
                  toggleSidebar();
                }}
              >
                <Feather name="list" size={20} color="#6b7280" />
                <Text style={styles.navText}>My Closet</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.navItem}
                onPress={() => {
                  router.push('/events');
                  toggleSidebar();
                }}
              >
                <Feather name="calendar" size={20} color="#6b7280" />
                <Text style={styles.navText}>Events</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>12</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navItem}>
                <Feather name="star" size={20} color="#6b7280" />
                <Text style={styles.navText}>Recommendations</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.navItem, styles.activeNavItem]}
                onPress={toggleSidebar}
              >
                <Feather name="user" size={20} color="#4f46e5" />
                <Text style={[styles.navText, styles.activeNavText]}>Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={20} color="#6b7280" />
              <Text style={styles.navText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileHeaderContent}>
            <View style={styles.profileImageContainer}>
              {profilePictureUrl ? (
                <Image
                  source={{ uri: profilePictureUrl }}
                  style={styles.profileImageLarge}
                />
              ) : (
                <View style={styles.profilePlaceholderLarge}>
                  <Text style={styles.profileInitialLarge}>
                    {profile?.profile?.full_name?.[0] || 'U'}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.editPhotoButton}
                onPress={pickImage}
              >
                <Feather name="camera" size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileNameLarge}>
                {profile?.profile?.full_name || 'Your Profile'}
              </Text>
              <View style={styles.locationContainer}>
                <Feather name="map-pin" size={16} color="#6b7280" />
                <Text style={styles.locationText}>
                  {profile?.profile?.location || 'Location not set'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Profile Form */}
        <View style={styles.formContainer}>
          {message && (
            <View style={styles.successContainer}>
              <Feather name="check-circle" size={20} color="#10b981" />
              <Text style={styles.successText}>{message}</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.full_name}
              onChangeText={(value) => handleInputChange('full_name', value)}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(value) => handleInputChange('age', value)}
              placeholder="Enter your age"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="M" />
                <Picker.Item label="Female" value="F" />
                <Picker.Item label="Other" value="O" />
                <Picker.Item label="Prefer not to say" value="P" />
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="Enter your city"
            />
            <Text style={styles.locationHint}>
              We use your location for weather-based recommendations
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Profile Picture</Text>
            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Feather name="upload" size={32} color="#9ca3af" />
                  <Text style={styles.uploadText}>Tap to upload an image</Text>
                  <Text style={styles.uploadSubtext}>PNG, JPG (max. 5MB)</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.push('/dashboard')}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
  sidebarToggle: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 50,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sidebar: {
    flex: 1,
    backgroundColor: 'white',
  },
  sidebarContent: {
    flex: 1,
    padding: 16,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    height: 48,
    width: 48,
    resizeMode: 'contain',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  profilePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontWeight: '500',
    color: '#111827',
  },
  profileLink: {
    fontSize: 12,
    color: '#6b7280',
  },
  navContainer: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  activeNavItem: {
    backgroundColor: '#eef2ff',
  },
  navText: {
    marginLeft: 12,
    color: '#6b7280',
  },
  activeNavText: {
    color: '#4f46e5',
    fontWeight: '500',
  },
  badge: {
    marginLeft: 'auto',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 'auto',
  },
  mainContent: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#e0e7ff',
    padding: 24,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImageLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
  },
  profilePlaceholderLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#a5b4fc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profileInitialLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  profileInfo: {
    marginLeft: 20,
  },
  profileNameLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    marginLeft: 4,
    color: '#6b7280',
  },
  formContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    marginBottom: 16,
  },
  successText: {
    marginLeft: 8,
    color: '#065f46',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    color: '#b91c1c',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
  },
  locationHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  imageUpload: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    color: '#9ca3af',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    marginLeft: 8,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default Profile;