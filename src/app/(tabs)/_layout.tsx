import { Stack } from 'expo-router';

export default function TabLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* Client routes - contains its own tab navigation */}
            <Stack.Screen name="client" />

            {/* Trainer routes - contains its own tab navigation */}
            <Stack.Screen name="trainer" />

        </Stack>
    );
}
