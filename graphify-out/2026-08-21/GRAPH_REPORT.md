# Graph Report - hanoi-residences-app  (2026-08-21)

## Corpus Check
- 121 files · ~108,393 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 849 nodes · 1685 edges · 78 communities (43 shown, 35 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d0254246`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- theme.ts
- admin-apartments-service.ts
- [id].tsx
- expo
- expo-device
- expo-router
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
- auth-context.tsx
- Welcome to your Expo app 👋
- partner-service.ts
- app.ts
- functions/package.json
- expo-glass-effect
- expo-image
- expo-font
- expo-linking
- compilerOptions
- @react-native-async-storage/async-storage
- expo-symbols
- search-keywords.ts
- @expo/ui
- expo-web-browser
- index.js
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
- react-native-safe-area-context
- index.ts
- @react-navigation/native-stack
- AGENTS.md
- expo-notifications
- expo-router
- @react-native-community/datetimepicker
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
- expo-linear-gradient
- Cloud Functions
- useAuth
- apartments-service.ts
- expo-file-system
- expo-image-picker
- expo-status-bar
- react-native-gesture-handler
- @react-navigation/bottom-tabs
- firebase
- expo-clipboard

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 59 edges
2. `expo-router` - 31 edges
3. `Hoteliq` - 30 edges
4. `Apartment` - 19 edges
5. `ApartmentDetailScreen()` - 15 edges
6. `expo` - 13 edges
7. `db` - 13 edges
8. `createNotification()` - 13 edges
9. `notifyAdmins()` - 12 edges
10. `USERS_COLLECTION` - 12 edges

## Surprising Connections (you probably didn't know these)
- `TabsLayout()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/_layout.tsx → src/contexts/auth-context.tsx
- `BookingsScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/bookings.tsx → src/contexts/auth-context.tsx
- `FavoritesScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/favorites.tsx → src/contexts/auth-context.tsx
- `HomeScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/index.tsx → src/contexts/auth-context.tsx
- `HomeScreen()` --calls--> `useNotifications()`  [EXTRACTED]
  src/app/(tabs)/index.tsx → src/hooks/use-notifications.ts

## Import Cycles
- None detected.

## Communities (78 total, 35 thin omitted)

### Community 0 - "theme.ts"
Cohesion: 0.10
Nodes (24): styles, styles, ExternalLink(), Props, HintRowProps, styles, styles, ThemedText() (+16 more)

### Community 1 - "admin-apartments-service.ts"
Cohesion: 0.06
Nodes (61): AdminApartmentFormScreen(), ImageItem, TAGS, AdminApartmentsScreen(), AdminSubmissionsScreen(), ImageItem, LandlordApartmentFormScreen(), LandlordApartmentsScreen() (+53 more)

### Community 2 - "[id].tsx"
Cohesion: 0.08
Nodes (46): ApartmentDetailScreen(), buildInternalCopyText(), getLandlordPhone(), overlayBtnShadow, UI, ApartmentCardComponent(), overlayFavoriteShadow, Props (+38 more)

### Community 3 - "expo"
Cohesion: 0.05
Nodes (38): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, permissions, predictiveBackGestureEnabled, reactCompiler (+30 more)

### Community 5 - "expo-router"
Cohesion: 0.14
Nodes (20): expo-router, RootNavigator(), NOTIFICATION_ICONS, NotificationsScreen(), db, useNotifications(), usePushNotifications(), formatNotificationTime() (+12 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (22): babel-preset-expo, devDependencies, babel-preset-expo, prettier-plugin-tailwindcss, tailwindcss, @types/react, typescript, typescript (+14 more)

### Community 8 - "bookings-service.ts"
Cohesion: 0.07
Nodes (53): isValidDate(), isValidTime(), NewBookingScreen(), AdminScope, BookingsScreen(), COLLECTION_FILTERS, CollectionFilter, STATUS_FILTERS (+45 more)

### Community 9 - "include"
Cohesion: 0.14
Nodes (13): ./assets/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, nativewind-env.d.ts, **/*.ts, **/*.tsx, compilerOptions (+5 more)

### Community 10 - "dependencies"
Cohesion: 0.18
Nodes (11): expo, expo-constants, expo-splash-screen, expo-system-ui, dependencies, expo, expo-constants, expo-splash-screen (+3 more)

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

### Community 17 - "auth-context.tsx"
Cohesion: 0.14
Nodes (18): AuthContext, AuthContextValue, AuthProvider(), auth, ensureUserDocument(), loginWithGoogle(), getRoleLabel(), hasMinimumRole() (+10 more)

### Community 18 - "Welcome to your Expo app 👋"
Cohesion: 0.25
Nodes (7): Get a fresh project, Get started, hanoi-residences-app, Join the community, Learn more, Other setup steps, Welcome to your Expo app 👋

### Community 19 - "partner-service.ts"
Cohesion: 0.15
Nodes (25): AdminPartnersScreen(), TabKey, AdminUsersScreen(), RoleFilter, roleLabel(), getLandlordApartmentStats(), signup(), safeNotifyAdmins() (+17 more)

### Community 20 - "app.ts"
Cohesion: 0.12
Nodes (14): firebaseApp, auth, createAuth(), db, firebaseApp, functions, loadReactNativePersistence(), ReactNativePersistenceFactory (+6 more)

### Community 21 - "functions/package.json"
Cohesion: 0.10
Nodes (20): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, openai, description, devDependencies (+12 more)

### Community 26 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compileOnSave, compilerOptions, esModuleInterop, module, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck (+5 more)

### Community 29 - "search-keywords.ts"
Cohesion: 0.33
Nodes (10): ApartmentTextSearchPlan, matchesAllSearchTokens(), matchesApartmentSearch(), normalizeSearchText(), planApartmentTextSearch(), removeVietnameseTones(), SearchableApartment, searchKeywordIndexValues() (+2 more)

### Community 32 - "index.js"
Cohesion: 0.29
Nodes (6): app_1, firestore_1, groqApiKey, https_1, openai_1, params_1

### Community 37 - "Collections"
Cohesion: 0.15
Nodes (12): `apartments/{apartmentId}`, Auth, Collections, `ctv_bookings/{id}`, Data model — dùng chung web và app, `guest_consultations/{id}`, Hằng số dùng chung, Indexes cần sẵn sàng (+4 more)

### Community 41 - "Kế hoạch triển khai — Hướng 1"
Cohesion: 0.18
Nodes (11): Kế hoạch triển khai — Hướng 1, Phase 0 — Nền (không UI), Phase 1 — App skeleton + Auth, Phase 2 — Khách xem tin, Phase 3 — User: tim, hồ sơ, chuông, Phase 4 — Đặt lịch (3 collection), Phase 5 — CTV + chủ nhà đăng ký, Phase 6 — Chủ nhà vận hành tin (+3 more)

### Community 45 - "index.ts"
Cohesion: 0.40
Nodes (4): generateListingSummary, groqApiKey, Input, Output

### Community 57 - "GRAPH_REPORT — Web ↔ Mobile (Hướng 1)"
Cohesion: 0.22
Nodes (9): Community — nhóm chức năng, Cạnh không đồng bộ được bằng SDK thuần, Cạnh đồng bộ (web ghi → app đọc), God nodes, GRAPH_REPORT — Web ↔ Mobile (Hướng 1), Luồng ghi tin (phải giống web), Lỗ hổng rules (ảnh hưởng trực tiếp app), Privilege vs public (+1 more)

### Community 58 - "Lưu ý bắt buộc — app Hướng 1"
Cohesion: 0.22
Nodes (9): Auth, Bẫy dữ liệu, Cấm, Graphify, Lưu ý bắt buộc — app Hướng 1, Monorepo (khuyến nghị), Rules, UI / UX app (+1 more)

### Community 59 - "Feature parity — website → app"
Cohesion: 0.25
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

### Community 69 - "useAuth"
Cohesion: 0.06
Nodes (40): AdminDashboardScreen(), ForgotPasswordScreen(), getResetErrorMessage(), getAuthErrorMessage(), LoginScreen(), FieldKey, getAuthErrorMessage(), SignupScreen() (+32 more)

### Community 70 - "apartments-service.ts"
Cohesion: 0.05
Nodes (62): SearchResultsScreen(), toServiceFilters(), FavoritesScreen(), CATEGORIES, CategoryKey, HomeScreen(), applyBtnShadow, searchBarShadow (+54 more)

## Knowledge Gaps
- **323 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+318 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `expo-router` to `theme.ts`, `admin-apartments-service.ts`, `[id].tsx`, `expo`, `useAuth`, `apartments-service.ts`, `bookings-service.ts`, `partner-service.ts`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `plugins` connect `expo` to `expo-router`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _323 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09639953542392567 - nodes in this community are weakly interconnected._
- **Should `admin-apartments-service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06293706293706294 - nodes in this community are weakly interconnected._
- **Should `[id].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0750151240169389 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._