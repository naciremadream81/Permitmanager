import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns';
import type { DeadlineWithPermit } from '@permitpro/shared';
import { PERMIT_STATUS_CONFIG } from '@permitpro/shared';
import { fetchUpcomingDeadlines } from '../../../lib/api-client';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days: Date[] = [];
  let current = start;
  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

interface DeadlineRowProps {
  deadline: DeadlineWithPermit;
}

function DeadlineRow({ deadline }: DeadlineRowProps) {
  const config = PERMIT_STATUS_CONFIG[deadline.permit.status];
  const dueDate = new Date(deadline.dueDate);

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(`/(tabs)/permits/${deadline.permit.id}` as never)
      }
      className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-start"
      activeOpacity={0.7}
    >
      <View
        style={{ backgroundColor: config.color + '20' }}
        className="w-10 h-10 rounded-xl items-center justify-center mr-3 flex-shrink-0"
      >
        <Text style={{ color: config.color }} className="text-lg font-bold">
          {format(dueDate, 'd')}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-navy-500" numberOfLines={1}>
          {deadline.title}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {deadline.permit.title}
          {deadline.permit.permitNumber
            ? ` · #${deadline.permit.permitNumber}`
            : ''}
        </Text>
        <View className="flex-row items-center mt-1.5">
          <View
            style={{ backgroundColor: config.color + '20' }}
            className="rounded-full px-2 py-0.5 mr-2"
          >
            <Text style={{ color: config.color }} className="text-xs font-medium">
              {config.label}
            </Text>
          </View>
          <Text className="text-xs text-gray-400">
            {format(dueDate, 'MMM d, yyyy')}
          </Text>
        </View>
      </View>
      <Text className="text-gray-300 text-lg ml-2">›</Text>
    </TouchableOpacity>
  );
}

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deadlines, setDeadlines] = useState<DeadlineWithPermit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const translateX = useSharedValue(0);

  useEffect(() => {
    fetchUpcomingDeadlines()
      .then(setDeadlines)
      .catch(() => setDeadlines([]))
      .finally(() => setIsLoading(false));
  }, []);

  const calendarDays = useMemo(
    () => buildCalendarDays(currentMonth),
    [currentMonth],
  );

  const deadlinesByDate = useMemo(() => {
    const map: Record<string, DeadlineWithPermit[]> = {};
    for (const d of deadlines) {
      const key = format(new Date(d.dueDate), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(d);
    }
    return map;
  }, [deadlines]);

  const selectedDateDeadlines = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    return deadlinesByDate[key] ?? [];
  }, [selectedDate, deadlinesByDate]);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((m) => subMonths(m, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => addMonths(m, 1));
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  }, []);

  const swipeGesture = Gesture.Pan()
    .onEnd((e) => {
      'worklet';
      if (e.translationX < -60) {
        runOnJS(goToNextMonth)();
      } else if (e.translationX > 60) {
        runOnJS(goToPrevMonth)();
      }
    });

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(translateX.value) }],
  }));

  if (isLoading) return <LoadingScreen message="Loading calendar..." />;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-navy-500 px-5 pt-4 pb-5">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-white text-2xl font-black">Calendar</Text>
          <TouchableOpacity
            onPress={goToToday}
            className="bg-amber-500 rounded-full px-3 py-1"
          >
            <Text className="text-white text-xs font-bold">Today</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-white/60 text-sm">
          {deadlines.length} upcoming deadline{deadlines.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Month navigation */}
        <View className="bg-white flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
          <TouchableOpacity
            onPress={goToPrevMonth}
            className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
          >
            <Text className="text-navy-500 font-bold">‹</Text>
          </TouchableOpacity>
          <Text className="text-navy-500 text-lg font-black">
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity
            onPress={goToNextMonth}
            className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
          >
            <Text className="text-navy-500 font-bold">›</Text>
          </TouchableOpacity>
        </View>

        {/* Day-of-week headers */}
        <View className="bg-white flex-row px-2 pt-3 pb-1">
          {DAYS_OF_WEEK.map((day) => (
            <View key={day} style={{ flex: 1 }} className="items-center">
              <Text className="text-xs font-semibold text-gray-400 uppercase">
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={slideStyle} className="bg-white px-2 pb-3">
            <View className="flex-row flex-wrap">
              {calendarDays.map((day, idx) => {
                const key = format(day, 'yyyy-MM-dd');
                const hasDeadlines = (deadlinesByDate[key]?.length ?? 0) > 0;
                const isSelected = isSameDay(day, selectedDate);
                const isCurrent = isSameMonth(day, currentMonth);
                const todayFlag = isToday(day);

                return (
                  <TouchableOpacity
                    key={`${key}-${idx}`}
                    onPress={() => setSelectedDate(day)}
                    style={{ width: '14.28%' }}
                    className="items-center py-1.5"
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        isSelected
                          ? { backgroundColor: '#0F2044' }
                          : todayFlag
                          ? { backgroundColor: '#FEF3C7' }
                          : {},
                        {
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: isSelected
                            ? '#FFFFFF'
                            : todayFlag
                            ? '#D97706'
                            : isCurrent
                            ? '#0F2044'
                            : '#CBD5E1',
                          fontSize: 13,
                          fontWeight: isSelected || todayFlag ? '700' : '400',
                        }}
                      >
                        {format(day, 'd')}
                      </Text>
                    </View>
                    {hasDeadlines && (
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 2.5,
                          backgroundColor: isSelected ? '#F59E0B' : '#F59E0B',
                          marginTop: 2,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </GestureDetector>

        {/* Selected day deadlines */}
        <View className="px-5 mt-4 pb-8">
          <Text className="text-navy-500 text-base font-bold mb-3">
            {isToday(selectedDate)
              ? "Today's Deadlines"
              : `${format(selectedDate, 'MMMM d')} Deadlines`}
          </Text>

          {selectedDateDeadlines.length > 0 ? (
            selectedDateDeadlines.map((d) => (
              <DeadlineRow key={d.id} deadline={d} />
            ))
          ) : (
            <View className="bg-white rounded-xl p-6 items-center shadow-sm">
              <Text className="text-3xl mb-2">📅</Text>
              <Text className="text-gray-500 text-sm text-center">
                No deadlines on this day.
              </Text>
            </View>
          )}

          {/* All upcoming deadlines */}
          {deadlines.length > 0 ? (
            <>
              <Text className="text-navy-500 text-base font-bold mt-5 mb-3">
                All Upcoming Deadlines
              </Text>
              {deadlines.slice(0, 20).map((d) => (
                <DeadlineRow key={`all-${d.id}`} deadline={d} />
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
