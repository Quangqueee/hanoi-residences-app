import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';

import { MAX_APARTMENT_IMAGES } from '@/lib/constants';
import type { UploadedImage } from '@/lib/types';

export type FormImageItem = UploadedImage & { key: string };

type Props = {
  images: FormImageItem[];
  onChange: (next: FormImageItem[]) => void;
  disabled?: boolean;
  uploading?: boolean;
  label?: string;
};

function assetsToItems(
  assets: ImagePicker.ImagePickerAsset[],
): FormImageItem[] {
  const stamp = Date.now();
  return assets.map((asset, i) => ({
    key: `local-${stamp}-${i}`,
    uri: asset.uri,
    preview: asset.uri,
    mimeType: asset.mimeType || 'image/jpeg',
    fileName: asset.fileName || undefined,
  }));
}

export function FormImagePicker({
  images,
  onChange,
  disabled = false,
  uploading = false,
  label = 'Hình ảnh *',
}: Props) {
  const remaining = MAX_APARTMENT_IMAGES - images.length;
  const canAdd = remaining > 0 && !disabled;

  const appendAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    if (!assets.length) return;
    onChange(
      [...images, ...assetsToItems(assets)].slice(0, MAX_APARTMENT_IMAGES),
    );
  };

  const pickFromLibrary = async () => {
    if (!canAdd) {
      if (remaining <= 0) {
        Alert.alert('Đủ ảnh', `Tối đa ${MAX_APARTMENT_IMAGES} ảnh.`);
      }
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Cần quyền',
          'Cho phép truy cập thư viện ảnh để tải lên.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;
      appendAssets(result.assets);
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không mở được thư viện ảnh. Vui lòng thử lại.');
    }
  };

  const takePhoto = async () => {
    if (!canAdd) {
      if (remaining <= 0) {
        Alert.alert('Đủ ảnh', `Tối đa ${MAX_APARTMENT_IMAGES} ảnh.`);
      }
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Cần quyền camera',
          'Cho phép Hanoi Residences dùng camera để chụp ảnh căn hộ.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.length) return;
      appendAssets(result.assets);
    } catch (err) {
      console.error(err);
      Alert.alert(
        'Không mở được camera',
        'Hãy dùng thiết bị thật hoặc chọn ảnh từ thư viện.',
      );
    }
  };

  const removeImage = (key: string) => {
    if (disabled) return;
    onChange(images.filter((img) => img.key !== key));
  };

  return (
    <View className="gap-2">
      <Text className="text-[12px] font-semibold text-hoteliq-gray">
        {label} ({images.length}/{MAX_APARTMENT_IMAGES})
      </Text>
      {uploading ? (
        <Text className="text-[12px] text-hoteliq-gray">
          Đang tải ảnh lên máy chủ…
        </Text>
      ) : null}

      {images.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {images.map((img) => (
            <View key={img.key} className="relative">
              <Image
                source={{ uri: img.preview || img.uri }}
                className="h-20 w-20 rounded-[10px] bg-hoteliq-chip"
              />
              <Pressable
                onPress={() => removeImage(img.key)}
                disabled={disabled}
                hitSlop={6}
                className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-hoteliq-ink"
                style={{ opacity: disabled ? 0.5 : 1 }}>
                <Text className="text-[12px] font-bold text-white">×</Text>
              </Pressable>
            </View>
          ))}
          {canAdd ? (
            <Pressable
              onPress={() => void pickFromLibrary()}
              className="h-20 w-20 items-center justify-center rounded-[10px] border border-dashed border-hoteliq-line bg-hoteliq-chip">
              <Text className="text-[22px] text-hoteliq-gray">+</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {remaining > 0 ? (
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => void pickFromLibrary()}
            disabled={!canAdd}
            className="min-h-11 flex-1 items-center justify-center rounded-full border border-hoteliq-line bg-white px-3"
            style={{ opacity: canAdd ? 1 : 0.5 }}>
            <Text className="text-center text-[13px] font-semibold text-hoteliq-ink">
              Chọn từ thư viện
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void takePhoto()}
            disabled={!canAdd}
            className="min-h-11 flex-1 items-center justify-center rounded-full border border-hoteliq-ink bg-hoteliq-ink px-3"
            style={{ opacity: canAdd ? 1 : 0.5 }}>
            <Text className="text-center text-[13px] font-semibold text-white">
              Chụp ảnh
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
