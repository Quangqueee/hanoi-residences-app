import { Alert, Platform } from 'react-native';

export type DownloadImagesResult = {
  saved: number;
  failed: number;
};

/**
 * Default / web-safe stub.
 * Native override: `download-images.native.ts`
 *
 * Do NOT import expo-file-system or expo-media-library here — they crash
 * Expo Router web SSR with "Class extends value undefined...".
 */
export async function downloadApartmentImages(
  imageUrls: string[],
  _options?: { albumName?: string; sourceCode?: string },
): Promise<DownloadImagesResult> {
  const failed = imageUrls.filter(Boolean).length;

  if (Platform.OS === 'web') {
    Alert.alert(
      'Không hỗ trợ trên Web',
      'Tải hình ảnh nhanh chỉ khả dụng trên iOS/Android.',
    );
  }

  return { saved: 0, failed };
}
