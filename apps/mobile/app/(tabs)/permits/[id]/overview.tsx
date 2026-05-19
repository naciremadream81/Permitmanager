import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import type { PermitWithRelations } from '@permitpro/shared';
import { PERMIT_STATUS_TRANSITIONS } from '@permitpro/shared';
import { fetchPermitSummary, updatePermitStatus } from '../../../../lib/api-client';
import { usePermitsStore } from '../../../../store/permitsStore';
import { StatusBadge } from '../../../../components/permits/StatusBadge';
import { DeadlineCountdown } from '../../../../components/permits/DeadlineCountdown';

export default function OverviewTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { permitsById, updatePermitOptimistic } = usePermitsStore();
  const permit = permitsById[id ?? ''];

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    setSummaryLoading(true);
    fetchPermitSummary(id)
      .then((res) => setSummary(res.summary))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [id]);

  if (!permit) return null;

  const allowedTransitions = PERMIT_STATUS_TRANSITIONS[permit.status] ?? [];

  const handleUpdateStatus = () => {
    if (allowedTransitions.length === 0) {
      Alert.alert('No transitions available', 'This permit cannot be moved to another status.');
      return;
    }

    Alert.alert(
      'Update Status',
      'Select new status:',
      [
        ...allowedTransitions.map((status) => ({
          text: status.replace(/_/g, ' '),
          onPress: () => confirmStatusUpdate(status),
        })),
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const confirmStatusUpdate = async (newStatus: string) => {
    if (!id) return;
    setIsUpdatingStatus(true);
    const previousStatus = permit.status;
    updatePermitOptimistic(id, { status: newStatus as never });

    try {
      await updatePermitStatus(id, newStatus);
      Alert.alert('Success', 'Permit status updated.');
    } catch {
      updatePermitOptimistic(id, { status: previousStatus });
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const keyDates = [
    { label: 'Applied', date: permit.appliedDate },
    { label: 'Issued', date: permit.issuedDate },
    { label: 'Expires', date: permit.expirationDate },
  ].filter((d) => d.date);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {/* AI Summary */}
      <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <View className="flex-row items-center mb-3">
          <Text className="text-base font-bold text-navy-500 flex-1">AI Summary</Text>
          <Text className="text-lg">🤖</Text>
        </View>
        {summaryLoading ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#0F2044" />
            <Text className="text-sm text-gray-500">Generating summary...</Text>
          </View>
        ) : summary ? (
          <Text className="text-sm text-gray-700 leading-relaxed">{summary}</Text>
        ) : (
          <Text className="text-sm text-gray-400 italic">
            AI summary unavailable. Tap the AI Chat tab for detailed analysis.
          </Text>
        )}
      </View>

      {/* Key Info */}
      <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <Text className="text-base font-bold text-navy-500 mb-3">Details</Text>
        <View className="gap-2">
          {permit.jurisdiction ? (
            <View className="flex-row">
              <Text className="text-sm text-gray-500 w-28">Jurisdiction</Text>
              <Text className="text-sm font-medium text-navy-500 flex-1">{permit.jurisdiction}</Text>
            </View>
          ) : null}
          {permit.agency ? (
            <View className="flex-row">
              <Text className="text-sm text-gray-500 w-28">Agency</Text>
              <Text className="text-sm font-medium text-navy-500 flex-1">{permit.agency}</Text>
            </View>
          ) : null}
          {permit.estimatedCost !== null ? (
            <View className="flex-row">
              <Text className="text-sm text-gray-500 w-28">Est. Cost</Text>
              <Text className="text-sm font-medium text-navy-500">${permit.estimatedCost?.toLocaleString()}</Text>
            </View>
          ) : null}
          <View className="flex-row">
            <Text className="text-sm text-gray-500 w-28">Status</Text>
            <StatusBadge status={permit.status} size="sm" />
          </View>
        </View>
      </View>

      {/* Key Dates */}
      {keyDates.length > 0 ? (
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-base font-bold text-navy-500 mb-3">Key Dates</Text>
          <View className="gap-3">
            {keyDates.map((kd) => (
              <View key={kd.label} className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-500">{kd.label}</Text>
                <View className="items-end">
                  <Text className="text-sm font-semibold text-navy-500">
                    {new Date(kd.date!).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  {kd.label === 'Expires' ? (
                    <DeadlineCountdown date={kd.date!} label="" />
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Upcoming Deadlines */}
      {permit.deadlines && permit.deadlines.length > 0 ? (
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-base font-bold text-navy-500 mb-3">Deadlines</Text>
          {permit.deadlines.map((d) => (
            <View key={d.id} className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-gray-700 flex-1 mr-2">{d.title}</Text>
              <DeadlineCountdown date={d.dueDate} label="" />
            </View>
          ))}
        </View>
      ) : null}

      {/* Quick Actions */}
      <View className="gap-3">
        <TouchableOpacity
          onPress={handleUpdateStatus}
          disabled={isUpdatingStatus || allowedTransitions.length === 0}
          className={`bg-navy-500 rounded-xl py-3.5 items-center ${
            allowedTransitions.length === 0 ? 'opacity-50' : ''
          }`}
        >
          {isUpdatingStatus ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-base">Update Status</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/permits/${id}/documents` as never)}
          className="bg-amber-500 rounded-xl py-3.5 items-center"
        >
          <Text className="text-white font-bold text-base">Upload Document</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
