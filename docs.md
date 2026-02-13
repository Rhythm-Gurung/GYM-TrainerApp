# Setu - Developer Documentation

This document covers the architecture, utilities, and patterns used in this React Native/Expo application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Package Manager (pnpm)](#package-manager-pnpm)
4. [Styling with NativeWind](#styling-with-nativewind)
5. [API Layer](#api-layer)
6. [API Hooks](#api-hooks)
7. [Toast Notifications](#toast-notifications)
8. [Authentication](#authentication)
9. [Configuration](#configuration)

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm expo start

# Clear cache and start
pnpm expo start --clear
```

### Available Scripts

```bash
pnpm start          # Start Expo dev server
pnpm android        # Run on Android
pnpm ios            # Run on iOS
pnpm web            # Run on web
pnpm lint           # Run ESLint
pnpm lint:fix       # Fix ESLint errors
pnpm format         # Format with Prettier
```

---

## Project Structure

```
src/
├── api/
│   ├── client.ts              # Axios instance with interceptors
│   ├── hooks/                  # Reusable API hooks
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── useApi.ts
│   │   ├── useApiMutation.ts
│   │   └── useApiQuery.ts
│   └── services/               # API service functions
│       ├── index.ts
│       └── auth.service.ts
├── app/                        # Expo Router (file-based routing)
│   ├── (auth)/                 # Auth screens group
│   ├── (tabs)/                 # Tab screens group
│   ├── _layout.tsx             # Root layout
│   └── index.tsx               # Entry point
├── components/
│   ├── auth/                   # Auth-specific components
│   ├── common/                 # Shared components
│   └── ui/                     # UI primitives
├── config/
│   ├── api.config.ts           # API endpoints & config
│   └── index.ts
├── contexts/
│   └── auth.tsx                # Auth context (state management)
├── hooks/
│   └── useGoogleSignIn.ts      # Google OAuth hook
├── lib/
│   ├── errorHandler.ts         # Error parsing utilities
│   ├── toast.ts                # Toast notification utilities
│   └── index.ts
├── schemas/
│   └── auth.schemas.ts         # Zod validation schemas
├── types/
│   ├── authTypes.ts            # TypeScript interfaces
│   └── images.d.ts
└── global.css                  # NativeWind styles
```

---

## Package Manager (pnpm)

This project uses **pnpm** for faster, more efficient package management.

### Configuration (`.npmrc`)

```ini
node-linker=hoisted
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
```

> **Note:** `shamefully-hoist=true` is required for React Native/Expo compatibility with Metro bundler.

### Common Commands

```bash
pnpm install              # Install all dependencies
pnpm add <package>        # Add a dependency
pnpm add -D <package>     # Add a dev dependency
pnpm remove <package>     # Remove a package
pnpm update               # Update packages
```

---

## Styling with NativeWind

This project uses **NativeWind v4** for Tailwind CSS styling in React Native.

### Configuration Files

- `tailwind.config.js` - Tailwind configuration with NativeWind preset
- `metro.config.js` - Metro bundler config for NativeWind
- `babel.config.js` - Babel config with NativeWind plugin
- `src/global.css` - Tailwind directives

### Usage

```tsx
import { View, Text } from 'react-native';

export function MyComponent() {
    return (
        <View className="flex-1 bg-white p-4">
            <Text className="text-xl font-bold text-gray-900">
                Hello World
            </Text>
        </View>
    );
}
```

### Dynamic Classes

```tsx
<View className={`p-4 ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`}>
    <Text className={error ? 'text-red-500' : 'text-gray-700'}>
        {message}
    </Text>
</View>
```

---

## API Layer

### API Client (`src/api/client.ts`)

Axios instance with automatic token handling and refresh logic.

```typescript
import { apiClient } from '@/api/client';

// Make a request
const response = await apiClient.get('/api/endpoint');
const data = await apiClient.post('/api/endpoint', { body });
```

### Features

- **Automatic token injection** - Adds `Authorization` header to protected requests
- **Public endpoint detection** - Skips auth header for login, register, and other public endpoints
- **Token refresh** - Automatically refreshes expired tokens on 401 errors
- **Logout on failure** - Clears auth data and redirects to login if refresh fails

### Public Auth Endpoints

The following endpoints are treated as "public" and will **NOT** have the Authorization header added:

- `/api/system/auth/login/`
- `/api/system/auth/register/`
- `/api/system/auth/google-login/`
- `/api/system/auth/forgot-password/`
- `/api/system/auth/verify-email/`
- `/api/system/auth/verify-forgot-password/`
- `/api/system/auth/resend-verification-code/`
- `/api/system/auth/change-password/`

This prevents issues where a stale token in AsyncStorage could cause registration or login failures on mobile devices.

### API Services (`src/api/services/`)

Centralized API functions organized by domain.

```typescript
// src/api/services/auth.service.ts
import { authService } from '@/api/services';

await authService.login(email, password);
await authService.register(input);
await authService.logout();
await authService.getProfile();
```

---

## API Hooks

Custom hooks for managing API state with automatic toast notifications.

### `useApiMutation`

For POST, PUT, DELETE operations (data modifications).

```typescript
import { useApiMutation } from '@/api/hooks';
import { authService } from '@/api/services';

function LoginForm() {
    const { mutateAsync, isLoading, isError, error } = useApiMutation(
        ({ email, password }) => authService.login(email, password),
        {
            onSuccess: (data) => {
                console.log('Login successful:', data);
            },
            onError: (error) => {
                console.log('Login failed:', error);
            },
            // Toast options (defaults to true)
            showErrorToast: true,
            errorToastTitle: 'Login Failed',
        }
    );

    const handleLogin = async () => {
        try {
            const result = await mutateAsync({ email, password });
            // Handle success
        } catch (error) {
            // Error already shown in toast
        }
    };

    return (
        <Button
            title="Login"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
        />
    );
}
```

### `useApiQuery`

For GET operations with caching support.

```typescript
import { useApiQuery } from '@/api/hooks';
import { authService } from '@/api/services';

function ProfileScreen() {
    const {
        data: profile,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useApiQuery(
        'profile',                        // Cache key
        () => authService.getProfile(),   // Query function
        {
            enabled: true,                // Whether to fetch
            staleTime: 5 * 60 * 1000,     // Cache for 5 minutes
            refetchOnMount: true,
            showErrorToast: true,
        }
    );

    if (isLoading) return <LoadingScreen />;
    if (isError) return <ErrorScreen error={error} onRetry={refetch} />;

    return <ProfileView profile={profile} />;
}
```

### `useApi`

Simple hook for one-off API calls.

```typescript
import { useApi } from '@/api/hooks';
import { authService } from '@/api/services';

function SomeComponent() {
    const { data, isLoading, isError, error, execute, reset } = useApi(
        authService.getProfile,
        { showErrorToast: true }
    );

    const fetchProfile = async () => {
        try {
            const profile = await execute();
            console.log('Profile:', profile);
        } catch (error) {
            // Handle error
        }
    };

    return <Button title="Fetch Profile" onPress={fetchProfile} />;
}
```

### Hook Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showErrorToast` | boolean | `true` | Show toast on error |
| `errorToastTitle` | string | `'Error'` | Custom toast title |
| `onSuccess` | function | - | Callback on success |
| `onError` | function | - | Callback on error |
| `onSettled` | function | - | Callback after success or error |

### Disabling Toast

```typescript
const { mutateAsync } = useApiMutation(apiFn, {
    showErrorToast: false,  // Disable toast for this hook
});
```

---

## Toast Notifications

Toast notifications are built-in with `react-native-toast-message`.

### Automatic Toast

API hooks automatically show toast notifications on errors (enabled by default).

### Manual Toast Usage

```typescript
import {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showToast,
    hideToast,
} from '@/lib';

// Simple toasts
showSuccessToast('Profile updated successfully!');
showErrorToast('Something went wrong', 'Error Title');
showInfoToast('Processing your request...');

// Custom toast
showToast({
    title: 'Custom Title',
    message: 'Custom message',
    type: 'success',        // 'success' | 'error' | 'info'
    duration: 4000,         // milliseconds
    position: 'top',        // 'top' | 'bottom'
    onPress: () => {},
    onHide: () => {},
});

// Hide toast
hideToast();
```

### Toast Types

| Type | Color | Use Case |
|------|-------|----------|
| `success` | Green | Operation completed successfully |
| `error` | Red | Error occurred, stays longer (5s) |
| `info` | Blue | Informational messages |

---

## Authentication

### Auth Context

The `useAuth` hook provides authentication state and methods.

```typescript
import { useAuth } from '@/contexts/auth';

function MyComponent() {
    const {
        authState,        // { token, authenticated, user }
        loading,          // Initial loading state
        login,            // (email, password) => Promise
        googleLogin,      // (idToken) => Promise
        register,         // (input) => Promise
        logout,           // () => Promise
        forgotPassword,   // (email) => Promise
        verifyEmail,      // (email, code) => Promise
        changePassword,   // (input) => Promise
        getProfile,       // () => Promise
    } = useAuth();

    if (loading) return <LoadingScreen />;

    if (!authState.authenticated) {
        return <LoginScreen />;
    }

    return <HomeScreen user={authState.user} />;
}
```

### Token Storage

Tokens are stored in AsyncStorage:

- `access_token` - JWT access token
- `refresh_token` - JWT refresh token
- `user` - JSON stringified user object

---

## Configuration

### API Configuration (`src/config/api.config.ts`)

```typescript
export const API_CONFIG = {
    BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',
    TIMEOUT: 30000,
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/system/auth/login/',
            REGISTER: '/api/system/auth/register/',
            LOGOUT: '/api/system/auth/logout/',
            // ... more endpoints
        },
        TOKEN: {
            REFRESH: '/api/token/refresh/',
        },
    },
};
```

### Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_API_URL=https://your-api.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
```

---

## Error Handling

### Error Handler Utility

```typescript
import { getErrorMessage, getErrorStatus, isErrorStatus } from '@/lib';

try {
    await someApiCall();
} catch (error) {
    // Get user-friendly error message
    const message = getErrorMessage(error, 'Default message');

    // Get HTTP status code
    const status = getErrorStatus(error);

    // Check specific status
    if (isErrorStatus(error, 401)) {
        // Handle unauthorized
    }
}
```

### Error Message Priority

1. `error.response.data.detail` - API detail message
2. Field-specific errors - Parsed and formatted
3. `error.response.statusText` - HTTP status text
4. `error.message` - Error message
5. Default message - Fallback

---

## Form Validation

Using **Zod** with **React Hook Form**.

### Example

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/schemas/auth.schemas';

function LoginForm() {
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting, isValid },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onBlur',
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: LoginFormData) => {
        // Handle submission
    };

    return (
        <InputField
            control={control}
            name="email"
            label="Email"
            error={errors.email?.message}
        />
    );
}
```

---

## Path Aliases

TypeScript path aliases are configured for clean imports.

```typescript
// Instead of
import { useAuth } from '../../../contexts/auth';

// Use
import { useAuth } from '@/contexts/auth';
```

Configured in `tsconfig.json`:

```json
{
    "compilerOptions": {
        "paths": {
            "@/*": ["./src/*"]
        }
    }
}
```

---

## Best Practices

### 1. Use API Hooks for Data Fetching

```typescript
// Good - uses hook with loading/error states
const { data, isLoading } = useApiQuery('key', fetchFn);

// Avoid - manual state management
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
```

### 2. Centralize API Calls in Services

```typescript
// Good - centralized in service
await authService.login(email, password);

// Avoid - direct API calls in components
await apiClient.post('/api/auth/login/', { email, password });
```

### 3. Use TypeScript Types

```typescript
// Good - typed
const user: User = await authService.getProfile();

// Avoid - any types
const user: any = await getProfile();
```

### 4. Handle Errors Gracefully

```typescript
// Good - let hook handle toast, handle specific cases
try {
    await mutateAsync(data);
    router.push('/success');
} catch (error) {
    // Toast already shown by hook
    // Handle specific cases if needed
}
```

---

## Troubleshooting

### Metro Cache Issues

```bash
pnpm expo start --clear
```

### NativeWind Styles Not Working

1. Ensure `global.css` is imported in `_layout.tsx`
2. Clear Metro cache: `pnpm expo start --clear`
3. Check `className` prop is on React Native components

### Module Resolution Errors

```bash
rm -rf node_modules
pnpm install
```

### TypeScript Errors

```bash
pnpm exec tsc --noEmit
```

### Registration/Login Fails on Mobile with "token_not_valid"

This happens when a stale token from a previous session is sent with public auth requests. The API client is configured to skip adding Authorization headers for public endpoints. If you still see this error:

1. Clear AsyncStorage: The app may have old tokens stored
2. Check the `PUBLIC_AUTH_ENDPOINTS` list in `src/api/client.ts`
3. Ensure your endpoint path matches the list (including trailing slash)
