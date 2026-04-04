import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { colors, fontSize, radius, shadow } from '@/constants/theme';

interface StatsCardProps {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBg?: string;
    onPress?: () => void;
    badgeCount?: number;
}

export default function StatsCard({ title, value, icon, iconColor, iconBg, onPress, badgeCount }: StatsCardProps) {
    const Container = onPress ? TouchableOpacity : View;
    return (
        <Container
            onPress={onPress}
            activeOpacity={onPress ? 0.8 : undefined}
            className="flex-1 bg-white rounded-2xl p-4 items-center border border-surface"
            style={shadow.card}
        >
            <View style={{ position: 'relative' }}>
                <View
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.sm,
                        backgroundColor: iconBg ?? colors.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                    }}
                >
                    <Ionicons name={icon} size={18} color={iconColor ?? colors.primary} />
                </View>
                {badgeCount !== undefined && badgeCount > 0 && (
                    <View
                        style={{
                            position: 'absolute',
                            top: -4,
                            right: -6,
                            minWidth: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: colors.error,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 4,
                        }}
                    >
                        <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>
                            {badgeCount > 99 ? '99+' : badgeCount}
                        </Text>
                    </View>
                )}
            </View>
            <Text style={{ fontSize: fontSize.stat, fontWeight: '800', color: colors.textPrimary, lineHeight: 22 }}>
                {value}
            </Text>
            <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, fontWeight: '500', marginTop: 2 }}>
                {title}
            </Text>
        </Container>
    );
}
