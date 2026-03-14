import { Stack } from 'expo-router';

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="editProfile" />
            <Stack.Screen name="certifications" />
            <Stack.Screen name="gallery" />
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
