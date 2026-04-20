import { Stack } from 'expo-router';

export default function ClientProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="editProfile" />
            <Stack.Screen name="favourites" />
        </Stack>
    );
}
