import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTabBarHeight } from '@/hooks/useTabBarHeight';

import { useAuth } from '@/contexts/auth';
import { showErrorToast, showSuccessToast } from '@/lib';

interface SettingItem {
    id: string;
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
}

export default function Settings() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const { authState: { user } } = useAuth();

    // TODO: Replace with actual API call to get settings
    const [autoUserNumbering, setAutoUserNumbering] = useState(true);
    const [notifications, setNotifications] = useState(false);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    const handleSettingChange = async (
        settingId: string,
        value: boolean,
        setter: (value: boolean) => void,
    ) => {
        try {
            setter(value);
            // TODO: Implement API call to update setting
            // await updateSetting(settingId, value);

            showSuccessToast('Setting updated successfully', 'Success');
        } catch {
            // Revert on error
            setter(!value);
            showErrorToast('Failed to update setting', 'Error');
        }
    };

    const settings: SettingItem[] = [
        {
            id: 'auto-user-numbering',
            label: 'Auto- User Numbering',
            value: autoUserNumbering,
            onChange: (value) =>
                handleSettingChange('auto-user-numbering', value, setAutoUserNumbering),
        },
        {
            id: 'notifications',
            label: 'Push Notifications',
            value: notifications,
            onChange: (value) =>
                handleSettingChange('notifications', value, setNotifications),
        },
        {
            id: 'email-alerts',
            label: 'Email Alerts',
            value: emailAlerts,
            onChange: (value) =>
                handleSettingChange('email-alerts', value, setEmailAlerts),
        },
        {
            id: 'dark-mode',
            label: 'Dark Mode',
            value: darkMode,
            onChange: (value) => handleSettingChange('dark-mode', value, setDarkMode),
        },
    ];

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 px-6 py-8">
                    {/* Header */}
                    <View className="flex-row items-center mb-6">
                        <TouchableOpacity onPress={handleBack} className="mr-4">
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
                    </View>

                    {/* Profile Section */}
                    <View className="items-center mb-8">
                        {/* Profile Image */}
                        <View className="mb-4">
                            {user?.profile_image ? (
                                <Image
                                    source={{ uri: user.profile_image }}
                                    className="w-32 h-32 rounded-full"
                                />
                            ) : (
                                <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center">
                                    <Ionicons name="person" size={64} color="#9CA3AF" />
                                </View>
                            )}
                        </View>

                        {/* Business Name */}
                        <Text className="text-2xl font-bold text-gray-900 mb-6">
                            {user?.business_name || 'Vintuna Stores'}
                        </Text>
                    </View>

                    {/* Settings List */}
                    <View className="bg-white border border-gray-200 rounded-lg">
                        {settings.map((setting, index) => (
                            <View
                                key={setting.id}
                                className={`flex-row items-center justify-between px-4 py-4 ${
                                    index !== settings.length - 1
                                        ? 'border-b border-gray-100'
                                        : ''
                                }`}
                            >
                                <Text className="text-base text-gray-900 flex-1">
                                    {setting.label}
                                </Text>
                                <Switch
                                    value={setting.value}
                                    onValueChange={setting.onChange}
                                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                                    thumbColor={setting.value ? '#3B82F6' : '#F3F4F6'}
                                    ios_backgroundColor="#D1D5DB"
                                />
                            </View>
                        ))}
                    </View>

                    {/* Additional Settings Sections */}
                    <View className="mt-6">
                        <Text className="text-lg font-semibold text-gray-900 mb-3">
                            Account
                        </Text>
                        <View className="bg-white border border-gray-200 rounded-lg">
                            <TouchableOpacity
                                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
                                onPress={() => {
                                    // TODO: Navigate to change password
                                }}
                            >
                                <View className="flex-row items-center flex-1">
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color="#6B7280"
                                        style={{ marginRight: 12 }}
                                    />
                                    <Text className="text-base text-gray-900">
                                        Change Password
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-row items-center justify-between px-4 py-4"
                                onPress={() => {
                                    // TODO: Navigate to delete account
                                }}
                            >
                                <View className="flex-row items-center flex-1">
                                    <Ionicons
                                        name="trash-outline"
                                        size={20}
                                        color="#EF4444"
                                        style={{ marginRight: 12 }}
                                    />
                                    <Text className="text-base text-red-500">
                                        Delete Account
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
