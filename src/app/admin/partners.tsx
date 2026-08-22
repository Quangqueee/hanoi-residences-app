import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  approveLandlordPartner,
  fetchPartners,
  rejectLandlordPartner,
  terminatePartnership,
  type PartnerRecord,
} from '@/lib/partner-service';
import { getLandlordApartmentStats } from '@/lib/admin-apartments-service';

type TabKey = 'pending' | 'approved' | 'rejected';

export default function AdminPartnersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<PartnerRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);
    try {
      setPartners(await fetchPartners());
    } catch (err) {
      console.error(err);
      setError('Không tải được danh sách đối tác.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) void load('initial');
  }, [authLoading, isAdmin, load]);

  const filtered = useMemo(
    () => partners.filter((p) => p.status === tab),
    [partners, tab],
  );

  if (!authLoading && !user) {
    return <Redirect href="/(auth)/login" />;
  }
  if (!authLoading && !isAdmin) {
    return <Redirect href="/(tabs)/profile" />;
  }

  const onApprove = (p: PartnerRecord) => {
    Alert.alert('Duyệt chủ nhà', `Duyệt ${p.displayName || p.email}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        onPress: () => {
          void (async () => {
            setBusyId(p.id);
            try {
              await approveLandlordPartner(p.id);
              setPartners((prev) =>
                prev.map((x) =>
                  x.id === p.id
                    ? { ...x, status: 'approved', role: 'landlord' }
                    : x,
                ),
              );
              Alert.alert('Thành công', 'Đã duyệt chủ nhà.');
            } catch {
              Alert.alert('Lỗi', 'Không duyệt được đối tác.');
            } finally {
              setBusyId(null);
            }
          })();
        },
      },
    ]);
  };

  const openReject = (p: PartnerRecord) => {
    setRejectTarget(p);
    setRejectReason('');
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await rejectLandlordPartner(rejectTarget.id, rejectReason);
      setPartners((prev) =>
        prev.map((x) =>
          x.id === rejectTarget.id ? { ...x, status: 'rejected' } : x,
        ),
      );
      setRejectOpen(false);
      setRejectTarget(null);
      Alert.alert('Đã từ chối', 'Đối tác đã được đánh dấu từ chối.');
    } catch {
      Alert.alert('Lỗi', 'Không từ chối được đối tác.');
    } finally {
      setBusyId(null);
    }
  };

  const onTerminate = (p: PartnerRecord) => {
    Alert.alert(
      'Ngưng hợp tác',
      `Thu hồi quyền chủ nhà và XÓA toàn bộ tin của ${p.displayName || p.email}? Hành động không hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Ngưng hợp tác',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyId(p.id);
              try {
                const deleted = await terminatePartnership(p.id);
                setPartners((prev) =>
                  prev.map((x) =>
                    x.id === p.id
                      ? { ...x, status: 'rejected', role: 'user' }
                      : x,
                  ),
                );
                Alert.alert(
                  'Đã ngưng hợp tác',
                  `Đã gỡ ${deleted} tin đăng và hạ quyền về User.`,
                );
              } catch {
                Alert.alert('Lỗi', 'Không thể ngưng hợp tác.');
              } finally {
                setBusyId(null);
              }
            })();
          },
        },
      ],
    );
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'approved', label: 'Đã duyệt' },
    { key: 'rejected', label: 'Từ chối' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-hoteliq-line px-6 py-3">
        <Text className="text-[20px] font-semibold text-hoteliq-ink">
          Đối tác chủ nhà
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
        contentContainerStyle={{ padding: 24, paddingBottom: 40, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={Hoteliq.primary}
          />
        }
        ListHeaderComponent={
          <View className="mb-4 gap-3">
            <View className="flex-row gap-2">
              {tabs.map((t) => {
                const active = tab === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setTab(t.key)}
                    className={`rounded-full border px-3 py-2 ${
                      active
                        ? 'border-hoteliq-ink bg-hoteliq-ink'
                        : 'border-hoteliq-line bg-white'
                    }`}>
                    <Text
                      className={`text-[12px] font-semibold ${
                        active ? 'text-white' : 'text-hoteliq-gray'
                      }`}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="text-[13px] text-hoteliq-gray">
              {filtered.length} đối tác
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const busy = busyId === item.id;
          return (
            <View className="mb-3 rounded-[12px] border border-hoteliq-line p-4">
              <Text className="text-[16px] font-semibold text-hoteliq-ink">
                {item.displayName || 'Chưa rõ tên'}
              </Text>
              <Text className="mt-0.5 text-[13px] text-hoteliq-gray">
                {item.email || '—'}
              </Text>
              <Text className="mt-1 text-[13px] text-hoteliq-gray">
                SĐT: {item.phoneNumber || '—'}
              </Text>
              <Text className="mt-1 text-[13px] text-hoteliq-gray">
                Khu vực: {item.district || '—'}
              </Text>
              {item.message ? (
                <Text
                  className="mt-2 text-[13px] leading-5 text-hoteliq-ink"
                  numberOfLines={4}>
                  {item.message}
                </Text>
              ) : null}

              {tab === 'pending' ? (
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    disabled={busy}
                    onPress={() => onApprove(item)}
                    className="min-h-10 flex-1 items-center justify-center rounded-full bg-hoteliq-ink">
                    {busy ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text className="text-[13px] font-semibold text-white">
                        Duyệt
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => openReject(item)}
                    className="min-h-10 flex-1 items-center justify-center rounded-full border border-red-200 bg-red-50">
                    <Text className="text-[13px] font-semibold text-red-700">
                      Từ chối
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {tab === 'approved' ? (
                <View className="mt-3 gap-2">
                  <Pressable
                    disabled={busy}
                    onPress={() => {
                      void (async () => {
                        setBusyId(item.id);
                        try {
                          const s = await getLandlordApartmentStats(item.id);
                          Alert.alert(
                            'Thống kê tin',
                            `Tổng ${s.total}\nPending ${s.pending}\nPublished ${s.published}\nRejected ${s.rejected}`,
                          );
                        } catch {
                          Alert.alert('Lỗi', 'Không lấy được thống kê.');
                        } finally {
                          setBusyId(null);
                        }
                      })();
                    }}
                    className="min-h-10 items-center justify-center rounded-full border border-hoteliq-line">
                    <Text className="text-[13px] font-semibold text-hoteliq-ink">
                      Thống kê tin (A9)
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => onTerminate(item)}
                    className="min-h-10 items-center justify-center rounded-full border border-red-300 bg-red-50">
                    {busy ? (
                      <ActivityIndicator color="#B91C1C" />
                    ) : (
                      <Text className="text-[13px] font-semibold text-red-700">
                        Ngưng hợp tác (xóa tin)
                      </Text>
                    )}
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={Hoteliq.primary} className="mt-10" />
          ) : (
            <Text className="mt-8 text-center text-[14px] text-hoteliq-gray">
              {error || 'Không có đối tác trong tab này.'}
            </Text>
          )
        }
      />

      <Modal visible={rejectOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="rounded-t-[20px] bg-white px-6 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <Text className="mb-3 text-[18px] font-semibold text-hoteliq-ink">
              Lý do từ chối
            </Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Không bắt buộc…"
              placeholderTextColor={Hoteliq.mutedLight}
              multiline
              className="min-h-[96px] rounded-[12px] border border-hoteliq-line px-4 py-3 text-[15px] text-hoteliq-ink"
              textAlignVertical="top"
            />
            <View className="mt-4 flex-row gap-2">
              <Pressable
                onPress={() => setRejectOpen(false)}
                className="min-h-11 flex-1 items-center justify-center rounded-full border border-hoteliq-line">
                <Text className="text-[14px] font-semibold text-hoteliq-ink">
                  Hủy
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void confirmReject()}
                className="min-h-11 flex-1 items-center justify-center rounded-full bg-hoteliq-ink">
                <Text className="text-[14px] font-semibold text-white">
                  Xác nhận
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
