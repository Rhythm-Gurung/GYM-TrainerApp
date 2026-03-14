export const API_CONFIG = {
    BASE_URL:
    process.env.EXPO_PUBLIC_API_URL,
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
            RESET_PASSWORD: '/api/system/auth/reset-password/',
            WHOAMI: '/api/system/auth/whoami/',
            CHECK_EMAIL: '/api/system/auth/check-email/',
            UPDATE_PROFILE: '/api/system/auth/update-profile/',
        },
        TRAINER: {
            REGISTER: '/api/system/auth/register/',
            UPDATE_PROFILE: '/api/trainer/update-profile/',
            UPDATE_PROFILE_DETAILS: '/api/system/trainer/update-profile/',
            GET_PROFILE: '/api/trainer/profile/',
            ID_PROOF: '/api/system/trainer/id-proof/',
            PROFILE_IMAGE: '/api/system/trainer/profile-image/',
            CERTIFICATIONS: '/api/system/trainer/certifications/',
            GALLERY: '/api/system/trainer/gallery/',
        },
        TOKEN: {
            REFRESH: '/api/token/refresh/',
        },
    },
} as const;
