import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTailwind } from 'nativewind';

export default function ResetPassword() {
  const tw = useTailwind();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();
  const { user_id } = useLocalSearchParams();

  useEffect(() => {
    if (!user_id) {
      setError('Invalid request. Please try again.');
      setTimeout(() => router.push('/login'), 3000);
    }
  }, [user_id, router]);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'bg-gray-200';
      case 1: return 'bg-red-400';
      case 2: return 'bg-yellow-400';
      case 3: return 'bg-blue-400';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  const handleSubmit = async () => {
    setError('');
    setMessage('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (passwordStrength < 3) {
      setError('Password is too weak. Please choose a stronger password.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('http://192.168.88.68:8000/api/auth/password-reset-confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, new_password: newPassword, confirm_password: confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.errors || 'Failed to reset password. Please try again.');
      }
      setMessage(data.message || 'Password has been reset successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={tw('min-h-screen bg-gray-50 flex items-center justify-center p-4')}>
      <View style={tw('bg-white p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-md')}>
        <View style={tw('flex justify-center mb-6')}>
          <Image
            source={require('./assets/images/closetai-logo.jpg')}
            style={tw('h-12 md:h-14 w-auto')}
            resizeMode="contain"
          />
        </View>
        <Text style={tw('text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2')}>
          Create New Password
        </Text>
        <Text style={tw('text-gray-600 text-center mb-6')}>
          Enter and confirm your new password
        </Text>
        {message && (
          <View style={tw('mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center')}>
            <Text style={tw('text-sm')}>{message}</Text>
          </View>
        )}
        {error && (
          <View style={tw('mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center')}>
            <Text style={tw('text-sm')}>{error}</Text>
          </View>
        )}
        <View style={tw('space-y-4')}>
          <View>
            <Text style={tw('block text-sm font-medium text-gray-700 mb-1')}>
              New Password
            </Text>
            <TextInput
              style={tw('w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500')}
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                checkPasswordStrength(text);
              }}
              secureTextEntry
              minLength={8}
            />
            {newPassword && (
              <View style={tw('mt-2')}>
                <View style={tw('w-full bg-gray-200 rounded-full h-2')}>
                  <View
                    style={[tw(`h-2 rounded-full ${getPasswordStrengthColor()}`), { width: `${passwordStrength * 25}%` }]}
                  />
                </View>
                <Text style={tw('text-xs text-gray-500 mt-1')}>
                  Password strength: {['Very weak', 'Weak', 'Moderate', 'Strong', 'Very strong'][passwordStrength]}
                </Text>
              </View>
            )}
          </View>
          <View>
            <Text style={tw('block text-sm font-medium text-gray-700 mb-1')}>
              Confirm Password
            </Text>
            <TextInput
              style={tw('w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500')}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            style={tw(`w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center ${isLoading ? 'opacity-75' : ''}`)}
          >
            {isLoading ? (
              <View style={tw('flex-row items-center')}>
                <ActivityIndicator size="small" color="white" style={tw('mr-3')} />
                <Text style={tw('text-white font-medium')}>Resetting...</Text>
              </View>
            ) : (
              <Text style={tw('text-white font-medium')}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={tw('mt-6 text-center')}>
          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={tw('inline-flex items-center')}
          >
            <Text style={tw('text-indigo-600 hover:text-indigo-800 font-medium text-sm')}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}