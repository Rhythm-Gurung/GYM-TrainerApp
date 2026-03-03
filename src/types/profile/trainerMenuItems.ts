import { type Ionicons } from '@expo/vector-icons';
import type { Router } from 'expo-router';

export interface TrainerMenuItem {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
}

export const getTrainerMenuItems = (router: Router): TrainerMenuItem[] => [
    {
        id: 'edit-profile',
        icon: 'person-outline',
        label: 'Edit Profile',
        onPress: () => {
            // TODO: Navigate to trainer edit profile
        },
    },
    {
        id: 'certifications',
        icon: 'ribbon-outline',
        label: 'Certifications',
        onPress: () => {
            // TODO: Navigate to certifications
        },
    },
    {
        id: 'application-status',
        icon: 'clipboard-outline',
        label: 'Application Status',
        onPress: () => {
            // TODO: Navigate to application status
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
