import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAvailableDates, useAvailableSlots, useBookings, useTrainerDetail } from '@/api/hooks/useBookSession';
import { clientService } from '@/api/services/client.service';
import {
    BookSessionHeader,
    BookingSummarySection,
    FixedCta,
    MonthCalendarSection,
    NotesSection,
    TimeSlotsSection,
    TrainerCard,
    WeeklyScheduleSection,
} from '@/components/client/bookSession';
import {
    BOOKING_ANIM,
    MONTH_LABELS_SHORT,
    WEEKDAY_LABELS_LONG,
} from '@/constants/clientBooking.constants';
import { colors, fontSize } from '@/constants/theme';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import type {
    ApiAvailableSlot,
    ApiAvailableSlotsResponse,
    ApiScheduleDay,
    BookingSessionMode,
    SessionMode,
} from '@/types/clientTypes';

const PER_DATE_LIMIT = 6;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
}

function toMonFirst(jsDay: number): number {
    return (jsDay + 6) % 7;
}

function formatDateSummary(dateStr: string): string {
    const d = new Date(dateStr);
    return `${WEEKDAY_LABELS_LONG[d.getDay()]}, ${d.getDate()} ${MONTH_LABELS_SHORT[d.getMonth()]}`;
}

/** Returns true if the trainer's weekly schedule has `startTime` for the given date's day-of-week. */
function scheduleHasSlot(date: string, startTime: string, schedule: ApiScheduleDay[]): boolean {
    const dow = new Date(date).getDay();
    const day = schedule.find((d) => d.day_of_week === dow && d.enabled);
    return day?.slots.some((s) => s.start_time === startTime) ?? false;
}

interface CalCell {
    key: string;
    day: number | null;
}

function toDateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildCalendarCells(year: number, month: number): CalCell[] {
    const offset = toMonFirst(new Date(year, month - 1, 1).getDay());
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: CalCell[] = [
        ...Array.from({ length: offset }, (_, i) => ({ key: `blank-pre-${i}`, day: null })),
        ...Array.from({ length: daysInMonth }, (_, i) => ({
            key: toDateStr(year, month, i + 1),
            day: i + 1,
        })),
    ];
    let trail = 0;
    while (cells.length % 7 !== 0) {
        cells.push({ key: `blank-post-${trail}`, day: null });
        trail += 1;
    }
    return cells;
}

