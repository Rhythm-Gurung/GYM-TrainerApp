import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { getErrorMessage, showErrorToast, showSuccessToast } from '@/lib';
import {
  type TrainerAdditionalDetailsFormData,
  trainerAdditionalDetailsSchema,
} from '@/schemas/trainer.schemas';
import { EXPERTISE_CATEGORIES } from '@/types/trainerTypes';

export default function TrainerAdditionalRegisterPage() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{
    email: string;
    password: string;
    confirmPassword: string;
  }>();

  const [certificationsFileName, setCertificationsFileName] = useState<string>('');
  const [idProofFileName, setIdProofFileName] = useState<string>('');
  const [profileImageFileName, setProfileImageFileName] = useState<string>('');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TrainerAdditionalDetailsFormData>({
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
    },
  });

  const expertiseCategories = watch('expertiseCategories');
  const sessionType = watch('sessionType');

  const toggleExpertise = (category: string) => {
    const current = expertiseCategories || [];
    if (current.includes(category)) {
      setValue(
        'expertiseCategories',
        current.filter((c) => c !== category)
      );
    } else {
      setValue('expertiseCategories', [...current, category]);
    }
  };

  const handleFileUpload = (type: 'certifications' | 'idProof' | 'profileImage') => {
    // Placeholder for file upload logic
    // In production, use expo-document-picker or expo-image-picker
    const fileName = `${type}_${Date.now()}.pdf`;

    switch (type) {
      case 'certifications':
        setCertificationsFileName(fileName);
        break;
      case 'idProof':
        setIdProofFileName(fileName);
        break;
      case 'profileImage':
        setProfileImageFileName(fileName);
        break;
      default:
        // No action needed for unknown types
        break;
    }

    showSuccessToast('File selected successfully', 'Success');
  };

  const onSubmit = useCallback(
    async () => {
      try {
        // Placeholder: In production, this would call the trainer registration API
        // For now, we'll show a success message and navigate to verification

        // TODO: Implement actual trainer registration API call
        // const response = await trainerService.register({
        //   email,
        //   password,
        //   confirmPassword,
        //   ...data,
        //   certifications: certificationsFileName ? [{ uri: certificationsFileName, name: certificationsFileName, type: 'application/pdf' }] : undefined,
        //   idProof: idProofFileName ? { uri: idProofFileName, name: idProofFileName, type: 'application/pdf' } : undefined,
        //   profileImage: profileImageFileName ? { uri: profileImageFileName, name: profileImageFileName, type: 'image/jpeg' } : undefined,
        // });

        showSuccessToast(
          'Please check your email to verify your account.',
          'Registration Successful',
        );

        router.push({
          pathname: '/(auth)/verifyEmail',
          params: { email },
        });
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          'Registration failed. Please try again.',
        );
        showErrorToast(errorMessage, 'Registration Failed');
      }
    },
    [email, router],
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
          <View className="flex-1 px-6 justify-center py-6">
            <View className="mb-6">
              <Text className="text-center text-3xl font-bold text-gray-900 mb-4">
                Trainer Details
              </Text>
              <Text className="text-center text-gray-light text-base mb-4">
                Tell us more about your expertise
              </Text>
            </View>

            <View className="mb-3">
              {/* Personal Information */}
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

              {/* Bio */}
              <View className="mb-6">
                <Controller
                  control={control}
                  name="bio"
                  render={() => (
                    <View>
                      <Text className="text-gray-700 font-medium mb-2">Bio</Text>
                      <View
                        className={`border rounded-lg p-3 bg-white ${errors.bio ? 'border-red-400' : 'border-gray-200'
                          }`}
                      >
                        <View className="border-0 text-gray-900 min-h-24">
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
                    </View>
                  )}
                />
              </View>

              {/* Expertise Categories */}
              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-2">
                  Expertise Categories
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {EXPERTISE_CATEGORIES.map((category) => {
                    const isSelected = expertiseCategories?.includes(category);
                    return (
                      <TouchableOpacity
                        key={category}
                        onPress={() => toggleExpertise(category)}
                        className={`px-4 py-2 rounded-full border ${isSelected
                            ? 'bg-[#73C2FB] border-[#73C2FB]'
                            : 'bg-white border-gray-300'
                          }`}
                      >
                        <Text
                          className={`${isSelected ? 'text-white' : 'text-gray-700'
                            } font-medium`}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.expertiseCategories && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.expertiseCategories.message}
                  </Text>
                )}
              </View>

              {/* Years of Experience */}
              <Controller
                control={control}
                name="yearsOfExperience"
                render={({ field: { onChange } }) => (
                  <InputField
                    control={control}
                    name="yearsOfExperience"
                    label="Years of Experience"
                    placeholder="Years of Experience"
                    error={errors.yearsOfExperience?.message}
                    keyboardType="numeric"
                    leftIcon="calendar-outline"
                    onChangeText={(text) => onChange(parseInt(text, 10) || 0)}
                  />
                )}
              />

              {/* Pricing Per Session */}
              <Controller
                control={control}
                name="pricingPerSession"
                render={({ field: { onChange } }) => (
                  <InputField
                    control={control}
                    name="pricingPerSession"
                    label="Pricing Per Session"
                    placeholder="Pricing Per Session"
                    error={errors.pricingPerSession?.message}
                    keyboardType="numeric"
                    leftIcon="cash-outline"
                    onChangeText={(text) => onChange(parseFloat(text) || 0)}
                  />
                )}
              />

              {/* Session Type */}
              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-2">Session Type</Text>
                <View className="flex-row gap-3">
                  {(['online', 'offline', 'both'] as const).map((type) => {
                    let iconName: keyof typeof Ionicons.glyphMap;
                    if (type === 'online') {
                      iconName = 'videocam-outline';
                    } else if (type === 'offline') {
                      iconName = 'location-outline';
                    } else {
                      iconName = 'globe-outline';
                    }

                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setValue('sessionType', type)}
                        className={`flex-1 px-4 py-3 rounded-lg border items-center ${sessionType === type
                            ? 'bg-[#73C2FB] border-[#73C2FB]'
                            : 'bg-white border-gray-300'
                          }`}
                      >
                        <Ionicons
                          name={iconName}
                          size={24}
                          color={sessionType === type ? '#FFFFFF' : '#73C2FB'}
                        />
                        <Text
                          className={`mt-1 font-medium capitalize ${sessionType === type ? 'text-white' : 'text-gray-700'
                            }`}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.sessionType && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.sessionType.message}
                  </Text>
                )}
              </View>

              {/* File Uploads */}
              <FileUploadField
                label="Certifications (Optional)"
                onPress={() => handleFileUpload('certifications')}
                fileName={certificationsFileName}
                multiple
              />

              <FileUploadField
                label="ID Proof (Optional)"
                onPress={() => handleFileUpload('idProof')}
                fileName={idProofFileName}
              />

              <FileUploadField
                label="Profile Image (Optional)"
                onPress={() => handleFileUpload('profileImage')}
                fileName={profileImageFileName}
              />
            </View>

            <Text className="text-center text-gray-600 text-sm mb-6">
              By creating an account, you confirm you have read and accepted our
              {' '}
              <Text className="text-primary-btn font-medium">Privacy Policy</Text>
              {' '}
              and
              {' '}
              <Text className="text-primary-btn font-medium">Terms of Use</Text>
            </Text>

            <View className="items-center mt-4">
              <Button
                title="Finish"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                width={250}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
