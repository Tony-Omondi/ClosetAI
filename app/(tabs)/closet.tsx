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
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign, MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';

const BASE_URL = 'http://192.168.88.66:8000';

const MyCloset = () => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [formData, setFormData] = useState({
    category: 'tshirts',
    name: '',
    image: null,
    description: '',
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [imageUri, setImageUri] = useState(null);

  const categoryOptions = [
    { value: 'tshirts', label: 'T-shirts' },
    { value: 'shirts_blouses', label: 'Shirts/Blouses' },
    { value: 'sweaters_hoodies', label: 'Sweaters/Hoodies' },
    { value: 'tank_tops_camisoles', label: 'Tank Tops/Camisoles' },
    { value: 'jeans', label: 'Jeans' },
    { value: 'trousers_pants', label: 'Trousers/Pants' },
    { value: 'shorts', label: 'Shorts' },
    { value: 'skirts', label: 'Skirts' },
    { value: 'dresses', label: 'Dresses' },
    { value: 'jumpsuits', label: 'Jumpsuits' },
    { value: 'jackets', label: 'Jackets' },
    { value: 'coats', label: 'Coats' },
    { value: 'blazers', label: 'Blazers' },
    { value: 'raincoats_trenchcoats', label: 'Raincoats/Trenchcoats' },
    { value: 'hats_caps', label: 'Hats/Caps' },
    { value: 'scarves', label: 'Scarves' },
    { value: 'belts', label: 'Belts' },
    { value: 'gloves', label: 'Gloves' },
    { value: 'sunglasses', label: 'Sunglasses' },
    { value: 'jewelry', label: 'Jewelry' },
    { value: 'sneakers', label: 'Sneakers' },
    { value: 'boots', label: 'Boots' },
    { value: 'sandals', label: 'Sandals' },
    { value: 'formal_shoes', label: 'Formal Shoes' },
    { value: 'underwear', label: 'Underwear' },
    { value: 'bras', label: 'Bras' },
    { value: 'pajamas', label: 'Pajamas' },
    { value: 'lounge_sets', label: 'Lounge Sets' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/login');
          return;
        }
        const response = await fetch(`${BASE_URL}/api/auth/profile/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };

    fetchProfile();
    fetchClosetItems();
  }, []);

  const fetchClosetItems = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }
      const response = await fetch(`${BASE_URL}/api/auth/closet/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      const data = await response.json();
      setItems(data.items);
      setGrouped(data.grouped);
    } catch (err) {
      setError(err.message || 'Failed to load closet items. Please ensure you are logged in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
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
      setFormData({ ...formData, image: result.assets[0] });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      setError('Please enter an item name');
      return;
    }

    const data = new FormData();
    data.append('category', formData.category);
    data.append('name', formData.name);
    if (formData.image) {
      data.append('image', {
        uri: formData.image.uri,
        name: formData.image.fileName || 'image.jpg',
        type: formData.image.type || 'image/jpeg',
      });
    }
    data.append('description', formData.description);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }
      
      const response = await fetch(`${BASE_URL}/api/auth/closet/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: data,
      });

      if (!response.ok) {
        throw new Error('Failed to upload item');
      }

      setFormData({ category: 'tshirts', name: '', image: null, description: '' });
      setImageUri(null);
      fetchClosetItems();
    } catch (err) {
      setError(err.message || 'Failed to upload item. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                throw new Error('No token found. Please log in.');
              }
              await fetch(`${BASE_URL}/api/auth/closet/${id}/`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Token ${token}`,
                },
              });
              fetchClosetItems();
            } catch (err) {
              setError(err.message || 'Failed to delete item. Please try again.');
            }
          },
        },
      ]
    );
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

  const itemsByCategory = {};
  items.forEach((item) => {
    const categoryLabel = categoryOptions.find(opt => opt.value === item.category)?.label || item.category;
    if (!itemsByCategory[categoryLabel]) {
      itemsByCategory[categoryLabel] = [];
    }
    itemsByCategory[categoryLabel].push(item);
  });

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
                style={[styles.navItem, styles.activeNavItem]}
                onPress={toggleSidebar}
              >
                <Feather name="list" size={20} color="#4f46e5" />
                <Text style={[styles.navText, styles.activeNavText]}>My Closet</Text>
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
                style={styles.navItem}
                onPress={() => {
                  router.push('/profile');
                  toggleSidebar();
                }}
              >
                <Feather name="user" size={20} color="#6b7280" />
                <Text style={styles.navText}>Profile</Text>
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Closet</Text>
          <Text style={styles.headerSubtitle}>Manage your fashion collection</Text>
        </View>

        {/* Upload Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Add New Item</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
                style={styles.picker}
              >
                {categoryOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="e.g. Denim Jacket"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Image</Text>
            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Feather name="image" size={32} color="#9ca3af" />
                  <Text style={styles.uploadText}>Tap to upload an image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Add details about color, size, brand, etc."
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Add to Closet</Text>
          </TouchableOpacity>
        </View>

        {/* Grouped Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Closet Summary</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.summaryContainer}>
              {Object.entries(grouped).map(([category, count]) => (
                <View key={category} style={styles.summaryCard}>
                  <Text style={styles.summaryCount}>{count}</Text>
                  <Text style={styles.summaryLabel}>
                    {categoryOptions.find(opt => opt.value === category)?.label || category}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Items Grouped by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Items</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4f46e5" />
            </View>
          ) : Object.keys(itemsByCategory).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="box" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>Your closet is empty</Text>
              <Text style={styles.emptyText}>Add some items to get started</Text>
            </View>
          ) : (
            Object.entries(itemsByCategory).map(([category, categoryItems]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{categoryItems.length}</Text>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.itemsContainer}>
                    {categoryItems.map((item) => {
                      const itemImageUrl = item.image
                        ? item.image.startsWith('http')
                          ? item.image
                          : `${BASE_URL}${item.image}`
                        : null;

                      return (
                        <View key={item.id} style={styles.itemCard}>
                          {itemImageUrl ? (
                            <Image
                              source={{ uri: itemImageUrl }}
                              style={styles.itemImage}
                            />
                          ) : (
                            <View style={styles.itemImagePlaceholder}>
                              <Feather name="image" size={32} color="#9ca3af" />
                            </View>
                          )}
                          
                          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                          {item.description && (
                            <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
                          )}
                          
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDelete(item.id)}
                          >
                            <Feather name="trash-2" size={18} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            ))
          )}
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
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
  textArea: {
    height: 100,
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
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  itemsContainer: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  itemCard: {
    backgroundColor: 'white',
    width: 160,
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderRadius: 4,
    marginBottom: 8,
  },
  itemImagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    padding: 4,
    borderRadius: 20,
  },
});

export default MyCloset;