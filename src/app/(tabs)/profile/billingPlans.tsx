import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTabBarHeight } from '@/hooks/useTabBarHeight';

import { useAuth } from '@/contexts/auth';
import { showErrorToast, showSuccessToast } from '@/lib';

interface BillingPlan {
    id: string;
    name: string;
    features: string[];
    isPremium?: boolean;
}

interface CurrentSubscription {
    planName: string;
    expiryDate: string;
    isPremium: boolean;
}

export default function BillingPlans() {
    const router = useRouter();
    const tabBarHeight = useTabBarHeight();
    const { authState: { user } } = useAuth();
    const [subscribingTo, setSubscribingTo] = useState<string | null>(null);

    // TODO: Replace with actual API call to get current subscription
    const currentSubscription: CurrentSubscription = {
        planName: 'Premium Plan',
        expiryDate: '18/02/2025',
        isPremium: true,
    };

    // TODO: Replace with actual API call to get available plans
    const billingPlans: BillingPlan[] = [
        {
            id: 'basic',
            name: 'Basic Plan',
            features: ['Limited Users', 'Includes Order Management System'],
            isPremium: false,
        },
        {
            id: 'premium',
            name: 'Premium Plan',
            features: [
                'Unlimited Users',
                'Includes Order Management System (OMS) & Accounting System',
            ],
            isPremium: true,
        },
        {
            id: 'diamond',
            name: 'Diamond plan',
            features: [
                'Unlimited Users',
                'Includes Order Management System (OMS), Accounting System & POS System',
            ],
            isPremium: true,
        },
    ];

    const handleSubscribe = async (planId: string) => {
        try {
            setSubscribingTo(planId);
            // TODO: Implement API call to subscribe to plan
            // await subscribeToPlan(planId);

            // Simulate API call
            await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 1500);
            });

            showSuccessToast('Successfully subscribed to plan', 'Success');
        } catch {
            showErrorToast('Failed to subscribe to plan', 'Error');
        } finally {
            setSubscribingTo(null);
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 px-6 py-8">
                    {/* Header */}
                    <View className="flex-row items-center mb-6">
                        <TouchableOpacity onPress={handleBack} className="mr-4">
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-900">
                            Billing Plans
                        </Text>
                    </View>

                    {/* Profile Section */}
                    <View className="items-center mb-8">
                        {/* Profile Image */}
                        <View className="mb-4">
                            {user?.profile_image ? (
                                <Image
                                    source={{ uri: user.profile_image }}
                                    className="w-32 h-32 rounded-full"
                                />
                            ) : (
                                <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center">
                                    <Ionicons name="person" size={64} color="#9CA3AF" />
                                </View>
                            )}
                        </View>

                        {/* Business Name */}
                        <Text className="text-2xl font-bold text-gray-900 mb-6">
                            {user?.business_name || 'Vintuna Stores'}
                        </Text>
                    </View>

                    {/* Current Subscription */}
                    <View className="mb-6">
                        <Text className="text-base font-semibold text-gray-900 mb-3">
                            Current Subscription
                        </Text>
                        <View className="bg-white border border-gray-200 rounded-lg px-4 py-4">
                            <Text
                                className={`text-base font-semibold ${currentSubscription.isPremium
                                        ? 'text-blue-500'
                                        : 'text-gray-900'
                                    }`}
                            >
                                {currentSubscription.planName}
                            </Text>
                            <Text className="text-sm text-gray-500 mt-1">
                                {'Expires on '}
                                {currentSubscription.expiryDate}
                            </Text>
                        </View>
                    </View>

                    {/* Available Billing Plans */}
                    <View>
                        <Text className="text-base font-semibold text-gray-900 mb-3">
                            Available Billing Plans
                        </Text>
                        <View className="gap-4">
                            {billingPlans.map((plan) => (
                                <View
                                    key={plan.id}
                                    className="bg-white border border-gray-200 rounded-lg p-4"
                                >
                                    {/* Plan Name */}
                                    <Text className="text-lg font-semibold text-gray-900 mb-3">
                                        {plan.name}
                                    </Text>

                                    {/* Features */}
                                    <View className="mb-4">
                                        {plan.features.map((feature) => (
                                            <View
                                                key={feature}
                                                className="flex-row items-start mb-2"
                                            >
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={20}
                                                    color="#000"
                                                    style={{ marginRight: 8, marginTop: 2 }}
                                                />
                                                <Text className="text-sm text-gray-700 flex-1">
                                                    {feature}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Subscribe Button */}
                                    <TouchableOpacity
                                        onPress={() => handleSubscribe(plan.id)}
                                        disabled={subscribingTo !== null}
                                        className="bg-blue-500 py-3 rounded-lg items-center"
                                    >
                                        {subscribingTo === plan.id ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <Text className="text-white font-semibold text-base">
                                                Subscribe
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
