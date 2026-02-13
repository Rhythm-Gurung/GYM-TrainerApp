import '../global.css';

import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';

import { AuthProvider } from '@/contexts/auth';



export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen
                    name="onboarding"
                    options={{
                        gestureEnabled: false,
                        animation: 'none',
                    }}
                />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
            </Stack>
            <Toast />
        </AuthProvider>
    );
}
