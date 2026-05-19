import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import type { PermitWithRelations } from '@permitpro/shared';
import { PERMIT_TYPE_CONFIG, RISK_SCORE_THRESHOLDS } from '@permitpro/shared';
import { fetchPermit } from '../../../../lib/api-client';
import { usePermitsStore } from '../../../../store/permitsStore';
import { StatusBadge } from '../../../../components/permits/StatusBadge';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { InlineError } from '../../../../components/ui/ErrorBoundary';

type TabKey = 'overview' | 'documents' | 'checklist' | 'inspections' | 'fees' | 'ai-chat';

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'overview', label: 'Overview', icon: '📋' },
  { key: 'documents', label: 'Docs', icon: '📁' },
  { key: 'checklist', label: 'Checklist', icon: '✅' },
  { key: 'inspections', label: 'Inspections', icon: '🔍' },
  { key: 'fees', label: 'Fees', icon: '💰' },
  { key: 'ai-chat', label: 'AI Chat', icon: '🤖' },
];

// Lazy-loaded tab content components
const OverviewTab = React.lazy(
  () => import('./overview').then((m) => ({ default: m.default })),
);
const DocumentsTab = React.lazy(() => import('./documents').then((m) => ({ default: m.default })));
const ChecklistTab = React.lazy(() => import('./checklist').then((m) => ({ default: m.default })));
const AiChatTab = React.lazy(() => import('./ai-chat').then((m) => ({ default: m.default })));

