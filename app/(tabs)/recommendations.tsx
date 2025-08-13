import { View, Text } from 'react-native';
import { useTailwind } from 'nativewind';

export default function Recommendations() {
  const { tw } = useTailwind();
  return (
    <View style={tw('flex-1 justify-center items-center bg-gray-100')}>
      <Text style={tw('text-xl font-bold')}>Recommendations</Text>
      <Text style={tw('text-gray-600')}>View your recommendations here.</Text>
    </View>
  );
}