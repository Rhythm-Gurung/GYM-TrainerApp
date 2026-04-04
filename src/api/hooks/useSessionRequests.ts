import { useCallback } from 'react';

import { clientService } from '@/api/services/client.service';
import { trainerService } from '@/api/services/trainer.service';
import type { SessionRequest, SessionRequestAction, SessionRequestType } from '@/types/clientTypes';

import { useApiMutation } from './useApiMutation';
import { useApiQuery } from './useApiQuery';

export function useBookingSessionRequests(bookingId: string | undefined) {
    const queryFn = useCallback(
        () => clientService.getSessionRequests(bookingId!),
        [bookingId],
    );

    return useApiQuery<SessionRequest[]>(
        `booking-session-requests-${bookingId}`,
        queryFn,
        {
            enabled: !!bookingId,
            staleTime: 5_000,
            showErrorToast: false,
        },
    );
}

export function useCreateTrainerSessionRequest() {
    return useApiMutation<void, { bookingId: string; requestType: SessionRequestType }>(
        ({ bookingId, requestType }) => trainerService.createSessionRequest(bookingId, requestType),
    );
}

export function useRespondSessionRequest() {
    return useApiMutation<SessionRequest, {
        bookingId: string;
        requestId: string;
        action: SessionRequestAction;
        reason?: string;
    }>(
        ({ bookingId, requestId, action, reason }) => (
            clientService.respondSessionRequest(bookingId, requestId, action, reason)
        ),
    );
}
