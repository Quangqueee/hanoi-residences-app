# Phase 0–1 status (honest)

Cập nhật sau khi sửa đánh dấu sớm + copy search helpers.

## Phase 0–1 — còn sót

| Hạng mục | Trạng thái |
|---|---|
| Draft rules / indexes / Storage auth | Có trong repo Expo, **chưa deploy** |
| Android/iOS app trong `quang-apartment` | **Chưa** |
| Google Sign-In native | **Chưa** (chỉ Web popup) |
| Màn reset-password (`oobCode`) | Có hàm, **chưa có màn** — mail reset trỏ web chấp nhận được |
| `generateSearchKeywords` / `planApartmentTextSearch` | **Đã copy** → `src/lib/search-keywords.ts` + wire vào `fetchApartmentsPage` |
| `notifyAdmins` khi signup | Vẫn phụ thuộc rules cho phép **list** `users` `role==admin`. Deploy draft xong mới chắc G7 |

## Đã ổn trong Expo

- Firebase config `quang-apartment`, Auth email, forgot-password send mail
- `AuthProvider` + `onSnapshot(users/{uid})`, auth gate
- Shared: `types`, `rbac`, `constants`, `price-range`, `source-code`, search helpers

## Phase còn lại (2–8)

| Phase | Việc | Thực tế khung Expo |
|---|---|---|
| 2 Feed / search / chi tiết | G1–G4 | Tab + published + lọc; text search đã dùng `searchKeywords`; mask mã/địa chỉ/SĐT/HH đã rà lại trên detail/card/share |
| 3 Tim, hồ sơ, chuông | U1–U4, U7 | **Đã có** favorites / notifications / profile + edit + settings + đổi mật khẩu |
| 4 Đặt lịch 3 collection | G5, U5–U6, C3–C4, A6 | Done — create 4 nhánh + my list + admin CRM (filter/status/notes) |
| 5 CTV + chủ nhà | U8–U9, C1–C2, A5, A8 | Done — register forms + admin users/partners |
| 6 Chủ nhà đăng/sửa tin | L1–L5 | Done — list/form/upload/status/push |
| 7 Admin CRUD + AI Function | A1–A4, A7, A9–A10 | Done — dashboard/CRUD/push/delete/quota/submissions/AI callable (cần deploy functions) |
| 8 FAQ / FCM / test 4 role | G8 | Done — legal screens + Storage siết + push deep-link; checklist test tại `PHASE_8_TEST_CHECKLIST.md` |

## Deploy (bạn làm trên Console / CLI)

```bash
firebase use quang-apartment
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Sau deploy: test signup → admin nhận notify; test search text với index mới (`searchKeywords` composites).
