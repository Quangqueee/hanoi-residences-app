# Privileged ops — vẫn Hướng 1

Hướng 1 = cùng Firebase. Việc cần secret hoặc quyền vượt client thì dùng **Cloud Functions callable**, không dùng REST tự viết.

## Phải ra Cloud Function

| Việc | Website hiện tại | App |
|---|---|---|
| Sinh `aiContent` (Groq) | `generateSummaryAction` + `src/ai/flows/generate-listing-summary.ts` | `httpsCallable("generateListingSummary")` |
| Migrate AI hàng loạt | `migrateAiApartmentsBatchAction` | Callable admin-only hoặc giữ trên web |
| `notifyAdmins` nếu rules cấm list `users` | Query `role==admin` từ client | Function Admin SDK gửi thông báo |
| Mask field nhạy cảm thật sự | Rules hiện `apartments` **public read cả document** | Lâu dài: function hoặc split field; ngắn hạn: ẩn UI theo role |

Giữ `GROQ_API_KEY*` chỉ trên Functions / Next server env.

### Hợp đồng callable `generateListingSummary`

Input giống `generateSummaryAction`: `title`, `roomType`, `district`, `address?`, `price`, `area?`, `detailedInformation?`.

Output: `{ seoTitle, seoDescription, description, highlights[] }` → ghi vào `apartments.aiContent`.

Chỉ `admin` (và nếu product cho phép: `landlord` khi nộp tin). Verify `context.auth` + `users/{uid}.role`.

## Được làm bằng SDK nếu copy đúng website

Những việc này website đã ghi từ **client hoặc Server Action dùng client SDK**:

- CRUD căn hộ, favorites, profile, bookings, notifications một recipient
- Duyệt CTV / landlord (admin UI gọi `updateDoc` trực tiếp trên `/users`)
- Đẩy tin, xin đẩy tin, đổi status chủ nhà

App được làm tương đương **chỉ khi** kèm kiểm tra role trên client **và** (bắt buộc trước khi store) siết `firestore.rules`.

Không tin UI. Rules phải:

```
apartments write: admin, hoặc landlord trên tin landlordId==uid (không tự published)
users write: chỉ doc của mình, trừ một số field; role/admin chỉ Admin SDK hoặc rule `request.resource.data.role == resource.data.role`
notifications: create hệ thống có kiểm soát; user chỉ update isRead trên tin của mình
bookings: create theo role; admin update status
```

File `firestore.rules` hiện **thiếu** `notifications`, `user_bookings`, `ctv_bookings`, `guest_consultations`. App mới sẽ fail hoặc (nếu rules production khác file) lệch so với repo. Đối chiếu rules **đã deploy** trước khi code app.

## Field ẩn theo role (bắt buộc trên UI app)

Dù rules đang public read:

| Field | Ai được thấy |
|---|---|
| `address`, `landlordPhoneNumber` | admin (`view_full_address`) |
| `commission` | collaborator + admin |
| `sourceCode` có `-` | collaborator + admin; user thấy `888` (`src/lib/source-code.ts`) |
| `sourceCode` không `-` | công khai |

## Việc web-only không giả lập trên app

- `revalidatePath` / `revalidateApartmentListings`
- `ADMIN_PATH` che URL admin
- Proxy `/api/download-image`

## Quota xóa căn hộ

`src/lib/apartment-delete-quota.ts`: transaction trên `users/{uid}.apartmentDeleteTimestamps`, tối đa 10 / 3600000ms. Port nguyên hàm sang shared module; admin cũng bị quota nếu website đang áp.
