import {
    useCallback,
    useState,
} from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '@/contexts/auth';
import { getErrorMessage, showErrorToast, showSuccessToast } from '@/lib';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
    const router = useRouter();
    const { googleLogin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const [request, , promptAsync] = Google.useIdTokenAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });

    const handleGoogleSignIn = useCallback(async () => {
        try {
            setIsLoading(true);

            const result = await promptAsync();

            if (result?.type === 'success') {
                const { id_token } = result.params;

                if (!id_token) {
                    throw new Error('No ID token received from Google');
                }

                await googleLogin(id_token);
                showSuccessToast('Welcome back!', 'Login Successful');
                router.replace('/(tabs)/home');
            } else if (result?.type === 'error') {
                throw new Error('Google sign-in failed');
            }
        } catch (error) {
            const errorMessage = getErrorMessage(
                error,
                'Google sign-in failed. Please try again.',
            );
            showErrorToast(errorMessage, 'Google Sign-In Failed');
        } finally {
            setIsLoading(false);
        }
    }, [promptAsync, googleLogin, router]);

    return {
        handleGoogleSignIn,
        isLoading,
        isReady: !!request,
    };
}
