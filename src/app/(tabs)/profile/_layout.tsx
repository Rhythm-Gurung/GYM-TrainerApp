import { Stack } from 'expo-router';

export default function ProfileLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="edit"
                options={{
                    headerShown: false,
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="switchUser"
                options={{
                    headerShown: false,
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="settings"
                options={{
                    headerShown: false,
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="billingPlans"
                options={{
                    headerShown: false,
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="users"
                options={{
                    headerShown: false,
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="addUser"
                options={{
                    headerShown: false,
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="rolesAccess"
                options={{
                    headerShown: false,
                    presentation: 'card',
                }}
            />
        </Stack>
    );
}
