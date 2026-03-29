import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { colors, fontSize } from '@/constants/theme';

interface ChatFabProps {
    onPress: () => void;
    unreadCount?: number;
    variant?: 'client' | 'trainer' | 'ai';
    bottom: number;
    right?: number;
    iconName?: keyof typeof Ionicons.glyphMap;
    accessibilityLabel?: string;
}

export default function ChatFab({
    onPress,
    unreadCount = 0,
    variant = 'client',
    bottom,
    right = 20,
    iconName,
    accessibilityLabel,
}: ChatFabProps) {
    const resolvedIcon = iconName ?? (variant === 'ai' ? 'sparkles' : 'chatbubbles');

    const bgColor = (() => {
        if (variant === 'trainer') return colors.trainerPrimary;
        if (variant === 'ai') return colors.primarySurface;
        return colors.primary;
    })();

    const iconColor = variant === 'ai' ? colors.primary : colors.white;
    const shadowColor = variant === 'trainer' ? colors.trainerPrimary : colors.primary;
    const borderColor = variant === 'ai' ? colors.primaryBorder : 'transparent';
    const borderWidth = variant === 'ai' ? 2 : 0;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={{
                position: 'absolute',
                bottom,
                right,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: bgColor,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth,
                borderColor,
                shadowColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.45,
                shadowRadius: 8,
                elevation: 6,
                zIndex: 10,
            }}
        >
            <Ionicons name={resolvedIcon} size={24} color={iconColor} />
            {unreadCount > 0 && (
                <View
                    style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        minWidth: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: colors.error,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 5,
                        borderWidth: 2,
                        borderColor: colors.white,
                    }}
                >
                    <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}
