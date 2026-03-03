import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="roleSelection" />
            <Stack.Screen name="trainerRegister" />
            <Stack.Screen name="trainerAdditionalRegister" />
            <Stack.Screen name="trainerPendingApproval" />
            <Stack.Screen name="forgotPassword" />
            <Stack.Screen name="verifyEmail" />
            <Stack.Screen name="verifyForgotPassword" />
            <Stack.Screen name="changePassword" />
        </Stack>
    );
}
