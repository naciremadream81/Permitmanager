import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../../store/authStore';
import { saveAuthTokens } from '../../lib/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const params = useLocalSearchParams<{ token?: string }>();
  const { login } = useAuthStore();

  // Handle magic link deep link callback
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      try {
        const parsed = Linking.parse(url);
        const token =
          parsed.queryParams?.token as string | undefined ??
          parsed.queryParams?.access_token as string | undefined;
        const refreshToken =
          parsed.queryParams?.refresh_token as string | undefined;

        if (token) {
          await exchangeToken(token, refreshToken ?? '');
        }
      } catch {
        Alert.alert('Login Error', 'Invalid magic link. Please request a new one.');
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  const exchangeToken = async (token: string, refreshToken: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) throw new Error('Token exchange failed');

      const data = await res.json() as {
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; name: string; avatar: string | null; phone: string | null; createdAt: string; updatedAt: string };
        org: { id: string; name: string; slug: string; logo: string | null; subscriptionTier: string; stripeCustomerId: string | null; settings: Record<string, unknown>; createdAt: string; updatedAt: string };
        role: 'OWNER' | 'ADMIN' | 'COORDINATOR' | 'VIEWER';
      };

      await login(
        data.accessToken,
        data.refreshToken ?? refreshToken,
        data.user,
        data.org,
        data.role,
      );

      router.replace('/(tabs)');
    } catch {
      Alert.alert(
        'Authentication Failed',
        'Could not complete sign-in. Please try again.',
      );
    }
  };

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          redirectTo: 'permitpro://auth/callback',
        }),
      });

      if (!res.ok) {
        const error = await res.json() as { message?: string };
        throw new Error(error.message ?? 'Failed to send magic link');
      }

      setLinkSent(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to send link';
      Alert.alert('Error', message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-navy-500"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-8 pt-20 pb-12 justify-center">
          {/* Logo area */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 rounded-2xl bg-amber-500 items-center justify-center mb-4 shadow-lg">
              <Text className="text-white text-3xl font-black">P</Text>
            </View>
            <Text className="text-white text-3xl font-black tracking-tight">
              PermitPro
            </Text>
            <Text className="text-white/60 text-base mt-1">
              Permit lifecycle management
            </Text>
          </View>

          {linkSent ? (
            /* Link sent state */
            <View className="bg-white/10 rounded-2xl p-6 items-center">
              <Text className="text-4xl mb-4">📨</Text>
              <Text className="text-white text-xl font-bold text-center mb-2">
                Check your email!
              </Text>
              <Text className="text-white/70 text-base text-center mb-6">
                We sent a magic link to{'\n'}
                <Text className="text-amber-400 font-semibold">{email}</Text>
              </Text>
              <Text className="text-white/50 text-sm text-center mb-6">
                Tap the link in the email to sign in. If you don't see it, check your spam folder.
              </Text>
              <TouchableOpacity
                onPress={() => setLinkSent(false)}
                className="py-2 px-4"
              >
                <Text className="text-amber-400 text-sm font-medium">
                  Use a different email
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Login form */
            <View className="bg-white/10 rounded-2xl p-6">
              <Text className="text-white text-xl font-bold mb-2">
                Sign In
              </Text>
              <Text className="text-white/60 text-sm mb-6">
                Enter your email to receive a magic sign-in link.
              </Text>

              <View className="mb-4">
                <Text className="text-white/80 text-sm font-medium mb-2">
                  Email Address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@company.com"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="send"
                  onSubmitEditing={handleSendMagicLink}
                  className="bg-white/15 text-white px-4 py-3.5 rounded-xl text-base border border-white/20"
                />
              </View>

              <TouchableOpacity
                onPress={handleSendMagicLink}
                disabled={isSending}
                className={`py-4 rounded-xl items-center ${
                  isSending ? 'bg-amber-400/50' : 'bg-amber-500'
                }`}
              >
                {isSending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base font-bold">
                    Send Magic Link
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Text className="text-white/30 text-xs text-center mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
