# Kế hoạch triển khai — Hướng 1

Làm tuần tự. Đánh dấu `[x]` khi xong. Chi tiết từng chức năng: `.cursor/skills/mobile-firebase-sync/feature-parity.md`.

## Phase 0 — Nền (không UI)

- [ ] So rules **đang deploy** trên Console vs draft trong Expo *(draft có; chưa xác nhận/deploy)*
- [x] Draft rules cho `notifications`, `user_bookings`, `ctv_bookings`, `guest_consultations` *(chờ deploy)*
- [x] Draft cấm client đổi `role` tùy ý; cấm landlord tự `published` *(chờ deploy)*
- [ ] Tạo Android (và iOS) app trong Firebase project `quang-apartment`
- [x] Composite indexes file *(gồm `searchKeywords`; chờ deploy)*
- [x] Copy shared: `types`, `rbac`, `constants`, `price-range`, `source-code`, **`search-keywords`**

## Phase 1 — App skeleton + Auth

- [x] Expo app + Firebase config `quang-apartment`
- [x] Email login / signup / logout / gửi mail quên mật khẩu
- [ ] Màn confirm reset bằng `oobCode` *(optional — mail đang trỏ web)*
- [x] Google Sign-In **Web** + `ensureUserDocument` merge
- [ ] Google Sign-In **native** (cần iOS/Android apps + OAuth)
- [x] Auth gate + listener `users/{uid}.role`
- [ ] G7 `notifyAdmins` chắc chắn sau khi deploy rules cho phép admin list users

**Parity:** G6 gần xong · G7 phụ thuộc deploy rules.

## Phase 2 — Khách xem tin

- [x] Feed `published`, sort newest, phân trang *(đã có)*
- [x] Lọc quận / loại phòng / khoảng giá / sort giá *(đã có)*
- [x] Ô tìm text dùng `planApartmentTextSearch` / `matchesAllSearchTokens` / `searchKeywords`
- [x] Chi tiết: mask mã nguồn / địa chỉ / SĐT / hoa hồng *(rà lại)*
- [ ] Deep link `hanoiresidences://apartments/{id}` (tùy chọn)

**Parity:** G1–G4. Không làm 12 màn SEO quận.

## Phase 3 — User: tim, hồ sơ, chuông

- [x] Toggle favorite (`users/{uid}.favorites` array — đồng bộ với Web apartment-card hiện tại)
- [x] Profile tab + **Sửa hồ sơ** (`/profile/edit`) + **Cài đặt** (`/profile/settings`) + đổi mật khẩu
- [x] `onSnapshot` notifications (`recipientId`), mark as read / đọc tất cả

**Parity:** U1–U4, U7.

## Phase 4 — Đặt lịch (3 collection)

- [x] Guest → `guest_consultations`
- [x] User → `user_bookings` + notify
- [x] CTV → `ctv_bookings` + notify
- [x] Admin đặt hộ từ chi tiết tin (như `booking-widget`)
- [x] Màn “lịch của tôi” (user + CTV)
- [x] Admin: list/filter/sửa status 3 collection + tạo tay (từ chi tiết căn)

**Parity:** G5, U5–U6, C3–C4, A6.

## Phase 5 — CTV + chủ nhà đăng ký

- [x] Form CTV → `requestStatus: pending` + notify
- [x] Form chủ nhà → `landlordApprovalStatus` + `landlordRequestData`
- [x] Admin users: duyệt/từ chối CTV, đổi role `user`/`collaborator`
- [x] Admin partners: duyệt/từ chối landlord, ngưng hợp tác (xóa tin `landlordId`)

**Parity:** U8–U9, C1–C2, A5, A8.

> Ghi chú A5: xóa user = xóa doc `users/{uid}` (không xóa Auth), khớp Web. C1–C2 đã có sẵn trên card/detail.

## Phase 6 — Chủ nhà vận hành tin

- [x] Upload ảnh Storage, max 15
- [x] Tạo tin `pending` + `searchKeywords`
- [x] Sửa tin của mình; đổi `available`/`rented`
- [x] Danh sách tin `landlordId`
- [x] Xin đẩy `pushRequestedAt` (+ bump `createdAt` như Web)

**Parity:** L1–L5.

## Phase 7 — Admin căn hộ + AI

- [x] CRUD tin, `published` khi admin tạo
- [x] Đẩy 1 tin / batch (bump timestamps)
- [x] Quota xóa 10/giờ
- [x] Cloud Function `generateListingSummary` (Groq ở server) — `functions/` cần deploy + secret `GROQ_API_KEY`
- [x] Ghi `aiContent`; form admin gọi callable
- [x] Duyệt submission + ghi `sourceCode`/`address`/`adminNotes`
- [x] Dashboard counts (A1)
- [x] Thống kê theo landlord (A9)
- [x] Backfill `submissionStatus` (A10)

**Parity:** A1–A4, A7, A9–A10.

> Migrate AI hàng loạt (batch) vẫn web-only theo privileged-ops.

## Phase 8 — Trang tĩnh + polish

- [x] FAQ / điều khoản / bảo mật (nội dung tĩnh trong app)
- [x] FCM / Expo Push: đăng ký token + local mirror Firestore; deep link khi tap *(server push Expo API = bước sau)*
- [x] Siết Storage write = authenticated (+ giới hạn ảnh / deny path khác) — **cần deploy** `storage.rules`
- [x] Checklist test 4 role: `docs/mobile/PHASE_8_TEST_CHECKLIST.md` *(chạy trên thiết bị thật)*

**Parity:** G8.

## Định nghĩa xong

Mọi dòng `SDK`/`CF`/`UI` trong `feature-parity.md` là `[x]`, trừ nhóm WEB thuần (SEO/sitemap). Web và app sửa cùng document thì phía kia thấy không cần deploy lại đối phương (trừ Function AI + rules/indexes/storage).
