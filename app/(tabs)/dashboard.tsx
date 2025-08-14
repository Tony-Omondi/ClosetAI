
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.88.66:8000/api/auth/profile/';

const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        setIsLoading(true);
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.errors || 'Failed to fetch user profile.');
        }
        setUser(data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    router.push('/login');
  };

  const profilePictureUrl = user?.profile?.profile_picture
    ? user.profile.profile_picture.startsWith('http')
      ? user.profile.profile_picture
      : `http://192.168.88.66:8000${user.profile.profile_picture}`
    : null;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mobile Sidebar Toggle */}
      <TouchableOpacity
        style={[styles.toggleButton, isOpen && styles.toggleButtonOpen]}
        onPress={toggleSidebar}
        accessibilityLabel="Toggle sidebar"
      >
        <Text style={styles.toggleIcon}>☰</Text>
      </TouchableOpacity>

      {/* Sidebar Overlay */}
      <TouchableOpacity
        style={[styles.overlay, isOpen ? styles.overlayVisible : styles.overlayHidden]}
        onPress={toggleSidebar}
        activeOpacity={1}
        accessibilityLabel="Close sidebar"
      />

      {/* Sidebar */}
      <View
        style={[
          styles.sidebar,
          isOpen ? styles.sidebarOpen : styles.sidebarClosed,
        ]}
      >
        <View style={styles.sidebarContent}>
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
                accessibilityLabel="User profile picture"
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileInitial}>
                  {user?.profile?.full_name?.[0] || 'U'}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.profileName}>
                {user?.profile?.full_name || 'User'}
              </Text>
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Text style={styles.profileLink}>View profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation */}
          <View style={styles.navContainer}>
            <TouchableOpacity
              style={styles.navItemActive}
              onPress={() => router.push('/dashboard')}
              accessibilityLabel="Dashboard"
            >
              <Text style={styles.navIcon}>🏠</Text>
              <Text style={styles.navText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.push('/closet')}
              accessibilityLabel="My Closet"
            >
              <Text style={styles.navIcon}>👗</Text>
              <Text style={styles.navText}>My Closet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.push('/events')}
              accessibilityLabel="Events"
            >
              <Text style={styles.navIcon}>📅</Text>
              <Text style={styles.navText}>Events</Text>
              <Text style={styles.navBadge}>12</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.push('/recommendations')}
              accessibilityLabel="Recommendations"
            >
              <Text style={styles.navIcon}>⭐</Text>
              <Text style={styles.navText}>Recommendations</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.push('/profile')}
              accessibilityLabel="Profile"
            >
              <Text style={styles.navIcon}>👤</Text>
              <Text style={styles.navText}>Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={handleLogout}
            accessibilityLabel="Logout"
          >
            <Text style={styles.navIcon}>🚪</Text>
            <Text style={styles.navText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        {/* Welcome Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Welcome back, {user?.profile?.full_name?.split(' ')[0] || 'User'}!
          </Text>
          <Text style={styles.sectionSubtitle}>
            Here's what's happening with your wardrobe today
          </Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Quick Add</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>👕</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Total Items</Text>
              <Text style={styles.statValue}>210</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>📅</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Upcoming Events</Text>
              <Text style={styles.statValue}>3</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>❤️</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Favorite Outfits</Text>
              <Text style={styles.statValue}>14</Text>
            </View>
          </View>
        </View>

        {/* Wardrobe Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Wardrobe</Text>
            <TouchableOpacity onPress={() => router.push('/closet')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/5705490/pexels-photo-5705490.jpeg?auto=compress&cs=tinysrgb&w=600' }}
              style={styles.sectionImage}
              accessibilityLabel="Wardrobe preview"
            />
            <Text style={styles.sectionSubtitle}>Your Style Inventory</Text>
            <Text style={styles.sectionText}>
              View and manage all your clothing items in one place. Organize by
              category, season, or occasion.
            </Text>
            <View style={styles.statsGrid}>
              <View>
                <Text style={styles.statLabel}>Tops</Text>
                <Text style={styles.statValue}>78</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Bottoms</Text>
                <Text style={styles.statValue}>42</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Shoes</Text>
                <Text style={styles.statValue}>24</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Accessories</Text>
                <Text style={styles.statValue}>36</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.sectionButton}
              onPress={() => router.push('/closet')}
            >
              <Text style={styles.sectionButtonText}>View Full Closet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/events')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderIcon}>📅</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Your Scheduled Events</Text>
            <Text style={styles.sectionText}>
              Plan your outfits for upcoming occasions and never be caught
              unprepared.
            </Text>
            <View style={styles.eventList}>
              <View style={styles.eventItem}>
                <View style={styles.eventIconContainer}>
                  <Text style={styles.eventIcon}>📅</Text>
                </View>
                <View>
                  <Text style={styles.eventTitle}>Business Meeting</Text>
                  <Text style={styles.eventTime}>Tomorrow, 10:00 AM</Text>
                </View>
              </View>
              <View style={styles.eventItem}>
                <View style={styles.eventIconContainer}>
                  <Text style={styles.eventIcon}>📅</Text>
                </View>
                <View>
                  <Text style={styles.eventTitle}>Friend's Wedding</Text>
                  <Text style={styles.eventTime}>Saturday, 2:00 PM</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.sectionButton}
              onPress={() => router.push('/events')}
            >
              <Text style={styles.sectionButtonText}>Plan Outfits</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Outfit Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Outfits</Text>
            <TouchableOpacity onPress={() => router.push('/recommendations')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderIcon}>👗</Text>
            </View>
            <Text style={styles.sectionSubtitle}>AI-Curated Outfits</Text>
            <Text style={styles.sectionText}>
              Discover new outfit combinations based on your wardrobe and
              preferences.
            </Text>
            <View style={styles.tagContainer}>
              <Text style={styles.tag}>Casual</Text>
              <Text style={styles.tag}>Formal</Text>
              <Text style={styles.tag}>Work</Text>
            </View>
            <TouchableOpacity
              style={styles.sectionButton}
              onPress={() => router.push('/recommendations')}
            >
              <Text style={styles.sectionButtonText}>Get Recommendations</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    color: '#4b5563',
    fontSize: 16,
  },
  toggleButton: {
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
  toggleButtonOpen: {
    transform: [{ rotate: '90deg' }],
  },
  toggleIcon: {
    fontSize: 24,
    color: '#374151',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayVisible: {
    opacity: 1,
  },
  overlayHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 256,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 40,
  },
  sidebarOpen: {
    transform: [{ translateX: 0 }],
  },
  sidebarClosed: {
    transform: [{ translateX: -256 }],
  },
  sidebarContent: {
    flex: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    height: 56,
    width: 'auto',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 32,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 20,
    color: '#4f46e5',
    fontWeight: '500',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    maxWidth: 150,
  },
  profileLink: {
    fontSize: 12,
    color: '#6b7280',
  },
  navContainer: {
    flex: 1,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  navItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
  },
  navIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#374151',
  },
  navText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  navBadge: {
    marginLeft: 'auto',
    backgroundColor: '#e0e7ff',
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  sectionLink: {
    fontSize: 14,
    color: '#4f46e5',
  },
  sectionImage: {
    width: '100%',
    height: 192,
    borderRadius: 8,
    marginBottom: 16,
  },
  placeholderImage: {
    width: '100%',
    height: 192,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderIcon: {
    fontSize: 64,
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 150,
  },
  statIconContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    marginRight: 12,
  },
  statIcon: {
    fontSize: 24,
    color: '#4f46e5',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  eventList: {
    gap: 16,
    marginBottom: 16,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIconContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 20,
    color: '#4f46e5',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  eventTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e0e7ff',
    color: '#4f46e5',
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  sectionButton: {
    padding: 12,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    alignItems: 'center',
  },
  sectionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default Dashboard;
