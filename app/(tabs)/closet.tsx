import { View, Text } from 'react-native';
import { useTailwind } from 'nativewind';

export default function Closet() {
  const { tw } = useTailwind();
  return (
    <View style={tw('flex-1 justify-center items-center bg-gray-100')}>
      <Text style={tw('text-xl font-bold')}>Closet</Text>
      <Text style={tw('text-gray-600')}>Manage your closet here.</Text>
    </View>
  );
}