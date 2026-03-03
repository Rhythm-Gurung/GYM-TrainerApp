import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useClientBooking } from '@/api/hooks/useClientBooking';
import type { SelectionMode } from '@/constants/clientBooking.constants';
import {
    BOOKING_ANIM,
    BOOKING_DATE_RANGE_DAYS,
    BOOKING_NOTES_MAX_LENGTH,
    BOOKING_NOTES_PLACEHOLDER,
    BOOKING_SLOT_ROWS,
    MONTH_LABELS_SHORT,
    SELECTION_MODE_OPTIONS,
    WEEKDAY_LABELS_LONG,
    WEEKDAY_LABELS_SHORT,
} from '@/constants/clientBooking.constants';
import { colors, fontSize, radius, shadow } from '@/constants/theme';
import { mockTrainers } from '@/data/mockData';
import { showSuccessToast } from '@/lib/toast';
import type { BookingRequest } from '@/types/clientTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** '09:00' → '10:00' */
function getEndTime(startTime: string): string {
    const [hour] = startTime.split(':');
    return `${String(Number(hour) + 1).padStart(2, '0')}:00`;
}

/** 'YYYY-MM-DD' → 'Wednesday, 25 Feb' */
function formatDateSummary(dateStr: string): string {
    const d = new Date(dateStr);
    return `${WEEKDAY_LABELS_LONG[d.getDay()]}, ${d.getDate()} ${MONTH_LABELS_SHORT[d.getMonth()]}`;
}

