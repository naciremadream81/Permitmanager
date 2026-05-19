import React, { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

export interface BottomSheetModalRef {
  open: () => void;
  close: () => void;
}

interface BottomSheetModalProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  title?: string;
}

export const BottomSheetModal = forwardRef<
  BottomSheetModalRef,
  BottomSheetModalProps
>(({ children, snapPoints = ['50%', '90%'], title }, ref) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  useImperativeHandle(ref, () => ({
    open: () => bottomSheetRef.current?.expand(),
    close: () => bottomSheetRef.current?.close(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.indicator}
      backgroundStyle={styles.background}
    >
      <BottomSheetView style={styles.content}>
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
        ) : null}
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
});

BottomSheetModal.displayName = 'BottomSheetModal';

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: '#CBD5E1',
    width: 40,
  },
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F2044',
  },
});
