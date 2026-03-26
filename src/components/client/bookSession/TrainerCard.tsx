import { Image as ExpoImage } from 'expo-image';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { resolveImageUrl } from '@/lib';

export function TrainerCard({
    animatedStyle,
    avatar,
    initials,
    name,
    expertise,
    hourlyRate,
}: {
    animatedStyle: object;
    avatar?: string;
    initials: string;
    name: string;
    expertise: string[];
    hourlyRate: number;
}) {
    const { authState } = useAuth();

    return (
        <Animated.View style={animatedStyle}>
            <View
                style={{
                    backgroundColor: colors.white,
                    borderRadius: radius.card,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    borderWidth: 1,
                    borderColor: colors.surfaceBorder,
                    ...shadow.card,
                }}
            >
                <View
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: radius.card,
                        backgroundColor: colors.primarySurface,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: colors.primaryBorderSm,
                        overflow: 'hidden',
                    }}
                >
                    {avatar ? (
                        <ExpoImage
                            source={{
                                uri: resolveImageUrl(avatar),
                                headers: { Authorization: `Bearer ${authState.token ?? ''}` },
                            }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            cachePolicy="none"
                        />
                    ) : (
                        <Text
                            style={{
                                fontSize: fontSize.card,
                                fontWeight: '800',
                                color: colors.primary,
                            }}
                        >
                            {initials}
                        </Text>
                    )}
                </View>

                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontSize: fontSize.card,
                            fontWeight: '700',
                            color: colors.textPrimary,
                        }}
                    >
                        {name}
                    </Text>
                    <Text
                        style={{
                            fontSize: fontSize.caption,
                            color: colors.textMuted,
                            marginTop: 2,
                        }}
                    >
                        {expertise.slice(0, 2).join(' · ')}
                    </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                    <Text
                        style={{
                            fontSize: fontSize.stat,
                            fontWeight: '800',
                            color: colors.primary,
                        }}
                    >
                        {`₹${hourlyRate}`}
                    </Text>
                    <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                        /session
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
}
