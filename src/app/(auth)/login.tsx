import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Link,
    useRouter,
} from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import {
    Button,
    InputField,
} from '@/components/ui/formComponent';
import { useAuth } from '@/contexts/auth';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import { useOnboarding } from '@/hooks/useOnboarding';
import { getErrorMessage, showErrorToast, showSuccessToast } from '@/lib';
import {
    type LoginFormData,
    loginSchema,
} from '@/schemas/auth.schemas';

export default function LoginPage() {
    const router = useRouter();
    const { resetOnboarding } = useOnboarding();

    const { login } = useAuth();
    const { handleGoogleSignIn, isLoading: isGoogleLoading, isReady } = useGoogleSignIn();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [rememberEmail, setRememberEmail] = useState(false);
    const [savedEmail, setSavedEmail] = useState<string>('');

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting},
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onBlur',
        defaultValues: {
            email: '',
            password: '',
        },
    });

    // Watch the email field for changes
    const currentEmail = watch('email');

    useEffect(() => {
        const loadSavedEmail = async () => {
            try {
                const savedEmailsStr = await AsyncStorage.getItem('saved_emails');
                if (savedEmailsStr) {
                    const emails: string[] = JSON.parse(savedEmailsStr);
                    // Auto-fill with the most recent email (first in array)
                    if (emails.length > 0) {
                        setValue('email', emails[0]);
                        setSavedEmail(emails[0]); // Store the saved email for comparison
                        // Automatically check "Remember Me" since this email was saved
                        setRememberEmail(true);
                    }
                }
            } catch (error) {
                console.error('Login Page - Error loading saved emails:', error);
            }
        };

        loadSavedEmail();
    }, [setValue]);

    // Watch for email changes and update Remember Me checkbox accordingly
    useEffect(() => {
        if (savedEmail) {
            const normalizedCurrent = currentEmail.trim().toLowerCase();
            const normalizedSaved = savedEmail.trim().toLowerCase();

            if (normalizedCurrent === normalizedSaved) {
                setRememberEmail(true);
            } else {
                setRememberEmail(false);
            }
        }
    }, [currentEmail, savedEmail]);

    const onSubmit = useCallback(
        async (data: LoginFormData) => {
            try {
                // If Remember Me is unchecked, remove the email from saved emails
                if (!rememberEmail) {
                    const savedEmailsStr = await AsyncStorage.getItem('saved_emails');
                    if (savedEmailsStr) {
                        const savedEmails: string[] = JSON.parse(savedEmailsStr);
                        const normalizedEmail = data.email.trim().toLowerCase();

                        // Remove the email if it exists in saved emails
                        const updatedEmails = savedEmails.filter(
                            (email) => email !== normalizedEmail
                        );

                        if (updatedEmails.length !== savedEmails.length) {
                            await AsyncStorage.setItem('saved_emails', JSON.stringify(updatedEmails));
                        }
                    }
                }

                await login(data.email, data.password, rememberEmail);
                showSuccessToast('Welcome back!', 'Login Successful');
                router.replace('/(tabs)/home');
            } catch (error) {
                const errorMessage = getErrorMessage(
                    error,
                    'Login failed. Please check your credentials.',
                );
                showErrorToast(errorMessage, 'Login Failed');
            }
        },
        [login, router, rememberEmail],
    );

    return (
        <SafeAreaView className='flex-1 bg-background'>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 px-6 justify-center">
                        <TouchableOpacity onPress={() => resetOnboarding()}>
                            <Text className="text-center text-blue-600 mb-4">Reset Onboarding (Dev Only)</Text>
                        </TouchableOpacity>
                        <View className="mb-10">
                            <Text className="text-center text-4xl font-bold text-gray-900 mb-6">
                                Login
                            </Text>
                            <Text className="text-center text-gray-600 text-base mb-4">
                                Please enter your details to login
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
                                autoComplete="password"
                            />

                            <View className="flex-row items-center justify-between mb-10">
                                <TouchableOpacity
                                    onPress={() => setRememberEmail((prev) => !prev)}
                                    className="flex-row items-center"
                                >
                                    <View
                                        className={`w-5 h-5 rounded border items-center justify-center ${
                                            rememberEmail ? 'bg-blue-600 border-blue-600' : 'border-gray-light'
                                        }`}
                                    >
                                        {rememberEmail && <Ionicons name="checkmark" size={14} color="white" />}
                                    </View>
                                    <Text className="text-gray-light ml-2 font-medium">Remember Me</Text>
                                </TouchableOpacity>
                                <Link href="/(auth)/forgotPassword">
                                    <Text className="text-gray-light font-medium">Forgot your password?</Text>
                                </Link>
                            </View>

                            <View className="items-center mt-8">
                                <Button
                                    title="Login"
                                    onPress={handleSubmit(onSubmit)}
                                    loading={isSubmitting}
                                    width={250}
                                // disabled={isSubmitting || !isValid}
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
                            <Text className="text-gray-600 font-medium">
                                Don
                                {'\''}
                                t have an account?
                                {' '}
                            </Text>
                            <Link href="/(auth)/register">
                                <Text className="text-primary-btn font-medium">Sign Up</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
