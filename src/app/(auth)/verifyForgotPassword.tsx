import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { type AxiosError } from 'axios';
import {
    Link,
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import React, {
    useCallback,
    useState,
} from 'react';
import {
    Controller,
    useForm,
} from 'react-hook-form';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '@/constants/theme';
import {
    CodeField,
    Cursor,
    useBlurOnFulfill,
    useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/formComponent';
import { useAuth } from '@/contexts/auth';
import {
    type VerifyEmailFormData,
    verifyEmailSchema,
} from '@/schemas/auth.schemas';

const CELL_COUNT = 6;

const styles = StyleSheet.create({
    codeFieldRoot: {
        marginTop: 8,
        marginBottom: 12,
    },
    cell: {
        width: 48,
        height: 56,
        lineHeight: 54,
        fontSize: 24,
        borderWidth: 2,
        borderColor: colors.surfaceBorder,
        borderRadius: 12,
        backgroundColor: colors.surfaceSubtle,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    focusCell: {
        borderColor: colors.action,
        backgroundColor: colors.actionBg,
    },
    cellText: {
        fontSize: 24,
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
    },
});

export default function VerifyForgotPasswordPage() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const { verifyForgotPassword, resendForgotPasswordCode } = useAuth();
    const [isResending, setIsResending] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        getValues,
        setValue,
        watch,
    } = useForm<VerifyEmailFormData>({
        resolver: zodResolver(verifyEmailSchema),
        mode: 'onBlur',
        defaultValues: {
            email: email ?? '',
            code: '',
        },
    });

    const code = watch('code');
    const ref = useBlurOnFulfill({ value: code, cellCount: CELL_COUNT });
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
        value: code,
        setValue: (value) => setValue('code', value),
    });

    const onSubmit = useCallback(
        async (data: VerifyEmailFormData) => {
            try {
                const response = await verifyForgotPassword(data.email, data.code);

                router.push({
                    pathname: '/(auth)/changePassword',
                    params: { resetToken: response.reset_token },
                });
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
        [verifyForgotPassword, router],
    );

    const handleResendCode = useCallback(async () => {
        const currentEmail = getValues('email');
        if (!currentEmail) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setIsResending(true);
        try {
            const response = await resendForgotPasswordCode(currentEmail);
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
    }, [getValues, resendForgotPasswordCode]);

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
                                    name="shield-checkmark-outline"
                                    size={40}
                                    color={colors.action}
                                />
                            </View>
                        </View>

                        <View className="mb-10">
                            <Text className="text-center text-heading font-bold text-foreground mb-6">
                                Verify Reset Code
                            </Text>
                            <Text className="text-center text-foreground-3 text-base mb-4">
                                We
                                {'\''}
                                ve sent a 6-digit code to your email. Please enter it
                                below to reset your password.
                            </Text>
                        </View>

                        <View className="mb-3">
                            <Text className="text-foreground-2 font-medium mb-3 text-base">
                                Verification Code
                            </Text>

                            <Controller
                                control={control}
                                name="code"
                                render={({ field: { onChange, value } }) => (
                                    <CodeField
                                        ref={ref}
                                        {...props}
                                        value={value}
                                        onChangeText={onChange}
                                        cellCount={CELL_COUNT}
                                        rootStyle={styles.codeFieldRoot}
                                        keyboardType="number-pad"
                                        textContentType="oneTimeCode"
                                        autoComplete="sms-otp"
                                        testID="verification-code-input"
                                        renderCell={({ index, symbol, isFocused }) => (
                                            <View
                                                key={index}
                                                style={[
                                                    styles.cell,
                                                    isFocused && styles.focusCell,
                                                ]}
                                                onLayout={getCellOnLayoutHandler(index)}
                                            >
                                                <Text style={styles.cellText}>
                                                    {symbol || (isFocused ? <Cursor /> : null)}
                                                </Text>
                                            </View>
                                        )}
                                    />
                                )}
                            />

                            {errors.code && (
                                <View className="flex-row items-center mt-2">
                                    <Ionicons name="alert-circle" size={16} color={colors.error} />
                                    <Text className="text-error text-sm ml-1">
                                        {errors.code.message}
                                    </Text>
                                </View>
                            )}

                            <View className="items-center mt-8">
                                <Button
                                    title="Verify Code"
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
                                    {isResending ? 'Sending...' : "Didn't receive a code? Resend OTP"}
                                </Text>
                            </TouchableOpacity>
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