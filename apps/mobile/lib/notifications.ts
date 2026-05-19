import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import type { Permit } from '@permitpro/shared';
import { registerPushToken } from './api-client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
    });
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    })
  ).data;

  try {
    await registerPushToken(token, Platform.OS);
  } catch {
    // Non-fatal: token saved locally, backend registration failed
  }

  return token;
}

export async function scheduleLocalDeadlineReminder(
  permit: Permit,
  daysBeforeDeadline: number,
): Promise<void> {
  if (!permit.expirationDate) return;

  const deadline = new Date(permit.expirationDate);
  const triggerDate = new Date(deadline);
  triggerDate.setDate(triggerDate.getDate() - daysBeforeDeadline);

  if (triggerDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Permit Deadline Approaching',
      body: `${permit.title} expires in ${daysBeforeDeadline} day${daysBeforeDeadline !== 1 ? 's' : ''}`,
      data: { permitId: permit.id, screen: 'permit-detail' },
      sound: true,
    },
    trigger: {
      date: triggerDate,
    },
  });
}

export function setupNotificationHandlers(): () => void {
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        permitId?: string;
        screen?: string;
      };

      if (data.permitId) {
        router.push(`/(tabs)/permits/${data.permitId}` as never);
      }
    });

  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      // Notification received while app is foregrounded
      const title = notification.request.content.title ?? 'PermitPro';
      const body = notification.request.content.body ?? '';
      if (body) {
        Alert.alert(title, body);
      }
    },
  );

  return () => {
    responseSubscription.remove();
    receivedSubscription.remove();
  };
}
