import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import type { PermitListItem, PermitStatus, PermitType } from '@permitpro/shared';
import { PERMIT_STATUS_CONFIG, PermitStatus as PS } from '@permitpro/shared';
import { fetchPermits } from '../../../lib/api-client';
import { usePermitsStore } from '../../../store/permitsStore';
import { PermitCard } from '../../../components/permits/PermitCard';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import { InlineError } from '../../../components/ui/ErrorBoundary';

const STATUS_FILTERS: Array<{ label: string; value: PermitStatus | null }> = [
  { label: 'All', value: null },
  { label: 'Active', value: PS.ACTIVE },
  { label: 'Submitted', value: PS.SUBMITTED },
  { label: 'Under Review', value: PS.UNDER_REVIEW },
  { label: 'Corrections', value: PS.CORRECTIONS_NEEDED },
  { label: 'Approved', value: PS.APPROVED },
  { label: 'Expired', value: PS.EXPIRED },
  { label: 'Draft', value: PS.DRAFT },
];

export default function PermitsListScreen() {
  const {
    permits,
    setPermits,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isLoading,
    setLoading,
    error,
    setError,
  } = usePermitsStore();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPermits = useCallback(
    async (pageNum = 1, reset = false) => {
      if (pageNum === 1) setLoading(true);
      else setIsLoadingMore(true);

      try {
        setError(null);
        const result = await fetchPermits({
          page: pageNum,
          pageSize: 20,
          status: statusFilter ?? undefined,
          search: searchQuery || undefined,
        });

        if (reset || pageNum === 1) {
          setPermits(result.data, result.total);
        } else {
          setPermits([...permits, ...result.data], result.total);
        }
        setTotalPages(result.totalPages);
        setPage(pageNum);
      } catch {
        setError('Failed to load permits.');
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [statusFilter, searchQuery, permits, setPermits, setLoading, setError],
  );

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      loadPermits(1, true);
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, statusFilter]);

  const handleLoadMore = () => {
    if (!isLoadingMore && page < totalPages) {
      loadPermits(page + 1);
    }
  };

  if (isLoading && permits.length === 0) {
    return <LoadingScreen message="Loading permits..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-navy-500 px-5 pt-4 pb-4">
        <Text className="text-white text-2xl font-black mb-3">Permits</Text>

        {/* Search bar */}
        <View className="flex-row items-center bg-white/15 rounded-xl px-3 py-2.5">
          <Text className="text-white/60 mr-2">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search permits..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="flex-1 text-white text-sm"
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text className="text-white/60 text-base">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Status filter chips */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        >
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;
            const config = filter.value ? PERMIT_STATUS_CONFIG[filter.value] : null;
            return (
              <TouchableOpacity
                key={filter.label}
                onPress={() => setStatusFilter(filter.value)}
                style={
                  active
                    ? { backgroundColor: config?.color ?? '#0F2044' }
                    : {}
                }
                className={`px-3 py-1.5 rounded-full border ${
                  active
                    ? 'border-transparent'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <Text
                  style={active ? { color: '#FFFFFF' } : {}}
                  className={`text-xs font-semibold ${active ? '' : 'text-gray-600'}`}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {error ? (
        <InlineError
          message={error}
          onRetry={() => loadPermits(1, true)}
        />
      ) : permits.length === 0 ? (
        <EmptyState
          title="No permits found"
          description={
            searchQuery || statusFilter
              ? 'Try adjusting your filters.'
              : 'Create your first permit to get started.'
          }
          actionLabel="New Permit"
          onAction={() => router.push('/(tabs)/permits/new' as never)}
        />
      ) : (
        <FlashList
          data={permits}
          renderItem={({ item }) => <PermitCard permit={item} />}
          estimatedItemSize={170}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-4 items-center">
                <Text className="text-gray-400 text-sm">Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/permits/new' as never)}
        className="absolute bottom-6 right-5 bg-amber-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: '#F59E0B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text className="text-white text-3xl font-light">+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
