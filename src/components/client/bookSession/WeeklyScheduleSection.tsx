import { ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors, fontSize, radius } from '@/constants/theme';
import type { ApiScheduleDay } from '@/types/clientTypes';

const SCHEDULE_DAYS = [
    { key: 'Sun', jsDay: 0 },
    { key: 'Mon', jsDay: 1 },
    { key: 'Tue', jsDay: 2 },
    { key: 'Wed', jsDay: 3 },
    { key: 'Thu', jsDay: 4 },
    { key: 'Fri', jsDay: 5 },
    { key: 'Sat', jsDay: 6 },
] as const;

export function WeeklyScheduleSection({
    animatedStyle,
    availability,
}: {
    animatedStyle: object;
    availability: ApiScheduleDay[];
}) {
    const hasEnabled = availability.some((d) => d.enabled);
    if (!hasEnabled) return null;

    return (
        <Animated.View style={animatedStyle}>
            <View style={{ gap: 10 }}>
                <Text
                    style={{
                        fontSize: fontSize.body,
                        fontWeight: '700',
                        color: colors.textPrimary,
                    }}
                >
                    Weekly Schedule
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                >
                    {SCHEDULE_DAYS.map(({ key, jsDay }) => {
                        const dayData = availability.find((d) => d.day_of_week === jsDay);
                        const isEnabled = dayData?.enabled ?? false;
                        return (
                            <View
                                key={key}
                                style={{
                                    width: 64,
                                    borderRadius: radius.md,
                                    backgroundColor: isEnabled
                                        ? colors.primarySurface
                                        : colors.surface,
                                    borderWidth: 1,
                                    borderColor: isEnabled
                                        ? colors.primaryBorderSm
                                        : colors.surfaceBorder,
                                    paddingVertical: 10,
                                    paddingHorizontal: 6,
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: fontSize.caption,
                                        fontWeight: '700',
                                        color: isEnabled
                                            ? colors.primary
                                            : colors.textDisabled,
                                    }}
                                >
                                    {key}
                                </Text>
                                {isEnabled && (dayData?.slots.length ?? 0) > 0 ? (
                                    dayData!.slots.map((slot) => (
                                        <Text
                                            key={slot.start_time}
                                            style={{
                                                fontSize: fontSize.badge,
                                                color: colors.primary,
                                                fontWeight: '500',
                                            }}
                                        >
                                            {slot.start_time}
                                        </Text>
                                    ))
                                ) : (
                                    <Text
                                        style={{
                                            fontSize: fontSize.badge,
                                            color: colors.textDisabled,
                                        }}
                                    >
                                        {isEnabled ? '—' : 'Off'}
                                    </Text>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        </Animated.View>
    );
}
