import type { TrainerSession } from '@/types/trainerTypes';

export const MOCK_TRAINER_BOOKINGS: TrainerSession[] = [
    {
        id: 'b1',
        clientName: 'Aayush Karki',
        clientId: 'c1',
        date: '2026-02-22',
        startTime: '09:00',
        endTime: '10:00',
        status: 'pending',
        totalAmount: 1200,
    },
    {
        id: 'b2',
        clientName: 'Mina Gurung',
        clientId: 'c2',
        date: '2026-02-23',
        startTime: '11:00',
        endTime: '12:00',
        status: 'pending',
        totalAmount: 1500,
    },
    {
        id: 'b3',
        clientName: 'Rajan Tamang',
        clientId: 'c3',
        date: '2026-02-24',
        startTime: '14:00',
        endTime: '15:00',
        status: 'confirmed',
        totalAmount: 1200,
    },
    {
        id: 'b4',
        clientName: 'Anita Poudel',
        clientId: 'c6',
        date: '2026-02-25',
        startTime: '10:00',
        endTime: '11:00',
        status: 'confirmed',
        totalAmount: 1500,
    },
    {
        id: 'b5',
        clientName: 'Sita Rai',
        clientId: 'c4',
        date: '2026-02-19',
        startTime: '08:00',
        endTime: '09:00',
        status: 'completed',
        totalAmount: 1800,
    },
    {
        id: 'b6',
        clientName: 'Bikash Shrestha',
        clientId: 'c5',
        date: '2026-02-18',
        startTime: '16:00',
        endTime: '17:00',
        status: 'cancelled',
        totalAmount: 1200,
    },
];

export const fetchMockTrainerBookings = (): Promise<TrainerSession[]> =>
    new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_TRAINER_BOOKINGS), 500);
    });
