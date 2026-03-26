import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { MONTH_LABELS_SHORT, WEEKDAY_LABELS_LONG } from '@/constants/clientBooking.constants';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import type { ApiAvailableSlot, ApiAvailableSlotsResponse, BookingSessionMode } from '@/types/clientTypes';

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
}

export function TimeSlotsSection({
    animatedStyle,
    activeSlotDate,
    selectedDates,
    isPerDateMode,
    perDateLimit,
    trainerMode,
    chosenMode,
    setChosenMode,
    slotsData,
    isSlotsLoading,
    slotPerDate,
    selectedSlot,
    onSlotPress,
    onChipPress,
    formatDateSummary,
}: {
    animatedStyle: object;
    activeSlotDate: string;
    selectedDates: Set<string>;
    isPerDateMode: boolean;
    perDateLimit: number;
    trainerMode: ApiAvailableSlotsResponse['session_mode'] | undefined;
    chosenMode: BookingSessionMode;
    setChosenMode: (m: BookingSessionMode) => void;
    slotsData: ApiAvailableSlotsResponse | null;
    isSlotsLoading: boolean;
    slotPerDate: Map<string, ApiAvailableSlot>;
    selectedSlot: ApiAvailableSlot | null;
    onSlotPress: (slot: ApiAvailableSlot) => void;
    onChipPress: (date: string) => void;
    formatDateSummary: (dateStr: string) => string;
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
                <View style={{ gap: 4 }}>
                    <Text
                        style={{
                            fontSize: fontSize.body,
                            fontWeight: '700',
                            color: colors.textPrimary,
                        }}
                    >
                        Select Time
                    </Text>
                    {selectedDates.size === 1 && (
                        <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle }}>
                            {formatDateSummary(activeSlotDate)}
                        </Text>
                    )}
                    {selectedDates.size > 1 && isPerDateMode && (
                        <Text style={{ fontSize: fontSize.caption, color: colors.primary, fontWeight: '600' }}>
                            Pick a time for each date — tap a chip to switch
                        </Text>
                    )}
                    {!isPerDateMode && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                backgroundColor: colors.accentBg,
                                borderRadius: radius.sm,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                alignSelf: 'flex-start',
                            }}
                        >
                            <Ionicons name="information-circle-outline" size={13} color={colors.accent} />
                            <Text style={{ fontSize: fontSize.caption, color: colors.accent, fontWeight: '600', flexShrink: 1 }}>
                                {`More than ${perDateLimit} dates — one time applies to all`}
                            </Text>
                        </View>
                    )}
                </View>

                {selectedDates.size > 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                    >
                        {Array.from(selectedDates).sort().map((date) => {
                            const d = new Date(date);
                            const isActive = activeSlotDate === date;
                            const chipDay = WEEKDAY_LABELS_LONG[d.getDay()].slice(0, 3);
                            const chipDate = `${d.getDate()} ${MONTH_LABELS_SHORT[d.getMonth()]}`;

                            const chipSlot = isPerDateMode
                                ? slotPerDate.get(date)
                                : selectedSlot ?? undefined;
                            const hasSlot = chipSlot !== undefined;

                            let chipBg: string = colors.primarySurface;
                            let chipBorderColor: string = colors.primaryBorderSm;
                            if (isActive) {
                                chipBg = colors.primary;
                                chipBorderColor = colors.primary;
                            } else if (hasSlot) {
                                chipBg = colors.statusNewBg;
                                chipBorderColor = colors.success;
                            }

                            return (
                                <TouchableOpacity
                                    key={date}
                                    onPress={() => onChipPress(date)}
                                    activeOpacity={0.75}
                                    style={{
                                        paddingHorizontal: 14,
                                        paddingVertical: 10,
                                        borderRadius: radius.md,
                                        alignItems: 'center',
                                        gap: 2,
                                        backgroundColor: chipBg,
                                        borderWidth: 1.5,
                                        borderColor: chipBorderColor,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: fontSize.badge,
                                            fontWeight: '600',
                                            color: isActive ? colors.white : colors.textSubtle,
                                        }}
                                    >
                                        {chipDay}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: fontSize.caption,
                                            fontWeight: '700',
                                            color: isActive ? colors.white : colors.primary,
                                        }}
                                    >
                                        {chipDate}
                                    </Text>
                                    {hasSlot ? (
                                        <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={11}
                                                color={isActive ? colors.white : colors.success}
                                            />
                                            <Text
                                                style={{
                                                    fontSize: fontSize.badge,
                                                    fontWeight: '600',
                                                    color: isActive ? colors.white : colors.success,
                                                }}
                                            >
                                                {chipSlot!.start_time}
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={{ marginTop: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: isActive ? colors.white : colors.textDisabled, opacity: 0.5 }} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}

                {trainerMode === 'both' && (
                    <View
                        style={{
                            flexDirection: 'row',
                            backgroundColor: colors.surface,
                            borderRadius: radius.md,
                            padding: 4,
                            gap: 4,
                        }}
                    >
                        {(['online', 'offline'] as BookingSessionMode[]).map((mode) => (
                            <TouchableOpacity
                                key={mode}
                                onPress={() => setChosenMode(mode)}
                                activeOpacity={0.75}
                                style={{
                                    flex: 1,
                                    paddingVertical: 8,
                                    borderRadius: radius.sm,
                                    alignItems: 'center',
                                    backgroundColor:
                                        chosenMode === mode ? colors.white : 'transparent',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: fontSize.tag,
                                        fontWeight: '600',
                                        color:
                                            chosenMode === mode
                                                ? colors.textPrimary
                                                : colors.textMuted,
                                    }}
                                >
                                    {mode === 'online' ? 'Online' : 'In-person'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {trainerMode !== undefined && trainerMode !== 'both' && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            backgroundColor: colors.surface,
                            borderRadius: radius.sm,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            alignSelf: 'flex-start',
                        }}
                    >
                        <Ionicons
                            name={
                                trainerMode === 'online'
                                    ? 'videocam-outline'
                                    : 'location-outline'
                            }
                            size={14}
                            color={colors.textMuted}
                        />
                        <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                            {trainerMode === 'online' ? 'Online only' : 'In-person only'}
                        </Text>
                    </View>
                )}

                {isSlotsLoading && (
                    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                        <ActivityIndicator color={colors.primary} />
                    </View>
                )}
                {!isSlotsLoading && (slotsData?.slots ?? []).length === 0 && (
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                        <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle }}>
                            No slots available for this date.
                        </Text>
                    </View>
                )}
                {!isSlotsLoading && (slotsData?.slots ?? []).length > 0 && (
                    <View style={{ gap: 8 }}>
                        {chunk(slotsData!.slots, 3).map((row) => (
                            <View
                                key={row[0].start_time}
                                style={{ flexDirection: 'row', gap: 8 }}
                            >
                                {row.map((slot) => {
                                    const isSlotSelected = isPerDateMode
                                        ? slotPerDate.get(activeSlotDate ?? '')?.start_time === slot.start_time
                                        : selectedSlot?.start_time === slot.start_time;

                                    let slotBg: string = colors.white;
                                    if (isSlotSelected) {
                                        slotBg = colors.primary;
                                    } else if (slot.is_booked) {
                                        slotBg = colors.surface;
                                    }

                                    let slotBorder: string = colors.primaryBorderSm;
                                    if (isSlotSelected) {
                                        slotBorder = colors.primary;
                                    } else if (slot.is_booked) {
                                        slotBorder = colors.surfaceBorder;
                                    }

                                    let slotTextColor: string = colors.primary;
                                    if (isSlotSelected) {
                                        slotTextColor = colors.white;
                                    } else if (slot.is_booked) {
                                        slotTextColor = colors.textDisabled;
                                    }

                                    let slotSubColor: string = colors.textSubtle;
                                    if (isSlotSelected) {
                                        slotSubColor = colors.white;
                                    } else if (slot.is_booked) {
                                        slotSubColor = colors.textDisabled;
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={slot.start_time}
                                            onPress={() => onSlotPress(slot)}
                                            disabled={slot.is_booked}
                                            activeOpacity={0.75}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 14,
                                                borderRadius: radius.md,
                                                alignItems: 'center',
                                                backgroundColor: slotBg,
                                                borderWidth: 1.5,
                                                borderColor: slotBorder,
                                                opacity: slot.is_booked ? 0.5 : 1,
                                                ...shadow.cardSubtle,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: fontSize.tag,
                                                    fontWeight: '700',
                                                    color: slotTextColor,
                                                }}
                                            >
                                                {slot.start_time}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: fontSize.badge,
                                                    color: slotSubColor,
                                                    marginTop: 2,
                                                    opacity: 0.8,
                                                }}
                                            >
                                                {slot.is_booked ? 'Booked' : slot.end_time}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                                {Array.from({ length: 3 - row.length }, (_, i) => (
                                    <View
                                        key={`pad-${row[0].start_time}-${i}`}
                                        style={{ flex: 1 }}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </Animated.View>
    );
}
