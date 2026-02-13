import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, {
    type AxiosError,
    type InternalAxiosRequestConfig,
} from 'axios';
import type { Router } from 'expo-router';

import { API_CONFIG } from '@/constants/config';

// Global router for navigation from non-component modules
let globalRouter: Router | null = null;

export const setGlobalRouter = (router: Router) => {
    globalRouter = router;
};

// Create axios instance
export const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Auth endpoints that should NOT have Authorization header (public endpoints)
const PUBLIC_AUTH_ENDPOINTS = [
    '/api/system/auth/login/',
    '/api/system/auth/register/',
    '/api/system/auth/google-login/',
    '/api/system/auth/forgot-password/',
    '/api/system/auth/verify-email/',
    '/api/system/auth/verify-forgot-password/',
    '/api/system/auth/resend-verification-code/',
    '/api/system/auth/change-password/',
];

// Check if URL is a public auth endpoint (should not have auth header)
const isPublicAuthEndpoint = (url: string | undefined): boolean => {
    if (!url) return false;
    return PUBLIC_AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

// Request interceptor - Add access token and ensure proper headers
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Skip adding auth header for public auth endpoints
        if (!isPublicAuthEndpoint(config.url)) {
            const accessToken = await AsyncStorage.getItem('access_token');
            if (accessToken && config.headers) {
                // eslint-disable-next-line no-param-reassign
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }

        // Ensure Content-Type is set for POST/PUT/PATCH requests
        if (config.data && config.headers) {
            // eslint-disable-next-line no-param-reassign
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error: AxiosError) => Promise.reject(error),
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        // Debug logging in development
        if (__DEV__) {
            console.error('API Error:', {
                url: error.config?.url,
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
        }

        const originalRequest = error.config as InternalAxiosRequestConfig & {
            retry?: boolean;
        };

        // Skip token refresh for public auth endpoints - let original error pass through
        if (isPublicAuthEndpoint(originalRequest?.url)) {
            return Promise.reject(error);
        }

        // If 401 error and haven't retried yet
        if (error.response?.status === 401 && !originalRequest.retry) {
            originalRequest.retry = true;

            try {
                const refreshToken = await AsyncStorage.getItem('refresh_token');

                if (!refreshToken) {
                    // No refresh token, redirect to login
                    if (globalRouter) {
                        globalRouter.replace('/(auth)/login');
                    }
                    return Promise.reject(error);
                }

                // Call refresh endpoint
                const refreshResponse = await axios.post(
                    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TOKEN.REFRESH}`,
                    { refresh: refreshToken },
                );

                const newAccessToken = refreshResponse.data?.access;

                if (!newAccessToken) {
                    throw new Error('No access token in refresh response');
                }

                // Store new access token
                await AsyncStorage.setItem('access_token', newAccessToken);

                // Update original request with new token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                // Retry original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                if (__DEV__) {
                    console.error('Token refresh failed:', refreshError);
                }
                // Clear all auth data on refresh failure
                await AsyncStorage.multiRemove([
                    'access_token',
                    'refresh_token',
                    'user',
                ]);

                // Navigate to login
                if (globalRouter) {
                    try {
                        globalRouter.replace('/(auth)/login');
                    } catch (navError) {
                        console.error('Navigation error:', navError);
                    }
                }

                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    },
);

// Legacy export for backward compatibility during migration
export const axiosInstance = apiClient;
