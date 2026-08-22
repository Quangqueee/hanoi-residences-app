import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  fetchPendingSubmissions,
  reviewApartmentSubmission,
} from '@/lib/admin-apartments-service';
import type { Apartment } from '@/lib/types';

export default function AdminSubmissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [items, setItems] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [target, setTarget] = useState<Apartment | null>(null);
  const [sourceCode, setSourceCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      setItems(await fetchPendingSubmissions());
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không tải được tin chờ duyệt.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) void load('initial');
  }, [authLoading, isAdmin, load]);

  if (!authLoading && !user) return <Redirect href="/(auth)/login" />;
  if (!authLoading && !isAdmin) return <Redirect href="/(tabs)/profile" />;

  const openReview = (apt: Apartment) => {
    setTarget(apt);
    setSourceCode(apt.sourceCode || '');
    setAddress(apt.address || apt.district || '');
    setPhone(apt.landlordPhoneNumber || apt.contactPhone || '');
    setAdminNotes(apt.adminNotes || '');
    setReviewOpen(true);
  };

  const decide = (decision: 'published' | 'rejected') => {
    if (!target) return;
    if (decision === 'published' && !sourceCode.trim()) {
      Alert.alert('Thiếu mã', 'Nhập sourceCode trước khi duyệt published.');
      return;
    }
    void (async () => {
      setBusyId(target.id);
      try {
        await reviewApartmentSubmission(target.id, decision, {
          sourceCode: sourceCode.trim(),
          address: address.trim(),
          landlordPhoneNumber: phone.trim(),
          adminNotes: adminNotes.trim(),
        });
        setItems((prev) => prev.filter((x) => x.id !== target.id));
        setReviewOpen(false);
        setTarget(null);
        Alert.alert(
          'Xong',
          decision === 'published' ? 'Đã duyệt tin.' : 'Đã từ chối tin.',
        );
      } catch (err) {
        Alert.alert(
          'Lỗi',
          err instanceof Error ? err.message : 'Không cập nhật được.',
        );
      } finally {
        setBusyId(null);
      }
    })();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-hoteliq-line px-6 py-3">
        <Text className="text-[20px] font-semibold text-hoteliq-ink">
          Duyệt tin chủ nhà
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-[14px] font-semibold underline text-hoteliq-ink">
            Đóng
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={loading ? [] : items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, paddingBottom: 40, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={Hoteliq.primary}
          />
        }
        ListHeaderComponent={
          <Text className="mb-4 text-[13px] text-hoteliq-gray">
            {items.length} tin pending
          </Text>
        }
        renderItem={({ item }) => {
          const thumb = item.imageUrls?.[0];
          return (
            <Pressable
              onPress={() => openReview(item)}
              className="mb-3 flex-row gap-3 rounded-[12px] border border-hoteliq-line p-3">
              {thumb ? (
                <Image
                  source={{ uri: thumb }}
                  className="h-20 w-20 rounded-[10px] bg-hoteliq-chip"
                />
              ) : (
                <View className="h-20 w-20 rounded-[10px] bg-hoteliq-chip" />
              )}
              <View className="min-w-0 flex-1">
                <Text
                  className="text-[15px] font-semibold text-hoteliq-ink"
                  numberOfLines={2}>
                  {item.title}
                </Text>
                <Text className="mt-1 text-[12px] text-hoteliq-gray">
                  {item.district} · {item.price}tr · {item.area}m²
                </Text>
                <Text className="mt-1 text-[12px] text-amber-700">
                  Chạm để duyệt / từ chối
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={Hoteliq.primary} className="mt-10" />
          ) : (
            <Text className="mt-8 text-center text-hoteliq-gray">
              Không có tin chờ duyệt.
            </Text>
          )
        }
      />

      <Modal visible={reviewOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="max-h-[88%] rounded-t-[20px] bg-white px-6 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <Text className="mb-1 text-[18px] font-semibold text-hoteliq-ink">
              Duyệt tin
            </Text>
            <Text className="mb-4 text-[13px] text-hoteliq-gray" numberOfLines={2}>
              {target?.title}
            </Text>

            <Field label="sourceCode *" value={sourceCode} onChangeText={setSourceCode} />
            <Field label="Địa chỉ" value={address} onChangeText={setAddress} />
            <Field
              label="SĐT chủ nhà"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Field
              label="Ghi chú admin"
              value={adminNotes}
              onChangeText={setAdminNotes}
              multiline
            />

            <View className="mt-4 flex-row gap-2">
              <Pressable
                onPress={() => setReviewOpen(false)}
                className="min-h-11 flex-1 items-center justify-center rounded-full border border-hoteliq-line">
                <Text className="text-[14px] font-semibold text-hoteliq-ink">
                  Hủy
                </Text>
              </Pressable>
              <Pressable
                disabled={busyId === target?.id}
                onPress={() => decide('rejected')}
                className="min-h-11 flex-1 items-center justify-center rounded-full border border-red-200 bg-red-50">
                <Text className="text-[14px] font-semibold text-red-700">
                  Từ chối
                </Text>
              </Pressable>
              <Pressable
                disabled={busyId === target?.id}
                onPress={() => decide('published')}
                className="min-h-11 flex-1 items-center justify-center rounded-full bg-hoteliq-ink">
                {busyId === target?.id ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-[14px] font-semibold text-white">
                    Duyệt
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View className="mb-3 gap-1">
      <Text className="text-[12px] font-semibold text-hoteliq-gray">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-[12px] border border-hoteliq-line px-4 text-[15px] text-hoteliq-ink ${
          multiline ? 'min-h-[80px] py-3' : 'min-h-[44px] py-2'
        }`}
      />
    </View>
  );
}
