import React from 'react';
import { View, Text } from 'react-native';
import type { PermitStatus } from '@permitpro/shared';
import { PERMIT_STATUS_CONFIG } from '@permitpro/shared';

interface StatusBadgeProps {
  status: PermitStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = PERMIT_STATUS_CONFIG[status];

  const sizeClasses = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1',
    lg: 'px-4 py-1.5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <View
      style={{ backgroundColor: config.color + '20' }}
      className={`rounded-full flex-row items-center ${sizeClasses[size]}`}
    >
      <View
        style={{ backgroundColor: config.color }}
        className="w-1.5 h-1.5 rounded-full mr-1.5"
      />
      <Text
        style={{ color: config.color }}
        className={`font-semibold ${textSizeClasses[size]}`}
      >
        {config.label}
      </Text>
    </View>
  );
}
