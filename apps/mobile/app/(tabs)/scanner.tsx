import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { DocumentScanner } from '../../components/scanner/DocumentScanner';
import { BottomSheetModal, type BottomSheetModalRef } from '../../components/ui/BottomSheetModal';
import { usePermitsStore } from '../../store/permitsStore';
import { fetchPermits } from '../../lib/api-client';
import type { PermitListItem } from '@permitpro/shared';

export default function ScannerScreen() {
  const [showScanner, setShowScanner] = useState(false);
  const [selectedPermitId, setSelectedPermitId] = useState<string | null>(null);
  const [permits, setPermits] = useState<PermitListItem[]>([]);
  const [isLoadingPermits, setIsLoadingPermits] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModalRef>(null);

  const loadPermits = useCallback(async () => {
    setIsLoadingPermits(true);
    try {
      const result = await fetchPermits({ pageSize: 50 });
      setPermits(result.data);
    } catch {
      Alert.alert('Error', 'Failed to load permits.');
    } finally {
      setIsLoadingPermits(false);
    }
  }, []);

  const handleStartScan = useCallback(async () => {
    // Load permits to show permit selector
    await loadPermits();
    bottomSheetRef.current?.open();
  }, [loadPermits]);

  const handleSelectPermit = useCallback((permitId: string | null) => {
    setSelectedPermitId(permitId);
    bottomSheetRef.current?.close();
    setShowScanner(true);
  }, []);

  const handleScanComplete = useCallback((uris: string[]) => {
    setShowScanner(false);
    setSelectedPermitId(null);
    if (uris.length > 0) {
      Alert.alert(
        'Scan Complete',
        `${uris.length} page(s) captured${selectedPermitId ? ' and uploaded' : ''}.`,
        [
          {
            text: selectedPermitId ? 'View Permit' : 'OK',
            onPress: selectedPermitId
              ? () => router.push(`/(tabs)/permits/${selectedPermitId}` as never)
              : undefined,
          },
        ],
      );
    }
  }, [selectedPermitId]);

  return (
    <SafeAreaView className="flex-1 bg-navy-500">
      {/* Scanner modal */}
      <Modal visible={showScanner} animationType="slide" statusBarTranslucent>
        <DocumentScanner
          permitId={selectedPermitId ?? undefined}
          onComplete={handleScanComplete}
          onCancel={() => {
            setShowScanner(false);
            setSelectedPermitId(null);
          }}
        />
      </Modal>

      {/* Permit selector bottom sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        title="Attach to Permit (Optional)"
        snapPoints={['60%', '90%']}
      >
        <View className="flex-1">
          {isLoadingPermits ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#0F2044" />
              <Text className="text-gray-500 text-sm mt-2">Loading permits...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => handleSelectPermit(null)}
                className="flex-row items-center p-4 border-b border-gray-100"
              >
                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                  <Text className="text-xl">📁</Text>
                </View>
                <View>
                  <Text className="font-semibold text-navy-500">No permit (standalone scan)</Text>
                  <Text className="text-xs text-gray-500">Save scan without attaching to a permit</Text>
                </View>
              </TouchableOpacity>

              {permits.map((permit) => (
                <TouchableOpacity
                  key={permit.id}
                  onPress={() => handleSelectPermit(permit.id)}
                  className="flex-row items-center p-4 border-b border-gray-100"
                >
                  <View className="w-10 h-10 rounded-full bg-navy-50 items-center justify-center mr-3">
                    <Text className="text-lg">📄</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-navy-500" numberOfLines={1}>
                      {permit.title}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {permit.type} • {permit.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </BottomSheetModal>

      {/* Main content */}
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-24 h-24 rounded-3xl bg-amber-500 items-center justify-center mb-6 shadow-lg"
          style={{
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 12,
          }}
        >
          <Text className="text-5xl">📷</Text>
        </View>

        <Text className="text-white text-3xl font-black mb-2 text-center">
          Document Scanner
        </Text>
        <Text className="text-white/60 text-base text-center mb-10">
          Scan and capture permit documents directly from your camera. Multi-page support with automatic enhancement.
        </Text>

        <TouchableOpacity
          onPress={handleStartScan}
          className="bg-amber-500 w-full py-4 rounded-2xl items-center mb-4"
          style={{
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text className="text-white text-lg font-black">Start Scanning</Text>
        </TouchableOpacity>

        <View className="flex-row gap-4 mt-4">
          {[
            { icon: '🔍', label: 'Edge Detection' },
            { icon: '📑', label: 'Multi-Page' },
            { icon: '✨', label: 'Auto-Enhance' },
          ].map((feat) => (
            <View key={feat.label} className="items-center flex-1">
              <Text className="text-2xl mb-1">{feat.icon}</Text>
              <Text className="text-white/60 text-xs text-center">{feat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
