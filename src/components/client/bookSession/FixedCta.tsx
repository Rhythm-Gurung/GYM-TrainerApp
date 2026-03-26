import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { colors, fontSize, radius, shadow } from '@/constants/theme';

export function FixedCta({
    bottomInset,
    onPress,
    disabled,
    isLoading,
    label,
}: {
    bottomInset: number;
    onPress: () => void;
    disabled: boolean;
    isLoading: boolean;
    label: string;
}) {
    return (
        <View
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: bottomInset + 16,
                backgroundColor: colors.background,
                borderTopWidth: 1,
                borderTopColor: colors.surfaceBorder,
            }}
        >
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled}
                activeOpacity={0.85}
                style={{
                    backgroundColor: !disabled && !isLoading ? colors.primary : colors.textDisabled,
                    borderRadius: radius.card,
                    paddingVertical: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    ...(!disabled && !isLoading ? shadow.primary : {}),
                }}
            >
                {isLoading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                ) : (
                    <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color={colors.white}
                    />
                )}
                <Text
                    style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.white }}
                >
                    {isLoading ? 'Confirming...' : label}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
