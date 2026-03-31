import { apiClient } from '@/api/client';
import { API_CONFIG } from '@/constants/config';
import type { ClientProfileEditForm, User } from '@/types/authTypes';
import type { ApiAvailableSlotsResponse, ApiCertification, ApiGalleryItem, ApiReviewsResponse, ApiTrainer, Booking, BookingSessionMode, BookingStatus, BulkPaymentInitiateRequest, BulkPaymentInitiateResponse, BulkPaymentStatusResponse, PaymentInitiateResponse, PaymentStatusResponse } from '@/types/clientTypes';
import { mapApiBooking } from '@/types/clientTypes';

export interface BookingStats {
    totalCount: number;
    completedCount: number;
}

export interface TrainerListParams {
    search?: string;
    session_type?: string;
    expertise?: string;
    location?: string;
    min_price?: number;
    max_price?: number;
    verified?: boolean;
}

export const clientService = {
    // ── Client Profile ────────────────────────────────────────────────────────

    /**
     * Fetch the authenticated client's full profile.
     * GET /api/system/client/profile/
     */
    getClientProfile: async (): Promise<User> => {
        const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.CLIENT.PROFILE);
        return data?.data ?? data;
    },

    /**
     * Partially update the client's profile.
     * PATCH /api/system/client/profile/
     * Send only the fields that changed (all optional).
     */
    patchClientProfile: async (input: Partial<ClientProfileEditForm>): Promise<User> => {
        const { data } = await apiClient.patch(API_CONFIG.ENDPOINTS.CLIENT.PROFILE, input);
        return data?.data ?? data;
    },

    /**
     * Upload / replace the client's profile image.
     * PUT /api/system/client/profile-image/  (multipart/form-data, field: profile_image)
     */
    uploadClientProfileImage: async (file: { uri: string; name: string; type: string }): Promise<void> => {
        const formData = new FormData();
        formData.append('profile_image', {
            uri: file.uri,
            name: file.name,
            type: file.type,
        } as unknown as Blob);
        await apiClient.put(API_CONFIG.ENDPOINTS.CLIENT.PROFILE_IMAGE, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    /**
     * Remove the client's profile image.
     * DELETE /api/system/client/profile-image/
     */
    deleteClientProfileImage: async (): Promise<void> => {
        await apiClient.delete(API_CONFIG.ENDPOINTS.CLIENT.PROFILE_IMAGE);
    },

    /**
     * Returns the full URL to the client profile image endpoint.
     * Use with an Authorization header (ExpoImage / Image).
     */
    getClientProfileImageUrl: (): string =>
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.PROFILE_IMAGE}`,

    /**
     * List trainers. Accepts optional filter params that map to the API query string.
     */
    getTrainers: async (params?: TrainerListParams): Promise<ApiTrainer[]> => {
        const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.CLIENT.TRAINERS, { params });
        const result = data?.data ?? data?.results ?? data;
        return Array.isArray(result) ? result : [];
    },

    /**
     * Fetch full trainer detail by id (includes certifications, gallery, schedule).
     */
    getTrainerDetail: async (id: string): Promise<ApiTrainer> => {
        const { data } = await apiClient.get(`${API_CONFIG.ENDPOINTS.CLIENT.TRAINERS}${id}/`);
        return data?.data ?? data;
    },

    /**
     * Fetch reviews for a trainer.
     * Response: { count, average_rating, data: ApiReview[] }
     */
    getTrainerReviews: async (id: string): Promise<ApiReviewsResponse> => {
        const { data } = await apiClient.get(
            `${API_CONFIG.ENDPOINTS.CLIENT.TRAINER_REVIEWS}${id}/reviews/`,
        );
        return data;
    },

    /**
     * Post a review for a trainer.
     * Returns 409 if the authenticated user already reviewed this trainer.
     */
    postReview: async (id: string, rating: number, comment: string): Promise<void> => {
        await apiClient.post(
            `${API_CONFIG.ENDPOINTS.CLIENT.TRAINER_REVIEWS}${id}/reviews/`,
            { rating, comment },
        );
    },

    /**
     * Toggle favourite on a trainer.
     * No body needed — API toggles the state and returns { is_favourited: boolean }.
     */
    toggleFavourite: async (id: string): Promise<{ is_favourited: boolean }> => {
        const { data } = await apiClient.post(
            `${API_CONFIG.ENDPOINTS.CLIENT.TRAINER_FAVOURITE}${id}/favourite/`,
        );
        return data?.data ?? data;
    },

    /**
     * Fetch the authenticated client's favourited trainers.
     * Same shape as the trainer list response.
     */
    getFavourites: async (): Promise<ApiTrainer[]> => {
        const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.CLIENT.FAVOURITES);
        const result = data?.data ?? data?.results ?? data;
        return Array.isArray(result) ? result : [];
    },

    /**
     * Fetch a trainer's gallery images.
     * GET /api/trainers/{id}/gallery/
     */
    getTrainerGallery: async (id: string): Promise<ApiGalleryItem[]> => {
        const { data } = await apiClient.get(`${API_CONFIG.ENDPOINTS.CLIENT.TRAINERS}${id}/gallery/`);
        const result = data?.data ?? data?.results ?? data;
        return Array.isArray(result) ? result : [];
    },

    /**
     * Fetch a trainer's certifications.
     * GET /api/trainers/{id}/certifications/
     */
    getTrainerCertifications: async (id: string): Promise<ApiCertification[]> => {
        const { data } = await apiClient.get(`${API_CONFIG.ENDPOINTS.CLIENT.TRAINERS}${id}/certifications/`);
        const result = data?.data ?? data?.results ?? data;
        return Array.isArray(result) ? result : [];
    },

    // ── Availability & Booking ────────────────────────────────────────────────

    /**
     * Fetch dates the trainer is available to book for a given month.
     * Response shape: { data: { available_dates: ["2026-03-24", ...] } }
     * GET /api/trainers/{id}/available-dates/?year=&month=
     */
    getAvailableDates: async (id: string, year: number, month: number): Promise<string[]> => {
        const { data } = await apiClient.get(
            `${API_CONFIG.ENDPOINTS.CLIENT.TRAINERS}${id}/available-dates/`,
            { params: { year, month } },
        );
        // Unwrap: { data: { available_dates: [...] } }
        const result = data?.data?.available_dates ?? data?.data ?? data?.results ?? data;
        return Array.isArray(result) ? result : [];
    },

    /**
     * Fetch available time slots for a trainer on a specific date.
     * Response shape: { data: { date, is_available, session_mode, slots: [...] } }
     * GET /api/trainers/{id}/available-slots/?date=
     */
    getAvailableSlots: async (id: string, date: string): Promise<ApiAvailableSlotsResponse> => {
        const { data } = await apiClient.get(
            `${API_CONFIG.ENDPOINTS.CLIENT.TRAINERS}${id}/available-slots/`,
            { params: { date } },
        );
        return data?.data ?? data;
    },

    /**
     * Book a single session with a trainer.
     * POST /api/trainers/{id}/book/
     */
    bookSession: async (
        id: string,
        payload: {
            date: string;
            start_time: string;
            end_time: string;
            session_mode: BookingSessionMode;
            notes?: string;
            total_amount?: number;
        },
    ): Promise<Booking> => {
        const { data } = await apiClient.post(
            `${API_CONFIG.ENDPOINTS.CLIENT.TRAINERS}${id}/book/`,
            payload,
        );
        const booking = mapApiBooking(data?.data ?? data);
        // If backend returns 0, fall back to the client-computed amount
        if (!booking.totalAmount && payload.total_amount) {
            booking.totalAmount = payload.total_amount;
        }
        return booking;
    },

    /**
     * Fetch the authenticated client's bookings.
     * GET /api/bookings/
     */
    getBookings: async (): Promise<Booking[]> => {
        const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.CLIENT.BOOKINGS);
        const result = data?.data ?? data?.results ?? data;
        return Array.isArray(result) ? result.map(mapApiBooking) : [];
    },

    /**
     * Fetch global booking stats across the whole system.
     * GET /api/bookings/stats/
     * Expected: { data: { total_count, completed_count } } (but we also accept a few common variants).
     */
    getBookingsStats: async (): Promise<BookingStats> => {
        const { data } = await apiClient.get(API_CONFIG.ENDPOINTS.CLIENT.BOOKINGS_STATS);
        const raw = (data?.data ?? data) as Record<string, unknown>;

        const totalRaw = raw.total_count ?? raw.totalCount ?? 0;
        const completedRaw = raw.completed_count ?? raw.completedCount ?? 0;

        const totalCount = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw ?? 0);
        const completedCount = typeof completedRaw === 'number' ? completedRaw : Number(completedRaw ?? 0);

        return {
            totalCount: Number.isFinite(totalCount) ? totalCount : 0,
            completedCount: Number.isFinite(completedCount) ? completedCount : 0,
        };
    },

    /**
     * Cancel a booking by id.
     * POST /api/bookings/{id}/cancel/
     * Returns the updated booking — status is 'cancelled' (pre-payment) or 'refund_pending' (post-payment).
     */
    cancelBooking: async (id: string, reason?: string): Promise<Booking> => {
        const { data } = await apiClient.post(
            `${API_CONFIG.ENDPOINTS.CLIENT.BOOKINGS}${id}/cancel/`,
            reason ? { reason } : {},
        );
        return mapApiBooking(data?.data ?? data);
    },

    /**
     * Initiate a Khalti payment for an accepted booking.
     * POST /api/payment/initiate/
     * Only valid when booking.status === 'accepted'.
     */
    initiatePayment: async (bookingId: string): Promise<PaymentInitiateResponse> => {
        const { data } = await apiClient.post(API_CONFIG.ENDPOINTS.PAYMENT.INITIATE, {
            booking_id: Number(bookingId),
        });
        return data;
    },

    /**
     * Poll payment + booking status after the Khalti WebView closes.
     * GET /api/payment/status/{booking_id}/
     */
    getPaymentStatus: async (bookingId: string): Promise<PaymentStatusResponse> => {
        const { data } = await apiClient.get(
            `${API_CONFIG.ENDPOINTS.PAYMENT.STATUS}${bookingId}/`,
        );
        return data;
    },

    /**
     * Initiate one payment for multiple accepted bookings.
     * POST /api/payment/bulk/initiate/
     * Frontend sends only booking ids; backend calculates payable amount.
     */
    initiateBulkPayment: async (
        input: BulkPaymentInitiateRequest,
    ): Promise<BulkPaymentInitiateResponse> => {
        const payload = {
            booking_ids: input.bookingIds.map((id) => Number(id)),
        };
        const headers: Record<string, string> = {};
        if (input.idempotencyKey) {
            headers['Idempotency-Key'] = input.idempotencyKey;
        }

        const { data } = await apiClient.post(
            API_CONFIG.ENDPOINTS.PAYMENT.BULK_INITIATE,
            payload,
            { headers },
        );

        const raw = (data?.data ?? data ?? {}) as Record<string, unknown>;
        const payment_group_id = String(raw.payment_group_id ?? raw.paymentGroupId ?? raw.group_id ?? '');
        const payment_url = String(raw.payment_url ?? raw.paymentUrl ?? '');

        return {
            payment_group_id,
            payment_url,
            pidx: typeof raw.pidx === 'string' ? raw.pidx : undefined,
            amount: typeof raw.amount === 'number' ? raw.amount : Number(raw.amount ?? 0) || undefined,
            currency: typeof raw.currency === 'string' ? raw.currency : undefined,
            expires_at: typeof raw.expires_at === 'string' ? raw.expires_at : undefined,
        };
    },

    /**
     * Get payment status for a bulk payment group.
     * GET /api/payment/bulk/status/{payment_group_id}/
     */
    getBulkPaymentStatus: async (paymentGroupId: string): Promise<BulkPaymentStatusResponse> => {
        const { data } = await apiClient.get(
            `${API_CONFIG.ENDPOINTS.PAYMENT.BULK_STATUS}${paymentGroupId}/`,
        );

        const raw = (data?.data ?? data ?? {}) as Record<string, unknown>;
        const rawBookings = (
            raw.bookings
            ?? raw.items
            ?? raw.booking_statuses
            ?? []
        ) as Array<Record<string, unknown>>;

        return {
            payment_group_id: String(raw.payment_group_id ?? raw.paymentGroupId ?? paymentGroupId),
            status: String(raw.status ?? raw.group_status ?? 'initiated'),
            bookings: rawBookings.map((item) => ({
                bookingId: String(item.booking_id ?? item.bookingId ?? item.id ?? ''),
                status: String(item.status ?? item.booking_status ?? 'initiated') as BookingStatus,
            })),
        };
    },
};
