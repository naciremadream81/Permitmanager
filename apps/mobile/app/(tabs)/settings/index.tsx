import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../../store/authStore';
import Constants from 'expo-constants';

const BIOMETRIC_PREF_KEY = 'permitpro_biometric_enabled';
const NOTIF_PREF_KEY = 'permitpro_notification_prefs';

interface NotifPrefs {
  deadlines: boolean;
  documents: boolean;
  statusChanges: boolean;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider px-5 pt-5 pb-2">
      {title}
    </Text>
  );
}

function SettingsRow({
  label,
  sublabel,
  right,
  onPress,
  destructive,
}: {
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={onPress ? 0.6 : 1}
      className="bg-white flex-row items-center px-5 py-4 border-b border-gray-100"
    >
      <View className="flex-1">
        <Text
          className={`text-sm font-semibold ${
            destructive ? 'text-red-500' : 'text-navy-500'
          }`}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text className="text-xs text-gray-400 mt-0.5">{sublabel}</Text>
        ) : null}
      </View>
      {right ? right : onPress ? (
        <Text className="text-gray-300 text-base ml-2">›</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, org, role, logout } = useAuthStore();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    deadlines: true,
    documents: true,
    statusChanges: true,
  });
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Load preferences on mount
  React.useEffect(() => {
    const loadPrefs = async () => {
      // Check biometric availability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && enrolled);

      // Load saved biometric pref
      const bioPref = await SecureStore.getItemAsync(BIOMETRIC_PREF_KEY);
      setBiometricEnabled(bioPref === 'true');

      // Load notification prefs
      const notifPrefStr = await SecureStore.getItemAsync(NOTIF_PREF_KEY);
      if (notifPrefStr) {
        try {
          const parsed = JSON.parse(notifPrefStr) as NotifPrefs;
          setNotifPrefs(parsed);
        } catch {
          // ignore
        }
      }
    };
    loadPrefs().catch(() => undefined);
  }, []);

  const handleBiometricToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        // Verify biometric before enabling
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enable biometric authentication',
          fallbackLabel: 'Use Passcode',
        });
        if (!result.success) return;
      }
      setBiometricEnabled(value);
      await SecureStore.setItemAsync(BIOMETRIC_PREF_KEY, value ? 'true' : 'false');
    },
    [],
  );

  const handleNotifToggle = useCallback(
    async (key: keyof NotifPrefs, value: boolean) => {
      const updated = { ...notifPrefs, [key]: value };
      setNotifPrefs(updated);
      await SecureStore.setItemAsync(NOTIF_PREF_KEY, JSON.stringify(updated));
    },
    [notifPrefs],
  );

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of PermitPro?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await logout();
              router.replace('/(auth)/login' as never);
            } catch {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ],
    );
  }, [logout]);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'U';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-navy-500 px-5 pt-4 pb-8">
          <Text className="text-white text-2xl font-black">Settings</Text>
        </View>

        {/* Profile card */}
        <View className="mx-4 -mt-5 bg-white rounded-2xl p-5 shadow-sm mb-2 flex-row items-center">
          <View className="w-14 h-14 rounded-full bg-navy-500 items-center justify-center mr-4">
            <Text className="text-white text-xl font-bold">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-navy-500 text-base font-bold" numberOfLines={1}>
              {user?.name ?? 'User'}
            </Text>
            <Text className="text-gray-500 text-sm" numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className="bg-amber-100 rounded-full px-2 py-0.5">
                <Text className="text-amber-700 text-xs font-semibold">
                  {role ?? 'Member'}
                </Text>
              </View>
              {org ? (
                <Text className="text-gray-400 text-xs ml-2" numberOfLines={1}>
                  {org.name}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Security */}
        <SectionHeader title="Security" />
        <View className="rounded-xl overflow-hidden mx-4">
          {biometricAvailable ? (
            <SettingsRow
              label="Biometric Authentication"
              sublabel="Use Face ID or fingerprint to unlock"
              right={
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: '#E5E7EB', true: '#0F2044' }}
                  thumbColor={biometricEnabled ? '#F59E0B' : '#FFFFFF'}
                />
              }
            />
          ) : (
            <SettingsRow
              label="Biometric Authentication"
              sublabel="Not available on this device"
              right={
                <Switch
                  value={false}
                  disabled
                  trackColor={{ false: '#E5E7EB', true: '#0F2044' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          )}
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View className="rounded-xl overflow-hidden mx-4">
          <SettingsRow
            label="Deadline Reminders"
            sublabel="Remind me before permit deadlines"
            right={
              <Switch
                value={notifPrefs.deadlines}
                onValueChange={(v) => handleNotifToggle('deadlines', v)}
                trackColor={{ false: '#E5E7EB', true: '#0F2044' }}
                thumbColor={notifPrefs.deadlines ? '#F59E0B' : '#FFFFFF'}
              />
            }
          />
          <SettingsRow
            label="Document Expiry"
            sublabel="Alert when documents are expiring"
            right={
              <Switch
                value={notifPrefs.documents}
                onValueChange={(v) => handleNotifToggle('documents', v)}
                trackColor={{ false: '#E5E7EB', true: '#0F2044' }}
                thumbColor={notifPrefs.documents ? '#F59E0B' : '#FFFFFF'}
              />
            }
          />
          <SettingsRow
            label="Status Changes"
            sublabel="Notify on permit status updates"
            right={
              <Switch
                value={notifPrefs.statusChanges}
                onValueChange={(v) => handleNotifToggle('statusChanges', v)}
                trackColor={{ false: '#E5E7EB', true: '#0F2044' }}
                thumbColor={notifPrefs.statusChanges ? '#F59E0B' : '#FFFFFF'}
              />
            }
          />
        </View>

        {/* Organization */}
        {org ? (
          <>
            <SectionHeader title="Organization" />
            <View className="rounded-xl overflow-hidden mx-4">
              <SettingsRow
                label="Organization"
                sublabel={org.name}
              />
              <SettingsRow
                label="Subscription"
                sublabel={
                  org.subscriptionTier.charAt(0).toUpperCase() +
                  org.subscriptionTier.slice(1) + ' Plan'
                }
              />
            </View>
          </>
        ) : null}

        {/* App */}
        <SectionHeader title="App" />
        <View className="rounded-xl overflow-hidden mx-4">
          <SettingsRow
            label="Version"
            right={
              <Text className="text-gray-400 text-sm">{appVersion}</Text>
            }
          />
          <SettingsRow
            label="Privacy Policy"
            onPress={() => {
              Alert.alert('Privacy Policy', 'Opens in browser.');
            }}
          />
          <SettingsRow
            label="Terms of Service"
            onPress={() => {
              Alert.alert('Terms of Service', 'Opens in browser.');
            }}
          />
        </View>

        {/* Sign out */}
        <View className="mx-4 mt-6 mb-10">
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={isSigningOut}
            className="bg-red-50 border border-red-200 rounded-xl py-4 items-center"
            style={{ opacity: isSigningOut ? 0.7 : 1 }}
          >
            {isSigningOut ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text className="text-red-500 font-bold text-base">Sign Out</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
