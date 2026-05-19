import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#0F2044" />
      <Text className="mt-4 text-navy-500 text-base font-medium">{message}</Text>
    </View>
  );
}
