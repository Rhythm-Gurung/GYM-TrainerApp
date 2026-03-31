import { useCallback } from 'react';

import { bookingChatService, type BookingChatMessage, type BookingChatSession } from '@/api/services/bookingChat.service';

import { useApiMutation } from './useApiMutation';
import { useApiQuery } from './useApiQuery';

const SESSIONS_QUERY_OPTIONS = { staleTime: 15_000 };

export function useBookingChatSessions() {
    return useApiQuery<BookingChatSession[]>(
        'booking-chat-sessions',
        bookingChatService.getSessions,
        SESSIONS_QUERY_OPTIONS,
    );
}

export function useBookingChatHistory(bookingId: string | undefined) {
    const queryFn = useCallback(
        () => bookingChatService.getHistory(bookingId!),
        [bookingId],
    );

    return useApiQuery<BookingChatMessage[]>(
        `booking-chat-history-${bookingId}`,
        queryFn,
        {
            enabled: !!bookingId,
            staleTime: 0,
            showErrorToast: false,
        },
    );
}

export function useMarkBookingChatRead() {
    return useApiMutation<number, { bookingId: string; messageIds?: number[] }>(
        ({ bookingId, messageIds }) => bookingChatService.markAsRead(bookingId, messageIds),
    );
}