function InspectionsTab({ permit }: { permit: PermitWithRelations }) {
  if (permit.inspections.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-4xl mb-3">🔍</Text>
        <Text className="text-gray-500 text-base text-center">No inspections scheduled.</Text>
      </View>
    );
  }
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
      {permit.inspections.map((insp) => (
        <View key={insp.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
          <Text className="font-bold text-navy-500">{insp.type}</Text>
          <Text className="text-sm text-gray-500 mt-1">
            {new Date(insp.scheduledDate).toLocaleDateString()} — {insp.status}
          </Text>
          {insp.inspectorName ? (
            <Text className="text-sm text-gray-600 mt-1">
              Inspector: {insp.inspectorName}
            </Text>
          ) : null}
          {insp.notes ? (
            <Text className="text-sm text-gray-600 mt-1">{insp.notes}</Text>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

function FeesTab({ permit }: { permit: PermitWithRelations }) {
  const total = permit.fees.reduce((sum, f) => sum + f.amount, 0);
  const paid = permit.fees.filter((f) => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
      {/* Summary */}
      <View className="bg-navy-500 rounded-2xl p-4 mb-4">
        <View className="flex-row justify-between">
          <View>
            <Text className="text-white/70 text-xs">Total Fees</Text>
            <Text className="text-white text-xl font-black">${total.toLocaleString()}</Text>
          </View>
          <View>
            <Text className="text-white/70 text-xs">Paid</Text>
            <Text className="text-white text-xl font-black">${paid.toLocaleString()}</Text>
          </View>
          <View>
            <Text className="text-white/70 text-xs">Outstanding</Text>
            <Text className="text-amber-400 text-xl font-black">${(total - paid).toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {permit.fees.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-gray-500 text-base">No fees recorded.</Text>
        </View>
      ) : (
        permit.fees.map((fee) => (
          <View key={fee.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row justify-between items-center">
            <View className="flex-1 mr-3">
              <Text className="font-semibold text-navy-500">{fee.description}</Text>
              {fee.dueDate ? (
                <Text className="text-xs text-gray-500 mt-0.5">
                  Due: {new Date(fee.dueDate).toLocaleDateString()}
                </Text>
              ) : null}
            </View>
            <View className="items-end">
              <Text className="font-bold text-navy-500">${fee.amount.toLocaleString()}</Text>
              <View
                style={{
                  backgroundColor:
                    fee.status === 'PAID' ? '#DCFCE7' :
                    fee.status === 'OVERDUE' ? '#FEE2E2' : '#FEF3C7',
                }}
                className="rounded-full px-2 py-0.5 mt-1"
              >
                <Text
                  style={{
                    color:
                      fee.status === 'PAID' ? '#16A34A' :
                      fee.status === 'OVERDUE' ? '#DC2626' : '#D97706',
                  }}
                  className="text-xs font-medium"
                >
                  {fee.status}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

export default function PermitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { permitsById, setPermitDetail } = usePermitsStore();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const permit = permitsById[id ?? ''];

  const loadPermit = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await fetchPermit(id);
      setPermitDetail(data);
      setError(null);
    } catch {
      setError('Failed to load permit details.');
    } finally {
      setIsLoading(false);
    }
  }, [id, setPermitDetail]);

  useEffect(() => {
    if (!permit) {
      loadPermit();
    }
  }, [permit, loadPermit]);

  if (isLoading && !permit) return <LoadingScreen message="Loading permit..." />;
  if (error && !permit) return <InlineError message={error} onRetry={loadPermit} />;
  if (!permit) return <LoadingScreen message="Loading..." />;

  const typeConfig = PERMIT_TYPE_CONFIG[permit.type];
  const riskScore = permit.riskScore ?? 0;
  const riskColor =
    riskScore >= RISK_SCORE_THRESHOLDS.high ? '#EF4444' :
    riskScore >= RISK_SCORE_THRESHOLDS.medium ? '#F59E0B' : '#10B981';

  function renderTabContent() {
    switch (activeTab) {
      case 'overview':
        return (
          <React.Suspense fallback={<LoadingScreen />}>
            <OverviewTab />
          </React.Suspense>
        );
      case 'documents':
        return (
          <React.Suspense fallback={<LoadingScreen />}>
            <DocumentsTab />
          </React.Suspense>
        );
      case 'checklist':
        return (
          <React.Suspense fallback={<LoadingScreen />}>
            <ChecklistTab />
          </React.Suspense>
        );
      case 'inspections':
        return <InspectionsTab permit={permit} />;
      case 'fees':
        return <FeesTab permit={permit} />;
      case 'ai-chat':
        return (
          <React.Suspense fallback={<LoadingScreen />}>
            <AiChatTab />
          </React.Suspense>
        );
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-navy-500 px-5 pt-4 pb-4">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 w-8 h-8 rounded-full bg-white/15 items-center justify-center"
          >
            <Text className="text-white text-base">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-white text-lg font-bold"
              numberOfLines={1}
            >
              {permit.title}
            </Text>
            {permit.permitNumber ? (
              <Text className="text-white/60 text-xs">
                #{permit.permitNumber}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Status + Type + Risk row */}
        <View className="flex-row items-center gap-2 flex-wrap">
          <StatusBadge status={permit.status} size="sm" />
          <View className="bg-white/15 rounded-full px-2.5 py-0.5">
            <Text className="text-white text-xs font-medium">{typeConfig.label}</Text>
          </View>
          {permit.riskScore !== null ? (
            <View
              style={{ backgroundColor: riskColor + '25' }}
              className="rounded-full px-2.5 py-0.5 flex-row items-center"
            >
              <View
                style={{ backgroundColor: riskColor }}
                className="w-1.5 h-1.5 rounded-full mr-1"
              />
              <Text style={{ color: riskColor }} className="text-xs font-semibold">
                Risk {Math.round(riskScore)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Completion bar */}
        <View className="mt-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-white/60 text-xs">Completion</Text>
            <Text className="text-white text-xs font-bold">{permit.completionPercentage}%</Text>
          </View>
          <View className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <View
              style={{ width: `${permit.completionPercentage}%` }}
              className="h-full bg-amber-500 rounded-full"
            />
          </View>
        </View>
      </View>

      {/* Tab bar */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`px-3 py-3 flex-row items-center border-b-2 ${
                activeTab === tab.key
                  ? 'border-amber-500'
                  : 'border-transparent'
              }`}
            >
              <Text className="text-sm mr-1">{tab.icon}</Text>
              <Text
                className={`text-sm font-semibold ${
                  activeTab === tab.key ? 'text-navy-500' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab content */}
      <View className="flex-1">{renderTabContent()}</View>
    </SafeAreaView>
  );
}
