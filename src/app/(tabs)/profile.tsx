import { useRouter } from 'expo-router';
import { AppSymbol as SymbolView } from '@/components/app-symbol';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hoteliq, TAB_BAR_BODY_HEIGHT } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { requestAccountDeletion } from '@/lib/account-service';
import { SITE_INFO } from '@/lib/legal-content';
import { SITE_ORIGIN } from '@/lib/share-apartment';

const TAB_CLEARANCE = TAB_BAR_BODY_HEIGHT + 16;

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
      className="min-h-[52px] flex-row items-center gap-4 py-3.5"
      style={({ pressed }) => ({
        opacity: disabled ? 0.45 : pressed ? 0.6 : 1,
      })}>
      <SymbolView
        name={{
          ios: symbol.ios as 'heart',
          android: symbol.android as 'favorite',
          web: symbol.web as 'favorite',
        }}
        size={24}
        tintColor={destructive ? '#DC2626' : Hoteliq.ink}
        weight="regular"
      />
      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          className={`text-[16px] leading-[22px] ${
            destructive ? 'text-red-600' : 'text-hoteliq-ink'
          }`}
          numberOfLines={1}>
          {label}
        </Text>
        {hint ? (
          <Text
            className="text-[14px] leading-[18px] text-hoteliq-gray"
            numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Text className="text-[14px] leading-[18px] text-hoteliq-gray">
          {trailing}
        </Text>
      ) : (
        <SymbolView
          name={{
            ios: 'chevron.right',
            android: 'chevron_right',
            web: 'chevron_right',
          }}
          size={16}
          tintColor={Hoteliq.muted}
          weight="regular"
        />
      )}
    </Pressable>
  );
}

