import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import type { ChecklistItemWithAssignee } from '@permitpro/shared';
import { ChecklistItemStatus } from '@permitpro/shared';
import {
  fetchChecklist,
  updateChecklistItem,
  generateChecklist,
} from '../../../../lib/api-client';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { InlineError } from '../../../../components/ui/ErrorBoundary';

interface ChecklistRowProps {
  item: ChecklistItemWithAssignee;
  onComplete: (id: string) => void;
}

function ChecklistRow({ item, onComplete }: ChecklistRowProps) {
  const translateX = useSharedValue(0);
  const isCompleted = item.status === ChecklistItemStatus.COMPLETED;

  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      if (!isCompleted && e.translationX > 0) {
        translateX.value = Math.min(e.translationX, 100);
      }
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationX > 60 && !isCompleted) {
        translateX.value = withSpring(0);
        runOnJS(onComplete)(item.id);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const statusColor =
    item.status === ChecklistItemStatus.COMPLETED ? '#10B981' :
    item.status === ChecklistItemStatus.BLOCKED ? '#EF4444' :
    item.status === ChecklistItemStatus.IN_PROGRESS ? '#3B82F6' : '#9CA3AF';

  return (
    <View className="relative mx-4 mb-2">
      {/* Swipe background */}
      <View
        className="absolute inset-0 rounded-xl bg-emerald-500 items-center justify-center flex-row px-4"
        style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 16 }}
      >
        <Text className="text-white text-xl mr-2">✓</Text>
        <Text className="text-white font-bold">Complete</Text>
      </View>

      <GestureDetector gesture={swipeGesture}>
        <Animated.View
          style={[rowStyle]}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <View className="flex-row items-start">
            <TouchableOpacity
              onPress={() => !isCompleted && onComplete(item.id)}
              className="mr-3 mt-0.5"
            >
              <View
                style={{ borderColor: statusColor }}
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  isCompleted ? 'bg-emerald-500' : 'bg-white'
                }`}
              >
                {isCompleted ? (
                  <Text className="text-white text-xs">✓</Text>
                ) : null}
              </View>
            </TouchableOpacity>
            <View className="flex-1">
              <Text
                className={`text-sm font-semibold ${
                  isCompleted ? 'text-gray-400 line-through' : 'text-navy-500'
                }`}
              >
                {item.title}
              </Text>
              {item.description ? (
                <Text className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </Text>
              ) : null}
              <View className="flex-row items-center mt-2 gap-2">
                {item.category ? (
                  <View className="bg-gray-100 rounded-full px-2 py-0.5">
                    <Text className="text-xs text-gray-500">{item.category}</Text>
                  </View>
                ) : null}
                {item.dueDate ? (
                  <Text className="text-xs text-amber-600">
                    Due {new Date(item.dueDate).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function ChecklistTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [items, setItems] = useState<ChecklistItemWithAssignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChecklist = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await fetchChecklist(id);
      setItems(data);
      setError(null);
    } catch {
      setError('Failed to load checklist.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  const handleComplete = useCallback(
    async (itemId: string) => {
      if (!id) return;
      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: ChecklistItemStatus.COMPLETED,
                completedAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      try {
        await updateChecklistItem(id, itemId, {
          status: ChecklistItemStatus.COMPLETED,
        });
      } catch {
        // Revert
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, status: ChecklistItemStatus.NOT_STARTED, completedAt: null }
              : item,
          ),
        );
        Alert.alert('Error', 'Failed to update checklist item.');
      }
    },
    [id],
  );

  const handleGenerate = useCallback(async () => {
    if (!id) return;
    setIsGenerating(true);
    try {
      const generated = await generateChecklist(id);
      await loadChecklist();
      Alert.alert('Success', `Generated ${generated.length} checklist items.`);
    } catch {
      Alert.alert('Error', 'Failed to generate checklist. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [id, loadChecklist]);

  if (isLoading) return <LoadingScreen message="Loading checklist..." />;
  if (error) return <InlineError message={error} onRetry={loadChecklist} />;

  const completed = items.filter(
    (i) => i.status === ChecklistItemStatus.COMPLETED,
  ).length;
  const progress = items.length > 0 ? (completed / items.length) * 100 : 0;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Progress header */}
      {items.length > 0 ? (
        <View className="bg-white px-5 py-3 border-b border-gray-100">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-sm font-semibold text-navy-500">
              {completed} of {items.length} completed
            </Text>
            <Text className="text-sm font-bold text-navy-500">
              {Math.round(progress)}%
            </Text>
          </View>
          <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <View
              style={{ width: `${progress}%` }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </View>
          <Text className="text-xs text-gray-400 mt-1">
            Swipe right on an item to complete it
          </Text>
        </View>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="No checklist items"
          description="Use AI to generate a checklist for this permit type."
          actionLabel={isGenerating ? 'Generating...' : 'Generate with AI'}
          onAction={isGenerating ? undefined : handleGenerate}
        />
      ) : (
        <FlashList
          data={items}
          renderItem={({ item }) => (
            <ChecklistRow item={item} onComplete={handleComplete} />
          )}
          estimatedItemSize={80}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 80 }}
        />
      )}

      {/* AI Generate button */}
      {items.length > 0 ? (
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={isGenerating}
          className="absolute bottom-6 right-5 bg-amber-500 px-4 h-12 rounded-full items-center justify-center flex-row shadow-lg"
          style={{
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text className="text-white text-base mr-1">🤖</Text>
              <Text className="text-white font-bold text-sm">AI Generate</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
