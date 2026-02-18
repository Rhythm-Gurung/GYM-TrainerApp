import { Ionicons } from '@expo/vector-icons';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@/constants/theme';

interface DrawerItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    showChevron?: boolean;
}

function DrawerItem({ icon, label, onPress, showChevron }: DrawerItemProps) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center justify-between px-6 py-4 active:bg-surface"
            style={({ pressed }) => ({
                backgroundColor: pressed ? '#f3f4f6' : 'transparent',
            })}
        >
            <View className="flex-row items-center">
                <Ionicons name={icon} size={22} color={colors.textSecondary} />
                <Text className="ml-4 text-base text-foreground">
                    {label}
                </Text>
            </View>
            {showChevron && (
                <Ionicons name="chevron-down-outline" size={20} color={colors.textSubtle} />
            )}
        </Pressable>
    );
}

export default function DrawerContent(props: DrawerContentComponentProps) {
    const { navigation } = props;
    const router = useRouter();

    return (
        <View className="flex-1 bg-white">
            <DrawerContentScrollView {...props} className="flex-1">
                {/* Close Button */}
                <View className="flex-row justify-end">
                    <Pressable
                        onPress={() => navigation.closeDrawer()}
                        className="p-2"
                    >
                        <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </Pressable>
                </View>

                {/* Search Bar */}
                <View className="px-4 pb-4">
                    <View className="flex-row items-center bg-surface rounded-lg px-4 py-3">
                        <Ionicons name="search-outline" size={20} color={colors.textSubtle} />
                        <TextInput
                            placeholder="Search"
                            placeholderTextcolor={colors.textSubtle}
                            className="ml-2 flex-1 text-base text-foreground"
                        />
                    </View>
                </View>

                {/* Menu Items */}
                <View className="py-2">
                    <DrawerItem
                        icon="car-outline"
                        label="Respond Order"
                        onPress={() => {
                            router.push('/(tabs)/menu');
                        }}
                    />
                    <DrawerItem
                        icon="chatbubble-outline"
                        label="Product Quotation"
                        onPress={() => {
                            router.push('/(tabs)/favorite');
                        }}
                        showChevron
                    />
                    <DrawerItem
                        icon="clipboard-outline"
                        label="Reports"
                        onPress={() => {
                            router.push('/(tabs)/profile');
                        }}
                    />
                    <DrawerItem
                        icon="settings-outline"
                        label="Settings"
                        onPress={() => {
                            // Navigate to settings when you create it
                        }}
                    />
                    <DrawerItem
                        icon="log-out-outline"
                        label="Logout"
                        onPress={() => {
                            // Handle logout
                        }}
                    />
                </View>
            </DrawerContentScrollView>

            {/* User Profile Section */}
            <View className="border-t border-surface-border px-6 py-4">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-neutral items-center justify-center">
                        <Ionicons name="person" size={20} color={colors.textMuted} />
                    </View>
                    <Text className="ml-3 text-base font-medium text-foreground">
                        Roshan Gurung
                    </Text>
                </View>
            </View>
        </View>
    );
}