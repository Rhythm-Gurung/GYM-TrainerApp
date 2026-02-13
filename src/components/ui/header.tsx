import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface HeaderProps {
    title: string;
    onNotificationPress?: () => void;
    onCartPress?: () => void;
}

function Header({
    title,
    onNotificationPress,
    onCartPress,
}: HeaderProps) {
    const handleNotificationPress = () => {
        onNotificationPress?.();
    };

    const handleCartPress = () => {
        onCartPress?.();
    };

    return (
        <View className="flex-row items-center justify-between px-4 py-3 bg-white">
            <Text className="text-xl font-semibold text-gray-900 flex-1">
                {title}
            </Text>
            <View className="flex-row items-center gap-2">
                <Pressable
                    onPress={handleNotificationPress}
                    className="p-2"
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                    <Ionicons name="notifications-outline" size={24} color="#000" />
                </Pressable>

                <Pressable
                    onPress={handleCartPress}
                    className="p-2"
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                    <Ionicons name="cart-outline" size={24} color="#000" />
                </Pressable>

                <Pressable
                    className="p-2"
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                    <Ionicons name="menu" size={24} color="#000" />
                </Pressable>
            </View>
        </View>
    );
}

export default Header;