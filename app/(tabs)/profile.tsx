import { View, Text } from 'react-native';
import { useTailwind } from 'nativewind';

export default function Profile() {
  const { tw } = useTailwind();
  return (
    <View style={tw('flex-1 justify-center items-center bg-gray-100')}>
      <Text style={tw('text-xl font-bold')}>Profile</Text>
      <Text style={tw('text-gray-600')}>Your profile details go here.</Text>
    </View>
  );
}