import React from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { Tabs, router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

function TabIcon({
  focused,
  icon,
  label,
}: {
  focused: boolean;
  icon: string;
  label: string;
}) {
  return (
    <View className="items-center pt-1">
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 10,
          color: focused ? '#0F2044' : '#9CA3AF',
          fontWeight: focused ? '700' : '400',
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function ScannerTabButton({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={{
        top: -20,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[
          animStyle,
          {
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#F59E0B',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
      >
        <Text style={{ fontSize: 26, color: '#FFFFFF' }}>📷</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          shadowColor: '#0F2044',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarActiveTintColor: '#0F2044',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🏠" label="Dashboard" />
          ),
        }}
      />
      <Tabs.Screen
        name="permits"
        options={{
          title: 'Permits',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📄" label="Permits" />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scan',
          tabBarButton: (props) => (
            <ScannerTabButton onPress={props.onPress ?? undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📅" label="Calendar" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="⚙️" label="Settings" />
          ),
        }}
      />
    </Tabs>
  );
}
