import * as Clipboard from 'expo-clipboard';
import { Alert, Platform, Share } from 'react-native';

import type { Apartment } from '@/lib/types';
import {
  formatPrice,
  getApartmentDisplayTitle,
} from '@/lib/apartment-display';
import type { UserRole } from '@/lib/rbac';

export const SITE_ORIGIN = 'https://hanoiresidence.site';
/** Fallback admin path for notification deep-links (Web uses env secret path). */
export const ADMIN_BOOKINGS_LINK = '/admin/bookings';

type WebNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: Clipboard;
};

/** Deep link khớp URL public trên Web. */
export function getApartmentShareUrl(apartmentId: string): string {
  return `${SITE_ORIGIN}/apartments/${apartmentId}`;
}

export function buildApartmentShareMessage(
  apartment: Apartment,
  role: UserRole | null | undefined,
): string {
  const title = getApartmentDisplayTitle(apartment, role);
  const url = getApartmentShareUrl(apartment.id);
  const lines = [
    title,
    `${apartment.district} · ${formatPrice(apartment.price)}`,
    apartment.sourceCode ? `Mã căn: ${apartment.sourceCode}` : null,
    '',
    `Xem chi tiết: ${url}`,
  ].filter((line): line is string => line !== null);

  return lines.join('\n');
}

async function copyLinkFallback(url: string): Promise<boolean> {
  try {
    const ok = await Clipboard.setStringAsync(url);
    if (ok === false) {
      // Some environments return boolean; treat explicit false as failure.
      throw new Error('Clipboard.setStringAsync returned false');
    }
  } catch {
    // Fallback for browsers where expo-clipboard / permissions fail.
    const navClipboard =
      typeof navigator !== 'undefined'
        ? (navigator as WebNavigator).clipboard
        : undefined;

    if (navClipboard && typeof navClipboard.writeText === 'function') {
      await navClipboard.writeText(url);
    } else {
      throw new Error('Clipboard API unavailable');
    }
  }

  Alert.alert(
    'Đã sao chép liên kết',
    'Đã sao chép liên kết vào bộ nhớ tạm!',
  );
  return true;
}

async function shareOnWeb(
  title: string,
  text: string,
  url: string,
): Promise<boolean> {
  const webNavigator =
    typeof navigator !== 'undefined' ? (navigator as WebNavigator) : null;

  if (typeof webNavigator?.share === 'function') {
    try {
      await webNavigator.share({ title, text, url });
      return true;
    } catch (error) {
      // User dismissed the share sheet — not an app error.
      const name =
        typeof error === 'object' && error && 'name' in error
          ? String((error as { name?: string }).name)
          : '';
      if (name === 'AbortError') {
        return false;
      }
      // Unsupported / failed Web Share → fall through to clipboard.
      console.warn('navigator.share failed, falling back to clipboard:', error);
    }
  }

  return copyLinkFallback(url);
}

async function shareOnNative(message: string, url: string): Promise<boolean> {
  const result = await Share.share(
    Platform.OS === 'ios' ? { message, url } : { message },
    { dialogTitle: 'Chia sẻ căn hộ' },
  );

  // RN Web historically returns undefined — never read .action blindly.
  if (result && result.action === Share.sharedAction) {
    return true;
  }

  return false;
}

/**
 * Cross-platform share:
 * - Web: navigator.share → clipboard fallback (never RN Share.share)
 * - iOS/Android: React Native Share.share with safe result checks
 */
export async function shareApartment(
  apartment: Apartment,
  role: UserRole | null | undefined,
): Promise<boolean> {
  const url = getApartmentShareUrl(apartment.id);
  const title = getApartmentDisplayTitle(apartment, role);
  const message = buildApartmentShareMessage(apartment, role);

  try {
    if (Platform.OS === 'web') {
      return await shareOnWeb(title, message, url);
    }

    return await shareOnNative(message, url);
  } catch (error) {
    console.error('Share failed:', error);

    // Last-resort soft recovery: try copying the link instead of crashing.
    try {
      if (Platform.OS === 'web') {
        return await copyLinkFallback(url);
      }
    } catch {
      // ignore nested failure
    }

    Alert.alert('Không thể chia sẻ', 'Vui lòng thử lại sau.');
    return false;
  }
}
