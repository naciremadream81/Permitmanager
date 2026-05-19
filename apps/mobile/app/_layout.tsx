import '../global.css';
import React, { useEffect, useCallback } from 'react';
import { View, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';
import { getAuthTokens } from '../lib/auth';
import { registerForPushNotifications, setupNotificationHandlers } from '../lib/notifications';
import { startNetworkListener } from '../lib/offline-queue';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();

  const initializeApp = useCallback(async () => {
    try {
      // Check if tokens exist
      const tokens = await getAuthTokens();

      if (!tokens) {
        setLoading(false);
        return;
      }

      // Biometric check
      const biometricAvailable = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (biometricAvailable && enrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to access PermitPro',
          fallbackLabel: 'Use Passcode',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (!result.success) {
          Alert.alert(
            'Authentication Required',
            'Please authenticate to access PermitPro.',
          );
          setLoading(false);
          return;
        }
      }

      // If tokens exist, mark as authenticated (full profile fetch happens in tabs)
      useAuthStore.getState().setUser(
        { id: '', email: '', name: '', avatar: null, phone: null, createdAt: '', updatedAt: '' },
        { id: '', name: '', slug: '', logo: null, subscriptionTier: 'free', stripeCustomerId: null, settings: {}, createdAt: '', updatedAt: '' },
        'COORDINATOR' as never,
      );

    } catch (e) {
      setLoading(false);
    } finally {
      await SplashScreen.hideAsync();
    }
  }, [setLoading]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      registerForPushNotifications().catch(() => undefined);
      const cleanup = setupNotificationHandlers();
      const stopNetworkListener = startNetworkListener();
      return () => {
        cleanup();
        stopNetworkListener();
      };
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
