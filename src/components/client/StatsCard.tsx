import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors, fontSize, radius, shadow } from '@/constants/theme';

interface StatsCardProps {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
}

export default function StatsCard({ title, value, icon }: StatsCardProps) {
    return (
        <View
            className="flex-1 bg-white rounded-2xl p-4 items-center border border-surface"
            style={shadow.card}
        >
            <View
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: radius.sm,
                    backgroundColor: colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                }}
            >
                <Ionicons name={icon} size={18} color={colors.primary} />
            </View>
            <Text style={{ fontSize: fontSize.stat, fontWeight: '800', color: colors.textPrimary, lineHeight: 22 }}>
                {value}
            </Text>
            <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, fontWeight: '500', marginTop: 2 }}>
                {title}
            </Text>
        </View>
    );
}
