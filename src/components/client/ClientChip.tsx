import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { colors, fontSize, radius } from '@/constants/theme';

type ChipVariant = 'sort' | 'filter' | 'rating';

interface ClientChipProps {
    label: string;
    active: boolean;
    onPress: () => void;
    variant?: ChipVariant;
    leftIcon?: ReactNode;
}

export default function ClientChip({
    label,
    active,
    onPress,
    variant = 'filter',
    leftIcon,
}: ClientChipProps) {
    const chipStyle = (() => {
        if (variant === 'sort') {
            return {
                backgroundColor: active ? colors.primary : colors.white,
                borderColor: active ? colors.primary : colors.surfaceBorder,
                textColor: active ? colors.white : colors.textMuted,
                fontWeight: '600' as const,
                paddingHorizontal: 14,
                paddingVertical: 6,
            };
        }

        if (variant === 'rating') {
            return {
                backgroundColor: active ? colors.accent : colors.white,
                borderColor: active ? colors.accent : colors.surfaceBorder,
                textColor: active ? colors.white : colors.textMuted,
                fontWeight: '500' as const,
                paddingHorizontal: 12,
                paddingVertical: 5,
            };
        }

        return {
            backgroundColor: active ? colors.primaryMuted : colors.white,
            borderColor: active ? colors.primary : colors.surfaceBorder,
            textColor: active ? colors.primary : colors.textMuted,
            fontWeight: '500' as const,
            paddingHorizontal: 12,
            paddingVertical: 5,
        };
    })();

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                paddingHorizontal: chipStyle.paddingHorizontal,
                paddingVertical: chipStyle.paddingVertical,
                borderRadius: radius.full,
                backgroundColor: chipStyle.backgroundColor,
                borderWidth: 1,
                borderColor: chipStyle.borderColor,
            }}
        >
            {leftIcon ?? null}
            <Text style={{ fontSize: fontSize.tag, fontWeight: chipStyle.fontWeight, color: chipStyle.textColor }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

interface RatingChipProps {
    label: string;
    active: boolean;
    withStar: boolean;
    onPress: () => void;
}

export function ClientRatingChip({ label, active, withStar, onPress }: RatingChipProps) {
    return (
        <ClientChip
            label={label}
            active={active}
            onPress={onPress}
            variant="rating"
            leftIcon={withStar ? <Ionicons name="star" size={11} color={active ? colors.white : colors.accent} /> : undefined}
        />
    );
}
