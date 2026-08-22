import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  fetchMyLandlordApartments,
  requestPushApartment,
  updateLandlordApartmentStatus,
} from '@/lib/landlord-apartments-service';
import type { Apartment, ApartmentStatus } from '@/lib/types';

function submissionLabel(status?: string) {
  switch (status) {
    case 'published':
      return { text: 'Đã duyệt', bg: '#DCFCE7', color: '#166534' };
    case 'rejected':
      return { text: 'Từ chối', bg: '#FEE2E2', color: '#991B1B' };
    default:
      return { text: 'Chờ duyệt', bg: '#FEF3C7', color: '#92400E' };
  }
}

export default function LandlordApartmentsScreen() {
  const router = useRouter();
  const { user, isLandlord, loading: authLoading } = useAuth();

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!user) return;
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      setError(null);
      try {
        setApartments(await fetchMyLandlordApartments(user.uid));
      } catch (err) {
        console.error(err);
        setError('Không tải được danh sách tin đăng.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (!authLoading && user && isLandlord) {
      void load('initial');
    }
  }, [authLoading, user, isLandlord, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apartments;
    return apartments.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.sourceCode?.toLowerCase().includes(q) ||
        a.district?.toLowerCase().includes(q) ||
        a.address?.toLowerCase().includes(q),
    );
  }, [apartments, search]);

  if (!authLoading && !user) {
    return <Redirect href="/(auth)/login" />;
  }
  if (!authLoading && !isLandlord) {
    return <Redirect href="/partner-register" />;
  }

  const onToggleStatus = (apt: Apartment) => {
    if (!user) return;
    const next: ApartmentStatus =
      apt.status === 'rented' ? 'available' : 'rented';
    Alert.alert(
      'Đổi trạng thái phòng',
      `Chuyển thành "${next === 'available' ? 'Còn trống' : 'Tạm hết'}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => {
            void (async () => {
              setBusyId(apt.id);
              try {
                await updateLandlordApartmentStatus(user.uid, apt.id, next);
                setApartments((prev) =>
                  prev.map((x) =>
                    x.id === apt.id ? { ...x, status: next } : x,
                  ),
                );
              } catch (err) {
                Alert.alert(
                  'Lỗi',
                  err instanceof Error
                    ? err.message
                    : 'Không cập nhật được trạng thái.',
                );
              } finally {
                setBusyId(null);
              }
            })();
          },
        },
      ],
    );
  };

  const onRequestPush = (apt: Apartment) => {
    if (!user) return;
    if (apt.submissionStatus !== 'published') {
      Alert.alert('Chưa thể đẩy', 'Chỉ xin đẩy tin đã được admin duyệt.');
      return;
    }
    if (apt.isPushRequested || apt.pushRequestedAt) {
      Alert.alert('Đã gửi', 'Tin này đã có yêu cầu đẩy đang chờ xử lý.');
      return;
    }
    Alert.alert(
      'Xin đẩy tin',
      'Tin sẽ được đẩy lên đầu danh sách. Tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xin đẩy',
          onPress: () => {
            void (async () => {
              setBusyId(apt.id);
              try {
                await requestPushApartment(user.uid, apt.id);
                setApartments((prev) =>
                  prev.map((x) =>
                    x.id === apt.id
                      ? { ...x, isPushRequested: true, pushRequestedAt: {} }
                      : x,
                  ),
                );
                Alert.alert('Thành công', 'Đã gửi yêu cầu đẩy tin.');
              } catch (err) {
                Alert.alert(
                  'Lỗi',
                  err instanceof Error
                    ? err.message
                    : 'Không gửi được yêu cầu đẩy.',
                );
              } finally {
                setBusyId(null);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-hoteliq-line px-6 py-3">
        <Text className="text-[20px] font-semibold text-hoteliq-ink">
          Tin của tôi
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
            Đóng
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, paddingBottom: 100, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={Hoteliq.primary}
          />
        }
        ListHeaderComponent={
          <View className="mb-4 gap-3">
            <View className="min-h-[48px] rounded-full border border-hoteliq-line px-4">
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm theo tên, mã, quận…"
                placeholderTextColor={Hoteliq.mutedLight}
                className="py-3 text-[15px] text-hoteliq-ink"
              />
            </View>
            <Text className="text-[13px] text-hoteliq-gray">
              {filtered.length} tin đăng
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const sub = submissionLabel(item.submissionStatus);
          const busy = busyId === item.id;
          const thumb = item.imageUrls?.[0];
          return (
            <View className="mb-3 overflow-hidden rounded-[12px] border border-hoteliq-line">
              <View className="flex-row gap-3 p-3">
                {thumb ? (
                  <Image
                    source={{ uri: thumb }}
                    className="h-20 w-20 rounded-[10px] bg-hoteliq-chip"
                  />
                ) : (
                  <View className="h-20 w-20 items-center justify-center rounded-[10px] bg-hoteliq-chip">
                    <Text className="text-[11px] text-hoteliq-gray">No img</Text>
                  </View>
                )}
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-[15px] font-semibold text-hoteliq-ink"
                    numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="mt-0.5 text-[12px] text-hoteliq-gray">
                    {item.district}
                    {item.sourceCode ? ` · ${item.sourceCode}` : ''}
                  </Text>
                  <View className="mt-2 flex-row flex-wrap gap-1.5">
                    <View
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: sub.bg }}>
                      <Text
                        className="text-[11px] font-semibold"
                        style={{ color: sub.color }}>
                        {sub.text}
                      </Text>
                    </View>
                    <View className="rounded-full bg-hoteliq-chip px-2 py-0.5">
                      <Text className="text-[11px] font-semibold text-hoteliq-ink">
                        {item.status === 'rented' ? 'Tạm hết' : 'Còn trống'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-2 border-t border-hoteliq-line px-3 py-2.5">
                <Pressable
                  disabled={busy}
                  onPress={() =>
                    router.push({
                      pathname: '/profile/apartments/form',
                      params: { id: item.id },
                    })
                  }
                  className="min-h-9 flex-1 items-center justify-center rounded-full border border-hoteliq-line px-3">
                  <Text className="text-[12px] font-semibold text-hoteliq-ink">
                    Sửa
                  </Text>
                </Pressable>
                <Pressable
                  disabled={busy}
                  onPress={() => onToggleStatus(item)}
                  className="min-h-9 flex-1 items-center justify-center rounded-full border border-hoteliq-line px-3">
                  {busy ? (
                    <ActivityIndicator color={Hoteliq.ink} size="small" />
                  ) : (
                    <Text className="text-[12px] font-semibold text-hoteliq-ink">
                      {item.status === 'rented' ? '→ Còn trống' : '→ Tạm hết'}
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  disabled={busy}
                  onPress={() => onRequestPush(item)}
                  className="min-h-9 flex-1 items-center justify-center rounded-full bg-hoteliq-ink px-3">
                  <Text className="text-[12px] font-semibold text-white">
                    {item.isPushRequested || item.pushRequestedAt
                      ? 'Đã xin đẩy'
                      : 'Xin đẩy'}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={Hoteliq.primary} className="mt-10" />
          ) : (
            <View className="mt-8 items-center gap-2 px-4">
              <Text className="text-center text-[16px] font-semibold text-hoteliq-ink">
                {error || 'Chưa có tin đăng nào'}
              </Text>
              <Text className="text-center text-[14px] text-hoteliq-gray">
                Bấm nút bên dưới để gửi tin mới chờ admin duyệt.
              </Text>
            </View>
          )
        }
      />

      <Pressable
        onPress={() => router.push('/profile/apartments/form')}
        className="absolute bottom-6 left-6 right-6 h-12 items-center justify-center rounded-full bg-hoteliq-ink"
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        <Text className="text-[15px] font-semibold text-white">
          + Đăng tin mới
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
