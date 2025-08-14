import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SafeAreaView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const BASE_URL = 'http://192.168.88.66:8000';

export default function Events() {
  const router = useRouter();
  const [eventData, setEventData] = useState({
    name: '',
    location: '',
    date: new Date(),
    eventNotes: '',
    weatherNotes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingEvents, setIsFetchingEvents] = useState(true);

  // Fetch CSRF token and events on mount
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
          console.log('CSRF Token Stored:', data.csrfToken);
        }
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        setError('Failed to initialize. Please try again.');
      }
    };

    const fetchEvents = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('Please log in to view events.');
          router.replace('/login');
          return;
        }
        const response = await fetch(`${BASE_URL}/api/auth/events/`, {
          headers: {
            Authorization: `Token ${token}`,
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
        const text = await response.text();
        console.log('Events Response Status:', response.status);
        console.log('Events Response Text:', text);
        if (!response.ok) {
          throw new Error('Failed to fetch events.');
        }
        const data = JSON.parse(text);
        setEvents(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch events. Please try again.');
      } finally {
        setIsFetchingEvents(false);
      }
    };

    fetchCsrfToken();
    fetchEvents();
  }, [router]);

  const handleChange = (name, value) => {
    setEventData({ ...eventData, [name]: value });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventData({ ...eventData, date: selectedDate });
    }
  };

  const handleSubmit = async () => {
    if (!eventData.name || !eventData.location || !eventData.date) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const csrfToken = await AsyncStorage.getItem('csrftoken');
      if (!token) {
        setError('Please log in to create an event.');
        router.replace('/login');
        return;
      }

      const formattedDate = eventData.date.toISOString().split('T')[0];
      const response = await fetch(`${BASE_URL}/api/auth/events/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          date: formattedDate,
          eventNotes: eventData.eventNotes || null,
          weatherNotes: eventData.weatherNotes || null,
        }),
        credentials: 'include',
      });

      const text = await response.text();
      console.log('Create Event Response Status:', response.status);
      console.log('Create Event Response Text:', text);

      if (!response.ok) {
        const data = JSON.parse(text);
        throw new Error(data.detail || 'Failed to save event.');
      }

      const data = JSON.parse(text);
      setEvents([...events, data]);
      setEventData({ name: '', location: '', date: new Date(), eventNotes: '', weatherNotes: '' });
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to save event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const csrfToken = await AsyncStorage.getItem('csrftoken');
              if (!token) {
                setError('Please log in to delete an event.');
                router.replace('/login');
                return;
              }

              const response = await fetch(`${BASE_URL}/api/auth/events/${eventId}/`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Token ${token}`,
                  'X-CSRFToken': csrfToken || '',
                  'Accept': 'application/json',
                },
                credentials: 'include',
              });

              if (!response.ok) {
                throw new Error('Failed to delete event.');
              }

              setEvents(events.filter((event) => event.id !== eventId));
            } catch (err) {
              setError(err.message || 'Failed to delete event. Please try again.');
            }
          },
        },
      ]
    );
  };

  const locations = [
    { label: 'Select location', value: '' },
    { label: 'Nairobi', value: 'Nairobi' },
    { label: 'Mombasa', value: 'Mombasa' },
    { label: 'Kisumu', value: 'Kisumu' },
    { label: 'Nakuru', value: 'Nakuru' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.mainContent}>
        {/* Create Event Form */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Plan Your Events</Text>
            <Text style={styles.formSubtitle}>Create a new event</Text>
          </View>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <View style={styles.form}>
            <View style={styles.formField}>
              <Text style={styles.label}>Event Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Wedding, Birthday Party"
                value={eventData.name}
                onChangeText={(value) => handleChange('name', value)}
                required
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={eventData.location}
                  onValueChange={(value) => handleChange('location', value)}
                  style={styles.picker}
                >
                  {locations.map((loc) => (
                    <Picker.Item key={loc.value} label={loc.label} value={loc.value} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {eventData.date.toISOString().split('T')[0]}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={eventData.date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
            <View style={styles.formField}>
              <Text style={styles.label}>Event Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Dress code, theme, or other important details"
                value={eventData.eventNotes}
                onChangeText={(value) => handleChange('eventNotes', value)}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.label}>Weather Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any specific weather considerations?"
                value={eventData.weatherNotes}
                onChangeText={(value) => handleChange('weatherNotes', value)}
                multiline
                numberOfLines={3}
              />
            </View>
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Saving...' : 'Save Event'}
              </Text>
              {!isLoading && (
                <Text style={styles.buttonIcon}>→</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Events List */}
        {isFetchingEvents ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : events.length > 0 ? (
          <View style={styles.eventsContainer}>
            <Text style={styles.eventsTitle}>Your Events</Text>
            <FlatList
              data={events}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.eventCard}>
                  <Text style={styles.eventName}>{item.name}</Text>
                  <Text style={styles.eventDetail}>Location: {item.location}</Text>
                  <Text style={styles.eventDetail}>Date: {item.date}</Text>
                  <Text style={styles.eventDetail}>
                    Event Notes: {item.eventNotes || '-'}
                  </Text>
                  <Text style={styles.eventDetail}>
                    Weather Notes: {item.weatherNotes || '-'}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events found. Create one above!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  formHeader: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  form: {
    padding: 16,
    gap: 16,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#b91c1c',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  formField: {
    marginBottom: 12,
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
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  dateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonIcon: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 8,
  },
  eventsContainer: {
    marginBottom: 24,
  },
  eventsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  eventDetail: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    fontSize: 14,
    color: '#4b5563',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '500',
  },
});