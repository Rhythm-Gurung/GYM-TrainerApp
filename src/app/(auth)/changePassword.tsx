import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { type AxiosError } from 'axios';
import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
} from 'react-native';

import {
    Button,
    InputField,
} from '@/components/ui/formComponent';
import { PasswordRequirements } from '@/components/ui/PasswordRequirements';
import { useAuth } from '@/contexts/auth';
import {
    type ChangePasswordFormData,
    changePasswordSchema,
} from '@/schemas/auth.schemas';


import { colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function ChangePasswordPage() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const { changePassword } = useAuth();
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        mode: 'onChange',
        defaultValues: {
            email: email ?? '',
            newPassword: '',
            confirmNewPassword: '',
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
                            <View className="w-20 h-20 bg-system-bg rounded-full items-center justify-center">
                                <Ionicons name="key-outline" size={40} color={colors.system} />
                            </View>
                        </View>

                        <View className="mb-10">
                            <Text className="text-center text-heading font-bold text-foreground mb-6">
                                Create New Password
                            </Text>
                            <Text className="text-center text-foreground-3 text-base mb-4">
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
                                secureTextEntry={!isNewPasswordVisible}
                                leftIcon="lock-closed-outline"
                                rightIcon={isNewPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                                onRightIconPress={() => setIsNewPasswordVisible((prev) => !prev)}
                                autoComplete="password-new"
                            />

                            <InputField
                                control={control}
                                name="confirmNewPassword"
                                label="Confirm New Password"
                                placeholder="Confirm new password"
                                error={errors.confirmNewPassword?.message}
                                secureTextEntry={!isConfirmPasswordVisible}
                                leftIcon="lock-closed-outline"
                                rightIcon={isConfirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                                onRightIconPress={() => setIsConfirmPasswordVisible((prev) => !prev)}
                                autoComplete="password-new"
                            />

                            <PasswordRequirements
                                password={watch('newPassword')}
                                showValidation={!!watch('newPassword')}
                            />

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
