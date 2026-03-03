import type { EarningsSummary } from '@/types/clientTypes';
import type { Transaction } from '@/types/trainerTypes';

import { MOCK_TRAINER_EARNINGS } from './trainerDashboard.mock';

export const MOCK_EARNINGS_TRANSACTIONS: Transaction[] = [
    {
        id: 't1',
        description: 'Session with Aayush Karki',
        amount: 1200,
        type: 'credit',
        date: '2026-02-20',
    },
    {
        id: 't2',
        description: 'Platform Commission',
        amount: -180,
        type: 'debit',
        date: '2026-02-20',
    },
    {
        id: 't3',
        description: 'Session with Mina Gurung',
        amount: 1500,
        type: 'credit',
        date: '2026-02-18',
    },
    {
        id: 't4',
        description: 'Payout to Bank',
        amount: -2520,
        type: 'debit',
        date: '2026-02-17',
    },
    {
        id: 't5',
        description: 'Session with Rajan Tamang',
        amount: 1200,
        type: 'credit',
        date: '2026-02-15',
    },
    {
        id: 't6',
        description: 'Platform Commission',
        amount: -225,
        type: 'debit',
        date: '2026-02-15',
    },
];

export const fetchMockEarnings = (): Promise<{
    earnings: EarningsSummary;
    transactions: Transaction[];
}> =>
    new Promise((resolve) => {
        setTimeout(
            () => resolve({ earnings: MOCK_TRAINER_EARNINGS, transactions: MOCK_EARNINGS_TRANSACTIONS }),
            500,
        );
    });
