import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DayScheduleCard from '@/components/trainer/DayScheduleCard';
import { DEFAULT_NEW_SLOT } from '@/constants/trainerSchedule.constants';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import type { ScheduleOverride } from '@/types/trainerAvailability.types';
import type { DaySchedule, SessionMode } from '@/types/trainerTypes';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Returns the date string for the given day-of-week offset from the week's Sunday start. */
function getDateForDow(weekSunday: string, dayOfWeek: number): string {
    const [y, m, d] = weekSunday.split('-').map(Number);
    const date = new Date(y, m - 1, d + dayOfWeek);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Rounds the current time UP to the next 30-min slot. e.g. 19:50 → "20:00". */
function currentTimeRoundedUp(): string {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const rounded = Math.min(Math.ceil(mins / 30) * 30, 22 * 60);
    return `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
}

function todayDateStr(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDateRange(start: string, end: string): string {
    const [sy, sm, sd] = start.split('-').map(Number);
    const [, em, ed] = end.split('-').map(Number);
    const startLabel = `${SHORT_MONTHS[sm - 1]} ${sd}`;
    const endLabel = `${SHORT_MONTHS[em - 1]} ${ed}`;
    const yearSuffix = sy !== new Date().getFullYear() ? ` ${sy}` : '';
    return `${startLabel} – ${endLabel}${yearSuffix}`;
}

interface WeekOverrideSheetProps {
    visible: boolean;
    startDate: string;
    endDate: string;
    existingOverride?: ScheduleOverride;
    defaultSchedule: DaySchedule[];
    onSave: (schedule: DaySchedule[]) => void;
    onDelete?: () => void;
    onClose: () => void;
}

export default function WeekOverrideSheet({
    visible,
    startDate,
    endDate,
    existingOverride,
    defaultSchedule,
    onSave,
    onDelete,
    onClose,
}: WeekOverrideSheetProps) {
    const insets = useSafeAreaInsets();
    const [localSchedule, setLocalSchedule] = useState<DaySchedule[]>([]);

    // Reset local state each time the sheet opens
    const handleShow = useCallback(() => {
        const base = existingOverride?.schedule ?? defaultSchedule;
        setLocalSchedule(base.map((d) => ({ ...d, slots: d.slots.map((s) => ({ ...s })) })));
    }, [existingOverride, defaultSchedule]);

    const toggleDay = useCallback((dayIndex: number) => {
        setLocalSchedule((prev) =>
            prev.map((d) => {
                if (d.dayOfWeek !== dayIndex) return d;
                if (d.enabled) return { ...d, enabled: false, slots: [] };

                // Build the initial slot — clamp to current time if this is today
                let { startTime, endTime } = DEFAULT_NEW_SLOT;
                const dayDate = getDateForDow(startDate, dayIndex);
                if (dayDate === todayDateStr()) {
                    const minTime = currentTimeRoundedUp();
                    const [mh, mm] = minTime.split(':').map(Number);
                    const minMins = mh * 60 + mm;
                    const [sh, sm] = startTime.split(':').map(Number);
                    if (sh * 60 + sm < minMins) {
                        startTime = minTime;
                        const endMins = Math.min(minMins + 60, 22 * 60);
                        endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
                    }
                }

                return { ...d, enabled: true, slots: [{ id: `${dayIndex}-${Date.now()}`, startTime, endTime }] };
            }),
        );
    }, [startDate]);

    const addSlot = useCallback((dayIndex: number) => {
        setLocalSchedule((prev) =>
            prev.map((d) => {
                if (d.dayOfWeek !== dayIndex) return d;
                let { startTime, endTime } = DEFAULT_NEW_SLOT;
                if (d.slots.length > 0) {
                    const latestEnd = d.slots.reduce((max, s) => {
                        const [h, m] = s.endTime.split(':').map(Number);
                        return Math.max(max, h * 60 + m);
                    }, 0);
                    if (latestEnd < 21 * 60) {
                        const h = Math.floor(latestEnd / 60);
                        const m = latestEnd % 60;
                        startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        const endMins = Math.min(latestEnd + 60, 22 * 60);
                        endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
                    }
                }

                // For today: clamp start time to current time if the default falls in the past
                const dayDate = getDateForDow(startDate, dayIndex);
                if (dayDate === todayDateStr()) {
                    const minTime = currentTimeRoundedUp();
                    const [sh, sm] = startTime.split(':').map(Number);
                    const [mh, mm] = minTime.split(':').map(Number);
                    if (sh * 60 + sm < mh * 60 + mm) {
                        startTime = minTime;
                        const endMins = Math.min(mh * 60 + mm + 60, 22 * 60);
                        endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
                    }
                }

                return { ...d, slots: [...d.slots, { id: `${dayIndex}-${Date.now()}`, startTime, endTime }] };
            }),
        );
    }, [startDate]);

    const removeSlot = useCallback((dayIndex: number, slotId: string) => {
        setLocalSchedule((prev) =>
            prev.map((d) =>
                (d.dayOfWeek === dayIndex
                    ? { ...d, slots: d.slots.filter((s) => s.id !== slotId) }
                    : d),
            ),
        );
    }, []);

    const updateSlot = useCallback(
        (dayIndex: number, slotId: string, field: 'startTime' | 'endTime', value: string) => {
            setLocalSchedule((prev) =>
                prev.map((d) =>
                    (d.dayOfWeek === dayIndex
                        ? { ...d, slots: d.slots.map((s) => (s.id === slotId ? { ...s, [field]: value } : s)) }
                        : d),
                ),
            );
        },
        [],
    );

    const setSessionMode = useCallback((dayIndex: number, mode: SessionMode) => {
        setLocalSchedule((prev) =>
            prev.map((d) => (d.dayOfWeek === dayIndex ? { ...d, session_mode: mode } : d)),
        );
    }, []);

    const isEditing = !!existingOverride;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={handleShow}>
            {/* Backdrop */}
            <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
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
                    maxHeight: '88%',
                    paddingBottom: Math.max(insets.bottom, 16),
                }}
            >
                {/* Handle */}
                <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.surfaceBorder }} />
                </View>

                {/* Header */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceBorder,
                }}
                >
                    <View>
                        <Text style={{ fontSize: fontSize.card, fontWeight: '700', color: colors.textPrimary }}>
                            {isEditing ? 'Edit Week Schedule' : 'Customize Week'}
                        </Text>
                        <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginTop: 2 }}>
                            {formatDateRange(startDate, endDate)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="close" size={22} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Info hint */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginHorizontal: 20,
                    marginTop: 12,
                    backgroundColor: colors.trainerMuted,
                    borderRadius: radius.md,
                    padding: 10,
                }}
                >
                    <Ionicons name="information-circle-outline" size={14} color={colors.trainerPrimary} />
                    <Text style={{ fontSize: fontSize.badge, color: colors.trainerPrimary, flex: 1 }}>
                        Overrides your default weekly schedule for 
{' '}
{formatDateRange(startDate, endDate)}
{' '}
only.
                    </Text>
                </View>

                {/* Day cards */}
                <ScrollView
                    style={{ marginTop: 12 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {localSchedule.map((day) => {
                        const dayDate = getDateForDow(startDate, day.dayOfWeek);
                        const today = todayDateStr();
                        return (
                            <DayScheduleCard
                                key={day.dayOfWeek}
                                day={day}
                                onToggle={() => toggleDay(day.dayOfWeek)}
                                onAddSlot={() => addSlot(day.dayOfWeek)}
                                onRemoveSlot={(slotId) => removeSlot(day.dayOfWeek, slotId)}
                                onUpdateSlot={(slotId, field, value) =>
                                    updateSlot(day.dayOfWeek, slotId, field, value)}
                                onSessionModeChange={(mode) => setSessionMode(day.dayOfWeek, mode)}
                                isPastDay={dayDate < today}
                                minStartTime={dayDate === today ? currentTimeRoundedUp() : undefined}
                            />
                        );
                    })}
                </ScrollView>

                {/* Action buttons */}
                <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 10 }}>
                    <TouchableOpacity
                        onPress={() => onSave(localSchedule)}
                        activeOpacity={0.8}
                        style={{
                            height: 52,
                            borderRadius: radius.card,
                            backgroundColor: colors.trainerPrimary,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: 8,
                            ...shadow.trainer,
                        }}
                    >
                        <Ionicons name="save-outline" size={18} color={colors.white} />
                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.white }}>
                            {isEditing ? 'Update Week Schedule' : 'Save Week Schedule'}
                        </Text>
                    </TouchableOpacity>

                    {isEditing && onDelete && (
                        <TouchableOpacity
                            onPress={onDelete}
                            activeOpacity={0.8}
                            style={{
                                height: 44,
                                borderRadius: radius.card,
                                borderWidth: 1,
                                borderColor: colors.error,
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                gap: 6,
                            }}
                        >
                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                            <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: colors.error }}>
                                Revert to Default Schedule
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}
