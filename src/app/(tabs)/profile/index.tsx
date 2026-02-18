import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTabBarHeight } from '@/hooks/useTabBarHeight';

import { useAuth } from '@/contexts/auth';
import { showErrorToast, showSuccessToast } from '@/lib';
import type { User } from '@/types/authTypes';
import { getPrimaryMenuItems, getSecondaryMenuItems } from '@/types/profile/menuItems';


import { colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const { authState, logout, getProfile } = useAuth();
    const [userData, setUserData] = useState<User | null>(authState.user);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            setIsLoading(true);
            const profile = await getProfile();
            setUserData(profile);
        } catch {
            showErrorToast('Failed to load profile', 'Error');
        } finally {
            setIsLoading(false);
        }
    }, [getProfile]);

    useEffect(() => {
        if (!userData) {
            fetchProfile();
        }
    }, [userData, fetchProfile]);

    const handleLogout = useCallback(async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            showSuccessToast('Logged out successfully', 'Success');
            router.replace('/(auth)/login');
        } catch {
            showErrorToast('Failed to logout', 'Error');
        } finally {
            setIsLoggingOut(false);
        }
    }, [logout, router]);

    const primaryMenuItems = getPrimaryMenuItems(router);
    const secondaryMenuItems = getSecondaryMenuItems(handleLogout, router);

    const displayName = userData?.business_name || userData?.username || 'User';

    if (isLoading && !userData) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.action} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 px-6 py-8">
                    {/* Profile Header */}
                    <View className="items-center mb-8">
                        {/* Profile Image */}
                        <View className="mb-4">
                            {userData?.profile_image ? (
                                <Image
                                    source={{ uri: userData.profile_image }}
                                    className="w-32 h-32 rounded-full"
                                />
                            ) : (
                                <View className="w-32 h-32 rounded-full bg-surface-border items-center justify-center">
                                    <Ionicons name="person" size={64} color={colors.textSubtle} />
                                </View>
                            )}
                        </View>

                        {/* Business Name */}
                        <Text className="text-title font-bold text-foreground mb-4">
                            {displayName}
                        </Text>

                        {/* Edit Button */}
                        <TouchableOpacity
                            onPress={() => {
                                router.push('/profile/edit');
                            }}
                            className="bg-action px-24 py-3 rounded-lg"
                        >
                            <Text className="text-white text-base font-semibold">Edit</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items */}
                    <View className="space-y-4">
                        {/* Primary Menu Items */}
                        <View className="border border-surface-border rounded-lg bg-white mb-2">
                            {primaryMenuItems.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={item.onPress}
                                    className={`flex-row items-center justify-between py-4 px-4 ${
                                        index !== primaryMenuItems.length - 1
                                            ? 'border-b border-surface'
                                            : ''
                                    }`}
                                >
                                    <View className="flex-row items-center">
                                        <View className="w-8 items-center">
                                            <Ionicons
                                                name={item.icon}
                                                size={24}
                                                color={colors.action}
                                            />
                                        </View>
                                        <Text className="ml-4 text-base text-foreground-2">
                                            {item.label}
                                        </Text>
                                    </View>
                                    {item.showChevron && (
                                        <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Secondary Menu Items */}
                        <View className="border border-surface-border rounded-lg bg-white">
                            {secondaryMenuItems.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={item.onPress}
                                    disabled={item.id === 'logout' && isLoggingOut}
                                    className={`flex-row items-center justify-between py-4 px-4 ${
                                        index !== secondaryMenuItems.length - 1
                                            ? 'border-b border-surface'
                                            : ''
                                    }`}
                                >
                                    <View className="flex-row items-center">
                                        <View className="w-8 items-center">
                                            <Ionicons
                                                name={item.icon}
                                                size={24}
                                                color={item.id === 'logout' ? colors.error : colors.action}
                                            />
                                        </View>
                                        <Text
                                            className={`ml-4 text-base ${
                                                item.id === 'logout'
                                                    ? 'text-error'
                                                    : 'text-foreground-2'
                                            }`}
                                        >
                                            {item.label}
                                        </Text>
                                        {item.id === 'logout' && isLoggingOut && (
                                            <ActivityIndicator
                                                size="small"
                                                color={colors.error}
                                                style={{ marginLeft: 8 }}
                                            />
                                        )}
                                    </View>
                                    {item.showChevron && (
                                        <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
