import { submitMockBooking } from '@/mockData/clientBooking.mock';
import type { Booking, BookingRequest } from '@/types/clientTypes';

/**
 * All booking-related API calls for the client side.
 * Swap mock implementations with real API calls here when the backend is ready.
 */
export const clientBookingService = {
    submitBooking: (request: BookingRequest): Promise<Booking> =>
        submitMockBooking(request),
};
