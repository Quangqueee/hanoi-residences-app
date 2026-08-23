import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Linking } from 'react-native';

export type DownloadImagesResult = {
  saved: number;
  failed: number;
};

export type DownloadProgress = {
  completed: number;
  total: number;
  percent: number;
};

export type DownloadImagesOptions = {
  albumName?: string;
  sourceCode?: string;
  onProgress?: (progress: DownloadProgress) => void;
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

function reportProgress(
  onProgress: DownloadImagesOptions['onProgress'],
  completed: number,
  total: number,
) {
  if (!onProgress || total <= 0) return;
  onProgress({
    completed,
    total,
    percent: Math.min(100, Math.round((completed / total) * 100)),
  });
}

async function ensureWritePermission(): Promise<boolean> {
  const current = await MediaLibrary.getPermissionsAsync(true);
  if (current.granted) return true;

  const requested = await MediaLibrary.requestPermissionsAsync(true);
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
  options?: DownloadImagesOptions,
): Promise<DownloadImagesResult> {
  const urls = imageUrls.filter(Boolean);
  if (urls.length === 0) {
    return { saved: 0, failed: 0 };
  }

  const allowed = await ensureWritePermission();
  if (!allowed) {
    return { saved: 0, failed: urls.length };
  }

  reportProgress(options?.onProgress, 0, urls.length);

  const albumName = options?.albumName ?? 'Hanoi Residences';
  const cacheDir = new Directory(Paths.cache, 'apartment-downloads');
  if (!cacheDir.exists) {
    cacheDir.create();
  }

  let saved = 0;
  let failed = 0;
  let album: MediaLibrary.Album | null = null;

  try {
    album = await MediaLibrary.getAlbumAsync(albumName);
  } catch (error) {
    console.warn('Album lookup failed:', error);
  }

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

      if (album) {
        await MediaLibrary.createAssetAsync(file.uri, album);
      } else {
        const asset = await MediaLibrary.createAssetAsync(file.uri);
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
      }
      saved += 1;
    } catch (error) {
      console.error('Download image failed:', url, error);
      failed += 1;
    }

    reportProgress(options?.onProgress, i + 1, urls.length);
  }

  return { saved, failed };
}
