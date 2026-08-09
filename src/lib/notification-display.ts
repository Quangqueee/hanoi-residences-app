import type { Href } from 'expo-router';

import type { AppNotification, NotificationType } from '@/lib/notifications';
import type { UserRole } from '@/lib/rbac';

export function getNotificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case 'new_booking':
      return 'Lịch hẹn';
    case 'status_update':
      return 'Cập nhật trạng thái';
    case 'system':
      return 'Hệ thống';
    case 'landlord_request':
      return 'Yêu cầu chủ nhà';
    case 'landlord_approved':
      return 'Duyệt chủ nhà';
    case 'landlord_rejected':
      return 'Từ chối chủ nhà';
    case 'new_submission':
      return 'Tin đăng mới';
    case 'submission_reviewed':
      return 'Duyệt tin đăng';
    default:
      return 'Thông báo';
  }
}

/** Hint nghiệp vụ theo role — phân luồng nhận thông báo. */
export function getRoleNotificationHint(role: UserRole | null): string {
  switch (role) {
    case 'admin':
      return 'Bạn nhận thông báo khi có CTV/đối tác đăng ký mới hoặc căn hộ chờ duyệt.';
    case 'collaborator':
      return 'Bạn nhận thông báo khi Admin gán lịch dẫn khách hoặc cập nhật trạng thái lịch hẹn.';
    case 'landlord':
      return 'Bạn nhận thông báo khi lịch hẹn liên quan được xác nhận/hủy, hoặc tin đăng được duyệt.';
    case 'user':
      return 'Bạn nhận thông báo khi lịch xem phòng được xác nhận hoặc hủy.';
    default:
      return 'Thông báo realtime theo tài khoản của bạn.';
  }
}

export function formatNotificationTime(
  createdAt: AppNotification['createdAt'],
): string {
  if (!createdAt) return '';

  try {
    let date: Date | null = null;
    if (typeof createdAt.toDate === 'function') {
      date = createdAt.toDate();
    } else if (typeof createdAt.seconds === 'number') {
      date = new Date(createdAt.seconds * 1000);
    }
    if (!date || Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
}

/**
 * Map Web deep-links → Expo Router routes.
 * Unknown links fall back to bookings tab.
 */
export function mapNotificationLinkToHref(link?: string): Href {
  if (!link) return '/(tabs)/bookings';

  const apartmentMatch = link.match(/\/apartments\/([^/?#]+)/);
  if (apartmentMatch?.[1]) {
    return `/apartment/${apartmentMatch[1]}`;
  }

  if (link.includes('/bookings') || link.includes('/profile/bookings')) {
    return '/(tabs)/bookings';
  }

  if (link.includes('/submit') || link.includes('/apartments')) {
    return '/(tabs)/explore';
  }

  return '/(tabs)/notifications';
}
