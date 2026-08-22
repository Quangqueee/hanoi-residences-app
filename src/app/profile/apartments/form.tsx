import * as ImagePicker from 'expo-image-picker';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { HANOI_DISTRICTS, MAX_APARTMENT_IMAGES, ROOM_TYPES } from '@/lib/constants';
import {
  createLandlordApartment,
  getLandlordApartmentById,
  updateLandlordApartment,
  uploadApartmentImages,
} from '@/lib/landlord-apartments-service';
import { checkPhoneNumber } from '@/lib/password-utils';
import type {
  ApartmentStatus,
  RoomType,
  UploadedImage,
} from '@/lib/types';

type ImageItem = UploadedImage & { key: string };

export default function LandlordApartmentFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const apartmentId = typeof id === 'string' ? id : undefined;
  const isEdit = Boolean(apartmentId);

  const { user, userData, isLandlord, loading: authLoading } =
    useAuth();

  const [loadingApt, setLoadingApt] = useState(isEdit);
  const [title, setTitle] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('studio');
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');
  const [commission, setCommission] = useState('');
  const [contactPhone, setContactPhone] = useState(
    () => userData?.phoneNumber?.trim() || '',
  );
  const [status, setStatus] = useState<ApartmentStatus>('available');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [showAllDistricts, setShowAllDistricts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleDistricts = useMemo(
    () => (showAllDistricts ? [...HANOI_DISTRICTS] : HANOI_DISTRICTS.slice(0, 6)),
    [showAllDistricts],
  );

  useEffect(() => {
    if (!apartmentId || !user) {
      setLoadingApt(false);
      return;
    }
    let active = true;
    const load = async () => {
      setLoadingApt(true);
      try {
        const apt = await getLandlordApartmentById(apartmentId, user.uid);
        if (!active) return;
        if (!apt) {
          Alert.alert('Không tìm thấy', 'Tin không tồn tại hoặc không thuộc bạn.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }
        setTitle(apt.title || '');
        setRoomType(apt.roomType || 'studio');
        setDistrict(apt.district || '');
        setArea(String(apt.area ?? ''));
        setPrice(String(apt.price ?? ''));
        setDetails(apt.details || '');
        setCommission(
          apt.commission != null && apt.commission !== ''
            ? String(apt.commission)
            : '',
        );
        setContactPhone(apt.contactPhone || apt.landlordPhoneNumber || '');
        setStatus(apt.status === 'rented' ? 'rented' : 'available');
        setImages(
          (apt.imageUrls || []).map((uri, i) => ({
            key: `existing-${i}-${uri.slice(-12)}`,
            uri,
            preview: uri,
          })),
        );
      } catch (err) {
        console.error(err);
        if (active) {
          Alert.alert('Lỗi', 'Không tải được tin đăng.');
        }
      } finally {
        if (active) setLoadingApt(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [apartmentId, user, router]);

  if (!authLoading && !user) {
    return <Redirect href="/(auth)/login" />;
  }
  if (!authLoading && !isLandlord) {
    return <Redirect href="/partner-register" />;
  }

  const pickImages = async () => {
    const remaining = MAX_APARTMENT_IMAGES - images.length;
    if (remaining <= 0) {
      Alert.alert('Đủ ảnh', `Tối đa ${MAX_APARTMENT_IMAGES} ảnh.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền', 'Cho phép truy cập thư viện ảnh để tải lên.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const next: ImageItem[] = result.assets.map((asset, i) => ({
      key: `local-${Date.now()}-${i}`,
      uri: asset.uri,
      preview: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || undefined,
    }));

    setImages((prev) => [...prev, ...next].slice(0, MAX_APARTMENT_IMAGES));
  };

  const removeImage = (key: string) => {
    setImages((prev) => prev.filter((img) => img.key !== key));
  };

  const onSubmit = async () => {
    setError(null);
    if (!user || submitting) return;

    if (!title.trim() || title.trim().length < 5) {
      setError('Tiêu đề cần ít nhất 5 ký tự.');
      return;
    }
    if (!district) {
      setError('Vui lòng chọn quận.');
      return;
    }
    const areaNum = Number(area);
    const priceNum = Number(price);
    if (!area || Number.isNaN(areaNum) || areaNum < 1) {
      setError('Diện tích phải lớn hơn 0.');
      return;
    }
    if (price === '' || Number.isNaN(priceNum) || priceNum < 0) {
      setError('Giá không hợp lệ (đơn vị: triệu VND).');
      return;
    }
    if (!details.trim() || details.trim().length < 20) {
      setError('Mô tả cần ít nhất 20 ký tự.');
      return;
    }
    const phoneCheck = checkPhoneNumber(contactPhone);
    if (!phoneCheck.isValid) {
      setError(phoneCheck.errorMessage || 'Số điện thoại không hợp lệ.');
      return;
    }
    if (images.length === 0) {
      setError('Cần ít nhất 1 hình ảnh.');
      return;
    }

    setSubmitting(true);
    try {
      const imageUrls = await uploadApartmentImages(images);
      const payload = {
        title: title.trim(),
        roomType,
        district,
        area: areaNum,
        price: priceNum,
        details: details.trim(),
        commission: commission.trim() || undefined,
        contactPhone: contactPhone.trim(),
        status,
        imageUrls,
        aiContent: null,
      };

      if (isEdit && apartmentId) {
        await updateLandlordApartment(user.uid, apartmentId, payload);
        Alert.alert('Thành công', 'Đã cập nhật tin đăng.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await createLandlordApartment(user.uid, payload);
        Alert.alert(
          'Đã gửi tin',
          'Tin đăng đang chờ admin duyệt (pending).',
          [{ text: 'OK', onPress: () => router.replace('/profile/apartments') }],
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể lưu tin đăng. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingApt) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={Hoteliq.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center justify-between border-b border-hoteliq-line px-6 py-3">
          <Text className="text-[20px] font-semibold text-hoteliq-ink">
            {isEdit ? 'Sửa tin đăng' : 'Đăng tin mới'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            disabled={submitting}>
            <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
              Đóng
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled">
          <Field label="Tiêu đề *" value={title} onChangeText={setTitle} />

          <View className="gap-1.5">
            <Text className="text-[12px] font-semibold text-hoteliq-gray">
              Loại phòng *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ROOM_TYPES.map((r) => {
                const active = roomType === r.value;
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => setRoomType(r.value)}
                    className={`rounded-full border px-3 py-2 ${
                      active
                        ? 'border-hoteliq-ink bg-hoteliq-ink'
                        : 'border-hoteliq-line bg-white'
                    }`}>
                    <Text
                      className={`text-[12px] font-semibold ${
                        active ? 'text-white' : 'text-hoteliq-gray'
                      }`}>
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-[12px] font-semibold text-hoteliq-gray">
              Quận *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {visibleDistricts.map((d) => {
                const active = district === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setDistrict(d)}
                    className={`rounded-full border px-3 py-2 ${
                      active
                        ? 'border-hoteliq-ink bg-hoteliq-ink'
                        : 'border-hoteliq-line bg-white'
                    }`}>
                    <Text
                      className={`text-[12px] font-semibold ${
                        active ? 'text-white' : 'text-hoteliq-gray'
                      }`}>
                      {d}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={() => setShowAllDistricts((v) => !v)}>
              <Text className="text-[13px] font-semibold text-hoteliq-ink underline">
                {showAllDistricts ? 'Thu gọn' : 'Xem thêm quận'}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field
                label="Diện tích (m²) *"
                value={area}
                onChangeText={setArea}
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <Field
                label="Giá (triệu) *"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Field
            label="Hoa hồng (tuỳ chọn)"
            value={commission}
            onChangeText={setCommission}
            placeholder="VD: 50% tháng đầu"
          />
          <Field
            label="SĐT liên hệ *"
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
          />
          <Field
            label="Mô tả chi tiết *"
            value={details}
            onChangeText={setDetails}
            multiline
            placeholder="Tối thiểu 20 ký tự…"
          />

          <View className="gap-1.5">
            <Text className="text-[12px] font-semibold text-hoteliq-gray">
              Trạng thái phòng
            </Text>
            <View className="flex-row gap-2">
              {(
                [
                  { value: 'available' as const, label: 'Còn trống' },
                  { value: 'rented' as const, label: 'Tạm hết' },
                ] as const
              ).map((s) => {
                const active = status === s.value;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => setStatus(s.value)}
                    className={`rounded-full border px-4 py-2.5 ${
                      active
                        ? 'border-hoteliq-ink bg-hoteliq-ink'
                        : 'border-hoteliq-line bg-white'
                    }`}>
                    <Text
                      className={`text-[13px] font-semibold ${
                        active ? 'text-white' : 'text-hoteliq-gray'
                      }`}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-[12px] font-semibold text-hoteliq-gray">
              Hình ảnh * ({images.length}/{MAX_APARTMENT_IMAGES})
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {images.map((img) => (
                <View key={img.key} className="relative">
                  <Image
                    source={{ uri: img.preview || img.uri }}
                    className="h-20 w-20 rounded-[10px] bg-hoteliq-chip"
                  />
                  <Pressable
                    onPress={() => removeImage(img.key)}
                    className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-hoteliq-ink">
                    <Text className="text-[12px] font-bold text-white">×</Text>
                  </Pressable>
                </View>
              ))}
              {images.length < MAX_APARTMENT_IMAGES ? (
                <Pressable
                  onPress={() => void pickImages()}
                  className="h-20 w-20 items-center justify-center rounded-[10px] border border-dashed border-hoteliq-line bg-hoteliq-chip">
                  <Text className="text-[22px] text-hoteliq-gray">+</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {error ? (
            <Text className="text-[14px] text-red-600">{error}</Text>
          ) : null}

          <Pressable
            onPress={() => void onSubmit()}
            disabled={submitting}
            className="mt-2 h-12 items-center justify-center rounded-full bg-hoteliq-ink"
            style={({ pressed }) => ({
              opacity: submitting ? 0.7 : pressed ? 0.9 : 1,
            })}>
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-[15px] font-semibold text-white">
                {isEdit ? 'Lưu thay đổi' : 'Gửi tin chờ duyệt'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'decimal-pad';
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="text-[12px] font-semibold text-hoteliq-gray">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Hoteliq.mutedLight}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-[12px] border bg-white px-4 text-[15px] text-hoteliq-ink ${
          multiline ? 'min-h-[120px] py-3' : 'min-h-[48px] py-3'
        } ${focused ? 'border-hoteliq-ink' : 'border-hoteliq-line'}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}
