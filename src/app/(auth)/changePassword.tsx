import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { type AxiosError } from 'axios';
import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    Button,
    InputField,
} from '@/components/ui/formComponent';
import { useAuth } from '@/contexts/auth';
import {
    type ChangePasswordFormData,
    changePasswordSchema,
} from '@/schemas/auth.schemas';

const PASSWORD_REQUIREMENTS = [
    'At least 8 characters',
    'One uppercase letter (A-Z)',
    'One lowercase letter (a-z)',
    'One number (0-9)',
] as const;

export default function ChangePasswordPage() {
    const router = useRouter();
    const { resetToken } = useLocalSearchParams<{ resetToken: string }>();
    const { changePassword } = useAuth();

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        mode: 'onChange',
        defaultValues: {
            newPassword: '',
            confirmNewPassword: '',
            resetToken: resetToken ?? '',
        },
    });

    const onSubmit = useCallback(
        async (data: ChangePasswordFormData) => {
            try {
                const response = await changePassword(data);

                Alert.alert(
                    'Password Changed',
                    response.message ?? 'Your password has been changed successfully!',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.replace('/(auth)/login'),
                        },
                    ],
                );
            } catch (error) {
                const axiosError = error as AxiosError<{
                    message?: string;
                    detail?: string;
                }>;

                Alert.alert(
                    'Error',
                    axiosError.response?.data?.message
                    ?? axiosError.response?.data?.detail
                    ?? 'Failed to change password. Please try again.',
                );
            }
        },
        [changePassword, router],
    );

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 px-6 justify-center">
                        <View className="items-center mb-6">
                            <View className="w-20 h-20 bg-purple-100 rounded-full items-center justify-center">
                                <Ionicons name="key-outline" size={40} color="#8B5CF6" />
                            </View>
                        </View>

                        <View className="mb-10">
                            <Text className="text-center text-4xl font-bold text-gray-900 mb-6">
                                Create New Password
                            </Text>
                            <Text className="text-center text-gray-600 text-base mb-4">
                                Your new password must be different from previously used
                                passwords.
                            </Text>
                        </View>

                        <View className="mb-3">
                            <InputField
                                control={control}
                                name="newPassword"
                                label="New Password"
                                placeholder="Enter new password"
                                error={errors.newPassword?.message}
                                secureTextEntry
                                leftIcon="lock-closed-outline"
                                autoComplete="password-new"
                            />

                            <InputField
                                control={control}
                                name="confirmNewPassword"
                                label="Confirm New Password"
                                placeholder="Confirm new password"
                                error={errors.confirmNewPassword?.message}
                                secureTextEntry
                                leftIcon="lock-closed-outline"
                                autoComplete="password-new"
                            />

                            <View className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <Text className="text-gray-700 font-medium mb-2">
                                    Password must contain:
                                </Text>
                                <View className="space-y-1">
                                    {PASSWORD_REQUIREMENTS.map((req) => (
                                        <Text key={req} className="text-gray-600 text-sm">
                                            •
                                            {' '}
                                            {req}
                                        </Text>
                                    ))}
                                </View>
                            </View>

                            <View className="items-center mt-8">
                                <Button
                                    title="Change Password"
                                    onPress={handleSubmit(onSubmit)}
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                    width={250}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}