function RowDivider() {
  return <View className="h-px bg-hoteliq-line" />;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    userData,
    roleLabel,
    logout,
    loading: authLoading,
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

  if (authLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white"
        style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={Hoteliq.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: TAB_CLEARANCE + Math.max(insets.bottom, 16),
          }}
          showsVerticalScrollIndicator={false}>
          <Text className="text-[26px] font-semibold leading-[34px] tracking-tight text-hoteliq-ink">
            Profile
          </Text>
          <Text className="mt-2 text-[14px] leading-[18px] text-hoteliq-gray">
            Đăng nhập để lưu yêu thích, theo dõi lịch hẹn và nhận thông báo.
            Bạn vẫn xem tin và gửi tư vấn khi chưa có tài khoản.
          </Text>

          <Pressable
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
            className="mt-6 h-12 items-center justify-center rounded-full bg-hoteliq-ink"
            style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
            <Text className="text-[15px] font-semibold text-white">
              Đăng nhập
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(auth)/signup')}
            accessibilityRole="button"
            className="mt-3 h-12 items-center justify-center rounded-full border border-hoteliq-ink bg-white"
            style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
            <Text className="text-[15px] font-semibold text-hoteliq-ink">
              Tạo tài khoản
            </Text>
          </Pressable>

          <View className="mt-8">
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
            <RowDivider />
            <SettingsRow
              symbol={{
                ios: 'questionmark.circle',
                android: 'help_outline',
                web: 'help_outline',
              }}
              label="Câu hỏi thường gặp"
              hint="FAQ thuê nhà / hợp tác"
              onPress={() => router.push('/legal/faq')}
            />
            <RowDivider />
            <SettingsRow
              symbol={{
                ios: 'doc.text',
                android: 'description',
                web: 'description',
              }}
              label="Điều khoản dịch vụ"
              hint="Quy định sử dụng app & website"
              onPress={() => router.push('/legal/terms')}
            />
            <RowDivider />
            <SettingsRow
              symbol={{
                ios: 'lock.shield',
                android: 'privacy_tip',
                web: 'privacy_tip',
              }}
              label="Chính sách bảo mật"
              hint="Dữ liệu cá nhân & thông báo đẩy"
              onPress={() => router.push('/legal/privacy')}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: TAB_CLEARANCE + Math.max(insets.bottom, 16),
        }}
        showsVerticalScrollIndicator={false}>
        {/* Header: page title + home shortcut */}
        <View className="flex-row items-center justify-between">
          <Text className="text-[26px] font-semibold leading-[34px] tracking-tight text-hoteliq-ink">
            Profile
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Về trang chủ"
            className="h-11 w-11 items-center justify-center rounded-full border border-hoteliq-line bg-white"
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
            <SymbolView
              name={{ ios: 'house', android: 'home', web: 'home' }}
              size={18}
              tintColor={Hoteliq.ink}
              weight="medium"
            />
          </Pressable>
        </View>

        {/* Identity block */}
        <View className="mt-6 flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-hoteliq-ink">
            <Text className="text-[22px] font-semibold tracking-wide text-white">
              {initials}
            </Text>
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text
              className="text-[18px] font-semibold leading-6 text-hoteliq-ink"
              numberOfLines={1}>
              {displayName}
            </Text>
            <Text
              className="text-[14px] leading-[18px] text-hoteliq-gray"
              numberOfLines={1}>
              {user?.email || '—'}
            </Text>
            {roleLabel ? (
              <View className="mt-1.5 self-start rounded-full bg-hoteliq-chip px-3 py-1">
                <Text className="text-[12px] font-semibold text-hoteliq-ink">
                  {roleLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Role summary — flattened into a single hairline card */}
        <View className="mt-5 rounded-[12px] border border-hoteliq-line px-4 py-3.5">
          <Text className="text-[14px] leading-5 text-hoteliq-gray">
            {roleHint}
          </Text>
          {userData?.phoneNumber ? (
            <Text className="mt-1 text-[14px] leading-5 text-hoteliq-ink">
              SĐT: {userData.phoneNumber}
            </Text>
          ) : null}
        </View>

        {/* Group: account */}
        <View className="mt-8">
          <SettingsRow
            symbol={{
              ios: 'person.crop.circle',
              android: 'manage_accounts',
              web: 'manage_accounts',
            }}
            label="Hồ sơ"

            onPress={() => router.push('/profile/edit')}
          />
          <RowDivider />
          <SettingsRow
            symbol={{
              ios: 'gearshape',
              android: 'settings',
              web: 'settings',
            }}
            label="Cài đặt"
            onPress={() => router.push('/profile/settings')}
          />
        </View>

        {/* Group: become partner */}
        {!isAdmin && !isCollaborator && !isLandlord ? (
          <View className="mt-8">
            <SettingsRow
              symbol={{
                ios: 'person.2',
                android: 'group',
                web: 'group',
              }}
              label="Đăng ký Cộng tác viên"
              hint={
                userData?.requestStatus === 'pending'
                  ? 'Hồ sơ đang chờ duyệt'
                  : 'Gửi hồ sơ CTV'
              }
              onPress={() => router.push('/ctv-register')}
            />
            <RowDivider />
            <SettingsRow
              symbol={{
                ios: 'building.2',
                android: 'apartment',
                web: 'apartment',
              }}
              label="Đăng ký Chủ nhà"
              hint={
                userData?.landlordApprovalStatus === 'pending'
                  ? 'Yêu cầu đang xử lý'
                  : userData?.landlordApprovalStatus === 'rejected'
                    ? 'Bị từ chối — gửi lại'
                    : 'Trở thành đối tác cho thuê'
              }
              onPress={() => router.push('/partner-register')}
            />
          </View>
        ) : null}

        {isLandlord ? (
          <View className="mt-8">
            <SettingsRow
              symbol={{
                ios: 'building.2',
                android: 'apartment',
                web: 'apartment',
              }}
              label="Quản lý tòa nhà"
              hint="Đăng / sửa tin, đổi trạng thái, xin đẩy"
              onPress={() => router.push('/(tabs)/bookings')}
            />
          </View>
        ) : null}

        {isAdmin ? (
          <View className="mt-8">
            <SettingsRow
              symbol={{
                ios: 'chart.bar',
                android: 'dashboard',
                web: 'dashboard',
              }}
              label="Tổng quan"

              onPress={() => router.push('/admin')}
            />
            <RowDivider />
            <SettingsRow
              symbol={{
                ios: 'building.2',
                android: 'apartment',
                web: 'apartment',
              }}
              label="Quản lý căn hộ"

              onPress={() => router.push('/admin/apartments')}
            />
            <RowDivider />
            <SettingsRow
              symbol={{
                ios: 'checkmark.seal',
                android: 'fact_check',
                web: 'fact_check',
              }}
              label="Duyệt tin chủ nhà"

              onPress={() => router.push('/admin/submissions')}
            />
            <RowDivider />
            <SettingsRow
              symbol={{
                ios: 'person.3',
                android: 'manage_accounts',
                web: 'manage_accounts',
              }}
              label="Quản lý người dùng"

              onPress={() => router.push('/admin/users')}
            />
            <RowDivider />
            <SettingsRow
              symbol={{
                ios: 'building.2',
                android: 'business',
                web: 'business',
              }}
              label="Quản lý chủ nhà"

              onPress={() => router.push('/admin/partners')}
            />
          </View>
        ) : null}

        {/* Group: in-app shortcuts */}
        <View className="mt-8">
          <SettingsRow
            symbol={{
              ios: 'heart',
              android: 'favorite_border',
              web: 'favorite_border',
            }}
            label="Yêu thích"
            onPress={() => router.push('/(tabs)/favorites')}
          />
          {!isLandlord ? (
            <>
              <RowDivider />
              <SettingsRow
                symbol={{
                  ios: 'calendar',
                  android: 'calendar_month',
                  web: 'calendar_month',
                }}
                label="Quản lý lịch hẹn"

                onPress={() => router.push('/(tabs)/bookings')}
              />
            </>
          ) : null}
          <RowDivider />
          <SettingsRow
            symbol={{
              ios: 'bell',
              android: 'notifications_none',
              web: 'notifications_none',
            }}
            label="Thông báo"

            onPress={() => router.push('/(tabs)/notifications')}
          />
          <RowDivider />

        </View>

        {/* Group: site + legal */}
        <View className="mt-8">
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
          <RowDivider />
          <SettingsRow
            symbol={{
              ios: 'questionmark.circle',
              android: 'help_outline',
              web: 'help_outline',
            }}
            label="Câu hỏi thường gặp"
            hint="FAQ thuê nhà / hợp tác"
            onPress={() => router.push('/legal/faq')}
          />
          <RowDivider />
          <SettingsRow
            symbol={{
              ios: 'doc.text',
              android: 'description',
              web: 'description',
            }}
            label="Điều khoản dịch vụ"
            hint="Quy định sử dụng app & website"
            onPress={() => router.push('/legal/terms')}
          />
          <RowDivider />
          <SettingsRow
            symbol={{
              ios: 'lock.shield',
              android: 'privacy_tip',
              web: 'privacy_tip',
            }}
            label="Chính sách bảo mật"
            hint="Dữ liệu cá nhân & thông báo đẩy"
            onPress={() => router.push('/legal/privacy')}
          />
          <RowDivider />
          <SettingsRow
            symbol={{
              ios: 'trash',
              android: 'delete_outline',
              web: 'delete_outline',
            }}
            label="Xóa tài khoản"
            hint="Gửi yêu cầu tới Ban quản trị"
            destructive
            onPress={() => {
              Alert.alert(
                'Xóa tài khoản',
                `Yêu cầu sẽ được gửi tới admin. Bạn cũng có thể email ${SITE_INFO.email}. Tiếp tục?`,
                [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Gửi yêu cầu',
                    style: 'destructive',
                    onPress: () => {
                      void (async () => {
                        if (!user) return;
                        setBusy(true);
                        setError(null);
                        try {
                          await requestAccountDeletion({
                            uid: user.uid,
                            email: user.email,
                            displayName: userData?.displayName,
                          });
                          Alert.alert(
                            'Đã gửi yêu cầu',
                            'Ban quản trị sẽ xử lý xóa tài khoản. Bạn có thể đăng xuất ngay.',
                          );
                        } catch {
                          setError(
                            'Không gửi được yêu cầu xóa. Thử lại hoặc email hỗ trợ.',
                          );
                        } finally {
                          setBusy(false);
                        }
                      })();
                    },
                  },
                ],
              );
            }}
          />
        </View>

        {error ? (
          <Text className="mt-6 text-center text-[14px] leading-[18px] text-red-600">
            {error}
          </Text>
        ) : null}

        {/* Logout — Airbnb pattern: underlined ink text */}
        <View className="mt-8 border-t border-hoteliq-line pt-2">
          <Pressable
            onPress={() => void onLogout()}
            disabled={busy}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Đăng xuất"
            className="min-h-[52px] flex-row items-center"
            style={({ pressed }) => ({
              opacity: busy || pressed ? 0.6 : 1,
            })}>
            {busy ? (
              <ActivityIndicator color={Hoteliq.ink} />
            ) : (
              <Text className="text-[16px] font-semibold leading-[22px] text-hoteliq-ink underline">
                Đăng xuất
              </Text>
            )}
          </Pressable>
        </View>

        <Text className="mt-4 pb-2 text-[12px] leading-4 text-hoteliq-gray">
          Hanoi Residences · Đồng bộ tài khoản với bản Web
        </Text>
      </ScrollView>
    </View>
  );
}
