import React from 'react';
import { View, Text } from 'react-native';
import { differenceInDays, isPast } from 'date-fns';

interface DeadlineCountdownProps {
  date: Date | string;
  label?: string;
}

export function DeadlineCountdown({ date, label = 'Expires' }: DeadlineCountdownProps) {
  const deadline = new Date(date);
  const today = new Date();
  const daysLeft = differenceInDays(deadline, today);
  const overdue = isPast(deadline);

  let bgColor = '#E8ECF4';
  let textColor = '#0F2044';
  let displayText = '';

  if (overdue) {
    bgColor = '#FEE2E2';
    textColor = '#DC2626';
    displayText = `${Math.abs(daysLeft)}d overdue`;
  } else if (daysLeft === 0) {
    bgColor = '#FEF3C7';
    textColor = '#D97706';
    displayText = 'Today';
  } else if (daysLeft <= 7) {
    bgColor = '#FEF3C7';
    textColor = '#D97706';
    displayText = `${daysLeft}d left`;
  } else if (daysLeft <= 30) {
    bgColor = '#E8ECF4';
    textColor = '#0F2044';
    displayText = `${daysLeft}d left`;
  } else {
    bgColor = '#F0FDF4';
    textColor = '#16A34A';
    const weeks = Math.floor(daysLeft / 7);
    displayText = `${weeks}w left`;
  }

  return (
    <View
      style={{ backgroundColor: bgColor }}
      className="flex-row items-center px-2 py-0.5 rounded-full"
    >
      <Text style={{ color: textColor }} className="text-xs font-semibold">
        {label}: {displayText}
      </Text>
    </View>
  );
}
