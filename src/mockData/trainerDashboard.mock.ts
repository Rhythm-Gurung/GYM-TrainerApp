import type { AppNotification, EarningsSummary } from '@/types/clientTypes';
import type { TrainerSession } from '@/types/trainerTypes';

export const MOCK_TRAINER_SESSIONS: TrainerSession[] = [
    {
        id: 's1',
        clientName: 'Aayush Karki',
        clientId: 'c1',
        date: '2026-02-22',
        startTime: '09:00',
        endTime: '10:00',
        status: 'confirmed',
        totalAmount: 1200,
    },
    {
        id: 's2',
        clientName: 'Mina Gurung',
        clientId: 'c2',
        date: '2026-02-22',
        startTime: '11:00',
        endTime: '12:00',
        status: 'pending',
        totalAmount: 1200,
    },
    {
        id: 's3',
        clientName: 'Rajan Tamang',
        clientId: 'c3',
        date: '2026-02-23',
        startTime: '14:00',
        endTime: '15:00',
        status: 'confirmed',
        totalAmount: 1200,
    },
];

export const MOCK_TRAINER_EARNINGS: EarningsSummary = {
    totalEarnings: 45000,
    pendingPayouts: 12000,
    completedPayouts: 33000,
    commissionRate: 15,
    commissionPaid: 6750,
};

export const MOCK_TRAINER_NOTIFICATIONS: AppNotification[] = [
    {
        id: 'tn1',
        type: 'booking',
        title: 'New Session Request',
        message: 'Aayush Karki has requested a session on Feb 22 at 9:00 AM.',
        isRead: false,
        createdAt: '2026-02-20T08:30:00Z',
    },
    {
        id: 'tn2',
        type: 'payment',
        title: 'Payment Received',
        message: '₹1,200 credited for your session with Mina Gurung.',
        isRead: false,
        createdAt: '2026-02-19T15:00:00Z',
    },
    {
        id: 'tn3',
        type: 'review',
        title: 'New Review',
        message: 'Rajan Tamang left you a 5-star review. Keep up the great work!',
        isRead: true,
        createdAt: '2026-02-18T11:20:00Z',
    },
    {
        id: 'tn4',
        type: 'booking',
        title: 'Session Cancelled',
        message: 'Sita Rai has cancelled the session scheduled for Feb 21.',
        isRead: true,
        createdAt: '2026-02-17T09:45:00Z',
    },
    {
        id: 'tn5',
        type: 'system',
        title: 'Profile Verified',
        message: 'Your trainer profile has been verified. Clients can now discover you.',
        isRead: true,
        createdAt: '2026-02-15T14:00:00Z',
    },
];

export const MOCK_UNREAD_NOTIFICATIONS = 2;

export const MOCK_TOTAL_SESSIONS = 28;
export const MOCK_AVG_RATING = 4.8;

export const fetchMockTrainerDashboard = (): Promise<{
    sessions: TrainerSession[];
    earnings: EarningsSummary;
}> =>
    new Promise((resolve) => {
        setTimeout(
            () => resolve({ sessions: MOCK_TRAINER_SESSIONS, earnings: MOCK_TRAINER_EARNINGS }),
            600,
        );
    });
