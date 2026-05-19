import React from 'react';
import { Stack } from 'expo-router';

export default function PermitDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="overview" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="checklist" />
      <Stack.Screen name="ai-chat" />
    </Stack>
  );
}
