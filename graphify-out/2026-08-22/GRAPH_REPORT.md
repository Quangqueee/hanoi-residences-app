# Graph Report - hanoi-residences-app  (2026-08-22)

## Corpus Check
- 130 files · ~112,336 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 905 nodes · 1839 edges · 84 communities (48 shown, 36 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62bc012d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- theme.ts
- profile.tsx
- [id].tsx
- expo
- expo-device
- partner-service.ts
- expo-media-library
- package.json
- bookings-service.ts
- include
- dependencies
- reset-project.js
- animated-icon.tsx
- animated-icon.web.tsx
- download-images.native.ts
- metro.config.js
- navigation/types.ts
- legal-content.ts
- Welcome to your Expo app 👋
- expo-linear-gradient
- functions/package.json
- expo-glass-effect
- expo-image
- expo-font
- expo-linking
- compilerOptions
- @react-native-async-storage/async-storage
- admin-apartments-service.ts
- @expo/ui
- expo-web-browser
- Phase 8 — Checklist test 4 role (thiết bị thật)
- nativewind
- react
- react-dom
- react-native
- Collections
- @expo-google-fonts/inter
- react-native-markdown-display
- react-native-reanimated
- Kế hoạch triển khai — Hướng 1
- react-native-screens
- react-native-worklets
- auth-context.tsx
- index.ts
- @react-navigation/native-stack
- AGENTS.md
- expo-notifications
- expo-router
- lib/types.ts
- react-native-web
- GRAPH_REPORT — Web ↔ Mobile (Hướng 1)
- Lưu ý bắt buộc — app Hướng 1
- Feature parity — website → app
- Privileged ops — vẫn Hướng 1
- Mobile Firebase Sync (Hướng 1)
- Phase 0–1 status (honest)
- price-range.ts
- Bàn giao sang agent Expo
- App mobile — Hướng 1 (cùng Firebase)
- settings.tsx
- Cloud Functions
- useAuth
- (tabs)/index.tsx
- expo-file-system
- expo-image-picker
- expo-status-bar
- react-native-gesture-handler
- @react-navigation/bottom-tabs
- expo-constants
- expo-splash-screen
- expo-system-ui
- app.native.ts
- firebase
- @react-navigation/native
- expo-clipboard
- notifications.tsx
- use-push-notifications.ts
- ctv-register.tsx

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 62 edges
2. `expo-router` - 37 edges
3. `Hoteliq` - 30 edges
4. `Apartment` - 19 edges
5. `ApartmentDetailScreen()` - 15 edges
6. `db` - 14 edges
7. `notifyAdmins()` - 14 edges
8. `expo` - 13 edges
9. `AdminApartmentsScreen()` - 13 edges
10. `createNotification()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `BookingsScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/bookings.tsx → src/contexts/auth-context.tsx
- `LandlordApartmentsScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/profile/apartments/index.tsx → src/contexts/auth-context.tsx
- `TabsLayout()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/_layout.tsx → src/contexts/auth-context.tsx
- `BookingsList()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/bookings.tsx → src/contexts/auth-context.tsx
- `FavoritesScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/favorites.tsx → src/contexts/auth-context.tsx

## Import Cycles
- None detected.

## Communities (84 total, 36 thin omitted)

### Community 0 - "theme.ts"
Cohesion: 0.08
Nodes (29): styles, AppSymbol(), AppSymbolName, MaterialName, Props, toMaterialName(), styles, ExternalLink() (+21 more)

### Community 1 - "profile.tsx"
Cohesion: 0.33
Nodes (4): initialsFromName(), ProfileScreen(), RowProps, SITE_ORIGIN

### Community 2 - "[id].tsx"
Cohesion: 0.07
Nodes (52): ApartmentDetailScreen(), buildInternalCopyText(), getLandlordPhone(), overlayBtnShadow, UI, FavoritesScreen(), ApartmentCard, ApartmentCardComponent() (+44 more)

### Community 3 - "expo"
Cohesion: 0.05
Nodes (40): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, permissions, predictiveBackGestureEnabled, reactCompiler (+32 more)

### Community 5 - "partner-service.ts"
Cohesion: 0.08
Nodes (39): AdminPartnersScreen(), TabKey, AdminUsersScreen(), RoleFilter, roleLabel(), auth, db, firebaseApp (+31 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (22): babel-preset-expo, devDependencies, babel-preset-expo, prettier-plugin-tailwindcss, tailwindcss, @types/react, typescript, typescript (+14 more)

### Community 8 - "bookings-service.ts"
Cohesion: 0.07
Nodes (54): isValidDate(), isValidTime(), NewBookingScreen(), AdminScope, BookingsList(), BookingsScreen(), COLLECTION_FILTERS, CollectionFilter (+46 more)

### Community 9 - "include"
Cohesion: 0.14
Nodes (13): ./assets/*, expo-env.d.ts, .expo/types/**/*.ts, nativewind-env.d.ts, ./node_modules/expo/tsconfig.base.json, **/*.ts, **/*.tsx, compilerOptions (+5 more)

### Community 10 - "dependencies"
Cohesion: 0.18
Nodes (11): expo, expo-symbols, @expo/vector-icons, dependencies, expo, expo-symbols, @expo/vector-icons, @react-native-community/datetimepicker (+3 more)

### Community 11 - "reset-project.js"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 12 - "animated-icon.tsx"
Cohesion: 0.29
Nodes (4): glowKeyframe, keyframe, logoKeyframe, styles

### Community 13 - "animated-icon.web.tsx"
Cohesion: 0.29
Nodes (4): glowKeyframe, keyframe, logoKeyframe, styles

### Community 14 - "download-images.native.ts"
Cohesion: 0.60
Nodes (4): downloadApartmentImages(), DownloadImagesResult, ensureWritePermission(), extensionFromUrl()

### Community 15 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

### Community 16 - "navigation/types.ts"
Cohesion: 0.50
Nodes (3): AuthStackParamList, MainTabParamList, RootStackParamList

### Community 17 - "legal-content.ts"
Cohesion: 0.21
Nodes (9): LegalPageShell(), Props, FAQ_ITEMS, FaqItem, LEGAL_UPDATED_AT, LegalSection, PRIVACY_SECTIONS, SITE_INFO (+1 more)

### Community 18 - "Welcome to your Expo app 👋"
Cohesion: 0.25
Nodes (7): Get a fresh project, Get started, hanoi-residences-app, Join the community, Learn more, Other setup steps, Welcome to your Expo app 👋

### Community 21 - "functions/package.json"
Cohesion: 0.10
Nodes (20): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, openai, description, devDependencies (+12 more)

### Community 26 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compileOnSave, compilerOptions, esModuleInterop, module, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck (+5 more)

### Community 29 - "admin-apartments-service.ts"
Cohesion: 0.08
Nodes (45): AdminApartmentsScreen(), dedupeApartments(), formatPostedDate(), isIndexBuildingError(), pendingOrRejectedLabel(), STATUS_CHIPS, AdminDashboardScreen(), AdminSubmissionsScreen() (+37 more)

### Community 32 - "Phase 8 — Checklist test 4 role (thiết bị thật)"
Cohesion: 0.22
Nodes (8): Admin, Chủ nhà (`landlord`), CTV (`collaborator`), Deploy còn lại (ops), Ghi chú FCM / Expo Push, Guest (chưa login), Phase 8 — Checklist test 4 role (thiết bị thật), User

### Community 37 - "Collections"
Cohesion: 0.15
Nodes (12): `apartments/{apartmentId}`, Auth, Collections, `ctv_bookings/{id}`, Data model — dùng chung web và app, `guest_consultations/{id}`, Hằng số dùng chung, Indexes cần sẵn sàng (+4 more)

### Community 41 - "Kế hoạch triển khai — Hướng 1"
Cohesion: 0.18
Nodes (11): Kế hoạch triển khai — Hướng 1, Phase 0 — Nền (không UI), Phase 1 — App skeleton + Auth, Phase 2 — Khách xem tin, Phase 3 — User: tim, hồ sơ, chuông, Phase 4 — Đặt lịch (3 collection), Phase 5 — CTV + chủ nhà đăng ký, Phase 6 — Chủ nhà vận hành tin (+3 more)

### Community 44 - "auth-context.tsx"
Cohesion: 0.28
Nodes (14): AuthContext, AuthContextValue, AuthProvider(), getRoleLabel(), hasMinimumRole(), hasPermission(), hasRole(), isAdmin() (+6 more)

### Community 45 - "index.ts"
Cohesion: 0.40
Nodes (4): generateListingSummary, groqApiKey, Input, Output

### Community 54 - "lib/types.ts"
Cohesion: 0.07
Nodes (47): AdminApartmentFormScreen(), TAGS, PartnerRegisterScreen(), LandlordApartmentFormScreen(), LandlordApartmentsScreen(), assetsToItems(), FormImageItem, FormImagePicker() (+39 more)

### Community 57 - "GRAPH_REPORT — Web ↔ Mobile (Hướng 1)"
Cohesion: 0.22
Nodes (9): Community — nhóm chức năng, Cạnh không đồng bộ được bằng SDK thuần, Cạnh đồng bộ (web ghi → app đọc), God nodes, GRAPH_REPORT — Web ↔ Mobile (Hướng 1), Luồng ghi tin (phải giống web), Lỗ hổng rules (ảnh hưởng trực tiếp app), Privilege vs public (+1 more)

### Community 58 - "Lưu ý bắt buộc — app Hướng 1"
Cohesion: 0.22
Nodes (9): Auth, Bẫy dữ liệu, Cấm, Graphify, Lưu ý bắt buộc — app Hướng 1, Monorepo (khuyến nghị), Rules, UI / UX app (+1 more)

### Community 59 - "Feature parity — website → app"
Cohesion: 0.22
Nodes (8): Admin, Chủ nhà, Cộng tác viên, Feature parity — website → app, Hợp đồng hành vi phải giữ, Khách (chưa đăng nhập), Không port (website-only), User đã login

### Community 60 - "Privileged ops — vẫn Hướng 1"
Cohesion: 0.25
Nodes (7): Field ẩn theo role (bắt buộc trên UI app), Hợp đồng callable `generateListingSummary`, Phải ra Cloud Function, Privileged ops — vẫn Hướng 1, Quota xóa căn hộ, Việc web-only không giả lập trên app, Được làm bằng SDK nếu copy đúng website

### Community 61 - "Mobile Firebase Sync (Hướng 1)"
Cohesion: 0.25
Nodes (8): Khi implement một màn, Map nhanh: website → app, Mobile Firebase Sync (Hướng 1), Nguyên tắc bắt buộc, Stack mặc định, Vai trò (phải đủ 4), Việc cấm, Xong một epic

### Community 62 - "Phase 0–1 status (honest)"
Cohesion: 0.33
Nodes (5): Deploy (bạn làm trên Console / CLI), Phase 0–1 — còn sót, Phase 0–1 status (honest), Phase còn lại (2–8), Đã ổn trong Expo

### Community 63 - "price-range.ts"
Cohesion: 0.36
Nodes (7): isPriceInRange(), normalizePriceValue(), parsePriceRange(), PRICE_FILTER_MAX, PRICE_FILTER_MIN, PriceRangeParts, serializePriceRange()

### Community 65 - "Bàn giao sang agent Expo"
Cohesion: 0.29
Nodes (6): Bàn giao sang agent Expo, Copy playbook vào repo Expo, Không làm, Nếu agent Expo cần đọc website, Prompt dán vào Agent Expo, Việc bạn làm trên Cursor

### Community 66 - "App mobile — Hướng 1 (cùng Firebase)"
Cohesion: 0.40
Nodes (5): App mobile — Hướng 1 (cùng Firebase), Hai client, một nguồn sự thật, Quyết định đã chốt, Việc làm trước khi code UI app, Đọc theo thứ tự

### Community 67 - "settings.tsx"
Cohesion: 0.19
Nodes (14): FieldKey, ProfileEditScreen(), GENDER_OPTIONS, InfoField, PassField, ProfileSettingsScreen(), changePassword(), checkPasswordMatch() (+6 more)

### Community 69 - "useAuth"
Cohesion: 0.15
Nodes (14): expo-router, ForgotPasswordScreen(), getResetErrorMessage(), getAuthErrorMessage(), LoginScreen(), FieldKey, getAuthErrorMessage(), SignupScreen() (+6 more)

### Community 70 - "(tabs)/index.tsx"
Cohesion: 0.05
Nodes (62): SearchResultsScreen(), toServiceFilters(), CATEGORIES, CategoryItem, CategoryKey, HomeScreen(), MciName, ROOM_TYPE_ICONS (+54 more)

### Community 79 - "app.native.ts"
Cohesion: 0.18
Nodes (10): auth, createAuth(), db, firebaseApp, functions, loadReactNativePersistence(), ReactNativeAsyncStorage, ReactNativePersistenceFactory (+2 more)

### Community 84 - "notifications.tsx"
Cohesion: 0.36
Nodes (8): NOTIFICATION_ICONS, NotificationsScreen(), formatNotificationTime(), getNotificationTypeLabel(), getRoleNotificationHint(), mapNotificationLinkToHref(), AppNotification, NotificationType

### Community 86 - "use-push-notifications.ts"
Cohesion: 0.35
Nodes (6): RootNavigator(), resolveNotificationRoute(), usePushNotifications(), presentLocalNotification(), registerForPushNotificationsAsync(), setAppBadgeCount()

### Community 88 - "ctv-register.tsx"
Cohesion: 0.47
Nodes (4): CtvRegisterScreen(), GENDERS, submitCtvRegistration(), checkPhoneNumber()

## Knowledge Gaps
- **339 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+334 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `useAuth` to `theme.ts`, `profile.tsx`, `[id].tsx`, `expo`, `settings.tsx`, `partner-service.ts`, `(tabs)/index.tsx`, `bookings-service.ts`, `legal-content.ts`, `notifications.tsx`, `lib/types.ts`, `use-push-notifications.ts`, `ctv-register.tsx`, `admin-apartments-service.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `plugins` connect `expo` to `useAuth`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _339 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08244680851063829 - nodes in this community are weakly interconnected._
- **Should `[id].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06993006993006994 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `partner-service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07542087542087542 - nodes in this community are weakly interconnected._