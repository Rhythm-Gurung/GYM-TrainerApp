import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTabBarHeight } from '@/hooks/useTabBarHeight';

import { Button, InputField } from '@/components/ui/formComponent';
import { useAuth } from '@/contexts/auth';
import { showErrorToast, showSuccessToast } from '@/lib';


import { colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddUserFormData {
    userId: string;
    name: string;
    department: string;
}

export default function AddUser() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const { authState: { user } } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isActive, setIsActive] = useState(true);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AddUserFormData>({
        defaultValues: {
            userId: '',
            name: '',
            department: '',
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleSave = async (data: AddUserFormData) => {
        try {
            setIsLoading(true);
            // TODO: Implement API call to add new user
            // await addNewUser({
            //     userId: data.userId,
            //     name: data.name,
            //     department: data.department,
            //     isActive: isActive,
            // });

            // Simulate API call
            await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 1000);
            });

            showSuccessToast('User added successfully', 'Success');
            router.back();
        } catch {
            showErrorToast('Failed to add user', 'Error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 px-6 py-8">
                        {/* Header */}
                        <View className="flex-row items-center mb-6">
                            <TouchableOpacity onPress={handleCancel} className="mr-4">
                                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                            <Text className="text-title font-bold text-foreground">
                                Add New User
                            </Text>
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
                                    <View className="w-32 h-32 rounded-full bg-surface-border items-center justify-center">
                                        <Ionicons name="person" size={64} color={colors.textSubtle} />
                                    </View>
                                )}
                            </View>

                            {/* Business Name */}
                            <Text className="text-title font-bold text-foreground mb-6">
                                {user?.business_name || 'Vintuna Stores'}
                            </Text>
                        </View>

                        {/* Form Fields */}
                        <View>
                            <InputField
                                control={control}
                                name="userId"
                                label="User ID"
                                placeholder="Enter user ID"
                                error={errors.userId?.message}
                                leftIcon="finger-print-outline"
                            />

                            <InputField
                                control={control}
                                name="name"
                                label="Name"
                                placeholder="Enter name"
                                error={errors.name?.message}
                                leftIcon="person-outline"
                            />

                            <InputField
                                control={control}
                                name="department"
                                label="Department"
                                placeholder="Enter department"
                                error={errors.department?.message}
                                leftIcon="business-outline"
                            />

                            {/* Status Toggle */}
                            <View className="mb-6">
                                <View className="flex-row items-center justify-between bg-white border border-surface-border rounded-lg px-4 py-4">
                                    <Text className="text-base text-foreground">Status</Text>
                                    <Switch
                                        value={isActive}
                                        onValueChange={setIsActive}
                                        trackColor={{ false: colors.neutral, true: colors.actionTrack }}
                                        thumbColor={isActive ? colors.action : colors.surface}
                                        ios_backgroundColor={colors.neutral}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View className="mt-4">
                            <Button
                                title="Save"
                                onPress={handleSubmit(handleSave)}
                                loading={isLoading}
                                disabled={isLoading}
                            />

                            <View className="mt-4">
                                <TouchableOpacity
                                    onPress={handleCancel}
                                    disabled={isLoading}
                                    className="border-2 border-cancel py-4 rounded-lg items-center"
                                >
                                    <Text className="text-cancel text-base font-semibold">
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
