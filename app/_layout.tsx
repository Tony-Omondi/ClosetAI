
import { Tabs, Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Disable headers for all stack screens
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Disable headers for all tab screens
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          href: '/', // Make dashboard the default tab
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="signup"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
