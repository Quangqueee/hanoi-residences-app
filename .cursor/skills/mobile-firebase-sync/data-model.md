# Data model — dùng chung web và app

Project: `quang-apartment`. Client config: `src/firebase/config.ts`.

Kiểu TypeScript nguồn: `src/lib/types.ts`, `src/lib/rbac.ts`, `src/lib/notifications.ts`.

## Collections

### `apartments/{apartmentId}`

| Field | Ghi chú |
|---|---|
| `title`, `sourceCode`, `roomType`, `area`, `district`, `price` | Bắt buộc với tin admin |
| `details`, `address`, `landlordPhoneNumber`, `commission` | `address`/`landlordPhoneNumber` coi là nội bộ |
| `imageUrls: string[]` | URL Storage |
| `searchKeywords: string[]` | `generateSearchKeywords(title + address + sourceCode)` |
| `status` | `available` \| `rented` |
| `tags` | `pet_friendly`, `lake_view` |
| `submissionStatus` | `pending` \| `published` \| `rejected` |
| `landlordId`, `adminNotes`, `contactPhone`, `design`, `serviceFees` | Workflow chủ nhà |
| `aiContent` | `{ seoTitle, seoDescription, description, highlights[], updatedAt }` |
| `pushRequestedAt` | Xin đẩy; xóa field khi admin xử lý |
| `createdAt`, `updatedAt` | Firestore Timestamp |

**Query công khai:** `where("submissionStatus","==","published")` + optional `district in`, `roomType in`, `price >=/<=`, `orderBy` createdAt hoặc price.

**Query admin pending:** `where("submissionStatus","==","pending")`, `orderBy("createdAt","desc")`.

**Query chủ nhà:** `where("landlordId","==",uid)`.

### `users/{uid}`

Doc ID = Auth UID.

| Field | Ghi chú |
|---|---|
| `email`, `displayName`, `phoneNumber`, `address` | Hồ sơ |
| `role` | `user` \| `collaborator` \| `landlord` \| `admin` |
| `dob`, `gender`, `interests`, `photoURL` | Settings |
| `requestStatus`, `ctvIntroduction`, `requestSubmittedAt` | Đăng ký CTV |
| `landlordApprovalStatus`, `landlordRequestData`, `landlordRequestSubmittedAt`, `landlordRejectionReason` | Đăng ký chủ nhà |
| `apartmentDeleteTimestamps` | Quota xóa 10/giờ |
| `createdAt`, `lastActiveAt` | |

`users/{uid}/favorites/{apartmentId}`: `{ addedAt }`. ID favorite = ID căn hộ.

Rules hiện tại: user chỉ `get`/`update` **document của mình** — app **không** `getDocs(users)` trừ khi siết/nới rules có chủ đích (admin hiện query cả collection trên web).

### `notifications/{id}`

`recipientId`, `title`, `message`, `type`, `isRead`, `link`, `createdAt`.

`type`: `new_booking` \| `status_update` \| `system` \| `landlord_request` \| `landlord_approved` \| `landlord_rejected` \| `new_submission` \| `submission_reviewed`.

Query: `where("recipientId","==",uid)`, `orderBy("createdAt","desc")`, `limit(20)`.

`link` trên web là path Next (`/admin/...`). App map sang screen name; đừng hardcode `ADMIN_PATH`.

### `user_bookings/{id}`

Khách đã login (hoặc admin tạo hộ).

Thường có: `userId`, `name`, `phone`, `apartmentId`, `apartmentCode`, `apartmentLink`, `budget`, `dateTime`, `notes`, `status`, `consultationPrice`, `isExternal`, `createdByAdminId`, `createdAt`, `updatedAt`.

`status`: `pending` → `approved` / từ chối (theo UI admin bookings). Admin tạo tay: `approved`. User tự đặt: `pending`.

### `ctv_bookings/{id}`

`ctvId`, `ctvName`, `ctvPhone`, `clientName`, `clientPhone`, `address` (thường = title căn), `consultationPrice`, `budget`, `dateTime`, cộng field chung apartment/status.

### `guest_consultations/{id}`

Khách chưa login. `name`, `phone`, `budget`, `dateTime`, apartment fields, `status: pending`.

## Storage

Bucket trong config. Path: `apartments/{uuid}` hoặc `apartments/{timestamp}-{id}.jpg`.

Public read. File `storage.rules` hiện `allow write: if true` — không copy thói quen này khi siết production.

## Auth

Providers website: email/password, Google popup, anonymous (có trong code). App: email + Google native; anonymous chỉ nếu cần khách vãng lai gắn UID.

Signup phải `setDoc(users/{uid})` với `role: "user"`. Google lần đầu: tạo user doc nếu chưa có (website `loginWithGoogle` chưa luôn tạo doc — app nên `setDoc merge` cho đủ parity hồ sơ).

## Indexes cần sẵn sàng

Ít nhất (tạo khi SDK báo thiếu):

- `apartments`: `submissionStatus` + `createdAt`
- `apartments`: `submissionStatus` + `district` + `createdAt`
- `apartments`: `submissionStatus` + `price` + sort field
- `apartments`: `landlordId` + `createdAt`
- `apartments`: `submissionStatus` + `landlordId`
- `notifications`: `recipientId` + `createdAt`
- `user_bookings`: `userId` + `createdAt`
- `ctv_bookings`: `ctvId` + `createdAt`
- `users`: `role` == admin (cho `notifyAdmins`)
- `users`: `requestStatus`, `landlordApprovalStatus`

## Hằng số dùng chung

Từ `src/lib/constants.ts`: `HANOI_DISTRICTS`, `PRICE_RANGES`, `ROOM_TYPES`, `SORT_OPTIONS`, `MAX_APARTMENT_IMAGES` (15), `APARTMENT_DELETE_LIMIT_PER_HOUR` (10).

Không đưa `ADMIN_PATH`, `GTM_ID`, `GA_MEASUREMENT_ID` vào app.
