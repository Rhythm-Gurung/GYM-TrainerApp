import { type Ionicons } from '@expo/vector-icons';
import type { Router } from 'expo-router';

export interface ClientMenuItem {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
}

export const getClientMenuItems = (router: Router): ClientMenuItem[] => [
    {
        id: 'edit-profile',
        icon: 'person-outline',
        label: 'Edit Profile',
        onPress: () => {
            // TODO: Navigate to client edit profile
        },
    },
    {
        id: 'change-password',
        icon: 'lock-closed-outline',
        label: 'Change Password',
        onPress: () => {
            router.push('/(auth)/changePassword' as never);
        },
    },
    {
        id: 'privacy',
        icon: 'eye-outline',
        label: 'Privacy Settings',
        onPress: () => {
            // TODO: Navigate to privacy settings
        },
    },
    {
        id: 'notifications',
        icon: 'notifications-outline',
        label: 'Notification Settings',
        onPress: () => {
            // TODO: Navigate to notification settings
        },
    },
    {
        id: 'security',
        icon: 'shield-outline',
        label: 'Security',
        onPress: () => {
            // TODO: Navigate to security
        },
    },
    {
        id: 'help',
        icon: 'help-circle-outline',
        label: 'Help & Support',
        onPress: () => {
            // TODO: Navigate to help & support
        },
    },
];