function resolveEffectiveMode(
    trainerMode: SessionMode | undefined,
    chosenMode: BookingSessionMode,
): BookingSessionMode {
    if (trainerMode === 'online') return 'online';
    if (trainerMode === 'offline') return 'offline';
    return chosenMode;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookSession() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: trainer, isLoading: isTrainerLoading, refetch: refetchTrainer } = useTrainerDetail(id);
    const { data: clientBookings } = useBookings();

    const today = useMemo(() => new Date(), []);
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth() + 1);

    const { data: availableDates, refetch: refetchAvailableDates } = useAvailableDates(id, calYear, calMonth);

    const [selectedDates, setSelectedDates] = useState<Set<string>>(() => new Set());
    const [activeSlotDate, setActiveSlotDate] = useState<string | null>(null);

    const [chosenMode, setChosenMode] = useState<BookingSessionMode>('online');
    const [selectedSlot, setSelectedSlot] = useState<ApiAvailableSlot | null>(null);
    const [slotPerDate, setSlotPerDate] = useState<Map<string, ApiAvailableSlot>>(() => new Map());
    const [notes, setNotes] = useState('');
    const [isBooking, setIsBooking] = useState(false);

    const isPerDateMode = selectedDates.size > 0 && selectedDates.size <= PER_DATE_LIMIT;

    // Keep refs for race-safe async auto-fill.
    const selectedDatesRef = useRef(selectedDates);
    useEffect(() => {
        selectedDatesRef.current = selectedDates;
    }, [selectedDates]);

    const availableSlotsCacheRef = useRef<Map<string, ApiAvailableSlotsResponse>>(new Map());
    const autoFillSeqRef = useRef(0);

    const getAvailableSlotsForDate = useCallback(async (dateStr: string) => {
        if (!id) return null;
        const cached = availableSlotsCacheRef.current.get(dateStr);
        if (cached) return cached;
        try {
            const resp = await clientService.getAvailableSlots(id, dateStr);
            availableSlotsCacheRef.current.set(dateStr, resp);
            return resp;
        } catch {
            return null;
        }
    }, [id]);

    const { data: slotsData, isLoading: isSlotsLoading, refetch: refetchSlots } = useAvailableSlots(id, activeSlotDate);
    const trainerMode = slotsData?.session_mode;
    const effectiveMode = resolveEffectiveMode(trainerMode, chosenMode);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        availableSlotsCacheRef.current.clear();

        try {
            await Promise.all([
                refetchTrainer(),
                refetchAvailableDates(),
                activeSlotDate ? refetchSlots() : Promise.resolve(),
            ]);
        } catch {
            showErrorToast('Failed to refresh availability. Please try again.');
        } finally {
            setIsRefreshing(false);
        }
    }, [activeSlotDate, refetchAvailableDates, refetchSlots, refetchTrainer]);

    // ── Entrance animations ───────────────────────────────────────────────────
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

    // ── Derived calendar values ───────────────────────────────────────────────
    const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);
    const availableSet = useMemo(() => new Set(availableDates ?? []), [availableDates]);
    const availableCountThisMonth = useMemo(
        () => (availableDates ?? []).filter((d) => d >= todayStr).length,
        [availableDates, todayStr],
    );
    const calCells = useMemo(() => buildCalendarCells(calYear, calMonth), [calYear, calMonth]);
    const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth() + 1;

    const bookedSet = useMemo(() => {
        const set = new Set<string>();
        if (!id || !clientBookings) return set;
        clientBookings.forEach((b) => {
            if (b.trainerId === id && b.status !== 'cancelled') {
                set.add(b.date);
            }
        });
        return set;
    }, [clientBookings, id]);

    // ── Date selection (month calendar) ──────────────────────────────────────
    const handleDatePress = useCallback((day: number) => {
        const dateStr = toDateStr(calYear, calMonth, day);
        if (dateStr < todayStr) return;
        if (!availableSet.has(dateStr)) return;

        setSelectedDates((prev) => {
            const next = new Set(prev);
            if (next.has(dateStr)) {
                next.delete(dateStr);
            } else {
                next.add(dateStr);
            }
            return next;
        });

        setActiveSlotDate((prevActive) => {
            if (prevActive === null) return dateStr;
            if (prevActive === dateStr) {
                // If user deselected the active date, switch to another selected date.
                const remaining = Array.from(selectedDatesRef.current).filter((d) => d !== dateStr);
                remaining.sort();
                return remaining[0] ?? null;
            }
            return dateStr;
        });
    }, [availableSet, calMonth, calYear, todayStr]);

    const handleChipPress = useCallback((dateStr: string) => {
        setActiveSlotDate(dateStr);
    }, []);

    // Keep slot selections consistent with selected dates and mode.
    useEffect(() => {
        if (selectedDates.size === 0) {
            setActiveSlotDate(null);
            setSelectedSlot(null);
            setSlotPerDate(new Map());
            return;
        }

        setSlotPerDate((prev) =>
            new Map(
                Array.from(prev.entries()).filter(([date]) => selectedDates.has(date)),
            )
        );

        if (selectedDates.size > PER_DATE_LIMIT) {
            // Global-time mode. Per-date selections no longer apply.
            setSlotPerDate(new Map());
        } else {
            // Per-date mode. Global selection should not apply.
            setSelectedSlot(null);
        }

        if (activeSlotDate && !selectedDates.has(activeSlotDate)) {
            const first = Array.from(selectedDates).sort()[0] ?? null;
            setActiveSlotDate(first);
        }
    }, [activeSlotDate, selectedDates]);

    const handleSlotPress = useCallback((slot: ApiAvailableSlot) => {
        if (!activeSlotDate) return;
        if (selectedDates.size === 0) return;

        if (!isPerDateMode) {
            setSelectedSlot(slot);
            return;
        }

        setSlotPerDate((prev) => {
            const next = new Map(prev);
            next.set(activeSlotDate, slot);
            return next;
        });

        if (!trainer) return;
        if (selectedDates.size <= 1) return;

        const seq = autoFillSeqRef.current + 1;
        autoFillSeqRef.current = seq;

        const startTime = slot.start_time;
        const schedule = trainer.availability;
        const baseDate = activeSlotDate;

        const runAutoFill = async () => {
            const datesNow = Array.from(selectedDatesRef.current);
            const otherDates = datesNow.filter((d) => d !== baseDate);

            if (autoFillSeqRef.current !== seq) return;

            const candidates = otherDates.filter((date) =>
                scheduleHasSlot(date, startTime, schedule),
            );

            const results = await Promise.all(
                candidates.map(async (date) => {
                    const resp = await getAvailableSlotsForDate(date);
                    if (!resp || !resp.is_available) return null;
                    const match = resp.slots.find(
                        (s) => s.start_time === startTime && !s.is_booked,
                    );
                    return match ? ([date, match] as const) : null;
                }),
            );

            const updates = new Map(
                results.filter(
                    (x): x is readonly [string, ApiAvailableSlot] => x !== null,
                ),
            );

            if (autoFillSeqRef.current !== seq) return;

            setSlotPerDate((prev) => {
                const next = new Map(prev);
                Array.from(updates.entries()).forEach(([date, s]) => {
                    if (!selectedDatesRef.current.has(date)) return;
                    if (next.has(date)) return;
                    next.set(date, s);
                });
                return next;
            });
        };

        runAutoFill().catch(() => {
            // best-effort; ignore auto-fill failures
        });
    }, [activeSlotDate, getAvailableSlotsForDate, isPerDateMode, selectedDates.size, trainer]);

    const isReady = useMemo(() => {
        if (!trainer) return false;
        if (selectedDates.size === 0) return false;

        if (isPerDateMode) {
            return Array.from(selectedDates).every((date) => !!slotPerDate.get(date));
        }

        return selectedSlot !== null;
    }, [isPerDateMode, selectedDates, selectedSlot, slotPerDate, trainer]);

    const ctaLabel = useMemo(() => {
        const count = selectedDates.size;
        if (isBooking) return 'Confirming...';
        if (count > 1) return `Confirm ${count} Sessions`;
        return 'Confirm Booking';
    }, [isBooking, selectedDates.size]);

    const handleBook = useCallback(async () => {
        if (!trainer) return;
        if (!isReady) return;
        if (!id) return;

        const dates = Array.from(selectedDates).sort();
        const notesValue = notes.trim() || undefined;

        /** Computes session cost: hourlyRate × duration in hours */
        const calcAmount = (startTime: string, endTime: string): number => {
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            const durationHours = (eh * 60 + em - sh * 60 - sm) / 60;
            return Math.round(trainer.hourlyRate * durationHours);
        };

        setIsBooking(true);
        try {
            if (isPerDateMode) {
                const bookings = dates.map(async (date) => {
                    const s = slotPerDate.get(date);
                    if (!s) throw new Error('Missing time for one or more selected dates.');

                    const resp = await getAvailableSlotsForDate(date);
                    const modeForDate = resolveEffectiveMode(resp?.session_mode, chosenMode);

                    await clientService.bookSession(id, {
                        date,
                        start_time: s.start_time,
                        end_time: s.end_time,
                        session_mode: modeForDate,
                        notes: notesValue,
                        total_amount: calcAmount(s.start_time, s.end_time),
                    });
                });
                await Promise.all(bookings);
            } else {
                await Promise.all(
                    dates.map((date) =>
                        clientService.bookSession(id, {
                            date,
                            start_time: selectedSlot!.start_time,
                            end_time: selectedSlot!.end_time,
                            session_mode: effectiveMode,
                            notes: notesValue,
                            total_amount: calcAmount(selectedSlot!.start_time, selectedSlot!.end_time),
                        }),
                    ),
                );
            }

            const count = dates.length;
            const label = count > 1 ? `${count} sessions` : 'a session';
            showSuccessToast(
                `Booked ${label} with ${trainer.name}`,
                'Booking confirmed!',
            );
            router.navigate('/(tabs)/client/bookings');
        } catch (e) {
            showErrorToast(e instanceof Error ? e.message : 'Booking failed. Please try again.');
        } finally {
            setIsBooking(false);
        }
    }, [chosenMode, effectiveMode, getAvailableSlotsForDate, id, isPerDateMode, isReady, notes, router, selectedDates, selectedSlot, slotPerDate, trainer]);

    if (isTrainerLoading || !trainer) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ fontSize: fontSize.caption, color: colors.textSubtle, marginTop: 10 }}>
                    Loading trainer...
                </Text>
            </View>
        );
    }

    const initials = trainer.name
        .split(' ')
        .map((n) => n[0])
        .join('');

    const onPrevMonth = () => {
        if (isCurrentMonth) return;
        if (calMonth === 1) {
            setCalYear((y) => y - 1);
            setCalMonth(12);
        } else {
            setCalMonth((m) => m - 1);
        }
    };
    const onNextMonth = () => {
        if (calMonth === 12) {
            setCalYear((y) => y + 1);
            setCalMonth(1);
        } else {
            setCalMonth((m) => m + 1);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <BookSessionHeader
                topInset={insets.top}
                selectedCount={selectedDates.size}
                onBack={() => router.back()}
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    padding: 20,
                    gap: 28,
                    paddingBottom: 140 + insets.bottom,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={(
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                )}
            >
                <TrainerCard
                    animatedStyle={cardStyle}
                    avatar={trainer.avatar}
                    initials={initials}
                    name={trainer.name}
                    expertise={trainer.expertise}
                    hourlyRate={trainer.hourlyRate}
                />

                <WeeklyScheduleSection
                    animatedStyle={dateStyle}
                    availability={trainer.availability}
                />

                <MonthCalendarSection
                    animatedStyle={dateStyle}
                    calYear={calYear}
                    calMonth={calMonth}
                    isCurrentMonth={isCurrentMonth}
                    onPrevMonth={onPrevMonth}
                    onNextMonth={onNextMonth}
                    availableCountThisMonth={availableCountThisMonth}
                    hasAvailableDatesInfo={availableDates != null}
                    calCells={calCells}
                    availableSet={availableSet}
                    bookedSet={bookedSet}
                    todayStr={todayStr}
                    selectedDates={selectedDates}
                    activeSlotDate={activeSlotDate}
                    isSlotsLoading={isSlotsLoading}
                    onDatePress={handleDatePress}
                    chunk={chunk}
                />

                {activeSlotDate !== null && selectedDates.size > 0 && (
                    <TimeSlotsSection
                        animatedStyle={timeStyle}
                        activeSlotDate={activeSlotDate}
                        selectedDates={selectedDates}
                        isPerDateMode={isPerDateMode}
                        perDateLimit={PER_DATE_LIMIT}
                        trainerMode={trainerMode}
                        chosenMode={chosenMode}
                        setChosenMode={setChosenMode}
                        slotsData={slotsData ?? null}
                        isSlotsLoading={isSlotsLoading}
                        slotPerDate={slotPerDate}
                        selectedSlot={selectedSlot}
                        onSlotPress={handleSlotPress}
                        onChipPress={handleChipPress}
                        formatDateSummary={formatDateSummary}
                    />
                )}

                <NotesSection notes={notes} setNotes={setNotes} />

                <BookingSummarySection
                    isReady={isReady}
                    trainer={trainer}
                    selectedDates={selectedDates}
                    isPerDateMode={isPerDateMode}
                    slotPerDate={slotPerDate}
                    selectedSlot={selectedSlot}
                    effectiveMode={effectiveMode}
                    formatDateSummary={formatDateSummary}
                />
            </ScrollView>

            <FixedCta
                bottomInset={insets.bottom}
                onPress={handleBook}
                disabled={!isReady || isBooking}
                isLoading={isBooking}
                label={ctaLabel}
            />
        </View>
    );
}
