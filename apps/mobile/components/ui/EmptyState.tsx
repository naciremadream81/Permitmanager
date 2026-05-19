import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 rounded-full bg-navy-50 items-center justify-center mb-4">
        <Text className="text-4xl">📋</Text>
      </View>
      <Text className="text-xl font-bold text-navy-500 text-center mb-2">
        {title}
      </Text>
      {description ? (
        <Text className="text-base text-gray-500 text-center mb-6">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          className="bg-navy-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold text-base">{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
