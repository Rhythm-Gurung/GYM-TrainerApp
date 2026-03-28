import { useApiMutation } from './useApiMutation';
import { useApiQuery } from './useApiQuery';

import { trainerService } from '@/api/services/trainer.service';
import type { TrainerSession } from '@/types/trainerTypes';

export interface TrainerProfileStats {
    avg_rating: number | null;
}

export function useTrainerProfile() {
    return useApiQuery<TrainerProfileStats>(
        'trainer-profile-stats',
        async () => {
            const raw = await trainerService.getProfile() as Record<string, unknown>;
            // Accept multiple potential shapes:
            // - whoami unwrapped user object: { ..., avg_rating }
            // - wrapped: { user: { avg_rating } }
            // - nested: { data: { avg_rating } }
            const nested = (raw?.data ?? raw?.results ?? raw?.user ?? raw?.trainer ?? raw?.profile) as Record<string, unknown> | undefined;
            const val = raw?.avg_rating ?? nested?.avg_rating;
            let avg_rating: number | null = null;
            if (typeof val === 'number') avg_rating = val;
            else if (typeof val === 'string') avg_rating = parseFloat(val) || null;
            return { avg_rating };
        },
        { refetchOnMount: true, showErrorToast: false },
    );
}

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
