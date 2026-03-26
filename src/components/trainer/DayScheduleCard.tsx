import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { FlatList, Modal, Switch, Text, TouchableOpacity, View } from 'react-native';

import {
    DAYS_OF_WEEK,
    SESSION_MODE_ICONS,
    SESSION_MODE_LABELS,
} from '@/constants/trainerSchedule.constants';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import type { DaySchedule, ScheduleTimeSlot, SessionMode } from '@/types/trainerTypes';

// ─── Time helpers ─────────────────────────────────────────────────────────────

// 30-minute increments from 05:00 to 22:00 (35 options)
const TIME_OPTIONS: string[] = Array.from({ length: 35 }, (_, i) => {
    const totalMinutes = 5 * 60 + i * 30;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

function toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function to12h(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h < 12 ? 'AM' : 'PM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function slotHasOverlap(slots: ScheduleTimeSlot[], slotId: string): boolean {
    const current = slots.find((s) => s.id === slotId);
    if (!current) return false;
    const cStart = toMinutes(current.startTime);
    const cEnd = toMinutes(current.endTime);
    return slots.some((s) => {
        if (s.id === slotId) return false;
        return cStart < toMinutes(s.endTime) && toMinutes(s.startTime) < cEnd;
    });
}

// ─── Time Picker Modal ────────────────────────────────────────────────────────

interface TimePickerModalProps {
    visible: boolean;
    title: string;
    selected: string;
    /** Strict lower bound: only shows times > minTime (used for end-time picker) */
    minTime?: string;
    /** Inclusive lower bound: only shows times >= minFloor (used for start-time picker on today) */
    minFloor?: string;
    onSelect: (time: string) => void;
    onClose: () => void;
}

function TimePickerModal({ visible, title, selected, minTime, minFloor, onSelect, onClose }: TimePickerModalProps) {
    const flatListRef = useRef<FlatList>(null);
    const options = TIME_OPTIONS.filter((t) => {
        if (minFloor && toMinutes(t) < toMinutes(minFloor)) return false;
        if (minTime && toMinutes(t) <= toMinutes(minTime)) return false;
        return true;
    });
    const selectedIndex = Math.max(0, options.indexOf(selected));

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            {/* Backdrop */}
            <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
                activeOpacity={1}
                onPress={onClose}
            />

            {/* Sheet */}
            <View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: colors.white,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    paddingBottom: 40,
                    maxHeight: '55%',
                }}
            >
                {/* Handle */}
                <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.surfaceBorder }} />
                </View>

                {/* Title */}
                <Text
                    style={{
                        fontSize: fontSize.card,
                        fontWeight: '700',
                        color: colors.textPrimary,
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.surfaceBorder,
                    }}
                >
                    {title}
                </Text>

                <FlatList
                    ref={flatListRef}
                    data={options}
                    keyExtractor={(item) => item}
                    getItemLayout={(_, index) => ({ length: 52, offset: 52 * index, index })}
                    initialScrollIndex={selectedIndex > 2 ? selectedIndex - 2 : 0}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const isSelected = item === selected;
                        return (
                            <TouchableOpacity
                                onPress={() => { onSelect(item); onClose(); }}
                                activeOpacity={0.7}
                                style={{
                                    height: 52,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingHorizontal: 24,
                                    backgroundColor: isSelected ? colors.trainerSurface : colors.white,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: fontSize.section,
                                        fontWeight: isSelected ? '700' : '400',
                                        color: isSelected ? colors.trainerPrimary : colors.textSecondary,
                                    }}
                                >
                                    {to12h(item)}
                                </Text>
                                {isSelected && (
                                    <Ionicons name="checkmark-circle" size={20} color={colors.trainerPrimary} />
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </Modal>
    );
}

// ─── Session mode selector ────────────────────────────────────────────────────

const SESSION_MODES: SessionMode[] = ['online', 'offline', 'both'];

interface ModeSelectorProps {
    current?: SessionMode;
    onChange: (mode: SessionMode) => void;
}

function ModeSelector({ current, onChange }: ModeSelectorProps) {
    const active = current ?? 'both';
    return (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
            {SESSION_MODES.map((mode) => {
                const isActive = active === mode;
                return (
                    <TouchableOpacity
                        key={mode}
                        onPress={() => onChange(mode)}
                        activeOpacity={0.7}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            paddingVertical: 5,
                            borderRadius: radius.sm,
                            borderWidth: 1,
                            borderColor: isActive ? colors.trainerBorder : colors.surfaceBorder,
                            backgroundColor: isActive ? colors.trainerMuted : colors.surface,
                        }}
                    >
                        <Ionicons
                            name={SESSION_MODE_ICONS[mode] as 'videocam-outline'}
                            size={12}
                            color={isActive ? colors.trainerPrimary : colors.textMuted}
                        />
                        <Text
                            style={{
                                fontSize: fontSize.badge,
                                fontWeight: isActive ? '700' : '500',
                                color: isActive ? colors.trainerPrimary : colors.textMuted,
                            }}
                        >
                            {SESSION_MODE_LABELS[mode]}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DayScheduleCardProps {
    day: DaySchedule;
    onToggle: () => void;
    onAddSlot: () => void;
    onRemoveSlot: (slotId: string) => void;
    onUpdateSlot: (slotId: string, field: 'startTime' | 'endTime', value: string) => void;
    onSessionModeChange?: (mode: SessionMode) => void;
    /** Earliest selectable start time — past options are hidden (used for today's card). */
    minStartTime?: string;
    /** Entire card is locked — day is already in the past. */
    isPastDay?: boolean;
}

export default function DayScheduleCard({
    day,
    onToggle,
    onAddSlot,
    onRemoveSlot,
    onUpdateSlot,
    onSessionModeChange,
    minStartTime,
    isPastDay = false,
}: DayScheduleCardProps) {
    const [picker, setPicker] = useState<{
        slotId: string;
        field: 'startTime' | 'endTime';
    } | null>(null);

    const slotLabel = day.enabled
        ? `${day.slots.length} slot${day.slots.length !== 1 ? 's' : ''}`
        : 'Off';

    const activeSlot = picker ? day.slots.find((s) => s.id === picker.slotId) : null;

    return (
        <View
            style={{
                backgroundColor: colors.white,
                borderRadius: radius.card,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
                marginBottom: 10,
                opacity: isPastDay ? 0.45 : 1,
                ...shadow.cardSubtle,
            }}
        >
            {/* Header row: switch + day name/slot count + add button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Switch
                        value={day.enabled}
                        onValueChange={onToggle}
                        disabled={isPastDay}
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

            {/* Session mode selector */}
            {day.enabled && onSessionModeChange && (
                <ModeSelector current={day.session_mode} onChange={onSessionModeChange} />
            )}

            {/* Time slots */}
            {day.enabled && day.slots.length > 0 && (
                <View style={{ marginTop: 12, gap: 8 }}>
                    {day.slots.map((slot) => {
                        const overlaps = slotHasOverlap(day.slots, slot.id);
                        const invalidRange = toMinutes(slot.startTime) >= toMinutes(slot.endTime);
                        const hasError = overlaps || invalidRange;

                        return (
                            <View key={slot.id}>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 8,
                                        backgroundColor: hasError ? 'rgba(239,68,68,0.06)' : colors.surface,
                                        borderRadius: radius.md,
                                        paddingHorizontal: 12,
                                        paddingVertical: 10,
                                        borderWidth: 1,
                                        borderColor: hasError ? colors.error : 'transparent',
                                    }}
                                >
                                    <Ionicons
                                        name="time-outline"
                                        size={14}
                                        color={hasError ? colors.error : colors.textSubtle}
                                    />

                                    {/* Start time pill */}
                                    <TouchableOpacity
                                        onPress={() => setPicker({ slotId: slot.id, field: 'startTime' })}
                                        activeOpacity={0.7}
                                        style={{
                                            backgroundColor: colors.white,
                                            borderRadius: radius.sm,
                                            paddingHorizontal: 10,
                                            paddingVertical: 5,
                                            borderWidth: 1,
                                            borderColor: hasError ? colors.error : colors.trainerBorder,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: fontSize.tag,
                                                fontWeight: '600',
                                                color: hasError ? colors.error : colors.trainerPrimary,
                                            }}
                                        >
                                            {to12h(slot.startTime)}
                                        </Text>
                                    </TouchableOpacity>

                                    <Text style={{ fontSize: fontSize.badge, color: colors.textSubtle }}>→</Text>

                                    {/* End time pill */}
                                    <TouchableOpacity
                                        onPress={() => setPicker({ slotId: slot.id, field: 'endTime' })}
                                        activeOpacity={0.7}
                                        style={{
                                            backgroundColor: colors.white,
                                            borderRadius: radius.sm,
                                            paddingHorizontal: 10,
                                            paddingVertical: 5,
                                            borderWidth: 1,
                                            borderColor: hasError ? colors.error : colors.trainerBorder,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: fontSize.tag,
                                                fontWeight: '600',
                                                color: hasError ? colors.error : colors.trainerPrimary,
                                            }}
                                        >
                                            {to12h(slot.endTime)}
                                        </Text>
                                    </TouchableOpacity>

                                    <View style={{ flex: 1 }} />

                                    {hasError && (
                                        <Ionicons name="warning-outline" size={15} color={colors.error} />
                                    )}

                                    <TouchableOpacity
                                        onPress={() => onRemoveSlot(slot.id)}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
                                    </TouchableOpacity>
                                </View>

                                {/* Inline error messages */}
                                {invalidRange && (
                                    <Text style={{ fontSize: fontSize.badge, color: colors.error, marginTop: 3, marginLeft: 4 }}>
                                        End time must be after start time
                                    </Text>
                                )}
                                {!invalidRange && overlaps && (
                                    <Text style={{ fontSize: fontSize.badge, color: colors.error, marginTop: 3, marginLeft: 4 }}>
                                        This slot overlaps with another
                                    </Text>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Time picker bottom sheet */}
            {picker && activeSlot && (
                <TimePickerModal
                    visible
                    title={picker.field === 'startTime' ? 'Select Start Time' : 'Select End Time'}
                    selected={picker.field === 'startTime' ? activeSlot.startTime : activeSlot.endTime}
                    minTime={picker.field === 'endTime' ? activeSlot.startTime : undefined}
                    minFloor={picker.field === 'startTime' ? minStartTime : undefined}
                    onSelect={(time) => onUpdateSlot(picker.slotId, picker.field, time)}
                    onClose={() => setPicker(null)}
                />
            )}
        </View>
    );
}
