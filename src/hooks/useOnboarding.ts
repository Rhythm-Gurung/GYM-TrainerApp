import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// AsyncStorage key for persisting onboarding completion status
const ONBOARDING_KEY = '@onboarding_completed';

// Handles checking, setting, and resetting onboarding completion status
export const useOnboarding = () => {
    const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);


    // Check if user has completed onboarding by reading from AsyncStorage
    const checkOnboardingStatus = async () => {
        try {
            const value = await AsyncStorage.getItem(ONBOARDING_KEY);
            const completed = value === 'true';
            setIsOnboardingCompleted(completed);
        } catch (error) {
            console.error('Error reading onboarding status:', error);
            setIsOnboardingCompleted(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Check onboarding status on hook initialization
    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    //  * Mark onboarding as completed and persist to AsyncStorage
    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
            setIsOnboardingCompleted(true);
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    };

    //  * Reset onboarding status (for testing)
    const resetOnboarding = async () => {
        try {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
            setIsOnboardingCompleted(false);
        } catch (error) {
            console.error('Error resetting onboarding status:', error);
        }
    };

    return {
        isOnboardingCompleted,
        isLoading,
        completeOnboarding,
        resetOnboarding,
    };
};