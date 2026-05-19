import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import type { DashboardStats, PermitListItem } from '@permitpro/shared';
import { fetchDashboardStats, fetchPermits } from '../../lib/api-client';
import { useAuthStore } from '../../store/authStore';
import { PermitCard } from '../../components/permits/PermitCard';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { InlineError } from '../../components/ui/ErrorBoundary';
import { EmptyState } from '../../components/ui/EmptyState';

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
  icon: string;
}

function StatCard({ label, value, color, bgColor, icon }: StatCardProps) {
  return (
    <View
      style={{ backgroundColor: bgColor, minWidth: 100 }}
      className="rounded-2xl px-4 py-3 mr-3"
    >
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text style={{ color }} className="text-2xl font-black">
        {value}
      </Text>
      <Text style={{ color: color + 'BB' }} className="text-xs font-medium mt-0.5">
        {label}
      </Text>
    </View>
  );
}

interface InsightCardProps {
  title: string;
  description: string;
  severity: string;
}

function InsightCard({ title, description, severity }: InsightCardProps) {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    critical: { bg: '#FEE2E2', text: '#DC2626', icon: '🚨' },
    high: { bg: '#FEF3C7', text: '#D97706', icon: '⚠️' },
    medium: { bg: '#EFF6FF', text: '#2563EB', icon: '💡' },
    low: { bg: '#F0FDF4', text: '#16A34A', icon: 'ℹ️' },
  };
  const config = colorMap[severity] ?? colorMap.low;

  return (
    <View
      style={{ backgroundColor: config.bg, minWidth: 220, maxWidth: 240 }}
      className="rounded-2xl p-4 mr-3"
    >
      <Text className="text-xl mb-2">{config.icon}</Text>
      <Text
        style={{ color: config.text }}
        className="text-sm font-bold mb-1"
        numberOfLines={2}
      >
        {title}
      </Text>
      <Text className="text-xs text-gray-600" numberOfLines={3}>
        {description}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPermits, setRecentPermits] = useState<PermitListItem[]>([]);
  const [insights, setInsights] = useState<
    Array<{ id: string; type: string; title: string; description: string; severity: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [statsData, permitsData] = await Promise.all([
        fetchDashboardStats(),
        fetchPermits({ pageSize: 10 }),
      ]);
      setStats(statsData);
      setRecentPermits(permitsData.data);

      // Insights from stats
      const insightItems: Array<{ id: string; type: string; title: string; description: string; severity: string }> = [];
      if (statsData.overdueItems > 0) {
        insightItems.push({
          id: '1',
          type: 'overdue',
          title: `${statsData.overdueItems} Overdue Items`,
          description: 'Some permit checklist items are past due. Review and take action.',
          severity: 'high',
        });
      }
      if (statsData.expiringThisMonth > 0) {
        insightItems.push({
          id: '2',
          type: 'expiring',
          title: `${statsData.expiringThisMonth} Expiring This Month`,
          description: 'Permits expiring soon require renewal or extension.',
          severity: 'medium',
        });
      }
      if (statsData.riskAverage > 60) {
        insightItems.push({
          id: '3',
          type: 'risk',
          title: 'Portfolio Risk Elevated',
          description: `Average risk score is ${Math.round(statsData.riskAverage)}. Review at-risk permits.`,
          severity: 'critical',
        });
      }
      if (insightItems.length === 0) {
        insightItems.push({
          id: '4',
          type: 'ok',
          title: 'Portfolio Looking Good',
          description: 'No critical issues detected. Keep up the great work!',
          severity: 'low',
        });
      }
      setInsights(insightItems);
    } catch (e) {
      setError('Failed to load dashboard data. Pull down to retry.');
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  if (isLoading) return <LoadingScreen message="Loading dashboard..." />;
  if (error && !stats) {
    return <InlineError message={error} onRetry={() => { setIsLoading(true); loadData().finally(() => setIsLoading(false)); }} />;
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#0F2044"
          />
        }
      >
        {/* Header */}
        <View className="bg-navy-500 pt-4 pb-6 px-5">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-white/70 text-sm">Good morning,</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/settings' as never)}
            >
              <View className="w-8 h-8 rounded-full bg-amber-500 items-center justify-center">
                <Text className="text-white text-sm font-bold">
                  {firstName[0]?.toUpperCase() ?? 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text className="text-white text-2xl font-black">{firstName}! 👋</Text>
        </View>

        {/* Stats row */}
        {stats ? (
          <View className="px-5 -mt-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              <StatCard
                label="Active Permits"
                value={stats.activePermits}
                color="#0F2044"
                bgColor="#FFFFFF"
                icon="📋"
              />
              <StatCard
                label="Due Today"
                value={stats.upcomingDeadlines.filter(d => {
                  const due = new Date(d.dueDate);
                  const today = new Date();
                  return due.toDateString() === today.toDateString();
                }).length}
                color="#D97706"
                bgColor="#FEF3C7"
                icon="⏰"
              />
              <StatCard
                label="At Risk"
                value={stats.overdueItems}
                color="#DC2626"
                bgColor="#FEE2E2"
                icon="⚠️"
              />
              <StatCard
                label="Completion"
                value={`${Math.round(stats.completionAverage)}%`}
                color="#16A34A"
                bgColor="#F0FDF4"
                icon="✅"
              />
            </ScrollView>
          </View>
        ) : null}

        {/* AI Insights */}
        {insights.length > 0 ? (
          <View className="mt-5">
            <View className="flex-row items-center justify-between px-5 mb-3">
              <Text className="text-navy-500 text-lg font-bold">AI Insights</Text>
              <View className="bg-amber-100 rounded-full px-2 py-0.5">
                <Text className="text-amber-600 text-xs font-semibold">
                  {insights.length} alerts
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  title={insight.title}
                  description={insight.description}
                  severity={insight.severity}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Recent Permits */}
        <View className="mt-5">
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text className="text-navy-500 text-lg font-bold">Recent Permits</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/permits' as never)}>
              <Text className="text-amber-500 text-sm font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          {recentPermits.length === 0 ? (
            <EmptyState
              title="No permits yet"
              description="Create your first permit to get started."
              actionLabel="New Permit"
              onAction={() => router.push('/(tabs)/permits' as never)}
            />
          ) : (
            <FlashList
              data={recentPermits}
              renderItem={({ item }) => <PermitCard permit={item} />}
              estimatedItemSize={160}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
            />
          )}
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
