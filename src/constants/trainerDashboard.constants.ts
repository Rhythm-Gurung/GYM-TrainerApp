import { type Ionicons } from '@expo/vector-icons';

import { colors } from '@/constants/theme';

// ─── Stats Cards ──────────────────────────────────────────────────────────────

export interface StatCardConfig {
    id: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
}

export const STAT_CARD_CONFIGS: StatCardConfig[] = [
    { id: 'earnings', title: 'Total Earnings', icon: 'cash-outline' },
    { id: 'pending', title: 'Pending', icon: 'time-outline' },
    { id: 'sessions', title: 'Sessions', icon: 'calendar-outline' },
    { id: 'rating', title: 'Avg Rating', icon: 'star-outline' },
];

// ─── Quick Actions ────────────────────────────────────────────────────────────

export interface QuickActionConfig {
    id: 'accept' | 'clients' | 'analytics';
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    iconColor: string;
    iconBg: string;
}

export const QUICK_ACTION_CONFIGS: QuickActionConfig[] = [
    {
        id: 'accept',
        icon: 'checkmark-circle-outline',
        label: 'Accept',
        iconColor: colors.success,
        iconBg: colors.statusNewBg,
    },
    {
        id: 'clients',
        icon: 'people-outline',
        label: 'Clients',
        iconColor: colors.action,
        iconBg: colors.actionBg,
    },
    {
        id: 'analytics',
        icon: 'trending-up-outline',
        label: 'Analytics',
        iconColor: colors.accent,
        iconBg: colors.accentBg,
    },
];
