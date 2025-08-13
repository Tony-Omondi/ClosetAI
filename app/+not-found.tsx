import { View, Text } from 'react-native';
import { useTailwind } from 'nativewind';

export default function NotFound() {
  const { tw } = useTailwind();
  return (
    <View style={tw('flex-1 justify-center items-center bg-gray-100')}>
      <Text style={tw('text-2xl font-bold text-gray-800')}>404 - Page Not Found</Text>
      <Text style={tw('text-gray-600')}>The page you are looking for does not exist.</Text>
    </View>
  );
}