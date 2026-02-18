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
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { type AxiosError } from 'axios';
import {
    Link,
    useRouter,
} from 'expo-router';

import {
    Button,
    InputField,
} from '@/components/ui/formComponent';
import { useAuth } from '@/contexts/auth';
import {
    type ForgotPasswordFormData,
    forgotPasswordSchema,
} from '@/schemas/auth.schemas';


import { colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { forgotPassword } = useAuth();

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting},
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: 'onBlur',
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = useCallback(
        async (data: ForgotPasswordFormData) => {
            try {
                const response = await forgotPassword(data.email);

                Alert.alert(
                    'Email Sent',
                    response.message
                    ?? 'A verification code has been sent to your email.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.push({
                                pathname: '/(auth)/verifyForgotPassword',
                                params: { email: data.email },
                            }),
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
                    ?? 'Failed to send reset email. Please try again.',
                );
            }
        },
        [forgotPassword, router],
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
                            <View className="w-20 h-20 bg-action-bg rounded-full items-center justify-center">
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={40}
                                    color={colors.action}
                                />
                            </View>
                        </View>

                        <View className="mb-10">
                            <Text className="text-center text-heading font-bold text-foreground mb-6">
                                Forgot Password?
                            </Text>
                            <Text className="text-center text-foreground-3 text-base mb-4">
                                Don
                                {'\''}
                                t worry! Enter your email and we
                                {'\''}
                                ll send you a code
                                to reset your password.
                            </Text>
                        </View>

                        <View className="mb-3">
                            <InputField
                                control={control}
                                name="email"
                                label="Email"
                                placeholder="Enter your email"
                                error={errors.email?.message}
                                keyboardType="email-address"
                                leftIcon="mail-outline"
                                autoComplete="email"
                            />

                            <View className="items-center mt-8">
                                <Button
                                    title="Send Reset Code"
                                    onPress={handleSubmit(onSubmit)}
                                    loading={isSubmitting}
                                    // disabled={isSubmitting || !isValid}
                                    width={250}
                                />
                            </View>
                        </View>

                        <View className="flex-row justify-center items-center mt-6">
                            <Ionicons name="arrow-back-outline" size={16} color={colors.textMuted} />
                            <Link href="/(auth)/login">
                                <Text className="text-primary-btn font-medium ml-2">Back to Sign In</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
