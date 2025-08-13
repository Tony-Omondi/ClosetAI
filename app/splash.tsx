import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// Prevent auto-hiding the splash screen
ExpoSplashScreen.preventAutoHideAsync().catch(() => {
  /* Prevent crashing if splash screen fails */
});

const SplashScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const router = useRouter();

  const navigateBasedOnAuth = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      await ExpoSplashScreen.hideAsync();
      if (token) {
        // User is logged in, navigate to dashboard
        router.replace('/(tabs)/dashboard');
      } else {
        // User is not logged in, navigate to login
        router.replace('/(tabs)/login');
      }
    } catch (error) {
      console.error('Splash screen error:', error);
      // Fallback to login if error occurs
      router.replace('/(tabs)/login');
    }
  }, [router]);

  useEffect(() => {
    // Combined animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Navigate after animation
      const timer = setTimeout(navigateBasedOnAuth, 1500);
      return () => clearTimeout(timer); // Cleanup on unmount
    });
  }, [fadeAnim, scaleAnim, navigateBasedOnAuth]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/images/closetai-logo.jpg')}
        style={[
          styles.logo,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        resizeMode="contain"
        onLoadEnd={() => {
          // Ensure splash screen hides if animation fails
          ExpoSplashScreen.hideAsync().catch(() => {});
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});

export default SplashScreen;
