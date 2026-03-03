import { Ionicons } from '@expo/vector-icons';
import { Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { DAYS_OF_WEEK } from '@/constants/trainerSchedule.constants';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import type { DaySchedule } from '@/types/trainerTypes';

// ─── Component ────────────────────────────────────────────────────────────────

interface DayScheduleCardProps {
    day: DaySchedule;
    onToggle: () => void;
    onAddSlot: () => void;
    onRemoveSlot: (slotId: string) => void;
    onUpdateSlot: (slotId: string, field: 'startTime' | 'endTime', value: string) => void;
}

export default function DayScheduleCard({
    day,
    onToggle,
    onAddSlot,
    onRemoveSlot,
    onUpdateSlot,
}: DayScheduleCardProps) {
    const slotLabel = day.enabled
        ? `${day.slots.length} slot${day.slots.length !== 1 ? 's' : ''}`
        : 'Off';

    return (
        <View
            style={{
                backgroundColor: colors.white,
                borderRadius: radius.card,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
                marginBottom: 10,
                ...shadow.cardSubtle,
            }}
        >
            {/* Header row: switch + day name/slot count + add button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Switch
                        value={day.enabled}
                        onValueChange={onToggle}
                        trackColor={{ false: colors.neutral, true: colors.trainerPrimary }}
                        thumbColor={colors.white}
                        ios_backgroundColor={colors.neutral}
                    />
                    <View>
                        <Text
                            style={{
                                fontSize: fontSize.body,
                                fontWeight: '600',
                                color: day.enabled ? colors.textPrimary : colors.textMuted,
                            }}
                        >
                            {DAYS_OF_WEEK[day.dayOfWeek]}
                        </Text>
                        <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle, marginTop: 1 }}>
                            {slotLabel}
                        </Text>
                    </View>
                </View>

                {day.enabled && (
                    <TouchableOpacity
                        onPress={onAddSlot}
                        activeOpacity={0.7}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: radius.sm,
                            backgroundColor: colors.trainerMuted,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="add" size={18} color={colors.trainerPrimary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Time slots */}
            {day.enabled && day.slots.length > 0 && (
                <View style={{ marginTop: 12, gap: 8 }}>
                    {day.slots.map((slot) => (
                        <View
                            key={slot.id}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                backgroundColor: colors.surface,
                                borderRadius: radius.md,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                            }}
                        >
                            <Ionicons name="time-outline" size={14} color={colors.textSubtle} />

                            <TextInput
                                value={slot.startTime}
                                onChangeText={(v) => onUpdateSlot(slot.id, 'startTime', v)}
                                maxLength={5}
                                keyboardType="numbers-and-punctuation"
                                returnKeyType="done"
                                style={{
                                    fontSize: fontSize.tag,
                                    color: colors.textPrimary,
                                    fontWeight: '500',
                                    width: 48,
                                    padding: 0,
                                }}
                            />

                            <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle }}>to</Text>

                            <TextInput
                                value={slot.endTime}
                                onChangeText={(v) => onUpdateSlot(slot.id, 'endTime', v)}
                                maxLength={5}
                                keyboardType="numbers-and-punctuation"
                                returnKeyType="done"
                                style={{
                                    fontSize: fontSize.tag,
                                    color: colors.textPrimary,
                                    fontWeight: '500',
                                    width: 48,
                                    padding: 0,
                                }}
                            />

                            {/* Spacer pushes X to the right */}
                            <View style={{ flex: 1 }} />

                            <TouchableOpacity
                                onPress={() => onRemoveSlot(slot.id)}
                                activeOpacity={0.7}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}
