import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const BASE_URL = 'http://192.168.88.66:8000';

export default function Recommendations() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/auth/get-csrf-token/`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        });
        const text = await response.text();
        console.log('CSRF Token Response Status:', response.status);
        console.log('CSRF Token Response Text:', text);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const data = JSON.parse(text);
        if (data.csrfToken) {
          await AsyncStorage.setItem('csrftoken', data.csrfToken);
        }
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        setError('Failed to initialize. Please try again.');
      }
    };

    const fetchProfileAndEvents = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/login');
          return;
        }

        const headers = {
          Authorization: `Token ${token}`,
          'Accept': 'application/json',
        };

        const [profileResponse, eventsResponse, recommendationsResponse] = await Promise.all([
          fetch(`${BASE_URL}/api/auth/profile/`, { headers, credentials: 'include' }),
          fetch(`${BASE_URL}/api/auth/events/`, { headers, credentials: 'include' }),
          fetch(`${BASE_URL}/api/auth/recommendations/`, { headers, credentials: 'include' }),
        ]);

        if (!profileResponse.ok || !eventsResponse.ok || !recommendationsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const profileData = await profileResponse.json();
        const eventsData = await eventsResponse.json();
        const recommendationsData = await recommendationsResponse.json();

        setProfile(profileData);
        setEvents(eventsData);
        setRecommendations(recommendationsData);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data. Please ensure you are logged in.');
      }
    };

    fetchCsrfToken();
    fetchProfileAndEvents();
  }, []);

  const handleGenerateRecommendation = async () => {
    if (!selectedEvent) {
      setError('Please select an event.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const csrfToken = await AsyncStorage.getItem('csrftoken');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }

      const response = await fetch(`${BASE_URL}/api/auth/recommendations/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ event_id: selectedEvent }),
        credentials: 'include',
      });

      const text = await response.text();
      console.log('Recommendation Response Status:', response.status);
      console.log('Recommendation Response Text:', text);

      if (!response.ok) {
        const data = JSON.parse(text);
        throw new Error(data.error || 'Failed to generate recommendation.');
      }

      const data = JSON.parse(text);
      setRecommendations([...recommendations, data]);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to generate recommendation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const csrfToken = await AsyncStorage.getItem('csrftoken');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }

      const response = await fetch(`${BASE_URL}/api/auth/recommendations/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${token}`,
          'X-CSRFToken': csrfToken || '',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recommendation.');
      }

      setRecommendations(recommendations.filter((rec) => rec.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete recommendation.');
    }
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const csrfToken = await AsyncStorage.getItem('csrftoken');
      if (token) {
        await fetch(`${BASE_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            Authorization: `Token ${token}`,
            'X-CSRFToken': csrfToken || '',
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
      }
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('csrftoken');
      router.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      router.replace('/login');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const profilePictureUrl = profile?.profile?.profile_picture
    ? profile.profile.profile_picture.startsWith('http')
      ? profile.profile.profile_picture
      : `${BASE_URL}${profile.profile.profile_picture}`
    : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Sidebar Toggle Button */}
      <TouchableOpacity
        style={[styles.sidebarToggle, isSidebarOpen && styles.sidebarToggleOpen]}
        onPress={toggleSidebar}
      >
        <Text style={styles.sidebarToggleIcon}>{isSidebarOpen ? '✕' : '☰'}</Text>
      </TouchableOpacity>

      {/* Sidebar Modal */}
      <Modal
        visible={isSidebarOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleSidebar}
      >
        <View style={styles.sidebarOverlay}>
          <View style={styles.sidebar}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/closetai-logo.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* User Profile */}
            <View style={styles.profileContainer}>
              {profilePictureUrl ? (
                <Image
                  source={{ uri: profilePictureUrl }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profilePlaceholderText}>
                    {profile?.profile?.full_name?.[0] || 'U'}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.profileName}>
                  {profile?.profile?.full_name || 'User'}
                </Text>
                <TouchableOpacity onPress={() => router.push('/profile')}>
                  <Text style={styles.profileLink}>View profile</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Navigation */}
            <View style={styles.navContainer}>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.push('/dashboard')}
              >
                <Text style={styles.navText}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.push('/closet')}
              >
                <Text style={styles.navText}>My Closet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.push('/events')}
              >
                <Text style={styles.navText}>Events</Text>
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>{events.length}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navItem, styles.activeNavItem]}
              >
                <Text style={[styles.navText, styles.activeNavText]}>Recommendations</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.push('/profile')}
              >
                <Text style={styles.navText}>Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity
              style={[styles.navItem, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.navText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Outfit Recommendations</Text>
          <Text style={styles.headerSubtitle}>
            Get AI-powered outfit suggestions for your events
          </Text>
        </View>

        {/* Generate Recommendation Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Generate New Recommendation</Text>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <View style={styles.formField}>
            <Text style={styles.label}>Select Event</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedEvent}
                onValueChange={(value) => setSelectedEvent(value)}
                style={styles.picker}
              >
                <Picker.Item label="Select an event" value="" />
                {events.map((event) => (
                  <Picker.Item
                    key={event.id}
                    label={`${event.name} - ${event.date}`}
                    value={event.id}
                  />
                ))}
              </Picker>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.generateButton, isLoading && styles.buttonDisabled]}
            onPress={handleGenerateRecommendation}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Generating...' : 'Generate Recommendation'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recommendations List */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Your Recommendations</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4f46e5" />
            </View>
          ) : recommendations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No recommendations yet</Text>
              <Text style={styles.emptyText}>
                Generate a recommendation for an event to get started
              </Text>
            </View>
          ) : (
            <FlatList
              data={recommendations}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item: recommendation }) => (
                <View style={styles.recommendationCard}>
                  <Text style={styles.recommendationTitle}>
                    {recommendation.event.name} - {recommendation.event.date}
                  </Text>
                  <Text style={styles.recommendationDescription}>
                    {recommendation.description}
                  </Text>
                  <Text style={styles.recommendationWeather}>
                    Weather: {recommendation.weather_info}
                  </Text>
                  <View style={styles.clothingItemsContainer}>
                    {recommendation.clothing_items.map((item) => {
                      const itemImageUrl = item.image
                        ? item.image.startsWith('http')
                          ? item.image
                          : `${BASE_URL}${item.image}`
                        : null;

                      return (
                        <View key={item.id} style={styles.clothingItem}>
                          {itemImageUrl ? (
                            <Image
                              source={{ uri: itemImageUrl }}
                              style={styles.clothingImage}
                            />
                          ) : (
                            <View style={styles.clothingPlaceholder}>
                              <Text style={styles.clothingPlaceholderText}>No Image</Text>
                            </View>
                          )}
                          <Text style={styles.clothingName}>{item.name}</Text>
                          <Text style={styles.clothingCategory}>{item.get_category_display}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(recommendation.id)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  sidebarToggle: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 50,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarToggleOpen: {
    transform: [{ rotate: '90deg' }],
  },
  sidebarToggleIcon: {
    fontSize: 24,
    color: '#374151',
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: 250,
    height: '100%',
    backgroundColor: '#fff',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    height: 48,
    width: 'auto',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  profilePicture: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  profilePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profilePlaceholderText: {
    fontSize: 20,
    color: '#4f46e5',
    fontWeight: '500',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  profileLink: {
    fontSize: 12,
    color: '#4f46e5',
  },
  navContainer: {
    flex: 1,
    gap: 8,
  },
  navItem: {
    padding: 12,
    borderRadius: 8,
  },
  activeNavItem: {
    backgroundColor: '#e0e7ff',
  },
  navText: {
    fontSize: 16,
    color: '#374151',
  },
  activeNavText: {
    color: '#4f46e5',
    fontWeight: '500',
  },
  eventBadge: {
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  eventBadgeText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 'auto',
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4b5563',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#b91c1c',
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  generateButton: {
    backgroundColor: '#4f46e5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  recommendationsContainer: {
    marginBottom: 24,
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#4b5563',
  },
  recommendationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  recommendationWeather: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  clothingItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  clothingItem: {
    width: '45%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clothingImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  clothingPlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  clothingPlaceholderText: {
    fontSize: 12,
    color: '#6b7280',
  },
  clothingName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  clothingCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#b91c1c',
  },
});