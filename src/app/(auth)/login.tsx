import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import setuLogo from '../../../assets/images/SETu.png';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, InputField } from '@/components/ui/formComponent';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { getErrorMessage, getErrorStatus, showErrorToast, showSuccessToast } from '@/lib';
import { type LoginFormData, loginSchema } from '@/schemas/auth.schemas';

// ─── Gradient stops: client-blue → trainer-orange ────────────────────────────

const HERO_GRADIENT = [colors.primaryDark, colors.primary, colors.trainerPrimary] as const;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LoginPage() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { resetOnboarding } = useOnboarding();

    const { login } = useAuth();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [rememberEmail, setRememberEmail] = useState(false);
    const [savedEmail, setSavedEmail] = useState<string>('');

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onBlur',
        defaultValues: {
            email: '',
            password: '',
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const currentEmail = watch('email');

    useEffect(() => {
        const loadSavedEmail = async () => {
            try {
                const savedEmailsStr = await AsyncStorage.getItem('saved_emails');
                if (savedEmailsStr) {
                    const emails: string[] = JSON.parse(savedEmailsStr);
                    if (emails.length > 0) {
                        setValue('email', emails[0]);
                        setSavedEmail(emails[0]);
                        setRememberEmail(true);
                    }
                }
            } catch (error) {
                console.error('Login Page - Error loading saved emails:', error);
            }
        };
        loadSavedEmail();
    }, [setValue]);

    useEffect(() => {
        if (savedEmail) {
            const normalizedCurrent = currentEmail.trim().toLowerCase();
            const normalizedSaved = savedEmail.trim().toLowerCase();
            setRememberEmail(normalizedCurrent === normalizedSaved);
        }
    }, [currentEmail, savedEmail]);

    const onSubmit = useCallback(
        async (data: LoginFormData) => {
            try {
                if (!rememberEmail) {
                    const savedEmailsStr = await AsyncStorage.getItem('saved_emails');
                    if (savedEmailsStr) {
                        const savedEmails: string[] = JSON.parse(savedEmailsStr);
                        const normalizedEmail = data.email.trim().toLowerCase();
                        const updatedEmails = savedEmails.filter((email) => email !== normalizedEmail);
                        if (updatedEmails.length !== savedEmails.length) {
                            await AsyncStorage.setItem('saved_emails', JSON.stringify(updatedEmails));
                        }
                    }
                }
                const loginResponse = await login(data.email, data.password, rememberEmail);
                showSuccessToast('Welcome back!', 'Login Successful');

                // Redirect based on role returned by the server
                if (loginResponse.user?.role === 'trainer') {
                    router.replace('/(tabs)/trainer/dashboard');
                } else {
                    router.replace('/(tabs)/client/home');
                }
            } catch (error) {
                const status = getErrorStatus(error);
                if (status === 403) {
                    const detail = getErrorMessage(error, '');
                    if (detail.toLowerCase().includes('pending')) {
                        router.replace('/(auth)/trainerPendingApproval');
                        return;
                    }
                    if (detail.toLowerCase().includes('rejected')) {
                        router.push({
                            pathname: '/(auth)/trainerRegister',
                            params: { rejected: '1' },
                        });
                        return;
                    }
                    if (detail.toLowerCase().includes('verify')) {
                        router.push({
                            pathname: '/(auth)/verifyEmail',
                            params: { email: data.email.trim().toLowerCase() },
                        });
                        return;
                    }
                }
                const errorMessage = getErrorMessage(error, 'Login failed. Please check your credentials.');
                showErrorToast(errorMessage, 'Login Failed');
            }
        },
        [login, router, rememberEmail],
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right', 'bottom']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

                    {/* ── Hero gradient: client-blue → trainer-orange ──────── */}
                    <LinearGradient
                        colors={HERO_GRADIENT}
                        locations={[0, 0.45, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            paddingTop: insets.top + 44,
                            paddingBottom: 64,
                            paddingHorizontal: 24,
                            alignItems: 'center',
                            borderBottomLeftRadius: radius.hero,
                            borderBottomRightRadius: radius.hero,
                        }}
                    >
                        {/* App icon badge */}
                        <Image
                            source={setuLogo}
                            style={{ width: 120, height: 120, marginBottom: -16 }}
                            resizeMode="contain"
                        />

                        <Text style={{ fontSize: fontSize.pageTitle, fontWeight: '800', color: colors.white, letterSpacing: -0.5 }}>
                            SETu
                        </Text>
                        <Text style={{ fontSize: fontSize.body, color: colors.white65, marginTop: 4, fontWeight: '500' }}>
                            Train smarter. Live stronger.
                        </Text>
                    </LinearGradient>

                    {/* ── Form card ─────────────────────────────────────────── */}
                    <View style={{ paddingHorizontal: 20, marginTop: -32, paddingBottom: 40 }}>
                        <View
                            style={{
                                backgroundColor: colors.white,
                                borderRadius: 24,
                                padding: 24,
                                ...shadow.cardStrong,
                            }}
                        >
                            {/* Card heading */}
                            <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.textPrimary }} className="mb-4">
                                Welcome back
                            </Text>

                            {/* Dual-color accent bar */}
                            {/* <LinearGradient
                                colors={ACCENT_GRADIENT}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ width: 48, height: 3, borderRadius: radius.full, marginTop: 8, marginBottom: 4 }}
                            /> */}

                            <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginBottom: 20, fontWeight: '500' }}>
                                Sign in to your account
                            </Text>

                            {/* Fields */}
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

                            {/* Remember me + forgot password */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                <TouchableOpacity
                                    onPress={() => setRememberEmail((prev) => !prev)}
                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                >
                                    <View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 5,
                                            borderWidth: 1.5,
                                            borderColor: rememberEmail ? colors.primary : colors.textDisabled,
                                            backgroundColor: rememberEmail ? colors.primary : 'transparent',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {rememberEmail && <Ionicons name="checkmark" size={13} color={colors.white} />}
                                    </View>
                                    <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginLeft: 8, fontWeight: '500' }}>
                                        Remember Me
                                    </Text>
                                </TouchableOpacity>

                                <Link href="/(auth)/forgotPassword">
                                    <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, fontWeight: '500' }}>
                                        Forgot password?
                                    </Text>
                                </Link>
                            </View>

                            {/* Submit */}
                            <Button
                                title="Sign In"
                                onPress={handleSubmit(onSubmit)}
                                loading={isSubmitting}
                            />

                            {/* Sign up row */}
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
                                <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, fontWeight: '500' }}>
                                    {"Don't have an account?  "}
                                </Text>
                                <Link href="/(auth)/register">
                                    <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.trainerPrimary }}>
                                        Sign Up
                                    </Text>
                                </Link>
                            </View>
                        </View>

                        {/* Dev-only reset — kept small and unobtrusive */}
                        <TouchableOpacity
                            onPress={async () => {
                                await resetOnboarding();
                                router.replace('/onboarding');
                            }}
                            style={{ marginTop: 20, alignItems: 'center' }}
                        >
                            <Text style={{ fontSize: fontSize.caption, color: colors.textDisabled }}>
                                Reset Onboarding (Dev Only)
                            </Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
