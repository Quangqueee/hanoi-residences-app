# Graph Report - hanoi-residences-app  (2026-08-10)

## Corpus Check
- 81 files · ~76,247 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 533 nodes · 1014 edges · 56 communities (23 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f8441b46`
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
- expo-status-bar
- expo-symbols
- expo-system-ui
- @expo/ui
- expo-web-browser
- firebase
- nativewind
- react
- react-dom
- react-native
- @react-native-async-storage/async-storage
- react-native-gesture-handler
- react-native-markdown-display
- react-native-reanimated
- expo-linear-gradient
- react-native-screens
- react-native-worklets
- @react-navigation/bottom-tabs
- @react-navigation/native
- @react-navigation/native-stack
- AGENTS.md
- expo-notifications
- expo-router
- @react-native-community/datetimepicker

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 31 edges
2. `expo-router` - 17 edges
3. `Apartment` - 14 edges
4. `expo` - 13 edges
5. `ApartmentDetailScreen()` - 13 edges
6. `ThemedText()` - 13 edges
7. `ThemedView()` - 13 edges
8. `Colors` - 12 edges
9. `Spacing` - 11 edges
10. `AuthProvider()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `LoginScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(auth)/login.tsx → src/contexts/auth-context.tsx
- `SignupScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(auth)/signup.tsx → src/contexts/auth-context.tsx
- `TabsLayout()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/_layout.tsx → src/contexts/auth-context.tsx
- `BookingsScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/bookings.tsx → src/contexts/auth-context.tsx
- `FavoritesScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(tabs)/favorites.tsx → src/contexts/auth-context.tsx

## Import Cycles
- None detected.

## Communities (56 total, 33 thin omitted)

### Community 0 - "theme.ts"
Cohesion: 0.09
Nodes (28): getAuthErrorMessage(), LoginScreen(), styles, getAuthErrorMessage(), SignupScreen(), styles, styles, styles (+20 more)

### Community 1 - "apartments-service.ts"
Cohesion: 0.06
Nodes (60): SearchResultsScreen(), toServiceFilters(), greetingForHour(), HomeScreen(), applyBtnShadow, Brand, SearchFilterCenterScreen(), ApartmentCard (+52 more)

### Community 2 - "[id].tsx"
Cohesion: 0.08
Nodes (44): ApartmentDetailScreen(), backBtnShadow, bookBtnShadow, bottomDockShadow, buildInternalCopyText(), getLandlordPhone(), shareBtnShadow, UI (+36 more)

### Community 3 - "expo"
Cohesion: 0.05
Nodes (38): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, permissions, predictiveBackGestureEnabled, reactCompiler (+30 more)

### Community 4 - "auth-context.tsx"
Cohesion: 0.07
Nodes (39): FavoritesScreen(), styles, UI, AuthContext, AuthContextValue, AuthProvider(), auth, db (+31 more)

### Community 5 - "useAuth"
Cohesion: 0.12
Nodes (24): expo-router, Index(), RootNavigator(), TabsLayout(), TabUI, NotificationsScreen(), styles, ProfileScreen() (+16 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (22): babel-preset-expo, devDependencies, babel-preset-expo, prettier-plugin-tailwindcss, tailwindcss, @types/react, typescript, main (+14 more)

### Community 8 - "bookings-service.ts"
Cohesion: 0.07
Nodes (42): isValidDate(), isValidTime(), NewBookingScreen(), styles, BookingsScreen(), BookingCard(), Props, BookingEditModal() (+34 more)

### Community 9 - "include"
Cohesion: 0.14
Nodes (13): ./assets/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, nativewind-env.d.ts, **/*.ts, **/*.tsx, compilerOptions (+5 more)

### Community 10 - "dependencies"
Cohesion: 0.22
Nodes (9): expo, expo-clipboard, dependencies, expo, expo-clipboard, react-native-safe-area-context, react-native-web, react-native-safe-area-context (+1 more)

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
- **197 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+192 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `useAuth` to `theme.ts`, `apartments-service.ts`, `[id].tsx`, `expo`, `auth-context.tsx`, `bookings-service.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `plugins` connect `expo` to `useAuth`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _197 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09306122448979592 - nodes in this community are weakly interconnected._
- **Should `apartments-service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `[id].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08272859216255443 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._