import { useApiMutation } from './useApiMutation';
import { useApiQuery } from './useApiQuery';

import { trainerService } from '@/api/services/trainer.service';
import type { TrainerSession } from '@/types/trainerTypes';

export function useTrainerBookings() {
    return useApiQuery<TrainerSession[]>(
        'trainer-bookings',
        () => trainerService.getBookings(),
        {
            // Keep defaults: showErrorToast=true so screens don't need extra plumbing.
            refetchOnMount: true,
        },
    );
}

/**
 * Mutation to accept a pending booking.
 * POST /api/trainer/bookings/{id}/confirm/
 */
export function useConfirmBooking() {
    return useApiMutation<void, string>(trainerService.confirmBooking);
}

/**
 * Mutation to reject / cancel a booking as the trainer.
 * POST /api/trainer/bookings/{id}/cancel/
 */
export function useCancelTrainerBooking() {
    return useApiMutation<void, { id: string; reason: string }>(
        ({ id, reason }) => trainerService.cancelBookingById(id, reason),
    );
}
