import { apiClient } from '@/api/client';
import { API_CONFIG } from '@/constants/config';
import { mapApiBooking } from '@/types/clientTypes';
import type { ClientProfileEditForm, User } from '@/types/authTypes';
import type { ApiAvailableSlotsResponse, ApiCertification, ApiGalleryItem, ApiReviewsResponse, ApiTrainer, Booking, BookingSessionMode, PaymentInitiateResponse, PaymentStatusResponse } from '@/types/clientTypes';

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
};
