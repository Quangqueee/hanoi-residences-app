# Feature parity — website → app

Mọi dòng `SDK` = Firebase client SDK. `CF` = Cloud Function callable (vẫn Hướng 1). `UI` = chỉ UI app, cùng data. `WEB` = không cần trên app.

Trạng thái: `[ ]` chưa làm · `[x]` đã parity.

## Khách (chưa đăng nhập)

| # | Website | Cách làm trên app | Loại |
|---|---------|-------------------|------|
| G1 | Trang chủ danh sách tin | Query `apartments` `submissionStatus==published`, sort `createdAt desc`, phân trang `limit`/`startAfter` | SDK `[~]` |
| G2 | Tìm kiếm `/tim-kiem` (quận, giá, loại phòng, sort, text) | Cùng `where` + `planApartmentTextSearch` / `matchesAllSearchTokens` / `isPriceInRange` | SDK `[~]` |
| G3 | Landing 12 quận (`/tay-ho`, …) | Một màn lọc `district`; không clone 12 route SEO | UI |
| G4 | Chi tiết `/apartments/[id]` | `getDoc(apartments/{id})`; gallery `imageUrls`; ẩn địa chỉ/SĐT/mã `-` | SDK `[~]` |
| G5 | Đặt lịch khách vãng lai | `addDoc(guest_consultations)` + `notifyAdmins` type `new_booking` | SDK `[x]` |
| G6 | Login / signup / quên mật khẩu / reset oobCode | Email+password, `sendPasswordResetEmail`, `confirmPasswordReset` | SDK `[~]` |
| G7 | Signup tạo `users/{uid}` + báo admin | `setDoc` role `user` + `notifyAdmins` type `system` | SDK `[~]` |
| G8 | About, FAQ, điều khoản, bảo mật, hướng dẫn | Màn tĩnh hoặc WebView cùng URL website | WEB/UI `[x]` |

## User đã login

| # | Website | Cách làm trên app | Loại |
|---|---------|-------------------|------|
| U1 | Yêu thích | `users/{uid}.favorites` arrayUnion/arrayRemove (đồng bộ Web card) | SDK `[x]` |
| U2 | Hồ sơ `/profile` | Đọc `users/{uid}` | SDK `[x]` |
| U3 | Sửa hồ sơ `/profile/edit` | `displayName`, `phoneNumber`, `address`, `preferredDistrict` | SDK `[x]` |
| U4 | Cài đặt `/profile/settings` | Thêm `dob`, `gender`, `interests`; đổi mật khẩu (reauth) | SDK `[x]` |
| U5 | Lịch của tôi `/profile/bookings` | Query `user_bookings` theo `userId` | SDK `[x]` |
| U6 | Đặt lịch user | `addDoc(user_bookings)` status `pending` + notify admin + notify self | SDK `[x]` |
| U7 | Chuông thông báo | `onSnapshot` `notifications` `recipientId==uid` limit 20; `isRead` | SDK `[x]` |
| U8 | Đăng ký CTV `/ctv-register` | Merge `requestStatus: pending`, `ctvIntroduction`, … + notify admin | SDK `[x]` |
| U9 | Đăng ký chủ nhà `/partner-register` | `landlordApprovalStatus: pending` + `landlordRequestData` + notify `landlord_request` | SDK `[x]` |

## Cộng tác viên

| # | Website | Cách làm trên app | Loại |
|---|---------|-------------------|------|
| C1 | Xem hoa hồng | `hasPermission(role, "view_commission")` | UI `[x]` |
| C2 | Xem mã nguồn có `-` | `getDisplaySourceCode` — user thường thấy `888` | UI `[x]` |
| C3 | Đặt lịch dẫn khách | `ctv_bookings` với `ctvId`, `clientName`, `clientPhone`, `consultationPrice` | SDK `[x]` |
| C4 | Lịch CTV | Query `ctv_bookings` theo `ctvId` | SDK `[x]` |

## Chủ nhà

| # | Website | Cách làm trên app | Loại |
|---|---------|-------------------|------|
| L1 | Đăng tin `/submit-apartment` | Upload Storage `apartments/{ts}-{id}.jpg` (tối đa 15); `submissionStatus: pending`; `landlordId` | SDK `[x]` |
| L2 | Tin của tôi `/profile/apartments` | `where("landlordId","==",uid)` | SDK `[x]` |
| L3 | Sửa tin của mình | Chỉ khi `landlordId==uid`; không tự `published` | SDK `[x]` |
| L4 | Đổi `available` / `rented` | `updateLandlordApartmentStatusAction` tương đương + notify admin | SDK `[x]` |
| L5 | Xin đẩy tin | Set `pushRequestedAt` | SDK `[x]` |

## Admin

| # | Website | Cách làm trên app | Loại |
|---|---------|-------------------|------|
| A1 | Tổng quan | `getCountFromServer`: apartments, users, bookings pending (3 collection), CTV `requestStatus==pending` | SDK `[x]` |
| A2 | Danh sách / thêm / sửa / xóa căn hộ | CRUD `apartments`; xóa kèm Storage + quota `apartmentDeleteTimestamps` | SDK `[x]` |
| A3 | Đẩy tin (1 và batch) | Set `createdAt`+`updatedAt` = now (batch lệch millis để giữ thứ tự) | SDK `[x]` |
| A4 | Tạo mô tả AI / migrate AI | Callable `generateListingSummary`; ghi `aiContent` | CF `[x]` |
| A5 | Users: đổi role user/CTV, duyệt CTV, xóa user | `users/{uid}`; xóa `requestStatus` khi duyệt | SDK `[x]` |
| A6 | Lịch: 3 collection, duyệt/sửa/thêm tay | `user_bookings`, `ctv_bookings`, `guest_consultations` | SDK `[x]` |
| A7 | Duyệt tin pending | `submissionStatus` published/rejected + `sourceCode`/`address`/`adminNotes` + notify landlord | SDK `[x]` |
| A8 | Đối tác: duyệt/từ chối/ngưng hợp tác | `role` landlord; terminate xóa hết tin `landlordId` | SDK `[x]` |
| A9 | Thống kê tin theo landlord | Count pending/published theo `landlordId` | SDK `[x]` |
| A10 | Backfill `submissionStatus` | Admin-only batch; không để user thường chạy | SDK `[x]` |

## Không port (website-only)

| Website | Lý do |
|---|---|
| `sitemap.ts`, JSON-LD, landing quận, GTM/GA | SEO / analytics web |
| `middleware.ts` redirect `/` → `/tim-kiem` | Routing Next |
| `unstable_cache` / `revalidateApartmentListings` | Cache Next; app đọc Firestore trực tiếp |
| `/api/download-image` | Proxy CORS; app lưu URL Storage |
| `ADMIN_PATH` bí mật | App chặn bằng `role`, không bằng URL |
| Genkit dev, migrate keyword một lần | Công cụ nội bộ web |

## Hợp đồng hành vi phải giữ

- Giá lưu **triệu VND** (`price: 12` = 12 triệu).
- Tin công khai chỉ `submissionStatus == "published"`.
- Tin admin tạo mới: `published`. Tin chủ nhà tạo mới: `pending`.
- Đẩy tin = bump `createdAt` và `updatedAt` (sort newest dựa vào đó).
- Ảnh: Storage path `apartments/...`, public read, tối đa 15.
- Thông báo lỗi không chặn luồng chính (website nuốt lỗi notify).
