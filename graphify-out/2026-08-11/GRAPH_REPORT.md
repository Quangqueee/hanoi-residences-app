# Graph Report - hanoi-residences-app  (2026-08-11)

## Corpus Check
- 81 files · ~82,100 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 541 nodes · 1015 edges · 56 communities (23 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a4d45f8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- theme.ts
- apartments-service.ts
- [id].tsx
- expo
- auth-context.tsx
- useAuth
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
- app.native.ts
- Welcome to your Expo app 👋
- expo-constants
- expo-device
- expo-file-system
- expo-glass-effect
- expo-image
- expo-font
- expo-linking
- expo-splash-screen
- @react-native-async-storage/async-storage
- expo-symbols
- expo-system-ui
- @expo/ui
- expo-web-browser
- firebase
- nativewind
- react
- react-dom
- react-native
- @expo-google-fonts/inter
- react-native-markdown-display
- react-native-reanimated
- expo-linear-gradient
- react-native-screens
- react-native-worklets
- react-native-safe-area-context
- @react-navigation/native
- @react-navigation/native-stack
- AGENTS.md
- expo-notifications
- expo-router
- @react-native-community/datetimepicker
- react-native-web

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 31 edges
2. `expo-router` - 18 edges
3. `Hoteliq` - 17 edges
4. `ApartmentDetailScreen()` - 14 edges
5. `Apartment` - 14 edges
6. `expo` - 13 edges
7. `AuthProvider()` - 11 edges
8. `db` - 9 edges
9. `useNotifications()` - 9 edges
10. `createBooking()` - 9 edges

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

## Communities (56 total, 33 thin omitted)

### Community 0 - "theme.ts"
Cohesion: 0.10
Nodes (24): styles, styles, ExternalLink(), Props, HintRowProps, styles, styles, ThemedText() (+16 more)

### Community 1 - "apartments-service.ts"
Cohesion: 0.06
Nodes (60): SearchResultsScreen(), toServiceFilters(), CATEGORIES, CategoryKey, HomeScreen(), applyBtnShadow, searchBarShadow, SearchFilterCenterScreen() (+52 more)

### Community 2 - "[id].tsx"
Cohesion: 0.08
Nodes (46): ApartmentDetailScreen(), buildInternalCopyText(), getLandlordPhone(), overlayBtnShadow, UI, FavoritesScreen(), ApartmentCard, ApartmentCardComponent() (+38 more)

### Community 3 - "expo"
Cohesion: 0.05
Nodes (38): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, permissions, predictiveBackGestureEnabled, reactCompiler (+30 more)

### Community 4 - "auth-context.tsx"
Cohesion: 0.08
Nodes (31): AuthContext, AuthContextValue, AuthProvider(), auth, firebaseApp, storage, ensureAndroidChannel(), presentLocalNotification() (+23 more)

### Community 5 - "useAuth"
Cohesion: 0.08
Nodes (34): expo-router, getAuthErrorMessage(), LoginScreen(), FieldKey, getAuthErrorMessage(), SignupScreen(), Index(), RootNavigator() (+26 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (22): babel-preset-expo, devDependencies, babel-preset-expo, prettier-plugin-tailwindcss, tailwindcss, @types/react, typescript, main (+14 more)

### Community 8 - "bookings-service.ts"
Cohesion: 0.07
Nodes (42): isValidDate(), isValidTime(), NewBookingScreen(), BookingsScreen(), BookingCard(), Props, BookingEditModal(), pad() (+34 more)

### Community 9 - "include"
Cohesion: 0.14
Nodes (13): ./assets/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, nativewind-env.d.ts, **/*.ts, **/*.tsx, compilerOptions (+5 more)

### Community 10 - "dependencies"
Cohesion: 0.18
Nodes (11): expo, expo-clipboard, expo-status-bar, dependencies, expo, expo-clipboard, expo-status-bar, react-native-gesture-handler (+3 more)

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

### Community 17 - "app.native.ts"
Cohesion: 0.22
Nodes (8): auth, createAuth(), db, firebaseApp, loadReactNativePersistence(), ReactNativePersistenceFactory, storage, firebaseConfig

### Community 18 - "Welcome to your Expo app 👋"
Cohesion: 0.25
Nodes (7): Get a fresh project, Get started, hanoi-residences-app, Join the community, Learn more, Other setup steps, Welcome to your Expo app 👋

## Knowledge Gaps
- **196 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+191 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `useAuth` to `theme.ts`, `apartments-service.ts`, `[id].tsx`, `expo`, `bookings-service.ts`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `plugins` connect `expo` to `useAuth`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _196 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09639953542392567 - nodes in this community are weakly interconnected._
- **Should `apartments-service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05517503805175038 - nodes in this community are weakly interconnected._
- **Should `[id].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07597895967270601 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._