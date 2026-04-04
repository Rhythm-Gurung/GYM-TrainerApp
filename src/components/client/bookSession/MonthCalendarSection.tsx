import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors, fontSize, radius, shadow } from '@/constants/theme';

interface CalCell {
    key: string;
    day: number | null;
}

const MONTH_LABELS_LONG = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const CAL_DAYS = [
    { key: 'Sun', label: 'Sun' },
    { key: 'Mon', label: 'Mon' },
    { key: 'Tue', label: 'Tue' },
    { key: 'Wed', label: 'Wed' },
    { key: 'Thu', label: 'Thu' },
    { key: 'Fri', label: 'Fri' },
    { key: 'Sat', label: 'Sat' },
] as const;

export function MonthCalendarSection({
    animatedStyle,
    calYear,
    calMonth,
    isCurrentMonth,
    onPrevMonth,
    onNextMonth,
    availableCountThisMonth,
    hasAvailableDatesInfo,
    calCells,
    availableSet,
    bookedSet,
    missedSet,
    completedSet,
    todayStr,
    selectedDates,
    activeSlotDate,
    isSlotsLoading,
    onDatePress,
    chunk,
}: {
    animatedStyle: object;
    calYear: number;
    calMonth: number;
    isCurrentMonth: boolean;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    availableCountThisMonth: number;
    hasAvailableDatesInfo: boolean;
    calCells: CalCell[];
    availableSet: Set<string>;
    bookedSet: Set<string>;
    missedSet: Set<string>;
    completedSet: Set<string>;
    todayStr: string;
    selectedDates: Set<string>;
    activeSlotDate: string | null;
    isSlotsLoading: boolean;
    onDatePress: (day: number) => void;
    chunk: <T>(arr: T[], size: number) => T[][];
}) {
    return (
        <Animated.View style={animatedStyle}>
            <View
                style={{
                    backgroundColor: colors.white,
                    borderRadius: radius.card,
                    borderWidth: 1,
                    borderColor: colors.surfaceBorder,
                    padding: 16,
                    gap: 14,
                    ...shadow.cardSubtle,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <TouchableOpacity
                        onPress={onPrevMonth}
                        activeOpacity={isCurrentMonth ? 1 : 0.7}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: radius.sm,
                            backgroundColor: isCurrentMonth ? colors.surface : colors.primarySurface,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={18}
                            color={isCurrentMonth ? colors.textDisabled : colors.primary}
                        />
                    </TouchableOpacity>

                    <View style={{ alignItems: 'center' }}>
                        <Text
                            style={{
                                fontSize: fontSize.body,
                                fontWeight: '800',
                                color: colors.textPrimary,
                            }}
                        >
                            {`${MONTH_LABELS_LONG[calMonth - 1]} ${calYear}`}
                        </Text>
                        {hasAvailableDatesInfo && (
                            <Text
                                style={{
                                    fontSize: fontSize.badge,
                                    color: availableCountThisMonth > 0
                                        ? colors.primary
                                        : colors.textSubtle,
                                    marginTop: 2,
                                    fontWeight: '600',
                                }}
                            >
                                {availableCountThisMonth > 0
                                    ? `${availableCountThisMonth} available`
                                    : 'No available dates'}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={onNextMonth}
                        activeOpacity={0.7}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: radius.sm,
                            backgroundColor: colors.primarySurface,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.primary}
                        />
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row' }}>
                    {CAL_DAYS.map(({ key, label }) => (
                        <View key={key} style={{ flex: 1, alignItems: 'center' }}>
                            <Text
                                style={{
                                    fontSize: fontSize.badge,
                                    fontWeight: '700',
                                    color: colors.textSubtle,
                                }}
                            >
                                {label}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={{ gap: 4 }}>
                    {chunk(calCells, 7).map((week, wi) => {
                        const rowKey = `${calYear}-${calMonth}-w${wi}`;
                        const weekHasAvailable = week.some((cell) => {
                            if (!cell.day) {
                                return false;
                            }
                            return (
                                bookedSet.has(cell.key)
                                || missedSet.has(cell.key)
                                || completedSet.has(cell.key)
                                || (availableSet.has(cell.key) && cell.key >= todayStr)
                            );
                        });
                        return (
                            <View
                                key={rowKey}
                                style={{
                                    flexDirection: 'row',
                                    gap: 4,
                                    opacity: weekHasAvailable ? 1 : 0.4,
                                }}
                            >
                                {week.map((cell) => {
                                    if (cell.day === null) {
                                        return (
                                            <View
                                                key={cell.key}
                                                style={{ flex: 1 }}
                                            />
                                        );
                                    }
                                    const { day, key: dateStr } = cell;
                                    const isAvailable = availableSet.has(dateStr);
                                    const isSelected = selectedDates.has(dateStr);
                                    const isActiveSlot = activeSlotDate === dateStr;
                                    const isPast = dateStr < todayStr;
                                    const isToday = dateStr === todayStr;
                                    const isBooked = bookedSet.has(dateStr);
                                    const isMissed = missedSet.has(dateStr);
                                    const isCompleted = completedSet.has(dateStr);
                                    const tappable = isAvailable && !isPast;

                                    let cellBg = 'transparent';
                                    let cellBorder = 0;
                                    let cellBorderColor = 'transparent';

                                    if (isSelected) {
                                        cellBg = colors.primary;
                                    } else if (isBooked) {
                                        cellBg = colors.statusNewBg;
                                        cellBorder = 1;
                                        cellBorderColor = colors.success;
                                    } else if (isMissed) {
                                        cellBg = colors.errorBg;
                                        cellBorder = 1;
                                        cellBorderColor = colors.error;
                                    } else if (isCompleted) {
                                        cellBg = colors.accentBg;
                                        cellBorder = 1;
                                        cellBorderColor = colors.accent;
                                    } else if (isAvailable && !isPast) {
                                        cellBg = colors.primarySurface;
                                        cellBorder = 1;
                                        cellBorderColor = colors.primaryBorderSm;
                                    }

                                    if (isToday && !isSelected) {
                                        cellBorder = 2;
                                        cellBorderColor = colors.primary;
                                    }

                                    let dayColor: string = colors.textPrimary;
                                    if (isSelected) {
                                        dayColor = colors.white;
                                    } else if (isBooked) {
                                        dayColor = colors.successDark;
                                    } else if (isMissed) {
                                        dayColor = colors.error;
                                    } else if (isCompleted) {
                                        dayColor = colors.accent;
                                    } else if (isAvailable && !isPast) {
                                        dayColor = colors.primary;
                                    } else {
                                        dayColor = colors.textDisabled;
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={dateStr}
                                            onPress={() => onDatePress(day)}
                                            disabled={!tappable || isBooked}
                                            activeOpacity={0.75}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 7,
                                                borderRadius: radius.md,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: cellBg,
                                                borderWidth: cellBorder,
                                                borderColor: cellBorderColor,
                                                gap: 3,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: fontSize.tag,
                                                    fontWeight: isSelected || isToday || isAvailable ? '700' : '400',
                                                    color: dayColor,
                                                }}
                                            >
                                                {day}
                                            </Text>

                                            {isAvailable && !isPast && !isSelected && !isBooked && (
                                                <View
                                                    style={{
                                                        width: 4,
                                                        height: 4,
                                                        borderRadius: 2,
                                                        backgroundColor: colors.primary,
                                                    }}
                                                />
                                            )}

                                            {isBooked && !isSelected && (
                                                <View
                                                    style={{
                                                        width: 4,
                                                        height: 4,
                                                        borderRadius: 2,
                                                        backgroundColor: colors.success,
                                                    }}
                                                />
                                            )}

                                            {isMissed && !isSelected && (
                                                <View
                                                    style={{
                                                        width: 4,
                                                        height: 4,
                                                        borderRadius: 2,
                                                        backgroundColor: colors.error,
                                                    }}
                                                />
                                            )}

                                            {isCompleted && !isSelected && (
                                                <View
                                                    style={{
                                                        width: 4,
                                                        height: 4,
                                                        borderRadius: 2,
                                                        backgroundColor: colors.accent,
                                                    }}
                                                />
                                            )}

                                            {isSelected && isActiveSlot && !isSlotsLoading && (
                                                <View
                                                    style={{
                                                        width: 4,
                                                        height: 4,
                                                        borderRadius: 2,
                                                        backgroundColor: colors.white,
                                                        opacity: 0.7,
                                                    }}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        );
                    })}
                </View>

                <View
                    style={{
                        flexDirection: 'row',
                        gap: 14,
                        paddingTop: 10,
                        borderTopWidth: 1,
                        borderTopColor: colors.surfaceBorder,
                        flexWrap: 'wrap',
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                backgroundColor: colors.primarySurface,
                                borderWidth: 1,
                                borderColor: colors.primaryBorderSm,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: colors.primary,
                                }}
                            />
                        </View>
                        <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle }}>
                            Available
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                backgroundColor: colors.primary,
                            }}
                        />
                        <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle }}>
                            Selected
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                backgroundColor: colors.statusNewBg,
                                borderWidth: 1,
                                borderColor: colors.success,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: colors.success,
                                }}
                            />
                        </View>
                        <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle }}>
                            Booked
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                backgroundColor: colors.surface,
                                opacity: 0.5,
                            }}
                        />
                        <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle }}>
                            Unavailable
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                backgroundColor: colors.errorBg,
                                borderWidth: 1,
                                borderColor: colors.error,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: colors.error,
                                }}
                            />
                        </View>
                        <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle }}>
                            Missed
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                backgroundColor: colors.accentBg,
                                borderWidth: 1,
                                borderColor: colors.accent,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: colors.accent,
                                }}
                            />
                        </View>
                        <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle }}>
                            Completed
                        </Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}
