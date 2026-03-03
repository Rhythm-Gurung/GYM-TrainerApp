import { clientBookingService } from '@/api/services/clientBooking.service';
import type { Booking, BookingRequest } from '@/types/clientTypes';
import { useApiMutation } from './useApiMutation';

/**
 * Hook for submitting a client session booking.
 *
 * Returns the full `useApiMutation` result:
 *   { mutateAsync, isLoading, isError, isSuccess, data, reset }
 *
 * Error toasts are shown automatically by `useApiMutation`.
 */
export function useClientBooking() {
    return useApiMutation<Booking, BookingRequest>(
        clientBookingService.submitBooking,
    );
}
