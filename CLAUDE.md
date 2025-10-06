# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WayJet is a mobile-first translation and social communication app built with Ionic React and Capacitor for cross-platform deployment (iOS/Android). The app features real-time translation, AI-powered chat, menu analysis, social networking, and health information management.

## Key Technologies

- **Framework**: React 19 + Ionic 8 + Capacitor 7
- **Routing**: React Router 5
- **State Management**: Zustand stores ([src/store/zustand/](src/store/zustand/))
- **Styling**: Tailwind CSS 4 + Ionic CSS utilities
- **API Communication**: Axios with token refresh interceptor, SignalR for real-time messaging
- **Internationalization**: i18next with namespaces (en, vi, zh)
- **Build Tool**: Vite with auto-import for React hooks
- **Testing**: Vitest (unit), Cypress (e2e)

## Development Commands

```bash
# Local development
npm run dev                    # Start Vite dev server
npm run dev:host              # Start with network access
ionic serve --host=0.0.0.0    # Ionic dev server (network accessible)

# Building
npm run build                 # TypeScript check + Vite build

# Testing
npm run test.unit             # Run Vitest unit tests
npm run test.e2e              # Run Cypress e2e tests
npm run lint                  # Run ESLint

# Mobile development
npm run sync:android          # Build and sync to Android
npm run watch:android         # Watch mode for Android development

# Capacitor
npx cap sync android          # Sync web assets to Android
npx cap sync ios              # Sync web assets to iOS
npx cap add android           # Add Android platform
npx cap add ios               # Add iOS platform

# Assets
npx @capacitor/assets generate  # Generate app icons/splash screens

# i18n
npm run i18n:extract          # Extract translation keys
```

## Architecture

### Routing & Navigation
- Routes defined in [src/routes/AppRoutes.tsx](src/routes/AppRoutes.tsx) using lazy loading
- `PrivateRoute` wrapper for authenticated routes
- Bottom tab bar shown conditionally based on route
- Main routes: `/social-chat` (default), `/social-feed`, `/translate`, `/chat`, `/my-profile`

### State Management
All global state managed via Zustand stores in [src/store/zustand/](src/store/zustand/):
- `auth-store.ts` - Authentication state, user profile, token management
- `chat-store.ts` - AI chat sessions and messages
- `social-chat-store.ts` - Social messaging (rooms, messages, typing indicators)
- `social-feed-store.ts` - Social feed posts and interactions
- `language-store.ts` - Translation history, language preferences
- `signalr-stream-store.ts` - Real-time SignalR connection management
- `notify-store.ts` - Notification management
- Other stores: `image-store`, `model-store`, `scanner-store`, `translation-store`, `ui-store`

### API Layer
- Base HTTP client: [src/config/http-client.ts](src/config/http-client.ts)
  - Auto-attaches Bearer token from localStorage
  - Automatic token refresh on 401 using `/api/v1/auth/refresh-token`
  - Redirects to `/login` on auth failure
- Service modules in [src/services/](src/services/) organized by domain (auth, chat, social, translation, menu, etc.)
- Real-time messaging via SignalR (`@microsoft/signalr`)

### Component Structure
- **Common components**: [src/components/common/](src/components/common/) - Reusable UI (BottomTabBar, Avatar, Button, Modal, etc.)
- **Feature components**: Organized under [src/components/](src/components/) by feature (social, sidebar, gallery-picker, markdown, etc.)
- **Layout components**: [src/components/layout/](src/components/layout/) (ChatSidebarLayout, etc.)
- **Pages**: [src/pages/](src/pages/) with feature folders (Auth, ChatStream, SocialChat, Profile, Translate, Menu, etc.)

### Hooks
[src/hooks/](src/hooks/) contains custom hooks:
- `useAppInit.ts` - App initialization logic (permissions, FCM, device info)
- `useFcmToken.ts` - Firebase Cloud Messaging token management
- `useInfiniteSearch.tsx` - Infinite scroll pagination pattern
- `useKeyboardResize.ts` - Keyboard appearance handling for mobile
- `useLongPressOpen.ts` - Long press gesture handling
- `useIntersectionObserver.ts` - Intersection observer for lazy loading
- Device hooks in [src/hooks/device/](src/hooks/device/)

### Auto-imports
Vite auto-imports configured for:
- React hooks (`useState`, `useEffect`, `useContext`, `useRef`, `useMemo`, `useCallback`)
- React Router (`Route`, `Redirect`, `RouteProps`)
- Custom global translation helper (`t` from `@/lib/globalT`)

Auto-imports generate `auto-imports.d.ts` and `.eslintrc-auto-import.json`

### Path Aliases
Use `@/` prefix for absolute imports from [src/](src/) directory:
```typescript
import { useAuthStore } from '@/store/zustand/auth-store'
import Button from '@/components/button/Button'
```

### Internationalization
- Namespaced translations in [public/locales/](public/locales/) (en, vi, zh)
- i18next configured with HTTP backend
- Namespaces: `home`, `auth`, `api`
- Extract new keys: `npm run i18n:extract`

### Environment Variables
Create `.env` from [.env.example](.env.example):
- `VITE_BE` - Backend API URL
- `VITE_GOOGLE_API_KEY` - Google OAuth client ID
- `VITE_FIREBASE_*` - Firebase config for push notifications
- `VITE_MODEL` - AI model identifier

### Capacitor Configuration
[capacitor.config.ts](capacitor.config.ts) configures:
- App ID: `com.wayjet.app`
- Plugins: SplashScreen, GoogleAuth, Keyboard, LocalNotifications, Media, ScreenOrientation
- Platform-specific settings for Android/iOS
- Development server URL can be set for device testing

### Mobile-Specific Considerations
- Uses Capacitor plugins for camera, filesystem, notifications, clipboard, etc.
- Firebase messaging worker in [public/firebase-messaging-sw.js](public/firebase-messaging-sw.js)
- QR code scanning (ZXing, html5-qrcode)
- Audio recording (capacitor-voice-recorder)
- Orientation locked to portrait
- Safe area handling with `capacitor-plugin-safe-area`

### SignalR Real-Time
- Connection managed in `signalr-stream-store.ts`
- Used for live chat messages, typing indicators, notifications
- Auto-reconnection logic

### Common Patterns
- Lazy-loaded routes for code splitting
- Virtualized lists for performance (react-virtuoso)
- Infinite scroll with pagination
- Long-press gestures on mobile
- Bottom sheets for mobile UX
- Image lazy loading (react-lazy-load-image-component)
- Markdown rendering with rehype/remark plugins

## Project-Specific Notes

- Main entry point: [src/main.tsx](src/main.tsx)
- App root: [src/App.tsx](src/App.tsx) with IonReactRouter, GoogleOAuthProvider, RefreshProvider
- Default redirect: `/` → `/social-chat`
- Auth flow: Login/Register → Health Information → Main App
- Authenticated state persisted via localStorage tokens
