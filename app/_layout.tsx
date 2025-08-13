import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="google-callback" />
      <Stack.Screen name="terms" options={{ headerShown: true, title: 'Terms' }} />
      <Stack.Screen name="privacy" options={{ headerShown: true, title: 'Privacy' }} />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
