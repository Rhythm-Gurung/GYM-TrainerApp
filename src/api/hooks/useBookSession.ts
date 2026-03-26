import { useCallback } from 'react';

import { clientService } from '@/api/services/client.service';
import { mapApiTrainer } from '@/types/clientTypes';
import type { ApiAvailableSlotsResponse, Booking, PaymentInitiateResponse, PaymentStatusResponse, Trainer } from '@/types/clientTypes';

import { useApiMutation } from './useApiMutation';
import { useApiQuery } from './useApiQuery';

// ─── Trainer detail ───────────────────────────────────────────────────────────

/**
 * Fetches a single trainer's full profile (includes schedule, certs, gallery).
 * Maps ApiTrainer → Trainer so screens don't need to know the raw shape.
 */
export function useTrainerDetail(id: string | undefined) {
    const queryFn = useCallback(
        () => clientService.getTrainerDetail(id!).then(mapApiTrainer),
        [id],
    );
    return useApiQuery<Trainer>(
        `trainer-detail-${id}`,
        queryFn,
        { enabled: !!id, staleTime: 60_000 },
    );
}

// ─── Available dates ──────────────────────────────────────────────────────────

/**
 * Fetches dates the trainer is available to book for a given year+month.
 * Returns ISO strings e.g. ["2026-03-25", "2026-03-26"].
 */
export function useAvailableDates(
    id: string | undefined,
    year: number,
    month: number,
) {
    const queryFn = useCallback(
        () => clientService.getAvailableDates(id!, year, month),
        [id, year, month],
    );
    return useApiQuery<string[]>(
        `available-dates-${id}-${year}-${month}`,
        queryFn,
        { enabled: !!id, staleTime: 60_000, showErrorToast: false },
    );
}

// ─── Available slots ──────────────────────────────────────────────────────────

/**
 * Fetches available time slots for a trainer on a specific date.
 * Returns the full response including session_mode and is_booked per slot.
 * Pass `date` as null / undefined to skip the fetch.
 */
export function useAvailableSlots(
    id: string | undefined,
    date: string | null | undefined,
) {
    const queryFn = useCallback(
        () => clientService.getAvailableSlots(id!, date!),
        [id, date],
    );
    return useApiQuery<ApiAvailableSlotsResponse>(
        `available-slots-${id}-${date}`,
        queryFn,
        { enabled: !!id && !!date, staleTime: 30_000, showErrorToast: false },
    );
}

// ─── Bookings list ────────────────────────────────────────────────────────────

/**
 * Fetches the authenticated client's own bookings.
 */
export function useBookings() {
    return useApiQuery<Booking[]>(
        'client-bookings',
        clientService.getBookings,
        { staleTime: 30_000 },
    );
}

// ─── Cancel booking ───────────────────────────────────────────────────────────

/**
 * Mutation to cancel a booking by id.
 * Returns the updated Booking so callers can check for 'refund_pending' status.
 */
export function useCancelBooking() {
    return useApiMutation<Booking, string>(
        (id) => clientService.cancelBooking(id),
    );
}

// ─── Payment ──────────────────────────────────────────────────────────────────

/**
 * Mutation to initiate a Khalti payment for an accepted booking.
 * Call with the booking id (string). Returns { pidx, payment_url, payment_id }.
 */
export function useInitiatePayment() {
    return useApiMutation<PaymentInitiateResponse, string>(clientService.initiatePayment);
}

/**
 * One-shot query to check the payment + booking status after the WebView closes.
 * Pass bookingId=undefined/null to disable.
 */
export function usePaymentStatus(bookingId: string | null | undefined) {
    const queryFn = useCallback(
        () => clientService.getPaymentStatus(bookingId!),
        [bookingId],
    );
    return useApiQuery<PaymentStatusResponse>(
        `payment-status-${bookingId}`,
        queryFn,
        { enabled: !!bookingId, staleTime: 0, showErrorToast: false },
    );
}
