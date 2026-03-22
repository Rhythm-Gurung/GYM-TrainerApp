import { Stack } from 'expo-router';

export default function ClientProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen
                name="profileMenu"
                options={{
                    presentation: 'transparentModal',
                    animation: 'slide_from_right',
                }}
            />
        </Stack>
    );
}
