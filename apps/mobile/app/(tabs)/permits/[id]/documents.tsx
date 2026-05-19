import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import type { Document as PermitDocument } from '@permitpro/shared';
import { DOCUMENT_CATEGORY_CONFIG, DOCUMENT_STATUS_CONFIG } from '@permitpro/shared';
import { fetchDocuments, uploadDocument } from '../../../../lib/api-client';
import { DocumentScanner } from '../../../../components/scanner/DocumentScanner';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { InlineError } from '../../../../components/ui/ErrorBoundary';

function DocumentRow({ doc }: { doc: PermitDocument }) {
  const catConfig = DOCUMENT_CATEGORY_CONFIG[doc.category];
  const statusConfig = DOCUMENT_STATUS_CONFIG[doc.status];
  const sizeKb = Math.round(doc.fileSize / 1024);

  return (
    <View className="bg-white rounded-xl mx-4 mb-3 p-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="font-semibold text-navy-500 mb-0.5" numberOfLines={1}>
            {doc.name}
          </Text>
          <Text className="text-xs text-gray-400 mb-2">{doc.fileName}</Text>
          <View className="flex-row items-center gap-2">
            <View className="bg-gray-100 rounded-full px-2 py-0.5">
              <Text className="text-xs text-gray-600">{catConfig.label}</Text>
            </View>
            <Text className="text-xs text-gray-400">
              {sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`}
            </Text>
            {doc.version > 1 ? (
              <Text className="text-xs text-gray-400">v{doc.version}</Text>
            ) : null}
          </View>
        </View>
        <View
          style={{ backgroundColor: statusConfig.color + '20' }}
          className="rounded-full px-2.5 py-1"
        >
          <Text style={{ color: statusConfig.color }} className="text-xs font-semibold">
            {statusConfig.label}
          </Text>
        </View>
      </View>
      {doc.expirationDate ? (
        <Text className="text-xs text-amber-600 mt-2">
          Expires: {new Date(doc.expirationDate).toLocaleDateString()}
        </Text>
      ) : null}
    </View>
  );
}

export default function DocumentsTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [documents, setDocuments] = useState<PermitDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const docs = await fetchDocuments(id);
      setDocuments(docs);
      setError(null);
    } catch {
      setError('Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handlePickDocument = useCallback(async () => {
    if (!id) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: asset.mimeType ?? 'application/octet-stream',
        name: asset.name,
      } as unknown as Blob);
      formData.append('name', asset.name);
      formData.append('category', 'OTHER');

      await uploadDocument(id, formData);
      Alert.alert('Success', 'Document uploaded successfully.');
      await loadDocuments();
    } catch {
      Alert.alert('Upload Error', 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [id, loadDocuments]);

  const handleScanComplete = useCallback(async () => {
    setShowScanner(false);
    await loadDocuments();
  }, [loadDocuments]);

  if (isLoading) return <LoadingScreen message="Loading documents..." />;
  if (error) return <InlineError message={error} onRetry={loadDocuments} />;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Scanner modal */}
      <Modal visible={showScanner} animationType="slide" statusBarTranslucent>
        <DocumentScanner
          permitId={id}
          onComplete={handleScanComplete}
          onCancel={() => setShowScanner(false)}
        />
      </Modal>

      {documents.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Upload or scan a document to get started."
        />
      ) : (
        <FlashList
          data={documents}
          renderItem={({ item }) => <DocumentRow doc={item} />}
          estimatedItemSize={110}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        />
      )}

      {/* Upload FAB with options */}
      {isUploading ? (
        <View className="absolute bottom-6 right-5 bg-amber-500 w-14 h-14 rounded-full items-center justify-center shadow-lg">
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Add Document',
              'Choose a method:',
              [
                { text: 'Scan with Camera', onPress: () => setShowScanner(true) },
                { text: 'Pick from Files', onPress: handlePickDocument },
                { text: 'Cancel', style: 'cancel' },
              ],
            );
          }}
          className="absolute bottom-6 right-5 bg-amber-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text className="text-white text-3xl font-light">+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
