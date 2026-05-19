import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

interface ScannerControlsProps {
  onCapture: () => void;
  onFlashToggle: () => void;
  flashOn: boolean;
  pageCount: number;
  onDone: () => void;
  onRetake: () => void;
}

export function ScannerControls({
  onCapture,
  onFlashToggle,
  flashOn,
  pageCount,
  onDone,
  onRetake,
}: ScannerControlsProps) {
  const scale = useSharedValue(1);

  const captureGesture = Gesture.Tap()
    .onBegin(() => {
      'worklet';
      scale.value = withSpring(0.9, { stiffness: 400 });
    })
    .onFinalize(() => {
      'worklet';
      scale.value = withSpring(1, { stiffness: 400 });
    });

  const captureButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Flash toggle */}
      <TouchableOpacity
        onPress={onFlashToggle}
        style={[styles.sideButton, flashOn && styles.sideButtonActive]}
      >
        <Text style={styles.sideButtonText}>{flashOn ? '⚡' : '🔦'}</Text>
      </TouchableOpacity>

      {/* Capture button */}
      <GestureDetector gesture={captureGesture}>
        <Animated.View style={[styles.captureOuter, captureButtonStyle]}>
          <TouchableOpacity
            onPress={onCapture}
            style={styles.captureInner}
            activeOpacity={0.9}
          />
        </Animated.View>
      </GestureDetector>

      {/* Page count / Done / Retake */}
      <View style={styles.rightControls}>
        {pageCount > 0 ? (
          <>
            <TouchableOpacity onPress={onDone} style={styles.doneButton}>
              <Text style={styles.doneText}>Done ({pageCount})</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onRetake} style={styles.retakeButton}>
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.pageBadge}>
            <Text style={styles.pageBadgeText}>0 pages</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonActive: {
    backgroundColor: '#F59E0B',
  },
  sideButtonText: {
    fontSize: 20,
  },
  captureOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  rightControls: {
    width: 80,
    alignItems: 'center',
    gap: 6,
  },
  doneButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  retakeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retakeText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  pageBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pageBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});
