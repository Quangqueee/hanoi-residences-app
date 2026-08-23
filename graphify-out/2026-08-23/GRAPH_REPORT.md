# Graph Report - hanoi-residences-app  (2026-08-23)

## Corpus Check
- 133 files · ~114,427 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 920 nodes · 1891 edges · 83 communities (47 shown, 36 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62bc012d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- theme.ts
- (tabs)/index.tsx
- [id]/index.tsx
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
- expo-router
- Welcome to your Expo app 👋
- expo-linear-gradient
- search-results.tsx
- functions/package.json
- expo-glass-effect
- expo-image
- expo-font
- expo-linking
- compilerOptions
- @react-native-async-storage/async-storage
- apartments-service.ts
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
- expo-constants
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
- useAuth
- Cloud Functions
- app-symbol.tsx
- search-params.ts
- expo-file-system
- expo-image-picker
- expo-status-bar
- react-native-gesture-handler
- @react-navigation/bottom-tabs
- expo-splash-screen
- expo-system-ui
- app.native.ts
- firebase
- @react-navigation/native
- expo-clipboard
- notifications.tsx

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 64 edges
2. `expo-router` - 39 edges
3. `Hoteliq` - 31 edges
4. `Apartment` - 21 edges
5. `ApartmentDetailScreen()` - 15 edges
6. `AppSymbol()` - 14 edges
7. `db` - 14 edges
8. `notifyAdmins()` - 14 edges
9. `getDisplaySourceCode()` - 14 edges
10. `expo` - 13 edges

## Surprising Connections (you probably didn't know these)
- `TabsLayout()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/_layout.tsx → src/contexts/auth-context.tsx
- `Index()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/index.tsx → src/contexts/auth-context.tsx
- `BookingsScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/bookings.tsx → src/contexts/auth-context.tsx
- `BookingsList()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/bookings.tsx → src/contexts/auth-context.tsx
- `FavoritesScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/favorites.tsx → src/contexts/auth-context.tsx

## Import Cycles
- None detected.

## Communities (83 total, 36 thin omitted)

### Community 0 - "theme.ts"
Cohesion: 0.09
Nodes (25): Index(), styles, styles, ExternalLink(), Props, HintRowProps, styles, styles (+17 more)

### Community 1 - "(tabs)/index.tsx"
Cohesion: 0.16
Nodes (13): CATEGORIES, CategoryItem, CategoryKey, MciName, ROOM_TYPE_ICONS, ApartmentCard, ListPaginationFooter(), Props (+5 more)

### Community 2 - "[id]/index.tsx"
Cohesion: 0.06
Nodes (57): ApartmentGalleryScreen(), clampIndex(), firstParam(), ApartmentDetailScreen(), buildInternalCopyText(), getLandlordPhone(), overlayBtnShadow, UI (+49 more)

### Community 3 - "expo"
Cohesion: 0.05
Nodes (40): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, permissions, predictiveBackGestureEnabled, reactCompiler (+32 more)

### Community 5 - "partner-service.ts"
Cohesion: 0.19
Nodes (20): AdminPartnersScreen(), TabKey, AdminUsersScreen(), RoleFilter, roleLabel(), getLandlordApartmentStats(), createNotification(), AdminUserRecord (+12 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (22): babel-preset-expo, devDependencies, babel-preset-expo, prettier-plugin-tailwindcss, tailwindcss, @types/react, typescript, typescript (+14 more)

### Community 8 - "bookings-service.ts"
Cohesion: 0.07
Nodes (52): isValidDate(), isValidTime(), NewBookingScreen(), AdminScope, BookingsList(), COLLECTION_FILTERS, CollectionFilter, STATUS_FILTERS (+44 more)

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
Cohesion: 0.36
Nodes (7): downloadApartmentImages(), DownloadImagesOptions, DownloadImagesResult, DownloadProgress, ensureWritePermission(), extensionFromUrl(), reportProgress()

### Community 15 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

### Community 16 - "navigation/types.ts"
Cohesion: 0.50
Nodes (3): AuthStackParamList, MainTabParamList, RootStackParamList

### Community 17 - "expo-router"
Cohesion: 0.11
Nodes (16): expo-router, unstable_settings, initialsFromName(), ProfileScreen(), RowProps, LegalPageShell(), Props, requestAccountDeletion() (+8 more)

### Community 18 - "Welcome to your Expo app 👋"
Cohesion: 0.25
Nodes (7): Get a fresh project, Get started, hanoi-residences-app, Join the community, Learn more, Other setup steps, Welcome to your Expo app 👋

### Community 20 - "search-results.tsx"
Cohesion: 0.21
Nodes (13): SearchResultsScreen(), toServiceFilters(), OPTIONS, Props, SortOption, SortPills(), dedupeApartments(), filtersKey() (+5 more)

### Community 21 - "functions/package.json"
Cohesion: 0.10
Nodes (20): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, openai, description, devDependencies (+12 more)

### Community 26 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compileOnSave, compilerOptions, esModuleInterop, module, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck (+5 more)

### Community 28 - "apartments-service.ts"
Cohesion: 0.23
Nodes (14): ApartmentsPageResult, applyClientFilters(), buildBaseConstraints(), buildSortConstraints(), fetchApartmentsPage(), normalizeStringList(), toApartment(), toPlainTimestamp() (+6 more)

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

### Community 45 - "index.ts"
Cohesion: 0.40
Nodes (4): generateListingSummary, groqApiKey, Input, Output

### Community 54 - "lib/types.ts"
Cohesion: 0.05
Nodes (57): AdminApartmentFormScreen(), TAGS, LandlordApartmentFormScreen(), assetsToItems(), FormImageItem, FormImagePicker(), Props, LandlordApartmentsPanel() (+49 more)

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

### Community 67 - "useAuth"
Cohesion: 0.07
Nodes (46): ForgotPasswordScreen(), getResetErrorMessage(), getAuthErrorMessage(), LoginScreen(), FieldKey, getAuthErrorMessage(), SignupScreen(), CtvRegisterScreen() (+38 more)

### Community 69 - "app-symbol.tsx"
Cohesion: 0.22
Nodes (8): TabsLayout(), TabUI, AppSymbol(), AppSymbolName, MaterialName, Props, toMaterialName(), TAB_BAR_BODY_HEIGHT

### Community 70 - "search-params.ts"
Cohesion: 0.14
Nodes (21): applyBtnShadow, searchBarShadow, SearchFilterCenterScreen(), ApartmentFiltersBar(), ChipProps, PRIORITY_DISTRICTS, Props, toggleInList() (+13 more)

### Community 79 - "app.native.ts"
Cohesion: 0.18
Nodes (10): auth, createAuth(), db, firebaseApp, functions, loadReactNativePersistence(), ReactNativeAsyncStorage, ReactNativePersistenceFactory (+2 more)

### Community 84 - "notifications.tsx"
Cohesion: 0.16
Nodes (20): HomeScreen(), NOTIFICATION_ICONS, NotificationsScreen(), ShimmerBlock(), useNotifications(), resolveNotificationRoute(), usePushNotifications(), formatNotificationTime() (+12 more)

## Knowledge Gaps
- **343 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+338 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `expo-router` to `theme.ts`, `(tabs)/index.tsx`, `[id]/index.tsx`, `expo`, `useAuth`, `partner-service.ts`, `app-symbol.tsx`, `search-params.ts`, `bookings-service.ts`, `search-results.tsx`, `notifications.tsx`, `lib/types.ts`, `admin-apartments-service.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `plugins` connect `expo` to `expo-router`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _343 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._
- **Should `[id]/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0640503517215846 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._