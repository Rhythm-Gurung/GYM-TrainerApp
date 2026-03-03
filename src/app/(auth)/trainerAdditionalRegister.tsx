import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FileUploadField } from '@/components/auth/FileUploadField';
import { Button, InputField } from '@/components/ui/formComponent';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { getErrorMessage, showErrorToast } from '@/lib';
import {
  type TrainerAdditionalDetailsFormData,
  type TrainerAdditionalDetailsFormInputData,
  trainerAdditionalDetailsSchema,
} from '@/schemas/trainer.schemas';
import type { FileAsset } from '@/types/authTypes';
import { EXPERTISE_CATEGORIES } from '@/types/trainerTypes';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TrainerAdditionalRegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const { email, password, confirmPassword, reapply } = useLocalSearchParams<{
    email: string;
    password: string;
    confirmPassword: string;
    reapply?: string;
  }>();
  const isReapply = reapply === '1';

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<TrainerAdditionalDetailsFormInputData, unknown, TrainerAdditionalDetailsFormData>({
    resolver: zodResolver(trainerAdditionalDetailsSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      contactNo: '',
      bio: '',
      expertiseCategories: [],
      yearsOfExperience: 0,
      pricingPerSession: 0,
      sessionType: 'both',
      profileImage: undefined,
      idProof: undefined,
      certifications: [],
    },
  });

  const expertiseCategories = useWatch({ control, name: 'expertiseCategories' });
  const sessionType = useWatch({ control, name: 'sessionType' });
  const profileImage = useWatch({ control, name: 'profileImage' });
  const idProof = useWatch({ control, name: 'idProof' });
  const certifications = useWatch({ control, name: 'certifications' });

  const toggleExpertise = (category: string) => {
    const current = expertiseCategories || [];
    if (current.includes(category)) {
      setValue('expertiseCategories', current.filter((c) => c !== category));
    } else {
      setValue('expertiseCategories', [...current, category]);
    }
  };

  const handlePickProfileImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const file: FileAsset = {
        uri: asset.uri,
        name: asset.fileName ?? `profile_${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize,
      };
      setValue('profileImage', file, { shouldValidate: true });
    }
  }, [setValue]);

  const handlePickIdProof = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const file: FileAsset = {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/octet-stream',
        size: asset.size,
      };
      setValue('idProof', file, { shouldValidate: true });
    }
  }, [setValue]);

  const handlePickCertifications = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const files: FileAsset[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/octet-stream',
        size: asset.size,
      }));
      const existing = getValues('certifications') ?? [];
      setValue('certifications', [...existing, ...files], { shouldValidate: true });
    }
  }, [getValues, setValue]);

  const handleRemoveCertification = useCallback(
    (index: number) => {
      const current = getValues('certifications') ?? [];
      setValue(
        'certifications',
        current.filter((_, i) => i !== index),
        { shouldValidate: true },
      );
    },
    [getValues, setValue],
  );

  const onSubmit = useCallback(
    async (data: TrainerAdditionalDetailsFormData) => {
      try {
        await registerUser({
          email,
          password,
          confirmPassword,
          username: data.fullName,
          isTrainer: true,
          fullName: data.fullName,
          contactNo: data.contactNo,
          bio: data.bio,
          expertiseCategories: data.expertiseCategories,
          yearsOfExperience: data.yearsOfExperience,
          pricingPerSession: data.pricingPerSession,
          sessionType: data.sessionType,
          profileImage: data.profileImage,
          idProof: data.idProof,
          certifications: data.certifications,
        });
        // Trainer registration does NOT trigger OTP — pending admin approval
        router.replace('/(auth)/trainerPendingApproval');
      } catch (error) {
        const errorMessage = getErrorMessage(error, 'Registration failed. Please try again.');
        showErrorToast(errorMessage, 'Registration Failed');
      }
    },
    [email, password, confirmPassword, registerUser, router],
  );

  const SESSION_TYPES = [
    { type: 'online', icon: 'videocam-outline' },
    { type: 'offline', icon: 'location-outline' },
    { type: 'both', icon: 'globe-outline' },
  ] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>

            {/* ── Back button ─────────────────────────────────── */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back-outline" size={18} color={colors.textMuted} />
              <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, fontWeight: '500' }}>Back</Text>
            </TouchableOpacity>

            <View style={{ backgroundColor: colors.white, borderRadius: 24, padding: 24, ...shadow.cardStrong }}>

              {/* ── Re-apply banner ─────────────────────────────── */}
              {isReapply && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                    backgroundColor: colors.trainerSurface,
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: colors.trainerBorder,
                    marginBottom: 20,
                  }}
                >
                  <Ionicons name="refresh-circle-outline" size={20} color={colors.trainerPrimary} style={{ marginTop: 1 }} />
                  <Text style={{ flex: 1, fontSize: fontSize.tag, color: colors.trainerPrimary, fontWeight: '600', lineHeight: 18 }}>
                    Your previous application was rejected. Update your details and re-apply below.
                  </Text>
                </View>
              )}

              {/* ── Page header ─────────────────────────────────── */}
              <View style={{ marginBottom: 28 }}>
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
                  <Ionicons name="id-card-outline" size={26} color={colors.trainerPrimary} />
                </View>

                {/* Step indicator */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: colors.trainerPrimary }} />
                  <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: colors.trainerPrimary }} />
                  <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, marginLeft: 6, fontWeight: '500' }}>
                    Step 2 of 2
                  </Text>
                </View>

                <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.textPrimary }}>
                  Trainer Details
                </Text>
                <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginTop: 4, fontWeight: '500' }}>
                  Tell us about your expertise
                </Text>
              </View>

              {/* ── Personal information ─────────────────────────── */}
              <InputField
                control={control}
                name="fullName"
                label="Full Name"
                placeholder="Full Name"
                error={errors.fullName?.message}
                leftIcon="person-outline"
              />

              <InputField
                control={control}
                name="contactNo"
                label="Contact Number"
                placeholder="Contact Number"
                error={errors.contactNo?.message}
                keyboardType="phone-pad"
                leftIcon="call-outline"
              />

              {/* ── Bio ─────────────────────────────────────────── */}
              <View style={{ marginBottom: 20 }}>
                <Controller
                  control={control}
                  name="bio"
                  render={() => (
                    <View>
                      <Text style={{ fontSize: fontSize.tag, color: colors.textSecondary, fontWeight: '600', marginBottom: 8 }}>
                        Bio
                      </Text>
                      <View
                        style={{
                          borderWidth: 1,
                          borderRadius: radius.md,
                          borderColor: errors.bio ? colors.error : colors.surfaceBorder,
                          backgroundColor: colors.white,
                          padding: 12,
                          minHeight: 96,
                        }}
                      >
                        <InputField
                          control={control}
                          name="bio"
                          label="Bio"
                          placeholder="Tell us about your training philosophy and experience..."
                          error={errors.bio?.message}
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                        />
                      </View>
                    </View>
                  )}
                />
              </View>

              {/* ── Expertise categories ─────────────────────────── */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: fontSize.tag, color: colors.textSecondary, fontWeight: '600', marginBottom: 10 }}>
                  Expertise Categories
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {EXPERTISE_CATEGORIES.map((category) => {
                    const isSelected = expertiseCategories?.includes(category);
                    return (
                      <TouchableOpacity
                        key={category}
                        onPress={() => toggleExpertise(category)}
                        activeOpacity={0.75}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: radius.full,
                          borderWidth: 1.5,
                          borderColor: isSelected ? colors.trainerPrimary : colors.surfaceBorder,
                          backgroundColor: isSelected ? colors.trainerMuted : colors.white,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: fontSize.tag,
                            fontWeight: '600',
                            color: isSelected ? colors.trainerPrimary : colors.textMuted,
                          }}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.expertiseCategories && (
                  <Text style={{ fontSize: fontSize.caption, color: colors.error, marginTop: 6 }}>
                    {errors.expertiseCategories.message}
                  </Text>
                )}
              </View>

              {/* ── Years of experience ──────────────────────────── */}
              <InputField
                control={control}
                name="yearsOfExperience"
                label="Years of Experience"
                placeholder="Years of Experience"
                error={errors.yearsOfExperience?.message}
                keyboardType="numeric"
                leftIcon="calendar-outline"
              />

              {/* ── Pricing per session ──────────────────────────── */}
              <InputField
                control={control}
                name="pricingPerSession"
                label="Pricing Per Session"
                placeholder="Pricing Per Session"
                error={errors.pricingPerSession?.message}
                keyboardType="numeric"
                leftIcon="cash-outline"
              />

              {/* ── Session type ─────────────────────────────────── */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: fontSize.tag, color: colors.textSecondary, fontWeight: '600', marginBottom: 10 }}>
                  Session Type
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {SESSION_TYPES.map(({ type, icon }) => {
                    const isSelected = sessionType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setValue('sessionType', type)}
                        activeOpacity={0.75}
                        style={{
                          flex: 1,
                          paddingVertical: 14,
                          borderRadius: radius.md,
                          borderWidth: 1.5,
                          borderColor: isSelected ? colors.trainerPrimary : colors.surfaceBorder,
                          backgroundColor: isSelected ? colors.trainerMuted : colors.white,
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Ionicons
                          name={icon}
                          size={22}
                          color={isSelected ? colors.trainerPrimary : colors.textDisabled}
                        />
                        <Text
                          style={{
                            fontSize: fontSize.caption,
                            fontWeight: '600',
                            color: isSelected ? colors.trainerPrimary : colors.textMuted,
                            textTransform: 'capitalize',
                          }}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.sessionType && (
                  <Text style={{ fontSize: fontSize.caption, color: colors.error, marginTop: 6 }}>
                    {errors.sessionType.message}
                  </Text>
                )}
              </View>

              {/* ── File uploads ─────────────────────────────────── */}
              <FileUploadField
                label="Profile Image *"
                onPress={handlePickProfileImage}
                files={profileImage ? [profileImage] : []}
                onRemove={() => resetField('profileImage')}
                error={(errors.profileImage as { message?: string } | undefined)?.message}
              />

              <FileUploadField
                label="ID Proof *"
                onPress={handlePickIdProof}
                files={idProof ? [idProof] : []}
                onRemove={() => resetField('idProof')}
                error={(errors.idProof as { message?: string } | undefined)?.message}
              />

              <FileUploadField
                label="Certifications * (min. 1)"
                onPress={handlePickCertifications}
                files={certifications ?? []}
                onRemove={handleRemoveCertification}
                error={(errors.certifications as { message?: string } | undefined)?.message}
                multiple
              />

              {/* ── Legal note ──────────────────────────────────── */}
              <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, textAlign: 'center', lineHeight: 18, marginBottom: 24, marginTop: 8 }}>
                {'By creating an account, you confirm you have read and accepted our '}
                <Text style={{ color: colors.trainerPrimary, fontWeight: '600' }}>Privacy Policy</Text>
                {' and '}
                <Text style={{ color: colors.trainerPrimary, fontWeight: '600' }}>Terms of Use</Text>
              </Text>

              {/* ── CTA ─────────────────────────────────────────── */}
              <Button
                title="Finish"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
              />

            </View>
            {' '}
            {/* card */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
