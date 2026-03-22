import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { colors, fontSize, radius } from '@/constants/theme';
import { DAYS_OF_WEEK, SHORT_DAY_LABELS } from '@/constants/trainerSchedule.constants';
import type { DateOverride, ScheduleOverride, ScheduleScope } from '@/types/trainerAvailability.types';
import type { DaySchedule } from '@/types/trainerTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

function toDateStr(year: number, month: number, day: number): string {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
}

/** Format a Date object to YYYY-MM-DD using local time (avoids UTC off-by-one). */
function dateObjToStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatWeekLabel(start: Date, end: Date): string {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sm = MONTHS[start.getMonth()];
    const sd = start.getDate();
    const em = MONTHS[end.getMonth()];
    const ed = end.getDate();
    return sm === em ? `${sm} ${sd}–${ed}` : `${sm} ${sd} – ${em} ${ed}`;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Component ────────────────────────────────────────────────────────────────

interface MonthlyCalendarViewProps {
    schedule: DaySchedule[];
    dateOverrides: DateOverride[];
    scheduleOverrides?: ScheduleOverride[];
    scheduleScope?: ScheduleScope | null;
    onToggleDateOverride: (dateStr: string) => void;
    onMonthChange?: (year: number, month: number) => void;
    onWeekCustomize?: (startDate: string, endDate: string, existing?: ScheduleOverride) => void;
}

export default function MonthlyCalendarView({
    schedule,
    dateOverrides,
    scheduleOverrides = [],
    scheduleScope,
    onToggleDateOverride,
    onMonthChange,
    onWeekCustomize,
}: MonthlyCalendarViewProps) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [currentYear, setCurrentYear] = useState(now.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(now.getMonth());

    const year = currentYear;
    const month = currentMonth;

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const overriddenDates = new Set(dateOverrides.map((o) => o.date));

    // Build grid cells
    const cells: (number | null)[] = [
        ...Array<null>(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    const remainder = cells.length % 7;
    if (remainder !== 0) cells.push(...Array<null>(7 - remainder).fill(null));

    // Summary (uses default schedule)
    const activeDayCount = schedule.filter((d) => d.enabled).length;
    const totalSlots = schedule.reduce((acc, d) => (d.enabled ? acc + d.slots.length : acc), 0);
    const overrideCount = overriddenDates.size;

    // Navigation handlers
    const goToPreviousMonth = () => {
        const newMonth = month === 0 ? 11 : month - 1;
        const newYear = month === 0 ? year - 1 : year;
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
        onMonthChange?.(newYear, newMonth);
    };

    const goToNextMonth = () => {
        const newMonth = month === 11 ? 0 : month + 1;
        const newYear = month === 11 ? year + 1 : year;
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
        onMonthChange?.(newYear, newMonth);
    };

    const goToToday = () => {
        setCurrentYear(now.getFullYear());
        setCurrentMonth(now.getMonth());
        onMonthChange?.(now.getFullYear(), now.getMonth());
    };

    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

    // Week rows — one entry per calendar row
    const numWeeks = cells.length / 7;
    const weekRows = Array.from({ length: numWeeks }, (_, rowIdx) => {
        const dayOffset = rowIdx * 7 - firstDay + 1; // day-of-month index for Sunday of this row
        const weekStartObj = new Date(year, month, dayOffset);
        const weekEndObj = new Date(year, month, dayOffset + 6);
        const startStr = dateObjToStr(weekStartObj);
        const endStr = dateObjToStr(weekEndObj);
        const override = scheduleOverrides.find(
            (o) => o.start_date <= endStr && o.end_date >= startStr,
        );
        const isPast = weekEndObj < today;
        // Entire week is beyond the schedule's effective_until
        const isBeyondScope = !!(scheduleScope?.effective_until && startStr > scheduleScope.effective_until);
        return { startStr, endStr, weekStartObj, weekEndObj, override, isPast, isBeyondScope, rowIdx };
    });

    return (
        <View>
            {/* Month header with navigation */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={goToPreviousMonth}
                        activeOpacity={0.7}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: radius.full,
                            backgroundColor: colors.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <View style={{ minWidth: 150, alignItems: 'center' }}>
                        <Text style={{ fontSize: fontSize.section, fontWeight: '700', color: colors.textPrimary }}>
                            {MONTH_NAMES[month]}
                            {' '}
                            {year}
                        </Text>
                        {isCurrentMonth && (
                            <TouchableOpacity onPress={goToToday} activeOpacity={0.7} style={{ marginTop: 2 }}>
                                <Text style={{ fontSize: fontSize.badge, fontWeight: '600', color: colors.trainerPrimary }}>
                                    Today
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={goToNextMonth}
                        activeOpacity={0.7}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: radius.full,
                            backgroundColor: colors.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View style={{ backgroundColor: colors.trainerMuted, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.trainerPrimary }}>
                            {activeDayCount}
                            d/wk
                        </Text>
                    </View>
                    <View style={{ backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: fontSize.badge, fontWeight: '700', color: colors.textMuted }}>
                            {totalSlots}
                            {' '}
                            slots/wk
                        </Text>
                    </View>
                </View>
            </View>

            {/* Hint */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 10 }}>
                <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                <Text style={{ fontSize: fontSize.badge, color: colors.textMuted, flex: 1 }}>
                    Tap a date to block it. Customize any week&apos;s schedule with the Week Schedules section below.
                </Text>
            </View>

            {/* Day-of-week header */}
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                {SHORT_DAY_LABELS.map((label) => (
                    <View key={label} style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: fontSize.badge, fontWeight: '600', color: colors.textSubtle }}>
                            {label}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Calendar grid */}
            {Array.from({ length: numWeeks }, (_, rowIdx) => {
                const week = weekRows[rowIdx];
                const hasOverride = !!week.override && !week.isBeyondScope;

                return (
                    <View
                        key={rowIdx}
                        style={{
                            flexDirection: 'row',
                            marginBottom: 4,
                            borderRadius: radius.sm,
                            backgroundColor: hasOverride ? `${colors.trainerPrimary}08` : 'transparent',
                            borderWidth: hasOverride ? 1 : 0,
                            borderColor: hasOverride ? `${colors.trainerPrimary}25` : 'transparent',
                        }}
                    >
                        {Array.from({ length: 7 }, (__col, col) => {
                            const day = cells[rowIdx * 7 + col];
                            if (day === null) {
                                return <View key={`e-${col}`} style={{ flex: 1, height: 38 }} />;
                            }

                            const dotw = (firstDay + day - 1) % 7;
                            const dateStr = toDateStr(year, month, day);
                            const isOverridden = overriddenDates.has(dateStr);
                            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                            const isPast = new Date(year, month, day) < today;

                            // Resolve effective schedule: use schedule override if this date falls in one
                            const activeSchedOverride = scheduleOverrides.find(
                                (o) => o.start_date <= dateStr && o.end_date >= dateStr,
                            );
                            const effectiveSchedule = activeSchedOverride?.schedule ?? schedule;
                            const isWeeklyAvailable = effectiveSchedule.some(
                                (d) => d.dayOfWeek === dotw && d.enabled,
                            );

                            const isBeyondScope = !!(scheduleScope?.effective_until && dateStr > scheduleScope.effective_until);
                            const isEffectivelyAvailable = isWeeklyAvailable && !isOverridden && !isPast && !isBeyondScope;
                            const isTappable = isWeeklyAvailable && !isPast && !isBeyondScope;

                            let bgColor: string = 'transparent';
                            let textColor: string = colors.textSubtle;
                            let fontWeight: '400' | '600' | '700' = '400';

                            if (isToday && isEffectivelyAvailable) {
                                bgColor = colors.trainerPrimary;
                                textColor = colors.white;
                                fontWeight = '700';
                            } else if (isToday) {
                                bgColor = colors.surface;
                                textColor = colors.textMuted;
                                fontWeight = '700';
                            } else if (isPast || isBeyondScope) {
                                textColor = colors.textDisabled;
                            } else if (isOverridden) {
                                bgColor = colors.errorBg;
                                textColor = colors.error;
                                fontWeight = '600';
                            } else if (isEffectivelyAvailable) {
                                bgColor = colors.trainerMuted;
                                textColor = colors.trainerPrimary;
                                fontWeight = '600';
                            }

                            return (
                                <View key={dateStr} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 38 }}>
                                    <TouchableOpacity
                                        onPress={() => isTappable && onToggleDateOverride(dateStr)}
                                        disabled={!isTappable}
                                        activeOpacity={0.7}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: radius.full,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: bgColor,
                                        }}
                                    >
                                        <Text style={{ fontSize: fontSize.tag, fontWeight, color: textColor }}>
                                            {day}
                                        </Text>
                                        {isOverridden && (
                                            <View style={{
                                                position: 'absolute',
                                                bottom: 2,
                                                width: 4,
                                                height: 4,
                                                borderRadius: 2,
                                                backgroundColor: colors.error,
                                            }}
                                            />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                );
            })}

            {/* Legend */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.trainerMuted }} />
                    <Text style={{ fontSize: fontSize.badge, color: colors.textMuted }}>Available</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.error }} />
                    <Text style={{ fontSize: fontSize.badge, color: colors.textMuted }}>Blocked</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.trainerPrimary }} />
                    <Text style={{ fontSize: fontSize.badge, color: colors.textMuted }}>Today</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: `${colors.trainerPrimary}20`, borderWidth: 1, borderColor: `${colors.trainerPrimary}40` }} />
                    <Text style={{ fontSize: fontSize.badge, color: colors.textMuted }}>Custom week</Text>
                </View>
            </View>

            {/* Blocked dates summary */}
            {overrideCount > 0 && (
                <View style={{ marginTop: 16, backgroundColor: colors.errorBg, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: `${colors.error}40` }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Ionicons name="ban-outline" size={14} color={colors.error} />
                        <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.error }}>
                            {overrideCount}
                            {' '}
                            day
                            {overrideCount !== 1 ? 's' : ''}
                            {' '}
                            blocked this month
                        </Text>
                    </View>
                    {dateOverrides
                        .filter((o) => o.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((override) => {
                            const [, , dayStr] = override.date.split('-');
                            const dayNum = parseInt(dayStr, 10);
                            const dotw = (firstDay + dayNum - 1) % 7;
                            return (
                                <View
                                    key={override.date}
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: 1, borderTopColor: `${colors.error}20` }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.error, width: 28 }}>
                                            {dayNum}
                                        </Text>
                                        <Text style={{ fontSize: fontSize.tag, color: colors.textSecondary }}>
                                            {DAYS_OF_WEEK[dotw]}
                                            ,
                                            {MONTH_NAMES[month]}
                                            {' '}
                                            {dayNum}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => onToggleDateOverride(override.date)}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                </View>
            )}

            {/* Week Schedules */}
            {onWeekCustomize && (
                <View style={{ marginTop: 16, backgroundColor: colors.surface, borderRadius: radius.card, padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                        <Text style={{ fontSize: fontSize.tag, fontWeight: '700', color: colors.textSecondary }}>
                            Week Schedules
                        </Text>
                    </View>

                    {weekRows.map(({ startStr, endStr, weekStartObj, weekEndObj, override, isPast, isBeyondScope }, idx) => (
                        <View
                            key={startStr}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 8,
                                borderTopWidth: idx > 0 ? 1 : 0,
                                borderTopColor: colors.surfaceBorder,
                                opacity: (isPast || isBeyondScope) ? 0.45 : 1,
                            }}
                        >
                            {/* Week range */}
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '500', color: colors.textPrimary }}>
                                    {formatWeekLabel(weekStartObj, weekEndObj)}
                                </Text>
                                {override && !isBeyondScope && (
                                    <Text style={{ fontSize: fontSize.badge, color: colors.trainerPrimary, marginTop: 1 }}>
                                        {override.schedule.filter((d) => d.enabled).length}
                                        {' '}
                                        days active
                                    </Text>
                                )}
                            </View>

                            {/* Badge */}
                            <View style={{
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: radius.full,
                                backgroundColor: override ? colors.trainerMuted : colors.surface,
                                marginRight: 8,
                            }}
                            >
                                <Text style={{
                                    fontSize: fontSize.badge,
                                    fontWeight: '600',
                                    color: override ? colors.trainerPrimary : colors.textSubtle,
                                }}
                                >
                                    {override ? 'Custom' : 'Default'}
                                </Text>
                            </View>

                            {/* Action button — hidden when past or beyond scope */}
                            {!isPast && !isBeyondScope && (
                                <TouchableOpacity
                                    onPress={() => onWeekCustomize(startStr, endStr, override)}
                                    activeOpacity={0.7}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: radius.sm,
                                        borderWidth: 1,
                                        borderColor: override ? colors.trainerBorder : colors.surfaceBorder,
                                        backgroundColor: override ? colors.trainerMuted : colors.white,
                                    }}
                                >
                                    <Ionicons
                                        name={override ? 'pencil-outline' : 'add'}
                                        size={12}
                                        color={override ? colors.trainerPrimary : colors.textMuted}
                                    />
                                    <Text style={{
                                        fontSize: fontSize.badge,
                                        fontWeight: '600',
                                        color: override ? colors.trainerPrimary : colors.textMuted,
                                    }}
                                    >
                                        {override ? 'Edit' : 'Customize'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}
