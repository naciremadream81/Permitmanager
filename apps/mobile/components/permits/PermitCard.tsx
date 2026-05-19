import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import type { PermitListItem } from '@permitpro/shared';
import { PERMIT_TYPE_CONFIG, RISK_SCORE_THRESHOLDS } from '@permitpro/shared';
import { StatusBadge } from './StatusBadge';
import { DeadlineCountdown } from './DeadlineCountdown';

interface PermitCardProps {
  permit: PermitListItem;
}

function RiskIndicator({ score }: { score: number | null }) {
  if (score === null) return null;
  let color = '#10B981';
  let label = 'Low';
  if (score >= RISK_SCORE_THRESHOLDS.high) {
    color = '#EF4444';
    label = 'High';
  } else if (score >= RISK_SCORE_THRESHOLDS.medium) {
    color = '#F59E0B';
    label = 'Med';
  }

  return (
    <View className="flex-row items-center">
      <View
        style={{ backgroundColor: color }}
        className="w-2 h-2 rounded-full mr-1"
      />
      <Text style={{ color }} className="text-xs font-medium">
        Risk {label}
      </Text>
    </View>
  );
}

export function PermitCard({ permit }: PermitCardProps) {
  const typeConfig = PERMIT_TYPE_CONFIG[permit.type];

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/permits/${permit.id}` as never)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 mx-4 mb-3 overflow-hidden"
      activeOpacity={0.7}
    >
      {/* Top accent bar - risk color */}
      <View
        style={{
          height: 3,
          backgroundColor:
            permit.riskScore !== null && permit.riskScore >= RISK_SCORE_THRESHOLDS.high
              ? '#EF4444'
              : permit.riskScore !== null && permit.riskScore >= RISK_SCORE_THRESHOLDS.medium
              ? '#F59E0B'
              : '#10B981',
        }}
      />

      <View className="p-4">
        {/* Header row */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text
              className="text-base font-bold text-navy-500 mb-0.5"
              numberOfLines={1}
            >
              {permit.title}
            </Text>
            {permit.permitNumber ? (
              <Text className="text-xs text-gray-400">
                #{permit.permitNumber}
              </Text>
            ) : null}
          </View>
          <StatusBadge status={permit.status} size="sm" />
        </View>

        {/* Type + Project row */}
        <View className="flex-row items-center mb-3">
          <View className="bg-gray-100 rounded-lg px-2 py-0.5 mr-2">
            <Text className="text-xs text-gray-600 font-medium">
              {typeConfig.label}
            </Text>
          </View>
          {permit.project ? (
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              {permit.project.name}
            </Text>
          ) : null}
        </View>

        {/* Footer row */}
        <View className="flex-row items-center justify-between">
          <RiskIndicator score={permit.riskScore} />
          {permit.expirationDate ? (
            <DeadlineCountdown date={permit.expirationDate} />
          ) : null}
        </View>

        {/* Completion bar */}
        <View className="mt-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs text-gray-500">Completion</Text>
            <Text className="text-xs font-semibold text-navy-500">
              {permit.completionPercentage}%
            </Text>
          </View>
          <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <View
              style={{ width: `${permit.completionPercentage}%` }}
              className="h-full bg-navy-500 rounded-full"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
