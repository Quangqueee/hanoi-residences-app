import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FormImagePicker,
  type FormImageItem,
} from '@/components/form-image-picker';
import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  createAdminApartment,
  getAdminApartmentById,
  updateAdminApartment,
} from '@/lib/admin-apartments-service';
import { generateListingSummaryRemote, toAiContent } from '@/lib/ai-service';
import { HANOI_DISTRICTS, ROOM_TYPES } from '@/lib/constants';
import { uploadApartmentImages } from '@/lib/landlord-apartments-service';
import type {
  AiContent,
  ApartmentStatus,
  FeatureTag,
  RoomType,
} from '@/lib/types';

const TAGS: { value: FeatureTag; label: string }[] = [
  { value: 'pet_friendly', label: 'Pet friendly' },
  { value: 'lake_view', label: 'View hồ' },
];

export default function AdminApartmentFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const apartmentId = typeof id === 'string' ? id : undefined;
  const isEdit = Boolean(apartmentId);
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [loadingApt, setLoadingApt] = useState(isEdit);
  const [title, setTitle] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('studio');
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [commission, setCommission] = useState('');
  const [status, setStatus] = useState<ApartmentStatus>('available');
  const [tags, setTags] = useState<FeatureTag[]>([]);
  const [images, setImages] = useState<FormImageItem[]>([]);
  const [aiContent, setAiContent] = useState<AiContent | null>(null);
  const [showAllDistricts, setShowAllDistricts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleDistricts = useMemo(
    () => (showAllDistricts ? [...HANOI_DISTRICTS] : HANOI_DISTRICTS.slice(0, 6)),
    [showAllDistricts],
  );

  useEffect(() => {
    if (!apartmentId) {
      setLoadingApt(false);
      return;
    }
    let active = true;
    void (async () => {
      setLoadingApt(true);
      try {
        const apt = await getAdminApartmentById(apartmentId);
        if (!active) return;
        if (!apt) {
          Alert.alert('Không tìm thấy', 'Tin không tồn tại.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }
        setTitle(apt.title || '');
        setSourceCode(apt.sourceCode || '');
        setRoomType(apt.roomType || 'studio');
        setDistrict(apt.district || '');
        setArea(String(apt.area ?? ''));
        setPrice(String(apt.price ?? ''));
        setDetails(apt.details || '');
        setAddress(apt.address || '');
        setPhone(apt.landlordPhoneNumber || apt.contactPhone || '');
        setCommission(
          apt.commission != null && apt.commission !== ''
            ? String(apt.commission)
            : '',
        );
        setStatus(apt.status === 'rented' ? 'rented' : 'available');
        setTags(
          (apt.tags || []).filter(
            (t): t is FeatureTag =>
              t === 'pet_friendly' || t === 'lake_view',
          ),
        );
        setAiContent(apt.aiContent || null);
        setImages(
          (apt.imageUrls || []).map((uri, i) => ({
            key: `existing-${i}`,
            uri,
            preview: uri,
          })),
        );
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoadingApt(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [apartmentId, router]);

  if (!authLoading && !user) return <Redirect href="/(auth)/login" />;
  if (!authLoading && !isAdmin) return <Redirect href="/(tabs)/profile" />;

  const onGenerateAi = async () => {
    setError(null);
    const areaNum = Number(area);
    const priceNum = Number(price);
    if (!title.trim() || !district || Number.isNaN(priceNum)) {
      setError('Cần tiêu đề, quận và giá trước khi gọi AI.');
      return;
    }
    setAiBusy(true);
    try {
      const result = await generateListingSummaryRemote({
        title: title.trim(),
        roomType,
        district,
        address: address.trim(),
        price: priceNum,
        area: Number.isNaN(areaNum) ? 0 : areaNum,
        detailedInformation: details.trim(),
      });
      setAiContent(toAiContent(result));
      Alert.alert('AI xong', 'Đã tạo aiContent. Nhớ lưu tin.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI thất bại.');
    } finally {
      setAiBusy(false);
    }
  };

  const onSubmit = async () => {
    setError(null);
    if (submitting) return;
    const areaNum = Number(area);
    const priceNum = Number(price);
    if (!title.trim() || title.trim().length < 5) {
      setError('Tiêu đề cần ≥ 5 ký tự.');
      return;
    }
    if (!district) {
      setError('Chọn quận.');
      return;
    }
    if (!area || Number.isNaN(areaNum) || areaNum < 1) {
      setError('Diện tích không hợp lệ.');
      return;
    }
    if (price === '' || Number.isNaN(priceNum) || priceNum < 0) {
      setError('Giá không hợp lệ.');
      return;
    }
    if (images.length === 0) {
      setError('Cần ít nhất 1 ảnh.');
      return;
    }

    setSubmitting(true);
    try {
      const imageUrls = await uploadApartmentImages(images);
      const payload = {
        title: title.trim(),
        sourceCode: sourceCode.trim(),
        roomType,
        district,
        area: areaNum,
        price: priceNum,
        details: details.trim(),
        address: address.trim() || district,
        landlordPhoneNumber: phone.trim(),
        commission: commission.trim() || undefined,
        status,
        tags,
        imageUrls,
        aiContent,
      };
      if (isEdit && apartmentId) {
        await updateAdminApartment(apartmentId, payload);
      } else {
        await createAdminApartment(payload);
      }
      Alert.alert('Thành công', isEdit ? 'Đã cập nhật tin.' : 'Đã tạo tin published.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại.');
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
            {isEdit ? 'Sửa tin (Admin)' : 'Thêm tin (Admin)'}
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-[14px] font-semibold underline text-hoteliq-ink">
              Đóng
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 24, gap: 14, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled">
          <Field label="Tiêu đề *" value={title} onChangeText={setTitle} />
          <Field
            label="Mã nguồn (sourceCode)"
            value={sourceCode}
            onChangeText={setSourceCode}
            placeholder="VD: 888-A1"
          />

          <ChipRow
            label="Loại phòng *"
            options={ROOM_TYPES.map((r) => ({
              value: r.value,
              label: r.label,
            }))}
            value={roomType}
            onChange={(v) => setRoomType(v as RoomType)}
          />

          <View className="gap-1.5">
            <Text className="text-[12px] font-semibold text-hoteliq-gray">
              Quận *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {visibleDistricts.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  active={district === d}
                  onPress={() => setDistrict(d)}
                />
              ))}
            </View>
            <Pressable onPress={() => setShowAllDistricts((v) => !v)}>
              <Text className="text-[13px] font-semibold underline text-hoteliq-ink">
                {showAllDistricts ? 'Thu gọn' : 'Xem thêm'}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field
                label="Diện tích *"
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

          <Field label="Địa chỉ đầy đủ" value={address} onChangeText={setAddress} />
          <Field
            label="SĐT chủ nhà"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Field
            label="Hoa hồng"
            value={commission}
            onChangeText={setCommission}
          />
          <Field
            label="Mô tả *"
            value={details}
            onChangeText={setDetails}
            multiline
          />

          <ChipRow
            label="Trạng thái phòng"
            options={[
              { value: 'available', label: 'Còn trống' },
              { value: 'rented', label: 'Tạm hết' },
            ]}
            value={status}
            onChange={(v) => setStatus(v as ApartmentStatus)}
          />

          <View className="gap-1.5">
            <Text className="text-[12px] font-semibold text-hoteliq-gray">
              Tags
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {TAGS.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  active={tags.includes(t.value)}
                  onPress={() =>
                    setTags((prev) =>
                      prev.includes(t.value)
                        ? prev.filter((x) => x !== t.value)
                        : [...prev, t.value],
                    )
                  }
                />
              ))}
            </View>
          </View>

          <FormImagePicker
            label="Ảnh *"
            images={images}
            onChange={setImages}
            disabled={submitting}
            uploading={submitting}
          />

          <View className="rounded-[12px] border border-hoteliq-line p-3">
            <Text className="mb-2 text-[13px] font-semibold text-hoteliq-ink">
              AI content
            </Text>
            {aiContent?.seoTitle ? (
              <Text className="mb-2 text-[12px] text-hoteliq-gray" numberOfLines={3}>
                {aiContent.seoTitle}
              </Text>
            ) : (
              <Text className="mb-2 text-[12px] text-hoteliq-gray">
                Chưa có aiContent
              </Text>
            )}
            <Pressable
              disabled={aiBusy}
              onPress={() => void onGenerateAi()}
              className="min-h-10 items-center justify-center rounded-full bg-hoteliq-ink">
              {aiBusy ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-[13px] font-semibold text-white">
                  Tạo mô tả AI (callable)
                </Text>
              )}
            </Pressable>
          </View>

          {error ? <Text className="text-[14px] text-red-600">{error}</Text> : null}

          <Pressable
            disabled={submitting}
            onPress={() => void onSubmit()}
            className="mt-2 h-12 items-center justify-center rounded-full bg-hoteliq-ink"
            style={{ opacity: submitting ? 0.7 : 1 }}>
            {submitting ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color="#FFF" />
                <Text className="text-[15px] font-semibold text-white">
                  Đang tải ảnh…
                </Text>
              </View>
            ) : (
              <Text className="text-[15px] font-semibold text-white">
                {isEdit ? 'Lưu thay đổi' : 'Tạo tin published'}
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
          multiline ? 'min-h-[100px] py-3' : 'min-h-[48px] py-3'
        } ${focused ? 'border-hoteliq-ink' : 'border-hoteliq-line'}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-2 ${
        active ? 'border-hoteliq-ink bg-hoteliq-ink' : 'border-hoteliq-line'
      }`}>
      <Text
        className={`text-[12px] font-semibold ${
          active ? 'text-white' : 'text-hoteliq-gray'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-[12px] font-semibold text-hoteliq-gray">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            active={value === o.value}
            onPress={() => onChange(o.value)}
          />
        ))}
      </View>
    </View>
  );
}
