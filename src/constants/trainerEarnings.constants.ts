import type { Ionicons } from '@expo/vector-icons';

export interface EarningsStatConfig {
    id: 'total_earned' | 'pending_transfer' | 'on_hold' | 'total_bookings';
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
}

export const EARNINGS_STAT_CONFIGS: EarningsStatConfig[] = [
    { id: 'total_earned', title: 'Total Earned', icon: 'cash-outline' },
    { id: 'pending_transfer', title: 'Pending Transfer', icon: 'time-outline' },
    { id: 'on_hold', title: 'On Hold', icon: 'lock-closed-outline' },
    { id: 'total_bookings', title: 'Bookings Paid', icon: 'wallet-outline' },
];
