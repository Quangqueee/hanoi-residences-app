---
name: mobile-firebase-sync
description: >-
  Guides building a Hanoi Residences mobile app that clones every current website
  feature via Approach 1: the same Firebase project (Auth, Firestore, Storage)
  and the Firebase SDK — not a REST clone of Next.js Server Actions. Use when
  working on Expo, React Native, Flutter, app mobile, đồng bộ web-mobile,
  hướng 1, listings, bookings, landlord, admin, favorites, or notifications.
---

# Mobile Firebase Sync (Hướng 1)

Website **Hanoi Residences** đã lấy Firestore làm nguồn sự thật. App mobile là **client thứ hai** của cùng project Firebase `quang-apartment`. Không clone database. Không bọc Server Actions thành REST.

Đọc ngay (theo thứ tự):

1. [docs/mobile/GRAPH_REPORT.md](../../../docs/mobile/GRAPH_REPORT.md) — bản đồ kiến trúc
2. [docs/mobile/NOTES.md](../../../docs/mobile/NOTES.md) — cấm / bẫy / rules
3. [feature-parity.md](feature-parity.md) — checklist từng chức năng website
4. [data-model.md](data-model.md) — collection, field, query
5. [privileged-ops.md](privileged-ops.md) — AI, quyền admin, field ẩn
6. [docs/mobile/IMPLEMENTATION_PLAN.md](../../../docs/mobile/IMPLEMENTATION_PLAN.md) — thứ tự làm

## Nguyên tắc bắt buộc

- Một project Firebase, hai client (Next.js + Expo). Cùng Auth UID, cùng document ID.
- Ghi đúng field/collection mà website đang ghi. Không invent schema.
- Tái sử dụng `src/lib/types.ts`, `rbac.ts`, `constants.ts`, `price-range.ts`, `source-code.ts`, hàm search trong `utils.ts`.
- Server Actions (`src/app/actions.ts`, `src/app/landlord-actions.ts`) **không gọi được từ app**. Port logic sang SDK hoặc Cloud Functions.
- Groq / AI key **không** nhét vào app. Xem [privileged-ops.md](privileged-ops.md).
- Mọi đọc/ghi Firebase bọc `try/catch`. Báo lỗi cho user, không nuốt im.

## Stack mặc định

Expo (React Native) + Firebase JS SDK `^11` (cùng major với website). Dùng native Google Sign-In, không dùng `signInWithPopup`.

Khởi tạo bằng config trong `src/firebase/config.ts` (client key công khai). Không copy service account vào app.

## Map nhanh: website → app

| Website | App |
|---|---|
| `src/lib/data.ts` + `data-client.ts` | Cùng query Firestore, lọc `submissionStatus == "published"` cho feed công khai |
| `src/lib/auth-service.ts` | Firebase Auth: email, Google native, reset/change password |
| `src/lib/notifications.ts` + `use-notifications.ts` | `onSnapshot` collection `notifications` |
| `booking-widget.tsx` | Ghi `user_bookings` / `ctv_bookings` / `guest_consultations` |
| Admin pages dưới `[adminPath]` | Stack Admin trong app, chặn bằng `users/{uid}.role == "admin"` |
| `generateSummaryAction` | Cloud Function callable, không gọi Groq từ client |
| `revalidateApartmentListings` | Bỏ — app không dùng Next cache |
| SEO, sitemap, landing quận, GTM | Không port. App lọc theo `district` |

## Vai trò (phải đủ 4)

`user` | `collaborator` | `landlord` | `admin` — logic trong `src/lib/rbac.ts` và `src/lib/source-code.ts`.

- User thường: xem tin published, yêu thích, đặt lịch, hồ sơ.
- CTV: thêm hoa hồng, mã nguồn có dấu `-`, form đặt lịch khách của CTV.
- Chủ nhà: đăng tin `pending`, sửa tin của mình, đổi `available`/`rented`, xin đẩy tin.
- Admin: CRUD căn hộ, đẩy tin, duyệt tin/đối tác/CTV, quản lý 3 collection lịch, thống kê.

## Khi implement một màn

1. Tra [feature-parity.md](feature-parity.md) — cột “Cách làm trên app”.
2. Tra [data-model.md](data-model.md) — path + field bắt buộc.
3. Copy điều kiện `where`/`orderBy` từ website; thêm composite index nếu Firestore báo thiếu.
4. Field nhạy cảm (`address`, `landlordPhoneNumber`, `commission`, mã nguồn có `-`): ẩn theo `rbac` + `source-code.ts`, dù rules hiện đang public read.
5. Sau khi ghi tin: luôn cập nhật `searchKeywords` bằng `generateSearchKeywords`.
6. Không xóa tính năng website để “cho dễ làm app”.

## Việc cấm

- REST API bọc toàn bộ website.
- Database/Storage riêng cho mobile.
- Gọi `/[adminPath]/...` hay Server Actions từ app.
- Đưa `GROQ_API_KEY` vào Expo env.
- Bỏ filter `submissionStatus == "published"` trên feed công khai.
- Ghi `role: "admin"` từ client (kể cả khi rules hiện lỏng).

## Xong một epic

Đánh dấu dòng tương ứng trong [feature-parity.md](feature-parity.md) và phase trong `IMPLEMENTATION_PLAN.md`. Chạy `graphify update .` sau khi sửa code.
