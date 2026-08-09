import { Directory, File, Paths } from 'expo-file-system';
import {
  Album,
  Asset,
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-media-library';
import { Alert, Linking } from 'react-native';

export type DownloadImagesResult = {
  saved: number;
  failed: number;
};

function extensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(jpe?g|png|webp|gif|heic)$/i);
    if (match) return match[0].toLowerCase();
  } catch {
    // ignore invalid URL parsing
  }
  return '.jpg';
}

async function ensureWritePermission(): Promise<boolean> {
  const current = await getPermissionsAsync(true);
  if (current.granted) return true;

  const requested = await requestPermissionsAsync(true);
  if (requested.granted) return true;

  Alert.alert(
    'Cần quyền thư viện ảnh',
    'Cho phép Hanoi Residences lưu ảnh căn hộ vào thiết bị để dùng tính năng Tải hình ảnh nhanh.',
    [
      { text: 'Đóng', style: 'cancel' },
      {
        text: 'Mở Cài đặt',
        onPress: () => {
          void Linking.openSettings();
        },
      },
    ],
  );
  return false;
}

/**
 * Native implementation — downloads apartment images to the device photo library.
 * Admin / CTV only — callers must gate with RBAC.
 */
export async function downloadApartmentImages(
  imageUrls: string[],
  options?: { albumName?: string; sourceCode?: string },
): Promise<DownloadImagesResult> {
  const urls = imageUrls.filter(Boolean);
  if (urls.length === 0) {
    return { saved: 0, failed: 0 };
  }

  const allowed = await ensureWritePermission();
  if (!allowed) {
    return { saved: 0, failed: urls.length };
  }

  const albumName = options?.albumName ?? 'Hanoi Residences';
  const cacheDir = new Directory(Paths.cache, 'apartment-downloads');
  if (!cacheDir.exists) {
    cacheDir.create();
  }

  let saved = 0;
  let failed = 0;
  const createdAssets: Asset[] = [];

  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    const ext = extensionFromUrl(url);
    const fileName = `${options?.sourceCode || 'apt'}-${i + 1}${ext}`;
    const destination = new File(cacheDir, fileName);

    try {
      if (destination.exists) {
        destination.delete();
      }

      const file = await File.downloadFileAsync(url, destination, {
        idempotent: true,
      });

      const asset = await Asset.create(file.uri);
      createdAssets.push(asset);
      saved += 1;
    } catch (error) {
      console.error('Download image failed:', url, error);
      failed += 1;
    }
  }

  if (createdAssets.length > 0) {
    try {
      const existing = await Album.get(albumName);
      if (existing) {
        await existing.add(createdAssets);
      } else {
        await Album.create(albumName, createdAssets, false);
      }
    } catch (error) {
      console.warn('Album grouping failed:', error);
    }
  }

  return { saved, failed };
}
