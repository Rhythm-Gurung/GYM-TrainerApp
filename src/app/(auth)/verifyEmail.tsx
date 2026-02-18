import React, {
    useCallback,
    useState,
} from 'react';
import { useForm } from 'react-hook-form';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { type AxiosError } from 'axios';
import {
    Link,
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import {
    Button,
    InputField,
} from '@/components/ui/formComponent';
import { useAuth } from '@/contexts/auth';
import {
    type VerifyEmailFormData,
    verifyEmailSchema,
} from '@/schemas/auth.schemas';


import { colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyEmailPage() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const { verifyEmail, resendOTP } = useAuth();
    const [isResending, setIsResending] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        getValues,
    } = useForm<VerifyEmailFormData>({
        resolver: zodResolver(verifyEmailSchema),
        mode: 'onBlur',
        defaultValues: {
            email: email ?? '',
            code: '',
        },
    });

    const onSubmit = useCallback(
        async (data: VerifyEmailFormData) => {
            try {
                const response = await verifyEmail(data.email, data.code);

                Alert.alert(
                    'Email Verified',
                    response.message ?? 'Your email has been verified successfully!',
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
                    'Verification Error',
                    axiosError.response?.data?.message
            ?? axiosError.response?.data?.detail
            ?? 'Verification failed. Please check your code.',
                );
            }
        },
        [verifyEmail, router],
    );

    const handleResendCode = useCallback(async () => {
        const currentEmail = getValues('email');
        if (!currentEmail) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setIsResending(true);
        try {
            const response = await resendOTP(currentEmail);
            Alert.alert(
                'Code Sent',
                response.message
          ?? 'A new verification code has been sent to your email.',
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
          ?? 'Failed to resend code. Please try again.',
            );
        } finally {
            setIsResending(false);
        }
    }, [getValues, resendOTP]);

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
                            <View className="w-20 h-20 bg-status-new-bg rounded-full items-center justify-center">
                                <Ionicons name="mail-outline" size={40} color={colors.success} />
                            </View>
                        </View>

                        <View className="mb-10">
                            <Text className="text-center text-heading font-bold text-foreground mb-6">
                                Verify Your Email
                            </Text>
                            <Text className="text-center text-foreground-3 text-base mb-4">
                                We
                                {'\''}
                                ve sent a 6-digit verification code to your email. Please
                                enter it below.
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

                            <InputField
                                control={control}
                                name="code"
                                label="Verification Code"
                                placeholder="Enter 6-digit code"
                                error={errors.code?.message}
                                keyboardType="number-pad"
                                maxLength={6}
                                leftIcon="keypad-outline"
                            />

                            <View className="items-center mt-8">
                                <Button
                                    title="Verify Email"
                                    onPress={handleSubmit(onSubmit)}
                                    loading={isSubmitting}
                                    disabled={isSubmitting || isResending}
                                    width={250}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleResendCode}
                                disabled={isResending || isSubmitting}
                                className="mt-4 py-2"
                            >
                                <Text className="text-center text-primary-btn font-medium">
                                    {isResending ? 'Sending...' : "Didn't receive a code? Resend"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row justify-center items-center mt-6">
                            <Ionicons name="arrow-back-outline" size={16} color={colors.textMuted} />
                            <Link href="/(auth)/login">
                                <Text className="text-primary-btn font-medium">
                                    {' '}
                                    Back to Sign In
                                </Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
