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
            // NOTE: Backend currently does not expose /api/system/trainer/profile/.
            // Use WHOAMI for the logged-in trainer's profile info/stats.
            GET_PROFILE: '/api/system/auth/whoami/',
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

            // ── Bookings (trainer's incoming + assigned) ─────────────────────────
            // Trainer bookings list. Backend may reject the client-only /api/bookings/.
            BOOKINGS: '/api/trainer/bookings/',
        },
        CLIENT: {
            // ── Profile ───────────────────────────────────────────────────────────
            // GET   /api/system/client/profile/        → fetch full profile
            // PATCH /api/system/client/profile/        → update editable fields
            // GET   /api/system/client/profile-image/  → fetch binary image
            // PUT   /api/system/client/profile-image/  → upload / replace image (multipart)
            // DELETE /api/system/client/profile-image/ → remove profile image
            PROFILE: '/api/system/client/profile/',
            PROFILE_IMAGE: '/api/system/client/profile-image/',

            // ── Trainer discovery (client-facing) ─────────────────────────────────
            // GET  /api/trainers/                       → list trainers (with filter params)
            // GET  /api/trainers/{id}/                  → trainer detail (profile, certs, gallery, schedule)
            // GET  /api/trainers/{id}/available-dates/?year=&month=  → bookable dates
            // GET  /api/trainers/{id}/available-slots/?date=         → available time slots
            // POST /api/trainers/{id}/book/                          → create a booking
            TRAINERS: '/api/trainers/',
            TRAINER_REVIEWS: '/api/trainers/', // append `{id}/reviews/` in service
            TRAINER_FAVOURITE: '/api/trainers/', // append `{id}/favourite/` in service
            FAVOURITES: '/api/favourites/',

            // ── Bookings (client's own) ───────────────────────────────────────────
            // GET  /api/bookings/              → list my bookings
            // GET  /api/bookings/{id}/         → single booking detail
            // POST /api/bookings/{id}/cancel/  → cancel a booking (body: { reason? })
            BOOKINGS: '/api/bookings/',

            // ── Bookings stats (global) ─────────────────────────────────────────
            // GET /api/bookings/stats/ → aggregate counts across the whole system
            BOOKINGS_STATS: '/api/bookings/stats/',
        },
        PAYMENT: {
            // POST /api/payment/initiate/         → body: { booking_id } → returns { pidx, payment_url, payment_id }
            // GET  /api/payment/status/{booking_id}/  → payment + booking status
            // GET  /api/payment/trainer/earnings/ → trainer earnings summary + payout list
            INITIATE: '/api/payment/initiate/',
            STATUS: '/api/payment/status/',
            TRAINER_EARNINGS: '/api/payment/trainer/earnings/',
        },
        TOKEN: {
            REFRESH: '/api/token/refresh/',
        },

        NOTIFICATIONS: {
            LIST: '/api/notifications/',
            STATS: '/api/notifications/stats/',
            MARK_ALL_READ: '/api/notifications/mark-all-read/',
        },

        CHAT: {
            CLIENT_SIMPLE: '/api/chat/client/',
            CLIENT_HISTORY: '/api/chat/client/history/',
            TRAINER_SIMPLE: '/api/chat/trainer/',
            TRAINER_HISTORY: '/api/chat/trainer/history/',
        },
    },
} as const;
