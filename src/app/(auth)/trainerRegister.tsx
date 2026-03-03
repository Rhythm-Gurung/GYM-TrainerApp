import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/api/services/auth.service';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { Button, InputField } from '@/components/ui/formComponent';
import { PasswordRequirements } from '@/components/ui/PasswordRequirements';
import { colors, fontSize, shadow } from '@/constants/theme';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import { type TrainerRegisterFormData, trainerRegisterSchema } from '@/schemas/trainer.schemas';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TrainerRegisterPage() {
  const router = useRouter();
  const { handleGoogleSignIn, isLoading: isGoogleLoading, isReady } = useGoogleSignIn();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TrainerRegisterFormData>({
    resolver: zodResolver(trainerRegisterSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = useCallback(
    async (data: TrainerRegisterFormData) => {
      try {
        setIsSubmitting(true);
        const emailCheckResult = await authService.checkEmailExists(data.email);

        if (emailCheckResult.exists && !emailCheckResult.can_reapply) {
          Toast.show({
            type: 'error',
            text1: 'Email Already Registered',
            text2: 'This email is already registered. Please sign in instead.',
            position: 'top',
          });
          return;
        }

        router.push({
          pathname: '/(auth)/trainerAdditionalRegister',
          params: {
            email: data.email,
            password: data.password,
            confirmPassword: data.confirmPassword,
            reapply: emailCheckResult.can_reapply ? '1' : '0',
          },
        });
      } catch (error: unknown) {
        let errorMessage = 'Failed to verify email. Please try again.';
        if (error && typeof error === 'object' && 'response' in error) {
          const response = error.response as { data?: { message?: string } };
          errorMessage = response.data?.message || errorMessage;
        }
        Toast.show({ type: 'error', text1: 'Error', text2: errorMessage, position: 'top' });
      } finally {
        setIsSubmitting(false);
      }
    },
    [router],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 }}>
            <View style={{ backgroundColor: colors.white, borderRadius: 24, padding: 24, ...shadow.cardStrong }}>

            {/* ── Page header ─────────────────────────────────── */}
            <View style={{ marginBottom: 32 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: colors.trainerMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Ionicons name="barbell-outline" size={26} color={colors.trainerPrimary} />
              </View>

              {/* Step indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: colors.trainerPrimary }} />
                <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: colors.surfaceBorder }} />
                <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, marginLeft: 6, fontWeight: '500' }}>
                  Step 1 of 2
                </Text>
              </View>

              <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.textPrimary }}>
                Join as Trainer
              </Text>
              <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginTop: 4, fontWeight: '500' }}>
                Start your fitness journey with GymJam
              </Text>
            </View>

            {/* ── Form fields ─────────────────────────────────── */}
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

            <PasswordRequirements
              password={watch('password')}
              showValidation={!!watch('password')}
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

            {/* ── CTA ─────────────────────────────────────────── */}
            <View style={{ marginTop: 24 }}>
              <Button
                title="Continue"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                disabled={isSubmitting}
              />
            </View>

            {/* ── Divider ─────────────────────────────────────── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.surfaceBorder }} />
              <Text style={{ fontSize: fontSize.tag, color: colors.textSubtle, marginHorizontal: 12, fontWeight: '500' }}>
                Or continue with
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.surfaceBorder }} />
            </View>

            {/* ── Google ──────────────────────────────────────── */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <GoogleSignInButton
                onPress={handleGoogleSignIn}
                loading={isGoogleLoading}
                disabled={!isReady || isGoogleLoading}
              />
            </View>

            {/* ── Sign in link ─────────────────────────────────── */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, fontWeight: '500' }}>
                {'Already have an account?  '}
              </Text>
              <Link href="/(auth)/login">
                <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.trainerPrimary }}>
                  Sign In
                </Text>
              </Link>
            </View>

            </View> 
{' '}
{/* card */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
