import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, radius, shadow } from '@/constants/theme';
import type { ScheduleDurationType } from '@/types/trainerAvailability.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toYMD(d: Date): string {
    return d.toISOString().split('T')[0];
}

function lastDayOfMonth(year: number, month: number): string {
    return toYMD(new Date(year, month + 1, 0));
}

function addDays(d: Date, days: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + days);
    return r;
}

function formatDateShort(dateStr: string): string {
    // Parse as UTC to avoid timezone shifts on display
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${MONTH_SHORT[m - 1]} ${d}, ${y}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    visible: boolean;
    onConfirm: (effectiveFrom: string, effectiveUntil: string | null, planLabel: string) => void;
    onClose: () => void;
}

const OPTIONS: { key: ScheduleDurationType; label: string; icon: string }[] = [
    { key: 'forever',   label: 'Forever',         icon: 'infinite-outline' },
    { key: 'this_year', label: 'This year',        icon: 'calendar-outline' },
    { key: 'one_year',  label: '1 Year',           icon: 'refresh-circle-outline' },
    { key: 'months',    label: 'Specific months',  icon: 'grid-outline' },
    { key: 'weeks',     label: 'Specific weeks',   icon: 'time-outline' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScheduleDurationSheet({ visible, onConfirm, onClose }: Props) {
    const insets = useSafeAreaInsets();

    const [selected, setSelected] = useState<ScheduleDurationType>('forever');
    const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(11); // 12 months ahead
    const [weekCount, setWeekCount] = useState<number>(4);

    // Compute dates fresh on each render so the sheet is always up to date
    const today = new Date();
    const todayStr = toYMD(today);
    const currentYear = today.getFullYear();

    // Next 24 months (starting from next month)
    const futureMonths = Array.from({ length: 24 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
        return {
            year: d.getFullYear(),
            month: d.getMonth(),
            label: `${MONTH_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        };
    });

    // End-of-week: nearest upcoming Sunday (or today if already Sunday)
    const daysUntilSunday = today.getDay() === 0 ? 0 : 7 - today.getDay();
    const endOfThisWeek = toYMD(addDays(today, daysUntilSunday));
    const endOfThisYear = `${currentYear}-12-31`;
    const oneYearFromToday = toYMD(new Date(currentYear + 1, today.getMonth(), today.getDate()));

    const handleShow = useCallback(() => {
        setSelected('forever');
        setSelectedMonthIndex(11);
        setWeekCount(4);
    }, []);

    function computeEffectiveUntil(): string | null {
        switch (selected) {
            case 'forever':   return null;
            case 'this_year': return endOfThisYear;
            case 'one_year':  return oneYearFromToday;
            case 'months': {
                const m = futureMonths[selectedMonthIndex];
                return lastDayOfMonth(m.year, m.month);
            }
            case 'weeks':     return toYMD(addDays(today, weekCount * 7 - 1));
            case 'this_week': return endOfThisWeek;
        }
    }

    function computePlanLabel(): string {
        switch (selected) {
            case 'forever':   return 'Forever';
            case 'this_year': return 'This year';
            case 'one_year':  return '1 Year';
            case 'months':    return 'Specific months';
            case 'weeks':     return `${weekCount} ${weekCount === 1 ? 'week' : 'weeks'}`;
            case 'this_week': return 'This week only';
        }
    }

    function getSubtitle(type: ScheduleDurationType): string {
        switch (type) {
            case 'forever':   return 'No end date — repeats indefinitely';
            case 'this_year': return `Until Dec 31, ${currentYear}`;
            case 'one_year':  return `Until ${formatDateShort(oneYearFromToday)}`;
            case 'months':    return 'Choose an end month below';
            case 'weeks':     return 'Choose number of weeks below';
            case 'this_week': return `Until ${formatDateShort(endOfThisWeek)}`;
        }
    }

    const hasExpansion = (key: ScheduleDurationType) => key === 'months' || key === 'weeks';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            onShow={handleShow}
        >
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
                    maxHeight: '85%',
                    paddingBottom: Math.max(insets.bottom, 16),
                }}
            >
                {/* Handle */}
                <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.surfaceBorder }} />
                </View>

                {/* Header */}
                <View
                    style={{
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
                            Schedule Duration
                        </Text>
                        <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginTop: 2 }}>
                            How long should this schedule apply?
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

                {/* Options */}
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                >
                    {OPTIONS.map((opt) => {
                        const isSelected = selected === opt.key;
                        const expanded = isSelected && hasExpansion(opt.key);

                        return (
                            <View key={opt.key}>
                                <TouchableOpacity
                                    onPress={() => setSelected(opt.key)}
                                    activeOpacity={0.7}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 12,
                                        paddingVertical: 12,
                                        paddingHorizontal: 14,
                                        borderRadius: radius.md,
                                        borderBottomLeftRadius: expanded ? 0 : radius.md,
                                        borderBottomRightRadius: expanded ? 0 : radius.md,
                                        marginBottom: expanded ? 0 : 8,
                                        backgroundColor: isSelected ? colors.trainerSurface : colors.surface,
                                        borderWidth: 1.5,
                                        borderColor: isSelected ? colors.trainerPrimary : colors.surfaceBorder,
                                    }}
                                >
                                    {/* Icon */}
                                    <View
                                        style={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: radius.sm,
                                            backgroundColor: isSelected ? colors.trainerPrimary : colors.surfaceBorder,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Ionicons
                                            name={opt.icon as 'infinite-outline'}
                                            size={17}
                                            color={isSelected ? colors.white : colors.textMuted}
                                        />
                                    </View>

                                    {/* Labels */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: colors.textPrimary }}>
                                            {opt.label}
                                        </Text>
                                        <Text style={{ fontSize: fontSize.tag, color: colors.textMuted, marginTop: 2 }}>
                                            {getSubtitle(opt.key)}
                                        </Text>
                                    </View>

                                    {/* Radio dot */}
                                    <View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 10,
                                            borderWidth: 2,
                                            borderColor: isSelected ? colors.trainerPrimary : colors.surfaceBorder,
                                            backgroundColor: isSelected ? colors.trainerPrimary : 'transparent',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {isSelected && (
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white }} />
                                        )}
                                    </View>
                                </TouchableOpacity>

                                {/* ── Month picker expansion ─────────────────────── */}
                                {expanded && opt.key === 'months' && (
                                    <View
                                        style={{
                                            marginBottom: 8,
                                            padding: 12,
                                            backgroundColor: colors.trainerSurface,
                                            borderWidth: 1.5,
                                            borderTopWidth: 0,
                                            borderColor: colors.trainerPrimary,
                                            borderBottomLeftRadius: radius.md,
                                            borderBottomRightRadius: radius.md,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                            {futureMonths.map((m, i) => {
                                                const isPicked = selectedMonthIndex === i;
                                                return (
                                                    <TouchableOpacity
                                                        key={i}
                                                        onPress={() => setSelectedMonthIndex(i)}
                                                        activeOpacity={0.7}
                                                        style={{
                                                            paddingHorizontal: 12,
                                                            paddingVertical: 6,
                                                            borderRadius: radius.full,
                                                            borderWidth: 1.5,
                                                            borderColor: isPicked ? colors.trainerPrimary : colors.surfaceBorder,
                                                            backgroundColor: isPicked ? colors.trainerPrimary : colors.white,
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: fontSize.tag,
                                                                fontWeight: '600',
                                                                color: isPicked ? colors.white : colors.textMuted,
                                                            }}
                                                        >
                                                            {m.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}

                                {/* ── Week stepper expansion ─────────────────────── */}
                                {expanded && opt.key === 'weeks' && (
                                    <View
                                        style={{
                                            marginBottom: 8,
                                            paddingVertical: 16,
                                            backgroundColor: colors.trainerSurface,
                                            borderWidth: 1.5,
                                            borderTopWidth: 0,
                                            borderColor: colors.trainerPrimary,
                                            borderBottomLeftRadius: radius.md,
                                            borderBottomRightRadius: radius.md,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                                            <TouchableOpacity
                                                onPress={() => setWeekCount((w) => Math.max(1, w - 1))}
                                                activeOpacity={0.7}
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 20,
                                                    backgroundColor: colors.white,
                                                    borderWidth: 1.5,
                                                    borderColor: colors.surfaceBorder,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Ionicons name="remove" size={20} color={colors.textPrimary} />
                                            </TouchableOpacity>

                                            <View style={{ minWidth: 110, alignItems: 'center' }}>
                                                <Text style={{ fontSize: fontSize.hero, fontWeight: '700', color: colors.textPrimary }}>
                                                    {weekCount}
                                                </Text>
                                                <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>
                                                    {weekCount === 1 ? 'week' : 'weeks'}
                                                </Text>
                                                <Text style={{ fontSize: fontSize.tag, color: colors.trainerPrimary, fontWeight: '600', marginTop: 4 }}>
                                                    Until {formatDateShort(toYMD(addDays(today, weekCount * 7 - 1)))}
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => setWeekCount((w) => Math.min(52, w + 1))}
                                                activeOpacity={0.7}
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 20,
                                                    backgroundColor: colors.trainerPrimary,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Ionicons name="add" size={20} color={colors.white} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Confirm button */}
                <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
                    <TouchableOpacity
                        onPress={() => onConfirm(todayStr, computeEffectiveUntil(), computePlanLabel())}
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
                        <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.white }}>
                            Confirm Duration
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
