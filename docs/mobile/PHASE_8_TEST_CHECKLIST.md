# Phase 8 — Checklist test 4 role (thiết bị thật)

Chạy trên **thiết bị thật** (push cần device). Đăng nhập lần lượt 4 role trên project `quang-apartment`.

## Guest (chưa login)

- [ ] Feed chỉ tin `published`
- [ ] Search / lọc / sort
- [ ] Chi tiết căn — không lộ địa chỉ / SĐT / HH / mã `-`
- [ ] Đặt lịch → `guest_consultations`
- [ ] FAQ / Điều khoản / Bảo mật mở được từ Profile (sau khi vào app)

## User

- [ ] Signup / login / quên mật khẩu
- [ ] Favorite sync với web
- [ ] Đặt lịch → `user_bookings` + chuông
- [ ] Profile edit / settings / đổi mật khẩu
- [ ] Đăng ký CTV / Chủ nhà
- [ ] Yêu cầu xóa tài khoản gửi được
- [ ] Thông báo local khi có doc mới (app foreground)

## CTV (`collaborator`)

- [ ] Thấy HH + mã nguồn có `-`
- [ ] Đặt lịch dẫn khách → `ctv_bookings`
- [ ] Tab Bookings lọc được lịch của mình

## Chủ nhà (`landlord`)

- [ ] Tin của tôi / đăng tin (upload ảnh Storage)
- [ ] Sửa tin, đổi available/rented, xin đẩy
- [ ] Không tự `published`

## Admin

- [ ] Dashboard counts
- [ ] CRUD căn / đẩy / xóa (quota)
- [ ] Duyệt submission
- [ ] Users CTV + Partners + thống kê A9
- [ ] Bookings CRM 3 collection
- [ ] AI callable (sau khi deploy Function + `GROQ_API_KEY`)

## Deploy còn lại (ops)

```bash
firebase use quang-apartment
firebase deploy --only storage
firebase deploy --only firestore:rules,firestore:indexes
# AI (nếu chưa):
firebase deploy --only functions:generateListingSummary
```

## Ghi chú FCM / Expo Push

- App đã lưu `users/{uid}.expoPushToken` khi user cho phép thông báo.
- Website hiện chỉ thông báo in-app Firestore; server push từ token là bước sau (Cloud Function gửi Expo Push API).
- Trong app: Firestore `onSnapshot` → local notification + deep link khi tap.
