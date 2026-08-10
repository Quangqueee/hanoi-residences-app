import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookingCard } from '@/components/booking-card';
import { BookingEditModal } from '@/components/booking-edit-modal';
import { ShimmerBlock } from '@/components/ui/shimmer-block';
import { useAuth } from '@/contexts/auth-context';
import {
  fetchMyBookings,
  type BookingRecord,
} from '@/lib/bookings-service';
import { SITE_ORIGIN } from '@/lib/share-apartment';

const BRAND = '#CDA533';
const TAB_CLEARANCE = 110;

function BookingSkeleton() {
  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-[#F0EDE4] bg-white p-4">
      <View className="mb-4 flex-row justify-between">
        <ShimmerBlock className="h-10 w-24 rounded-md" height={40} width={96} />
        <ShimmerBlock className="h-7 w-24 rounded-md" height={28} width={96} />
      </View>
      <ShimmerBlock className="mb-2 h-5 w-[55%] rounded-md" height={20} width="55%" />
      <ShimmerBlock className="mb-4 h-4 w-[35%] rounded-md" height={16} width="35%" />
      <ShimmerBlock className="h-12 w-full rounded-xl" height={48} width="100%" />
    </View>
  );
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, role, isCollaborator, isAdmin, loading: authLoading } =
    useAuth();

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<BookingRecord | null>(null);

  const title = isCollaborator || isAdmin
    ? 'Quản lý lịch dẫn khách'
    : 'Quản lý lịch xem phòng';

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!user) {
        setBookings([]);
        setLoading(false);
        return;
      }
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      setError(null);
      try {
        const data = await fetchMyBookings({ uid: user.uid, role });
        setBookings(data);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : 'Không tải được danh sách lịch hẹn.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, role],
  );

  useEffect(() => {
    if (authLoading) return;
    void load('initial');
  }, [authLoading, load]);

  const filtered = useMemo(() => {
    if (!isCollaborator && !isAdmin) return bookings;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter((b) => {
      const matchName =
        b.name?.toLowerCase().includes(term) ||
        b.clientName?.toLowerCase().includes(term);
      const matchPhone =
        b.phone?.includes(term) || b.clientPhone?.includes(term);
      const matchCode = b.apartmentCode?.toLowerCase().includes(term);
      return Boolean(matchName || matchPhone || matchCode);
    });
  }, [bookings, searchTerm, isCollaborator, isAdmin]);

  const openEdit = (booking: BookingRecord) => {
    setSelected(booking);
    setEditOpen(true);
  };

  const onSaved = (next: BookingRecord) => {
    setBookings((prev) =>
      prev
        .map((b) => (b.id === next.id ? next : b))
        .sort((a, b) => {
          const ta =
            (a.updatedAt as { toMillis?: () => number })?.toMillis?.() ||
            (a.createdAt as { toMillis?: () => number })?.toMillis?.() ||
            0;
          const tb =
            (b.updatedAt as { toMillis?: () => number })?.toMillis?.() ||
            (b.createdAt as { toMillis?: () => number })?.toMillis?.() ||
            0;
          return tb - ta;
        }),
    );
  };

  const openContact = () => {
    void Linking.openURL(`${SITE_ORIGIN}`);
  };

  if (!authLoading && !user) {
    return (
      <View
        className="flex-1 items-center justify-center bg-[#F7F6F2] px-8"
        style={{ paddingTop: insets.top }}>
        <Text className="mb-2 text-center text-xl font-extrabold text-[#111827]">
          Đăng nhập để xem lịch hẹn
        </Text>
        <Text className="text-center text-sm leading-5 text-[#6B7280]">
          Lịch xem phòng và lịch dẫn khách của bạn sẽ hiển thị tại đây sau khi
          đăng nhập.
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}>
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => `${item._collection}-${item.id}`}
        renderItem={({ item }) => (
          <BookingCard booking={item} onEdit={openEdit} />
        )}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: TAB_CLEARANCE + Math.max(insets.bottom, 12),
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={BRAND}
            colors={[BRAND]}
          />
        }
        ListHeaderComponent={
          <View className="mb-6 gap-5 pt-3">
            <View className="flex-row items-start gap-3.5">
              <View className="mt-0.5 h-12 w-12 items-center justify-center rounded-2xl bg-white">
                <Text className="text-xl text-brand">📅</Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[28px] font-semibold leading-9 tracking-tight text-foreground">
                  {title}
                </Text>
                <Text className="mt-1.5 text-[14px] leading-6 text-brand-muted">
                  Theo dõi trạng thái, lịch trình và phản hồi từ ban quản trị.
                </Text>
              </View>
            </View>

            {isCollaborator || isAdmin ? (
              <View className="min-h-[52px] flex-row items-center gap-2.5 rounded-full bg-white px-4">
                <Text className="text-base text-[#B0AAA0]">⌕</Text>
                <TextInput
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholder="Tìm khách, SĐT, mã căn…"
                  placeholderTextColor="#A8A29A"
                  className="flex-1 py-3 text-[15px] text-foreground"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View>
              <BookingSkeleton />
              <BookingSkeleton />
              <BookingSkeleton />
            </View>
          ) : (
            <View className="items-center gap-3 rounded-3xl bg-white px-7 py-14">
              <Text className="text-4xl text-brand/30">📅</Text>
              <Text className="text-center text-[17px] font-semibold text-foreground">
                {error ? 'Không tải được lịch hẹn' : 'Bạn chưa có lịch hẹn nào'}
              </Text>
              <Text className="text-center text-sm leading-6 text-brand-muted">
                {error
                  ? error
                  : 'Đặt lịch từ trang chi tiết căn hộ để bắt đầu theo dõi tại đây.'}
              </Text>
              {error ? (
                <Pressable
                  onPress={() => void load('initial')}
                  hitSlop={8}
                  className="mt-1 min-h-11 items-center justify-center rounded-full bg-brand px-6"
                  style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
                  <Text className="text-sm font-bold text-white">Thử lại</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
      />

      {/* CONTACT FAB — inspired by Web multi-contact */}
      <Pressable
        onPress={openContact}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Liên hệ"
        className="absolute bottom-[88px] right-5 h-[64px] w-[64px] items-center justify-center rounded-full bg-brand shadow-lg elevation-6"
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
          bottom: Math.max(insets.bottom, 10) + 72,
        })}>
        <Text className="text-lg text-white">💬</Text>
        <Text className="text-[9px] font-extrabold uppercase tracking-wide text-white">
          Contact
        </Text>
      </Pressable>

      <BookingEditModal
        visible={editOpen}
        booking={selected}
        onClose={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        onSaved={onSaved}
      />
    </View>
  );
}
