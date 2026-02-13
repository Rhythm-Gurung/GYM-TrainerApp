import { type Ionicons } from '@expo/vector-icons';
import type { Router } from 'expo-router';

export interface MenuItem {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    showChevron?: boolean;
}

export const getPrimaryMenuItems = (router: Router): MenuItem[] => [
    {
        id: 'messages',
        icon: 'chatbubble-outline',
        label: 'Messages',
        onPress: () => {
            // TODO: Navigate to messages
        },
        showChevron: true,
    },
    {
        id: 'switch-user',
        icon: 'people-outline',
        label: 'Switch User',
        onPress: () => {
            router.push('/profile/switchUser');
        },
        showChevron: true,
    },
    {
        id: 'billing',
        icon: 'card-outline',
        label: 'Billing Plans',
        onPress: () => {
            router.push('/profile/billingPlans');
        },
        showChevron: true,
    },
    {
        id: 'users',
        icon: 'person-outline',
        label: 'Users',
        onPress: () => {
            router.push('/profile/users');
        },
        showChevron: true,
    },
    {
        id: 'roles',
        icon: 'shield-checkmark-outline',
        label: 'Roles & Access',
        onPress: () => {
            router.push('/profile/rolesAccess');
        },
        showChevron: true,
    },
];

export const getSecondaryMenuItems = (
    handleLogout: () => void,
    router: Router,
): MenuItem[] => [
    {
        id: 'settings',
        icon: 'settings-outline',
        label: 'Settings',
        onPress: () => {
            router.push('/profile/settings');
        },
        showChevron: true,
    },
    {
        id: 'help',
        icon: 'help-circle-outline',
        label: 'Help center',
        onPress: () => {
            // TODO: Navigate to help center
        },
        showChevron: true,
    },
    {
        id: 'privacy',
        icon: 'shield-outline',
        label: 'Privacy Policy',
        onPress: () => {
            // TODO: Navigate to privacy policy
        },
        showChevron: true,
    },
    {
        id: 'terms',
        icon: 'document-text-outline',
        label: 'Terms & Conditions',
        onPress: () => {
            // TODO: Navigate to terms & conditions
        },
        showChevron: true,
    },
    {
        id: 'logout',
        icon: 'log-out-outline',
        label: 'Logout',
        onPress: handleLogout,
        showChevron: false,
    },
];
