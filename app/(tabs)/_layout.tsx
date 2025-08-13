import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarStyle: { backgroundColor: '#f8fafc' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
        }}
      />
      <Tabs.Screen
        name="closet"
        options={{
          title: 'Closet',
        }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          title: 'Recommendations',
        }}
      />
    </Tabs>
  );
}
