import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Link,
    useRouter,
} from 'expo-router';

import { authService } from '@/api/services/auth.service';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import {
    Button,
    InputField,
} from '@/components/ui/formComponent';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import {
    type RegisterFormData,
    registerSchema,
} from '@/schemas/auth.schemas';

export default function RegisterPage() {
    const router = useRouter();
    const { handleGoogleSignIn, isLoading: isGoogleLoading, isReady } = useGoogleSignIn();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: 'onBlur',
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = useCallback(
        async (data: RegisterFormData) => {
            try {
                setIsSubmitting(true);

                // Check if email already exists
                const emailCheckResult = await authService.checkEmailExists(data.email);

                if (emailCheckResult.exists) {
                    Toast.show({
                        type: 'error',
                        text1: 'Email Already Exists',
                        text2: 'This email is already registered. Please use a different email or sign in.',
                        position: 'top',
                    });
                    return;
                }

                // If email doesn't exist and validation passed, route to next step
                router.push({
                    pathname: '/(auth)/additionalRegister',
                    params: {
                        email: data.email,
                        password: data.password,
                        confirmPassword: data.confirmPassword,
                    },
                });
            } catch (error: unknown) {
                let errorMessage = 'Failed to verify email. Please try again.';

                if (error && typeof error === 'object' && 'response' in error) {
                    const response = error.response as { data?: { message?: string } };
                    errorMessage = response.data?.message || errorMessage;
                }

                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: errorMessage,
                    position: 'top',
                });
            } finally {
                setIsSubmitting(false);
            }
        },
        [router],
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
                        <View className="mb-10">
                            <Text className="text-center text-4xl font-bold text-gray-900 mb-6">
                                Signup
                            </Text>
                            <Text className="text-center text-gray-light text-base mb-4">
                                Please enter your details to register
                            </Text>
                        </View>

                        <View className="mb-3">
                            <InputField
                                control={control}
                                name="email"
                                label="Email"
                                placeholder="Email"
                                error={errors.email?.message}
                                keyboardType="email-address"
                                leftIcon="mail-outline"
                                autoComplete="email"
                            />

                            <InputField
                                control={control}
                                name="password"
                                label="Password"
                                placeholder="Password"
                                error={errors.password?.message}
                                secureTextEntry={!isPasswordVisible}
                                leftIcon="lock-closed-outline"
                                rightIcon={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                                onRightIconPress={() => setIsPasswordVisible((prev) => !prev)}
                                autoComplete="password-new"
                            />

                            <InputField
                                control={control}
                                name="confirmPassword"
                                label="Confirm Password"
                                placeholder="Confirm Password"
                                error={errors.confirmPassword?.message}
                                secureTextEntry={!isConfirmPasswordVisible}
                                leftIcon="lock-closed-outline"
                                rightIcon={isConfirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                                onRightIconPress={() => setIsConfirmPasswordVisible((prev) => !prev)}
                                autoComplete="password-new"
                            />

                            <View className="items-center mt-8">
                                <Button
                                    title="Continue"
                                    onPress={handleSubmit(onSubmit)}
                                    width={250}
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                />
                            </View>
                        </View>

                        <View className="flex-row items-center my-6">
                            <View className="flex-1 h-px bg-gray-light" />
                            <Text className="mx-4 text-xl text-gray-600 font-medium">Or</Text>
                            <View className="flex-1 h-px bg-gray-light" />
                        </View>

                        <View className="mb-6 items-center">
                            <GoogleSignInButton
                                onPress={handleGoogleSignIn}
                                loading={isGoogleLoading}
                                disabled={!isReady || isGoogleLoading}
                            />
                        </View>

                        <View className="flex-row justify-center items-center">
                            <Text className="text-gray-600">Already have an account? </Text>
                            <Link href="/(auth)/login">
                                <Text className="text-primary-btn font-medium">Sign In</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
