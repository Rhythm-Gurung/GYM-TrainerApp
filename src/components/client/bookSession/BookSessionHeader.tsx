import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { colors, fontSize, radius } from '@/constants/theme';

export function BookSessionHeader({
    topInset,
    selectedCount,
    onBack,
}: {
    topInset: number;
    selectedCount: number;
    onBack: () => void;
}) {
    return (
        <View
            style={{
                paddingTop: topInset + 14,
                paddingBottom: 14,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: colors.background,
                borderBottomWidth: 1,
                borderBottomColor: colors.surfaceBorder,
            }}
        >
            <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.sm,
                    backgroundColor: colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
                <Text
                    style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.textPrimary }}
                >
                    Book Session
                </Text>
                {selectedCount > 0 && (
                    <Text style={{ fontSize: fontSize.caption, color: colors.primary, marginTop: 1 }}>
                        {selectedCount === 1 ? '1 date selected' : `${selectedCount} dates selected`}
                    </Text>
                )}
            </View>
        </View>
    );
}
