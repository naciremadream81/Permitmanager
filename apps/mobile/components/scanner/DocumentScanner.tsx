import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { ScannerControls } from './ScannerControls';
import { PagePreview } from './PagePreview';
import { uploadDocument } from '../../lib/api-client';

interface DocumentScannerProps {
  permitId?: string;
  onComplete: (uris: string[]) => void;
  onCancel: () => void;
}

export function DocumentScanner({
  permitId,
  onComplete,
  onCancel,
}: DocumentScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Corner marker animation
  const cornerOpacity = useSharedValue(1);
  React.useEffect(() => {
    cornerOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, [cornerOpacity]);

  const cornerStyle = useAnimatedStyle(() => ({
    opacity: cornerOpacity.value,
  }));

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        skipProcessing: false,
      });
      if (!photo) return;

      // Process with ImageManipulator: crop to portrait, enhance contrast
      const processed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          { resize: { width: 1200 } },
        ],
        {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      setPages((prev) => [...prev, processed.uri]);
      setSelectedPage((prev) => prev + 1);
    } catch (e) {
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const handleRetake = useCallback(() => {
    setPages((prev) => {
      const updated = [...prev];
      updated.pop();
      return updated;
    });
    setSelectedPage((prev) => Math.max(0, prev - 1));
  }, []);

  const handleRemovePage = useCallback((index: number) => {
    setPages((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    setSelectedPage((prev) => Math.max(0, Math.min(prev, pages.length - 2)));
  }, [pages.length]);

  const handleDone = useCallback(async () => {
    if (pages.length === 0) return;

    if (permitId) {
      setIsUploading(true);
      try {
        for (const uri of pages) {
          const formData = new FormData();
          formData.append('file', {
            uri,
            type: 'image/jpeg',
            name: `scan_${Date.now()}.jpg`,
          } as unknown as Blob);
          formData.append('category', 'PHOTO');
          formData.append('name', `Scanned Document ${new Date().toLocaleDateString()}`);
          await uploadDocument(permitId, formData);
        }
        Alert.alert('Success', `${pages.length} page(s) uploaded successfully.`);
        onComplete(pages);
      } catch {
        Alert.alert('Upload Error', 'Failed to upload documents. They have been saved locally.');
        onComplete(pages);
      } finally {
        setIsUploading(false);
      }
    } else {
      onComplete(pages);
    }
  }, [pages, permitId, onComplete]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required to scan documents.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={'back' as CameraType}
        flash={flashOn ? 'on' : 'off'}
      />

      {/* Edge detection overlay */}
      <View style={styles.overlay} pointerEvents="none">
        <Animated.View style={[styles.corners, cornerStyle]}>
          {/* Top-left */}
          <View style={[styles.corner, styles.cornerTL]} />
          {/* Top-right */}
          <View style={[styles.corner, styles.cornerTR]} />
          {/* Bottom-left */}
          <View style={[styles.corner, styles.cornerBL]} />
          {/* Bottom-right */}
          <View style={[styles.corner, styles.cornerBR]} />
        </Animated.View>
      </View>

      {/* Guide text */}
      <View style={styles.guideContainer} pointerEvents="none">
        <Text style={styles.guideText}>
          {isProcessing ? 'Processing...' : isUploading ? 'Uploading...' : 'Align document within frame'}
        </Text>
      </View>

      {/* Cancel button */}
      <TouchableOpacity onPress={onCancel} style={styles.cancelOverlay}>
        <Text style={styles.cancelOverlayText}>✕</Text>
      </TouchableOpacity>

      {/* Page thumbnails */}
      <PagePreview
        pages={pages}
        selectedIndex={selectedPage}
        onSelectPage={setSelectedPage}
        onRemovePage={handleRemovePage}
      />

      {/* Controls */}
      <ScannerControls
        onCapture={handleCapture}
        onFlashToggle={() => setFlashOn((v) => !v)}
        flashOn={flashOn}
        pageCount={pages.length}
        onDone={handleDone}
        onRetake={handleRetake}
      />
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corners: {
    width: '75%',
    height: '55%',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#F59E0B',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 3,
  },
  guideContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  guideText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cancelOverlay: {
    position: 'absolute',
    top: 52,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOverlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F2044',
    padding: 32,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
});
