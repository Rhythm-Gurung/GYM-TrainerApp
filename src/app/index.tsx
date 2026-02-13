import { useOnboarding } from '@/hooks/useOnboarding';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    // Get onboarding status from unboarding hook
    const { isOnboardingCompleted, isLoading } = useOnboarding();

    // Show loading indicator while checking onboarding status from AsyncStorage
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBFBFB' }}>
                <ActivityIndicator size="large" color="#73C2FB" />
            </View>
        );
    }

    // If user has completed onboarding, redirect to login screen
    if (isOnboardingCompleted) {
        return <Redirect href="/(auth)/login" />;
    }

    // If user hasn't completed onboarding, show onboarding screens
    return <Redirect href="/onboarding" />;
}