import type { TrainerSession } from '@/types/trainerTypes';

// New minimalistic 4-tab approach
export type BookingFilterStatus = 'all' | 'active' | 'completed' | 'issues';

export interface StatusTab {
    label: string;
    value: BookingFilterStatus;
}

export const STATUS_TABS: StatusTab[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Issues', value: 'issues' },
];

// Status groupings
type SessionStatus = TrainerSession['status'];
export const ACTIVE_STATUSES: SessionStatus[] = ['pending', 'accepted', 'confirmed', 'in_progress'];
export const COMPLETED_STATUSES: SessionStatus[] = ['completed'];
export const ISSUES_STATUSES: SessionStatus[] = ['disputed', 'no_show_client', 'session_was_taken_but_not_end_by_client', 'missed', 'cancelled', 'refund_pending', 'refunded'];

// Helper to check if a session matches a filter
export function sessionMatchesFilter(status: SessionStatus, filter: BookingFilterStatus): boolean {
    if (filter === 'all') return true;
    if (filter === 'active') return ACTIVE_STATUSES.includes(status);
    if (filter === 'completed') return COMPLETED_STATUSES.includes(status);
    if (filter === 'issues') return ISSUES_STATUSES.includes(status);
    return false;
}
