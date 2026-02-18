import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { colors, fontSize, radius } from '@/constants/theme';
import type { Trainer } from '@/types/clientTypes';

const CARD_STAGGER_MS = 60;
const CARD_DURATION_MS = 360;

interface ImmersiveTrainerCardProps {
    trainer: Trainer;
    index: number;
    animKey: number;
    onPress: () => void;
}

export default function ImmersiveTrainerCard({ trainer, index, animKey, onPress }: ImmersiveTrainerCardProps) {
    const [liked, setLiked] = useState(trainer.isFavorited ?? false);

    const initials = useMemo(
        () => trainer.name.split(' ').map((n) => n[0]).join(''),
        [trainer.name],
    );

    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    useEffect(() => {
        opacity.value = 0;
        translateY.value = 20;
        opacity.value = withDelay(index * CARD_STAGGER_MS, withTiming(1, { duration: CARD_DURATION_MS }));
        translateY.value = withDelay(index * CARD_STAGGER_MS, withTiming(0, { duration: CARD_DURATION_MS }));
    }, [animKey, index, opacity, translateY]);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[{ flex: 1 }, animStyle]}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.9}
                style={{
                    flex: 1,
                    aspectRatio: 3 / 4,
                    borderRadius: radius.hero,
                    overflow: 'hidden',
                    backgroundColor: colors.surface,
                }}
            >
                {trainer.avatar ? (
                    <Image source={{ uri: trainer.avatar }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                ) : (
                    <LinearGradient
                        colors={[colors.primaryMuted, colors.primaryBorder]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ fontSize: 34, fontWeight: '800', color: colors.primary }}>{initials}</Text>
                    </LinearGradient>
                )}

                <LinearGradient
                    colors={["transparent", colors.primaryDark]}
                    start={{ x: 0, y: 0.2 }}
                    end={{ x: 0, y: 1 }}
                    style={{ position: 'absolute', inset: 0 }}
                />

                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        setLiked((prev) => !prev);
                    }}
                    activeOpacity={0.8}
                    style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 34,
                        height: 34,
                        borderRadius: radius.full,
                        backgroundColor: colors.white18,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? colors.heartActive : colors.white} />
                </TouchableOpacity>

                {trainer.isVerified && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            borderRadius: radius.full,
                            backgroundColor: colors.primary,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                        }}
                    >
                        <Ionicons name="checkmark-circle" size={12} color={colors.white} />
                        <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.white }}>Verified</Text>
                    </View>
                )}

                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
                        <View style={{ flex: 1 }}>
                            <Text numberOfLines={1} style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.white }}>
                                {trainer.name}
                            </Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                                <Ionicons name="star" size={12} color={colors.accent} />
                                <Text style={{ fontSize: fontSize.caption, fontWeight: '700', color: colors.white, marginLeft: 4 }}>
                                    {trainer.rating}
                                </Text>
                                <Text style={{ fontSize: fontSize.badge, color: colors.white60, marginLeft: 4 }}>
                                    {`(${trainer.reviewCount})`}
                                </Text>
                                <Text style={{ fontSize: fontSize.badge, color: colors.white60, marginHorizontal: 6 }}>•</Text>
                                <Ionicons name="location-outline" size={10} color={colors.white60} />
                                <Text numberOfLines={1} style={{ fontSize: fontSize.badge, color: colors.white60, marginLeft: 2, flexShrink: 1 }}>
                                    {trainer.location}
                                </Text>
                            </View>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: fontSize.hero, fontWeight: '800', color: colors.white }}>
                                {`₹${trainer.hourlyRate}`}
                            </Text>
                            <Text style={{ fontSize: fontSize.badge, color: colors.white55 }}>/hour</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {trainer.expertise.slice(0, 2).map((tag) => (
                            <View
                                key={tag}
                                style={{
                                    backgroundColor: colors.white18,
                                    borderRadius: radius.full,
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                }}
                            >
                                <Text numberOfLines={1} style={{ fontSize: fontSize.badge, color: colors.white, fontWeight: '600' }}>
                                    {tag}
                                </Text>
                            </View>
                        ))}
                        {trainer.expertise.length > 2 && (
                            <Text style={{ fontSize: fontSize.badge, color: colors.white60, fontWeight: '600' }}>
                                {`+${trainer.expertise.length - 2}`}
                            </Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}
