import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { SITE_ORIGIN } from '@/lib/share-apartment';

const TAB_CLEARANCE = 110;

const softCardShadow = Platform.select({
  ios: {
    shadowColor: Hoteliq.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  android: { elevation: 2 },
  default: {},
});

function initialsFromName(name?: string | null, email?: string | null): string {
  const source = (name || email || 'HR').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

type RowProps = {
  symbol: {
    ios: string;
    android: string;
    web: string;
  };
  label: string;
  hint?: string;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  trailing?: string;
};

function SettingsRow({
  symbol,
  label,
  hint,
  onPress,
  destructive,
  disabled,
  trailing,
}: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-[56px] flex-row items-center gap-3.5 px-4 py-3.5"
      style={({ pressed }) => ({
        opacity: disabled ? 0.45 : pressed ? 0.72 : 1,
      })}>
      <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-hoteliq-soft">
        <SymbolView
          name={{
            ios: symbol.ios as 'heart',
            android: symbol.android as 'favorite',
            web: symbol.web as 'favorite',
          }}
          size={18}
          tintColor={destructive ? '#DC2626' : Hoteliq.primary}
          weight="medium"
        />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          className={`text-[15px] font-semibold tracking-tight ${
            destructive ? 'text-red-600' : 'text-hoteliq-ink'
          }`}>
          {label}
        </Text>
        {hint ? (
          <Text className="text-[12px] font-medium leading-4 text-hoteliq-gray">
            {hint}
          </Text>
        ) : null}
      </View>
      <Text className="text-[15px] text-hoteliq-muted">
        {trailing ?? '›'}
      </Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    userData,
    roleLabel,
    logout,
    isAdmin,
    isCollaborator,
    isLandlord,
  } = useAuth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = userData?.displayName?.trim() || 'Chưa cập nhật tên';
  const initials = useMemo(
    () => initialsFromName(userData?.displayName, user?.email),
    [userData?.displayName, user?.email],
  );

  const roleHint = useMemo(() => {
    if (isAdmin || isCollaborator) {
      return 'Quyền vận hành: xem hoa hồng / điều phối lịch';
    }
    if (isLandlord) {
      return `Chủ nhà · duyệt: ${userData?.landlordApprovalStatus ?? '—'}`;
    }
    return 'Tài khoản khách hàng Hanoi Residences';
  }, [isAdmin, isCollaborator, isLandlord, userData?.landlordApprovalStatus]);

  const onLogout = async () => {
    setError(null);
    setBusy(true);
    try {
      await logout();
    } catch {
      setError('Không thể đăng xuất. Thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  const openSite = () => {
    void Linking.openURL(SITE_ORIGIN);
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: TAB_CLEARANCE + Math.max(insets.bottom, 16),
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between pt-1">
          <View className="gap-1">
            <Text className="text-[12px] font-medium text-hoteliq-gray">
              Account
            </Text>
            <Text className="text-[24px] font-bold leading-8 tracking-tight text-hoteliq-ink">
              Profile
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Về trang chủ"
            className="h-11 w-11 items-center justify-center rounded-[12px] border border-hoteliq-line bg-white"
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
            <SymbolView
              name={{ ios: 'house', android: 'home', web: 'home' }}
              size={18}
              tintColor={Hoteliq.ink}
              weight="medium"
            />
          </Pressable>
        </View>

        <View
          className="overflow-hidden rounded-[20px] bg-white px-5 py-5"
          style={softCardShadow}>
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-hoteliq-soft">
              <Text className="text-[22px] font-bold tracking-wide text-hoteliq-primary">
                {initials}
              </Text>
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <Text
                className="text-[18px] font-semibold tracking-tight text-hoteliq-ink"
                numberOfLines={1}>
                {displayName}
              </Text>
              <Text
                className="text-[13px] font-medium text-hoteliq-gray"
                numberOfLines={1}>
                {user?.email || '—'}
              </Text>
              {roleLabel ? (
                <View className="mt-1 self-start rounded-full bg-hoteliq-soft px-2.5 py-1">
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-hoteliq-primary">
                    {roleLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="mt-5 rounded-[14px] bg-hoteliq-chip px-3.5 py-3">
            <Text className="text-[13px] leading-5 text-hoteliq-gray">
              {roleHint}
            </Text>
            {userData?.phoneNumber ? (
              <Text className="mt-1.5 text-[13px] font-medium text-hoteliq-ink">
                SĐT: {userData.phoneNumber}
              </Text>
            ) : null}
          </View>
        </View>

        <View
          className="overflow-hidden rounded-[20px] bg-white"
          style={softCardShadow}>
          <SettingsRow
            symbol={{
              ios: 'heart',
              android: 'favorite_border',
              web: 'favorite_border',
            }}
            label="Yêu thích"
            hint="Căn hộ bạn đã lưu"
            onPress={() => router.push('/(tabs)/favorites')}
          />
          <View className="mx-4 h-px bg-hoteliq-line" />
          <SettingsRow
            symbol={{
              ios: 'calendar',
              android: 'calendar_month',
              web: 'calendar_month',
            }}
            label="Lịch hẹn"
            hint="Theo dõi trạng thái đặt lịch"
            onPress={() => router.push('/(tabs)/bookings')}
          />
          <View className="mx-4 h-px bg-hoteliq-line" />
          <SettingsRow
            symbol={{
              ios: 'bell',
              android: 'notifications_none',
              web: 'notifications_none',
            }}
            label="Thông báo"
            hint="Cập nhật theo vai trò của bạn"
            onPress={() => router.push('/(tabs)/notifications')}
          />
          <View className="mx-4 h-px bg-hoteliq-line" />
          <SettingsRow
            symbol={{
              ios: 'magnifyingglass',
              android: 'search',
              web: 'search',
            }}
            label="Tìm kiếm"
            hint="Lọc quận, giá, loại phòng"
            onPress={() => router.push('/(tabs)/search')}
          />
        </View>

        <View
          className="overflow-hidden rounded-[20px] bg-white"
          style={softCardShadow}>
          <SettingsRow
            symbol={{
              ios: 'globe',
              android: 'language',
              web: 'language',
            }}
            label="Trang web Hanoi Residences"
            hint={SITE_ORIGIN.replace('https://', '')}
            onPress={openSite}
          />
          <View className="mx-4 h-px bg-hoteliq-line" />
          <SettingsRow
            symbol={{
              ios: 'lock.shield',
              android: 'privacy_tip',
              web: 'privacy_tip',
            }}
            label="Chính sách bảo mật"
            hint="Sắp ra mắt — bắt buộc App Store / Play"
            disabled
            trailing="Soon"
          />
          <View className="mx-4 h-px bg-hoteliq-line" />
          <SettingsRow
            symbol={{
              ios: 'trash',
              android: 'delete_outline',
              web: 'delete_outline',
            }}
            label="Xóa tài khoản"
            hint="Sắp ra mắt — yêu cầu xác thực lại"
            disabled
            destructive
            trailing="Soon"
          />
        </View>

        {error ? (
          <Text className="text-center text-[13px] font-medium text-red-600">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={() => void onLogout()}
          disabled={busy}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất"
          className="min-h-[56px] items-center justify-center rounded-[16px] bg-hoteliq-ink"
          style={({ pressed }) => ({
            opacity: busy || pressed ? 0.75 : 1,
          })}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-[15px] font-semibold text-white">
              Đăng xuất
            </Text>
          )}
        </Pressable>

        <Text className="pb-2 text-center text-[12px] leading-5 text-hoteliq-gray">
          Hanoi Residences · Đồng bộ tài khoản với bản Web
        </Text>
      </ScrollView>
    </View>
  );
}
