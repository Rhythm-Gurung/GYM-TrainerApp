import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    Button,
    InputField,
} from '@/components/ui/formComponent';
import { useAuth } from '@/contexts/auth';
import { getErrorMessage, showErrorToast, showSuccessToast } from '@/lib';
import {
    type AdditionalRegisterFormData,
    additionalRegisterSchema,
} from '@/schemas/auth.schemas';


import { colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdditionalRegisterPage() {
    const router = useRouter();
    const { register: registerUser } = useAuth();
    const { email, password, confirmPassword } = useLocalSearchParams<{
        email: string;
        password: string;
        confirmPassword: string;
    }>();

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<AdditionalRegisterFormData>({
        resolver: zodResolver(additionalRegisterSchema),
        mode: 'onBlur',
        defaultValues: {
            businessName: '',
            ownerName: '',
            address: '',
            panVatNo: '',
            contactNo: '',
            businessType: '',
            agreeCompanyPolicies: false,
            receiveNews: false,
        },
    });

    const agreeCompanyPolicies = useWatch({ control, name: 'agreeCompanyPolicies' });
    const receiveNews = useWatch({ control, name: 'receiveNews' });

    const onSubmit = useCallback(
        async (data: AdditionalRegisterFormData) => {
            try {
                const response = await registerUser({
                    email,
                    password,
                    confirmPassword,
                    businessName: data.businessName,
                    ownerName: data.ownerName,
                    address: data.address,
                    panVatNo: data.panVatNo,
                    contactNo: data.contactNo,
                    businessType: data.businessType,
                    agreeCompanyPolicies: data.agreeCompanyPolicies,
                    receiveNews: data.receiveNews,
                });

                showSuccessToast(
                    response.detail ?? 'Please check your email to verify your account.',
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
        [registerUser, email, password, confirmPassword, router],
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
                            <Text className="text-center text-heading font-bold text-foreground mb-6">
                                Additional Details
                            </Text>
                            <Text className="text-center text-gray-light text-base mb-4">
                                Please enter your details to register
                            </Text>
                        </View>

                        <View className="mb-3">
                            <InputField
                                control={control}
                                name="businessName"
                                label="Name of Business"
                                placeholder="Name of Business"
                                error={errors.businessName?.message}
                            />

                            <InputField
                                control={control}
                                name="ownerName"
                                label="Owner Name"
                                placeholder="Owner Name"
                                error={errors.ownerName?.message}
                            />

                            <InputField
                                control={control}
                                name="address"
                                label="Address"
                                placeholder="Address"
                                error={errors.address?.message}
                            />

                            <InputField
                                control={control}
                                name="panVatNo"
                                label="PAN/VAT No"
                                placeholder="PAN/VAT No"
                                error={errors.panVatNo?.message}
                            />

                            <InputField
                                control={control}
                                name="contactNo"
                                label="Contact No"
                                placeholder="Contact No"
                                error={errors.contactNo?.message}
                                keyboardType="phone-pad"
                            />

                            <InputField
                                control={control}
                                name="businessType"
                                label="Type of Business"
                                placeholder="Type of Business"
                                error={errors.businessType?.message}
                            />
                        </View>

                        <View className="mb-4">
                            <TouchableOpacity
                                onPress={() => setValue('agreeCompanyPolicies', !agreeCompanyPolicies)}
                                className="flex-row items-center mb-3"
                            >
                                <View
                                    className={`w-5 h-5 rounded border items-center justify-center ${agreeCompanyPolicies ? 'bg-action-dark border-action-dark' : 'border-gray-light'
                                        }`}
                                >
                                    {agreeCompanyPolicies && <Ionicons name="checkmark" size={14} color={colors.white} />}
                                </View>
                                <Text className="text-gray-light ml-2 font-medium">I agree with company policies</Text>
                            </TouchableOpacity>
                            {errors.agreeCompanyPolicies && (
                                <Text className="text-error text-sm mb-2">{errors.agreeCompanyPolicies.message}</Text>
                            )}

                            <TouchableOpacity
                                onPress={() => setValue('receiveNews', !receiveNews)}
                                className="flex-row items-center"
                            >
                                <View
                                    className={`w-5 h-5 rounded border items-center justify-center ${receiveNews ? 'bg-action-dark border-action-dark' : 'border-gray-light'
                                        }`}
                                >
                                    {receiveNews && <Ionicons name="checkmark" size={14} color={colors.white} />}
                                </View>
                                <Text className="text-gray-light ml-2 font-medium">
                                    Send me news and update from supplier.com
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text className="text-center text-foreground-3 text-sm mb-6">
                            By creating an account, you confirm you have read
                            {' '}
                            and accepted our
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
