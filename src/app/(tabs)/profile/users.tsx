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
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTabBarHeight } from '@/hooks/useTabBarHeight';

import { useAuth } from '@/contexts/auth';
import { showErrorToast, showSuccessToast } from '@/lib';

interface User {
    id: string;
    userId: string;
    name: string;
    department: string;
    isActive: boolean;
}

export default function Users() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const { authState: { user } } = useAuth();
    const [disablingUser, setDisablingUser] = useState<string | null>(null);

    // TODO: Replace with actual API call to get users list
    const [usersList, setUsersList] = useState<User[]>([
        {
            id: '1',
            userId: 'DKS1',
            name: 'Suman Prajapati',
            department: 'Sales',
            isActive: true,
        },
        {
            id: '2',
            userId: 'DKS2',
            name: 'Yabesh Thapa',
            department: 'Sales',
            isActive: true,
        },
        {
            id: '3',
            userId: 'DKS3',
            name: 'Juna Tamrakar',
            department: 'Sales',
            isActive: true,
        },
        {
            id: '4',
            userId: 'DKS4',
            name: 'Maxtem Ghimire',
            department: 'Sales',
            isActive: true,
        },
        {
            id: '5',
            userId: 'DKS5',
            name: 'Mukesh Dholakiya',
            department: 'Account',
            isActive: true,
        },
    ]);

    const handleDisableUser = async (userId: string) => {
        try {
            setDisablingUser(userId);
            // TODO: Implement API call to disable user
            // await disableUser(userId);

            // Simulate API call
            await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 1000);
            });

            // Update local state
            setUsersList((prev) =>
                prev.map((u) => (
                    u.id === userId ? { ...u, isActive: false } : u
                )),
            );

            showSuccessToast('User disabled successfully', 'Success');
        } catch {
            showErrorToast('Failed to disable user', 'Error');
        } finally {
            setDisablingUser(null);
        }
    };

    const handleAddNewUser = () => {
        router.push('/profile/addUser');
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
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-900">Users</Text>
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

                    {/* Users Table */}
                    <View className="mb-6">
                        {/* Table Header */}
                        <View className="flex-row bg-white border border-gray-200 rounded-t-lg px-4 py-3">
                            <Text className="text-sm font-semibold text-gray-900 flex-[0.8]">
                                User ID
                            </Text>
                            <Text className="text-sm font-semibold text-gray-900 flex-[1.5]">
                                Name
                            </Text>
                            <Text className="text-sm font-semibold text-gray-900 flex-1">
                                Dept
                            </Text>
                            <View className="flex-1" />
                        </View>

                        {/* Table Rows */}
                        <View className="bg-white border-x border-b border-gray-200 rounded-b-lg">
                            {usersList.map((userData, index) => (
                                <View
                                    key={userData.id}
                                    className={`flex-row items-center px-4 py-4 ${index !== usersList.length - 1
                                            ? 'border-b border-gray-100'
                                            : ''
                                        }`}
                                >
                                    <Text className="text-sm text-gray-900 flex-[0.8]">
                                        {userData.userId}
                                    </Text>
                                    <Text className="text-sm text-gray-900 flex-[1.5]">
                                        {userData.name}
                                    </Text>
                                    <Text className="text-sm text-gray-900 flex-1">
                                        {userData.department}
                                    </Text>
                                    <View className="flex-1 items-end">
                                        <TouchableOpacity
                                            onPress={() => handleDisableUser(userData.id)}
                                            disabled={
                                                !userData.isActive ||
                                                disablingUser !== null
                                            }
                                            className={`${userData.isActive
                                                    ? 'opacity-100'
                                                    : 'opacity-50'
                                                }`}
                                        >
                                            {disablingUser === userData.id ? (
                                                <ActivityIndicator
                                                    size="small"
                                                    color="#EF4444"
                                                />
                                            ) : (
                                                <Text className="text-red-500 font-medium text-sm">
                                                    Disable
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Add New User Button */}
                    <TouchableOpacity
                        onPress={handleAddNewUser}
                        className="flex-row items-center justify-center py-3"
                    >
                        <Ionicons name="add-circle" size={20} color="#3B82F6" />
                        <Text className="text-blue-500 font-medium text-base ml-2">
                            Add New User
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
