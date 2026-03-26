import type { Booking, BookingRequest } from '@/types/clientTypes';
import { clientService } from './client.service';

/**
 * All booking-related API calls for the client side.
 * For multi-day requests, fires one POST per date in parallel and returns
 * the first resolved booking (the UI only needs one for the toast/nav).
 */
export const clientBookingService = {
    submitBooking: async (request: BookingRequest): Promise<Booking> => {
        const results = await Promise.all(
            request.dates.map((date) =>
                clientService.bookSession(request.trainerId, {
                    date,
                    start_time: request.startTime,
                    end_time: request.endTime,
                    session_mode: request.sessionMode,
                    notes: request.notes,
                }),
            ),
        );
        return results[0];
    },
};
