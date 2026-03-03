import type { Ionicons } from '@expo/vector-icons';

export interface EarningsStatConfig {
    id: 'earnings' | 'pending' | 'completed' | 'commission';
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
}

export const EARNINGS_STAT_CONFIGS: EarningsStatConfig[] = [
    { id: 'earnings', title: 'Total Earnings', icon: 'cash-outline' },
    { id: 'pending', title: 'Pending Payout', icon: 'time-outline' },
    { id: 'completed', title: 'Completed', icon: 'wallet-outline' },
    { id: 'commission', title: 'Commission', icon: 'trending-up-outline' },
];
