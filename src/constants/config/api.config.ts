export const API_CONFIG = {
    BASE_URL:
    process.env.EXPO_PUBLIC_API_URL || 'https://chanco-core.lolskins.gg',
    TIMEOUT: 30000,
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/system/auth/login/',
            GOOGLE_LOGIN: '/api/system/auth/google-login/',
            REGISTER: '/api/system/auth/register/',
            LOGOUT: '/api/system/auth/logout/',
            FORGOT_PASSWORD: '/api/system/auth/forgot-password/',
            VERIFY_EMAIL: '/api/system/auth/verify-email/',
            VERIFY_FORGOT_PASSWORD: '/api/system/auth/verify-forgot-password/',
            RESEND_OTP: '/api/system/auth/resend-verification-code/',
            CHANGE_PASSWORD: '/api/system/auth/change-password/',
            WHOAMI: '/api/system/auth/whoami/',
            CHECK_EMAIL: '/api/system/auth/check-email-exists/',
            UPDATE_PROFILE: '/api/system/auth/update-profile/',
        },
        TOKEN: {
            REFRESH: '/api/token/refresh/',
        },
    },
} as const;
