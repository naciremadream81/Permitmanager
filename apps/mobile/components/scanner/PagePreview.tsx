import React from 'react';
import {
  ScrollView,
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

interface PagePreviewProps {
  pages: string[];
  selectedIndex: number;
  onSelectPage: (index: number) => void;
  onRemovePage: (index: number) => void;
}

export function PagePreview({
  pages,
  selectedIndex,
  onSelectPage,
  onRemovePage,
}: PagePreviewProps) {
  if (pages.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {pages.map((uri, index) => (
          <TouchableOpacity
            key={`${uri}-${index}`}
            onPress={() => onSelectPage(index)}
            style={[
              styles.thumb,
              selectedIndex === index && styles.thumbSelected,
            ]}
            activeOpacity={0.8}
          >
            <Image source={{ uri }} style={styles.image} resizeMode="cover" />
            <TouchableOpacity
              onPress={() => onRemovePage(index)}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.pageNumber}>
              <Text style={styles.pageNumberText}>{index + 1}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 64,
    height: 74,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbSelected: {
    borderColor: '#F59E0B',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  pageNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
