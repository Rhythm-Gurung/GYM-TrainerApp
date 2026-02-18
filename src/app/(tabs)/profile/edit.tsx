import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

import { useTabBarHeight } from '@/hooks/useTabBarHeight';

import { Button, InputField } from '@/components/ui/formComponent';
import { useAuth } from '@/contexts/auth';
import { showErrorToast, showSuccessToast } from '@/lib';


import { colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EditProfileFormData {
    businessType: string;
    panVatNo: string;
    ownerName: string;
    businessName: string;
    address: string;
    contactNo: string;
    email: string;
}

export default function EditProfile() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const { authState: { user }, updateProfile } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [profileImage] = useState<string | undefined>(
        user?.profile_image,
    );

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<EditProfileFormData>({
        defaultValues: {
            businessType: user?.business_name || 'Fashion',
            panVatNo: '',
            ownerName: user?.username || '',
            businessName: user?.business_name || '',
            address: '',
            contactNo: '',
            email: user?.email || '',
        },
    });

    const handleImagePick = async () => {
        try {
            // TODO: Implement image picker using expo-image-picker
            // For now, just show a message
            showErrorToast('Image picker not implemented yet', 'Info');
        } catch {
            showErrorToast('Failed to pick image', 'Error');
        }
    };

    const handleSave = async (data: EditProfileFormData) => {
        try {
            setIsLoading(true);
            await updateProfile({
                businessName: data.businessName,
                ownerName: data.ownerName,
                address: data.address,
                panVatNo: data.panVatNo,
                contactNo: data.contactNo,
                businessType: data.businessType,
                profileImage,
            });
            showSuccessToast('Profile updated successfully', 'Success');
            router.back();
        } catch {
            showErrorToast('Failed to update profile', 'Error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 px-6 py-8">
                        {/* Header */}
                        <View className="flex-row items-center mb-6">
                            <TouchableOpacity onPress={handleCancel} className="mr-4">
                                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                            <Text className="text-title font-bold text-foreground">
                                Edit Profile
                            </Text>
                        </View>

                        {/* Profile Image */}
                        <View className="items-center mb-8">
                            <View style={{ position: 'relative', width: 128, height: 128 }}>
                                {profileImage ? (
                                    <Image
                                        source={{ uri: profileImage }}
                                        className="w-32 h-32 rounded-full"
                                    />
                                ) : (
                                    <View className="w-32 h-32 rounded-full bg-surface-border items-center justify-center">
                                        <Ionicons name="person" size={64} color={colors.textSubtle} />
                                    </View>
                                )}
                                <TouchableOpacity
                                    onPress={handleImagePick}
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                    }}
                                    className="bg-action w-10 h-10 rounded-full items-center justify-center border-4 border-white"
                                >
                                    <Ionicons name="camera" size={20} color={colors.white} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Form Fields */}
                        <View>
                            <InputField
                                control={control}
                                name="businessType"
                                label="Business Type"
                                placeholder="e.g., Fashion"
                                error={errors.businessType?.message}
                                leftIcon="briefcase-outline"
                            />

                            <InputField
                                control={control}
                                name="panVatNo"
                                label="PAN/VAT No"
                                placeholder="Enter PAN/VAT number"
                                error={errors.panVatNo?.message}
                                leftIcon="card-outline"
                            />

                            <InputField
                                control={control}
                                name="ownerName"
                                label="Owner Name"
                                placeholder="Enter owner name"
                                error={errors.ownerName?.message}
                                leftIcon="person-outline"
                            />

                            <InputField
                                control={control}
                                name="businessName"
                                label="Business Name"
                                placeholder="Enter business name"
                                error={errors.businessName?.message}
                                leftIcon="storefront-outline"
                            />

                            <InputField
                                control={control}
                                name="address"
                                label="Address"
                                placeholder="e.g., Kathmandu"
                                error={errors.address?.message}
                                leftIcon="location-outline"
                            />

                            <InputField
                                control={control}
                                name="contactNo"
                                label="Contact Number"
                                placeholder="e.g., 98600000000"
                                error={errors.contactNo?.message}
                                leftIcon="call-outline"
                                keyboardType="phone-pad"
                            />

                            <InputField
                                control={control}
                                name="email"
                                label="Email"
                                placeholder="email@example.com"
                                error={errors.email?.message}
                                leftIcon="mail-outline"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Action Buttons */}
                        <View className="mt-4">
                            <Button
                                title="Save"
                                onPress={handleSubmit(handleSave)}
                                loading={isLoading}
                                disabled={isLoading}
                            />

                            <View className="mt-4">
                                <TouchableOpacity
                                    onPress={handleCancel}
                                    disabled={isLoading}
                                    className="border-2 border-cancel py-4 rounded-lg items-center"
                                >
                                    <Text className="text-cancel text-base font-semibold">
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
