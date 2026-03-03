import type { Booking, BookingRequest } from '@/types/clientTypes';

/**
 * Simulates a 1.2 s network delay for booking submission.
 * For multi-day requests the mock returns a single Booking record
 * anchored to the first date; the real API will create one record per date.
 */
export const submitMockBooking = (request: BookingRequest): Promise<Booking> =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: `b${Date.now()}`,
                clientId: 'u1', // mocked current user
                trainerId: request.trainerId,
                trainerName: request.trainerName,
                date: request.dates[0],
                startTime: request.startTime,
                endTime: request.endTime,
                status: 'pending',
                totalAmount: request.totalAmount,
                createdAt: new Date().toISOString(),
            });
        }, 1200);
    });
