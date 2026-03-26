import type { TrainerSession } from '@/types/trainerTypes';

export type BookingFilterStatus = TrainerSession['status'] | 'all';

export interface StatusTab {
    label: string;
    value: BookingFilterStatus;
}

export const STATUS_TABS: StatusTab[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
];
