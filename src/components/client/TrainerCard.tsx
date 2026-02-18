import { Ionicons } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { colors, fontSize, radius, shadow } from '@/constants/theme';
import type { Trainer } from '@/types/clientTypes';

interface TrainerCardProps {
    trainer: Trainer;
    onPress: () => void;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('');
}

export default function TrainerCard({ trainer, onPress }: TrainerCardProps) {
    const initials = getInitials(trainer.name);
    const visibleTags = trainer.expertise.slice(0, 2);
    const extraTagCount = trainer.expertise.length - visibleTags.length;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            className="bg-white rounded-2xl border border-surface p-4"
            style={shadow.card}
        >
            <View className="flex-row items-center">
                {/* Avatar */}
                <View style={{ position: 'relative', marginRight: 12 }}>
                    {trainer.avatar ? (
                        <Image
                            source={{ uri: trainer.avatar }}
                            style={{ width: 56, height: 56, borderRadius: radius.card }}
                        />
                    ) : (
                        <View
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: radius.card,
                                backgroundColor: colors.primaryLight,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1.5,
                                borderColor: colors.primaryBorder,
                            }}
                        >
                            <Text style={{ fontSize: fontSize.icon, fontWeight: '700', color: colors.primary }}>
                                {initials}
                            </Text>
                        </View>
                    )}
                    {trainer.isVerified && (
                        <View
                            style={{
                                position: 'absolute',
                                bottom: -3,
                                right: -3,
                                width: 18,
                                height: 18,
                                borderRadius: 9,
                                backgroundColor: colors.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 2,
                                borderColor: colors.white,
                            }}
                        >
                            <Ionicons name="checkmark" size={10} color={colors.white} />
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                    {/* Name + Favorite */}
                    <View className="flex-row items-center justify-between">
                        <Text
                            style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary, flex: 1 }}
                            numberOfLines={1}
                        >
                            {trainer.name}
                        </Text>
                        <Ionicons
                            name={trainer.isFavorited ? 'heart' : 'heart-outline'}
                            size={18}
                            color={trainer.isFavorited ? colors.error : colors.textDisabled}
                        />
                    </View>

                    {/* Rating */}
                    <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={12} color={colors.accent} />
                        <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textSecondary, marginLeft: 3 }}>
                            {trainer.rating.toFixed(1)}
                        </Text>
                        <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, marginLeft: 3 }}>
                            {trainer.reviewCount}
                            {' reviews)'}
                        </Text>
                    </View>

                    {/* Tags */}
                    <View className="flex-row flex-wrap mt-2" style={{ gap: 4 }}>
                        {visibleTags.map((tag) => (
                            <View
                                key={tag}
                                style={{
                                    backgroundColor: colors.primarySubtle,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: radius.full,
                                }}
                            >
                                <Text style={{ fontSize: fontSize.badge, color: colors.primary, fontWeight: '600' }}>
                                    {tag}
                                </Text>
                            </View>
                        ))}
                        {extraTagCount > 0 && (
                            <View
                                style={{
                                    backgroundColor: colors.surface,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: radius.full,
                                }}
                            >
                                <Text style={{ fontSize: fontSize.badge, color: colors.textMuted, fontWeight: '600' }}>
                                    {`+${extraTagCount}`}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-surface-subtle">
                <View className="flex-row items-center">
                    <Ionicons name="location-outline" size={13} color={colors.textSubtle} />
                    <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginLeft: 3 }}>
                        {trainer.location}
                    </Text>
                </View>
                <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.primary }}>
                    {`₹${trainer.hourlyRate.toLocaleString('en-IN')}/hr`}
                </Text>
            </View>
        </TouchableOpacity>
    );
}
