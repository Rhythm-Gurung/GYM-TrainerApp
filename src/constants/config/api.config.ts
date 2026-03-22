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
            // ── Profile & Documents ───────────────────────────────────────────────
            REGISTER: '/api/system/auth/register/',
            UPDATE_PROFILE: '/api/trainer/update-profile/',
            UPDATE_PROFILE_DETAILS: '/api/system/trainer/update-profile/',
            GET_PROFILE: '/api/trainer/profile/',
            ID_PROOF: '/api/system/trainer/id-proof/',
            PROFILE_IMAGE: '/api/system/trainer/profile-image/',
            CERTIFICATIONS: '/api/system/trainer/certifications/',
            GALLERY: '/api/system/trainer/gallery/',

            // ── Weekly Schedule ───────────────────────────────────────────────────
            // GET  /api/trainer/schedule/       → fetch trainer's 7-day recurring schedule
            // PUT  /api/trainer/schedule/       → replace full 7-day schedule (always all 7 days)
            SCHEDULE: '/api/trainer/schedule/',

            // ── Availability Overrides (specific unavailable dates) ────────────────
            // GET    /api/trainer/availability/overrides/?month=YYYY-MM  → list overrides (filter by month)
            // POST   /api/trainer/availability/overrides/                → block a specific date
            // PATCH  /api/trainer/availability/overrides/{id}/           → update reason for a blocked date
            // DELETE /api/trainer/availability/overrides/{id}/           → unblock a specific date
            AVAILABILITY_OVERRIDES: '/api/trainer/availability/overrides/',

            // ── Schedule Overrides (custom weekly schedule for a date range) ───────
            // GET    /api/trainer/schedule-overrides/?month=YYYY-MM  → list (filter by month)
            // POST   /api/trainer/schedule-overrides/                → create for a date range
            // PUT    /api/trainer/schedule-overrides/{id}/           → update an existing override
            // DELETE /api/trainer/schedule-overrides/{id}/           → remove an override
            SCHEDULE_OVERRIDES: '/api/trainer/schedule-overrides/',

            // ── Presets (client-side only — no backend storage needed) ────────────
            // Presets are hardcoded templates on the frontend. Applying a preset
            // fills the Daily tab with slot values; trainer must tap Save to persist.
            PRESETS: '/api/trainer/schedule/presets/',
        },
        TOKEN: {
            REFRESH: '/api/token/refresh/',
        },
    },
} as const;