/** 'YYYY-MM-DD' → '25 Feb' */
function formatDateShort(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getDate()} ${MONTH_LABELS_SHORT[d.getMonth()]}`;
}

/** Generate the next N bookable dates starting from tomorrow. */
function generateDates(count: number): string[] {
    return Array.from({ length: count }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return d.toISOString().split('T')[0];
    });
}

/** Generate N consecutive dates starting from startDate (inclusive). */
function generateDateRange(startDate: string, count: number): string[] {
    const start = new Date(startDate);
    return Array.from({ length: count }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d.toISOString().split('T')[0];
    });
}

/** First–Last range label for the booking summary. */
function formatPeriod(dates: string[]): string {
    if (dates.length === 1) return formatDateSummary(dates[0]);
    return `${formatDateShort(dates[0])} – ${formatDateShort(dates[dates.length - 1])}`;
}

// Pre-computed once at module load; refreshes on next app launch.
const DATES = generateDates(BOOKING_DATE_RANGE_DAYS);
const DATES_SET = new Set(DATES);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookSession() {
    const router = useRouter();
    // Manually consume insets — avoids nesting SafeAreaView inside View
    // which causes double-inset / zero-inset issues on Android.
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const trainer = mockTrainers.find((t) => t.id === id);

    const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [notes, setNotes] = useState('');

    const { mutateAsync, isLoading } = useClientBooking();

    // ── Entrance animations ────────────────────────────────────────────────────
    const cardY = useSharedValue<number>(BOOKING_ANIM.SLIDE);
    const dateY = useSharedValue<number>(BOOKING_ANIM.SLIDE);
    const timeY = useSharedValue<number>(BOOKING_ANIM.SLIDE);

    const animRef = useRef({ cardY, dateY, timeY });

    useFocusEffect(
        useCallback(() => {
            const v = animRef.current;
            const ease = { duration: BOOKING_ANIM.DUR };

            v.cardY.value = BOOKING_ANIM.SLIDE;
            v.cardY.value = withTiming(0, ease);

            v.dateY.value = BOOKING_ANIM.SLIDE;
            v.dateY.value = withDelay(BOOKING_ANIM.STAGGER, withTiming(0, ease));

            v.timeY.value = BOOKING_ANIM.SLIDE;
            v.timeY.value = withDelay(BOOKING_ANIM.STAGGER * 2, withTiming(0, ease));
        }, []),
    );

    // overflow: 'visible' prevents the animated transform from being clipped
    // by the parent — matches the pattern used in trainerProfile.tsx.
    const cardStyle = useAnimatedStyle(() => ({
        overflow: 'visible',
        transform: [{ translateY: cardY.value }],
    }));
    const dateStyle = useAnimatedStyle(() => ({
        overflow: 'visible',
        transform: [{ translateY: dateY.value }],
    }));
    const timeStyle = useAnimatedStyle(() => ({
        overflow: 'visible',
        transform: [{ translateY: timeY.value }],
    }));

    // ── Mode change — always clears selection ──────────────────────────────────
    function handleSelectionModeChange(mode: SelectionMode) {
        setSelectionMode(mode);
        setSelectedDates([]);
    }

    // ── Date press — mode-aware ────────────────────────────────────────────────
    function handleDatePress(date: string) {
        switch (selectionMode) {
            case 'single':
                setSelectedDates((prev) => (prev[0] === date ? [] : [date]));
                break;

            case 'multi':
                setSelectedDates((prev) => {
                    if (prev.includes(date)) return prev.filter((d) => d !== date);
                    return [...prev, date].sort();
                });
                break;

            case 'week':
            case 'month': {
                const count = selectionMode === 'week' ? 7 : 30;
                const range = generateDateRange(date, count).filter((d) => DATES_SET.has(d));
                setSelectedDates((prev) => {
                    if (prev.length > 0 && prev[0] === range[0]) return [];
                    return range;
                });
                break;
            }

            default:
                break;
        }
    }

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleBook = useCallback(async () => {
        if (!trainer || selectedDates.length === 0 || !selectedTime) return;

        const count = selectedDates.length;
        const request: BookingRequest = {
            trainerId: trainer.id,
            trainerName: trainer.name,
            dates: selectedDates,
            sessionCount: count,
            startTime: selectedTime,
            endTime: getEndTime(selectedTime),
            totalAmount: trainer.hourlyRate * count,
            notes: notes.trim() || undefined,
        };

        try {
            await mutateAsync(request);
            const label = count > 1 ? `${count} sessions` : 'a session';
            showSuccessToast(
                `Booked ${label} with ${trainer.name} at ${selectedTime}`,
                'Booking request sent!',
            );
            router.navigate('/(tabs)/client/bookings');
        } catch {
            // Error toast already shown by useApiMutation
        }
    }, [trainer, selectedDates, selectedTime, notes, mutateAsync, router]);

    // ── Not found ──────────────────────────────────────────────────────────────
    if (!trainer) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: fontSize.body, color: colors.textMuted }}>
                    Trainer not found
                </Text>
            </View>
        );
    }

    const isReady = selectedDates.length > 0 && !!selectedTime;
    const sessionCount = selectedDates.length;
    const totalAmount = trainer.hourlyRate * (sessionCount || 1);
    const initials = trainer.name.split(' ').map((n) => n[0]).join('');

    function getButtonLabel(): string {
        if (isLoading) return 'Confirming...';
        if (sessionCount > 1) return `Confirm ${sessionCount} Sessions`;
        return 'Confirm Booking';
    }

    // Height of the fixed CTA bar (button + padding above + bottom inset)
    const CTA_HEIGHT = 16 + 52 + 12 + insets.bottom;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>

            {/* ── Header (manual insets — no nested SafeAreaView) ────────────── */}
            <View
                style={{
                    paddingTop: insets.top + 14,
                    paddingBottom: 14,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: colors.background,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceBorder,
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: radius.sm,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>

                <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.textPrimary }}>
                    Book Session
                </Text>
            </View>

            {/* ── Scrollable body ─────────────────────────────────────────────── */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    padding: 20,
                    gap: 28,
                    paddingBottom: CTA_HEIGHT + 16,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Trainer summary card ─────────────────────────────────── */}
                <Animated.View style={cardStyle}>
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
                        {/* Avatar initials */}
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
                            }}
                        >
                            <Text style={{ fontSize: fontSize.card, fontWeight: '800', color: colors.primary }}>
                                {initials}
                            </Text>
                        </View>

                        {/* Name + expertise */}
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: fontSize.card, fontWeight: '700', color: colors.textPrimary }}>
                                {trainer.name}
                            </Text>
                            <Text style={{ fontSize: fontSize.caption, color: colors.textMuted, marginTop: 2 }}>
                                {trainer.expertise.slice(0, 2).join(' · ')}
                            </Text>
                        </View>

                        {/* Hourly rate */}
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: fontSize.stat, fontWeight: '800', color: colors.primary }}>
                                {`₹${trainer.hourlyRate}`}
                            </Text>
                            <Text style={{ fontSize: fontSize.caption, color: colors.textMuted }}>
                                /session
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* ── Date selection ───────────────────────────────────────── */}
                {/*
                    gap lives on a plain child View, NOT on the Animated.View,
                    so layout props never mix with animated transform styles.
                */}
                <Animated.View style={dateStyle}>
                    <View style={{ gap: 12 }}>

                        {/* Section header + session-count badge */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }}>
                                Select Date
                            </Text>
                            {sessionCount > 0 && (
                                <View
                                    style={{
                                        backgroundColor: colors.primarySurface,
                                        borderRadius: radius.full,
                                        paddingHorizontal: 10,
                                        paddingVertical: 3,
                                        borderWidth: 1,
                                        borderColor: colors.primaryBorderSm,
                                    }}
                                >
                                    <Text style={{ fontSize: fontSize.caption, fontWeight: '700', color: colors.primary }}>
                                        {sessionCount === 1 ? '1 session' : `${sessionCount} sessions`}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Mode selector: Single | Multi-Day | Week | Month */}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {SELECTION_MODE_OPTIONS.map((option) => {
                                const isActive = selectionMode === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => handleSelectionModeChange(option.value)}
                                        activeOpacity={0.75}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 8,
                                            borderRadius: radius.md,
                                            alignItems: 'center',
                                            backgroundColor: isActive ? colors.primary : colors.surface,
                                            borderWidth: 1,
                                            borderColor: isActive ? colors.primary : colors.surfaceBorder,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: fontSize.caption,
                                                fontWeight: '700',
                                                color: isActive ? colors.white : colors.textMuted,
                                            }}
                                        >
                                            {option.label}
                                        </Text>
                                        {option.days !== null && (
                                            <Text
                                                style={{
                                                    fontSize: fontSize.badge,
                                                    color: isActive ? colors.white65 : colors.textSubtle,
                                                    marginTop: 1,
                                                }}
                                            >
                                                {`${option.days}d`}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Contextual hint */}
                        <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle }}>
                            {selectionMode === 'single' && 'Tap a date to select one session.'}
                            {selectionMode === 'multi' && 'Tap multiple dates to book separate sessions.'}
                            {selectionMode === 'week' && 'Tap any date to auto-select a 7-day block.'}
                            {selectionMode === 'month' && 'Tap any date to auto-select a 30-day block.'}
                        </Text>

                        {/* Horizontal date strip */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                        >
                            {DATES.map((date) => {
                                const d = new Date(date);
                                const isSelected = selectedDates.includes(date);
                                const isFirst = selectedDates[0] === date;
                                const isLast = selectedDates[selectedDates.length - 1] === date;
                                const isMiddle = isSelected && sessionCount > 1 && !isFirst && !isLast;

                                return (
                                    <TouchableOpacity
                                        key={date}
                                        onPress={() => handleDatePress(date)}
                                        activeOpacity={0.75}
                                        style={{
                                            width: 62,
                                            paddingVertical: 12,
                                            borderRadius: radius.card,
                                            alignItems: 'center',
                                            backgroundColor: isSelected ? colors.primary : colors.white,
                                            borderWidth: isFirst || isLast ? 2 : 1,
                                            borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                                            opacity: isMiddle ? 0.72 : 1,
                                            ...shadow.card,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: fontSize.badge,
                                                fontWeight: '600',
                                                color: isSelected ? colors.white65 : colors.textSubtle,
                                            }}
                                        >
                                            {WEEKDAY_LABELS_SHORT[d.getDay()]}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: fontSize.stat,
                                                fontWeight: '800',
                                                color: isSelected ? colors.white : colors.textPrimary,
                                                marginVertical: 2,
                                            }}
                                        >
                                            {d.getDate()}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: fontSize.badge,
                                                fontWeight: '600',
                                                color: isSelected ? colors.white65 : colors.textSubtle,
                                            }}
                                        >
                                            {MONTH_LABELS_SHORT[d.getMonth()]}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </Animated.View>

                {/* ── Time selection ───────────────────────────────────────── */}
                <Animated.View style={timeStyle}>
                    <View style={{ gap: 12 }}>
                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }}>
                            Select Time
                        </Text>

                        {/* Two rows: morning (07–11) and afternoon (14–18) */}
                        <View style={{ gap: 8 }}>
                            {BOOKING_SLOT_ROWS.map((rowSlots) => (
                                <View key={rowSlots[0]} style={{ flexDirection: 'row', gap: 8 }}>
                                    {rowSlots.map((time) => {
                                        const isSelected = selectedTime === time;
                                        return (
                                            <TouchableOpacity
                                                key={time}
                                                onPress={() => setSelectedTime((prev) => (prev === time ? null : time))}
                                                activeOpacity={0.75}
                                                style={{
                                                    flex: 1,
                                                    paddingVertical: 12,
                                                    borderRadius: radius.md,
                                                    alignItems: 'center',
                                                    backgroundColor: isSelected ? colors.primary : colors.white,
                                                    borderWidth: 1,
                                                    borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                                                    ...shadow.cardSubtle,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: fontSize.tag,
                                                        fontWeight: '600',
                                                        color: isSelected ? colors.white : colors.textSecondary,
                                                    }}
                                                >
                                                    {time}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </View>
                </Animated.View>

                {/* ── Notes ────────────────────────────────────────────────── */}
                <View style={{ gap: 10 }}>
                    <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }}>
                        Notes (optional)
                    </Text>
                    <TextInput
                        value={notes}
                        onChangeText={setNotes}
                        placeholder={BOOKING_NOTES_PLACEHOLDER}
                        placeholderTextColor={colors.textSubtle}
                        maxLength={BOOKING_NOTES_MAX_LENGTH}
                        multiline
                        textAlignVertical="top"
                        style={{
                            backgroundColor: colors.white,
                            borderWidth: 1,
                            borderColor: colors.surfaceBorder,
                            borderRadius: radius.card,
                            paddingHorizontal: 16,
                            paddingTop: 14,
                            paddingBottom: 14,
                            fontSize: fontSize.body,
                            color: colors.textPrimary,
                            height: 96,
                        }}
                    />
                </View>

                {/* ── Booking summary ───────────────────────────────────────── */}
                {isReady && (
                    <View
                        style={{
                            backgroundColor: colors.primarySurface,
                            borderRadius: radius.card,
                            padding: 18,
                            borderWidth: 1,
                            borderColor: colors.primaryBorder,
                            gap: 12,
                        }}
                    >
                        <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }}>
                            Booking Summary
                        </Text>

                        {/* Trainer */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>Trainer</Text>
                            <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textPrimary }}>
                                {trainer.name}
                            </Text>
                        </View>

                        {/* Date (single) or Sessions + Period (multi) */}
                        {sessionCount > 1 ? (
                            <>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>Sessions</Text>
                                    <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textPrimary }}>
                                        {sessionCount}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>Period</Text>
                                    <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textPrimary }}>
                                        {formatPeriod(selectedDates)}
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>Date</Text>
                                <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textPrimary }}>
                                    {formatDateSummary(selectedDates[0])}
                                </Text>
                            </View>
                        )}

                        {/* Time */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>Time</Text>
                            <Text style={{ fontSize: fontSize.tag, fontWeight: '600', color: colors.textPrimary }}>
                                {`${selectedTime} – ${getEndTime(selectedTime!)}`}
                            </Text>
                        </View>

                        {/* Divider */}
                        <View style={{ height: 1, backgroundColor: colors.primaryBorderSm }} />

                        {/* Rate breakdown (multi only) */}
                        {sessionCount > 1 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>Rate</Text>
                                <Text style={{ fontSize: fontSize.tag, color: colors.textMuted }}>
                                    {`₹${trainer.hourlyRate} × ${sessionCount}`}
                                </Text>
                            </View>
                        )}

                        {/* Total */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.textPrimary }}>
                                Total
                            </Text>
                            <Text style={{ fontSize: fontSize.hero, fontWeight: '800', color: colors.primary }}>
                                {`₹${totalAmount.toLocaleString()}`}
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* ── Fixed bottom CTA ───────────────────────────────────────────── */}
            <View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: insets.bottom + 16,
                    backgroundColor: colors.background,
                    borderTopWidth: 1,
                    borderTopColor: colors.surfaceBorder,
                }}
            >
                <TouchableOpacity
                    onPress={handleBook}
                    disabled={!isReady || isLoading}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: isReady && !isLoading ? colors.primary : colors.textDisabled,
                        borderRadius: radius.card,
                        paddingVertical: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        ...(isReady && !isLoading ? shadow.primary : {}),
                    }}
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                        <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                    )}
                    <Text style={{ fontSize: fontSize.body, fontWeight: '700', color: colors.white }}>
                        {getButtonLabel()}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
