import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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


import { colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Profile {
    id: string;
    name: string;
    role: string;
    isActive: boolean;
}

export default function SwitchUser() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const { authState: { user } } = useAuth();
    const [isSwitching, setIsSwitching] = useState<string | null>(null);

    // TODO: Replace with actual API call to get available profiles
    const currentProfile: Profile = {
        id: '1',
        name: user?.username || 'Shikhar Pokharel',
        role: 'Admin',
        isActive: true,
    };

    // TODO: Replace with actual API call to get available profiles
    const availableProfiles: Profile[] = [
        {
            id: '2',
            name: 'Suman Prajapati',
            role: 'Sales',
            isActive: false,
        },
        {
            id: '3',
            name: 'Yabesh Thapa',
            role: 'Sales',
            isActive: false,
        },
        {
            id: '4',
            name: 'Juna Temrakar',
            role: 'Sales',
            isActive: false,
        },
        {
            id: '5',
            name: 'Maxtem Ghimire',
            role: 'Sales',
            isActive: false,
        },
        {
            id: '6',
            name: 'Mukesh Dholakiya',
            role: 'Account',
            isActive: false,
        },
    ];

    const handleSwitchUser = async (profileId: string) => {
        try {
            setIsSwitching(profileId);
            // TODO: Implement API call to switch user
            // await switchUserProfile(profileId);

            // Simulate API call
            await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 1000);
            });

            showSuccessToast('User switched successfully', 'Success');
            router.back();
        } catch {
            showErrorToast('Failed to switch user', 'Error');
        } finally {
            setIsSwitching(null);
        }
    };

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
                            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text className="text-title font-bold text-foreground">
                            Switch User
                        </Text>
                    </View>

                    {/* Profile Header */}
                    <View className="items-center mb-8">
                        {/* Profile Image */}
                        <View className="mb-4">
                            {user?.profile_image ? (
                                <Image
                                    source={{ uri: user.profile_image }}
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
                            {user?.business_name || 'Vintuna Stores'}
                        </Text>
                    </View>

                    {/* Current Profile Section */}
                    <View className="mb-6">
                        <Text className="text-base font-semibold text-foreground mb-3">
                            Current Profile
                        </Text>
                        <View className="bg-white border border-surface-border rounded-lg px-4 py-4">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className="text-base font-medium text-foreground">
                                        {currentProfile.name}
                                    </Text>
                                    <Text className="text-sm text-action mt-1">
                                        {currentProfile.role}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Available Profiles Section */}
                    <View>
                        <Text className="text-base font-semibold text-foreground mb-3">
                            Available Profiles
                        </Text>
                        <View className="bg-white border border-surface-border rounded-lg">
                            {availableProfiles.map((profile, index) => (
                                <View
                                    key={profile.id}
                                    className={`flex-row items-center justify-between px-4 py-4 ${index !== availableProfiles.length - 1
                                            ? 'border-b border-surface'
                                            : ''
                                        }`}
                                >
                                    <View className="flex-1">
                                        <Text className="text-base font-medium text-foreground">
                                            {profile.name}
                                        </Text>
                                        <Text className="text-sm text-foreground-4 mt-1">
                                            {profile.role}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleSwitchUser(profile.id)}
                                        disabled={isSwitching !== null}
                                        className="px-4 py-2"
                                    >
                                        {isSwitching === profile.id ? (
                                            <ActivityIndicator size="small" color={colors.action} />
                                        ) : (
                                            <Text className="text-action font-medium">
                                                Switch
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
