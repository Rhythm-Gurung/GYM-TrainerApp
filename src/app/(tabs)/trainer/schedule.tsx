import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTrainerBookings } from '@/api/hooks/useTrainerBookings';
import { useTrainerSchedule } from '@/api/hooks/useTrainerSchedule';
import AvailabilityTabBar from '@/components/trainer/AvailabilityTabBar';
import DayScheduleCard from '@/components/trainer/DayScheduleCard';
import MonthlyCalendarView from '@/components/trainer/MonthlyCalendarView';
import PresetCard from '@/components/trainer/PresetCard';
import ScheduleDurationSheet from '@/components/trainer/ScheduleDurationSheet';
import WeekOverrideSheet from '@/components/trainer/WeekOverrideSheet';
import HeroGradient from '@/components/ui/HeroGradient';
import { colors, fontSize, gradientColors, radius, shadow } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import type { ScheduleOverride } from '@/types/trainerAvailability.types';
import type { DaySchedule } from '@/types/trainerTypes';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatScopeLabel(effectiveUntil: string): string {
    const [y, m, d] = effectiveUntil.split('-').map(Number);
    return `${SHORT_MONTHS[m - 1]} ${d}, ${y}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const SLIDE = 30;
const DUR = 300;

export default function TrainerSchedule() {
    const tabBarHeight = useTabBarHeight();
    const insets = useSafeAreaInsets();

    const { data: bookingsData, refetch: refetchBookings } = useTrainerBookings();
    const bookings = bookingsData ?? [];

    const {
        activeTab,
        setActiveTab,
        schedule,
        scheduleScope,
        scheduleDuplicateName,
        presets,
        dateOverrides,
        scheduleOverrides,
        isLoading,
        isSaving,
        isApplyingPreset,
        loadData,
        toggleDay,
        addSlot,
        removeSlot,
        updateSlot,
        setSessionMode,
        saveSchedule,
        applyPreset,
        deletePreset,
        activePresetId,
        toggleDateOverride,
        loadMonthOverrides,
        createScheduleOverride,
        updateScheduleOverride,
        deleteScheduleOverride,
    } = useTrainerSchedule();

    const [durationSheetVisible, setDurationSheetVisible] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await Promise.all([loadData(), refetchBookings()]);
        setIsRefreshing(false);
    }, [loadData, refetchBookings]);

    const handleSavePress = useCallback(() => {
        const hasActiveDays = schedule.some((d) => d.enabled);

        // Guard: enabled days must have at least one slot
        const emptyEnabledDays = schedule.filter((d) => d.enabled && d.slots.length === 0);
        if (emptyEnabledDays.length > 0) {
            const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const names = emptyEnabledDays.map((d) => DAY_NAMES[d.dayOfWeek]).join(', ');
            Alert.alert(
                'Missing time slots',
                `${names} ${emptyEnabledDays.length === 1 ? 'is' : 'are'} enabled but ${emptyEnabledDays.length === 1 ? 'has' : 'have'} no time slots. Add at least one slot or disable ${emptyEnabledDays.length === 1 ? 'that day' : 'those days'} before saving.`,
            );
            return;
        }

        // Guard: end time must be after start time
        const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const invalidSlotDays = schedule.filter((d) =>
            d.enabled && d.slots.some((s) => s.endTime <= s.startTime),
        );
        if (invalidSlotDays.length > 0) {
            const lines = invalidSlotDays.flatMap((d) =>
                d.slots
                    .filter((s) => s.endTime <= s.startTime)
                    .map((s) => `• ${DAY_NAMES[d.dayOfWeek]}: ${s.startTime} – ${s.endTime}`),
            );
            Alert.alert(
                'Invalid time slots',
                `End time must be after start time:\n\n${lines.join('\n')}`,
            );
            return;
        }

        const proceed = () => {
            if (scheduleDuplicateName) {
                Alert.alert(
                    'Already saved',
                    `This schedule matches "${scheduleDuplicateName}". Save again?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Save Anyway', onPress: () => setDurationSheetVisible(true) },
                    ],
                );
            } else {
                setDurationSheetVisible(true);
            }
        };

        if (!hasActiveDays) {
            Alert.alert(
                'No days selected',
                'You have not selected any days. Are you sure you want to save an empty schedule?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save Anyway', style: 'destructive', onPress: proceed },
                ],
            );
            return;
        }

        proceed();
    }, [schedule, scheduleDuplicateName]);

    const handleDurationConfirm = useCallback((effectiveFrom: string, effectiveUntil: string | null, planLabel: string) => {
        setDurationSheetVisible(false);
        saveSchedule(effectiveFrom, effectiveUntil, planLabel);
    }, [saveSchedule]);

    const scopeText = useMemo(() => {
        if (!scheduleScope) return null;
        const { planLabel, effective_from, effective_until } = scheduleScope;
        const fromLabel = effective_from ? formatScopeLabel(effective_from) : null;
        const untilLabel = effective_until ? formatScopeLabel(effective_until) : null;
        let rangeText: string;
        if (fromLabel && untilLabel) {
            rangeText = `${fromLabel} – ${untilLabel}`;
        } else if (untilLabel) {
            rangeText = `Until ${untilLabel}`;
        } else {
            rangeText = 'No end date';
        }
        return planLabel ? `${planLabel} · ${rangeText}` : rangeText;
    }, [scheduleScope]);

    const [weekModal, setWeekModal] = useState<{
        startDate: string;
        endDate: string;
        existing?: ScheduleOverride;
    } | null>(null);

    const handleWeekCustomize = useCallback((startDate: string, endDate: string, existing?: ScheduleOverride) => {
        setWeekModal({ startDate, endDate, existing });
    }, []);

    const handleWeekSave = useCallback((weekSchedule: DaySchedule[]) => {
        if (!weekModal) return;
        if (weekModal.existing) {
            updateScheduleOverride(weekModal.existing.id, weekModal.startDate, weekModal.endDate, weekSchedule);
        } else {
            // Clamp start_date to today — backend rejects past start dates.
            // This lets trainers customize the current (partially-elapsed) week.
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const effectiveStart = weekModal.startDate < todayStr ? todayStr : weekModal.startDate;
            createScheduleOverride(effectiveStart, weekModal.endDate, weekSchedule);
        }
        setWeekModal(null);
    }, [weekModal, createScheduleOverride, updateScheduleOverride]);

    const handleWeekDelete = useCallback(() => {
        if (!weekModal?.existing) return;
        deleteScheduleOverride(weekModal.existing.id);
        setWeekModal(null);
    }, [weekModal, deleteScheduleOverride]);

    const listY = useSharedValue(SLIDE);
    const anim = useRef({ listY });

    // Load data on initial mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Refresh overrides every time the Monthly tab is opened
    useEffect(() => {
        if (activeTab === 'monthly') {
            const now = new Date();
            loadMonthOverrides(now.getFullYear(), now.getMonth());
        }
    }, [activeTab, loadMonthOverrides]);

    useFocusEffect(
        useCallback(() => {
            const v = anim.current;
            v.listY.value = SLIDE;
            v.listY.value = withTiming(0, { duration: DUR });
        }, []),
    );

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData]),
    );

    const listStyle = useAnimatedStyle(() => ({ transform: [{ translateY: listY.value }] }));

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.trainerPrimary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
            <HeroGradient gradient={gradientColors.trainer} fixed />
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={(
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.trainerPrimary}
                        colors={[colors.trainerPrimary]}
                    />
                )}
            >
                {/* Hero title */}
                <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 80 }}>
                    <Text style={{ fontSize: fontSize.header, fontWeight: '800', color: colors.white }}>
                        Availability
                    </Text>
                    <Text
                        style={{
                            fontSize: fontSize.body,
                            color: colors.white65,
                            marginTop: 2,
                            fontWeight: '500',
                        }}
                    >
                        Set your weekly schedule
                    </Text>
                </View>

                <Animated.View style={[{ marginTop: -48 }, listStyle]}>
                    {/* Tab bar */}
                    <AvailabilityTabBar activeTab={activeTab} onTabChange={setActiveTab} />

                    {/* ── Daily tab ─────────────────────────────────────────── */}
                    {activeTab === 'daily' && (
                        <View style={{ paddingHorizontal: 20 }}>
                            {/* Active scope badge */}
                            {scopeText ? (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginBottom: 12,
                                        backgroundColor: colors.trainerSurface,
                                        borderRadius: radius.md,
                                        padding: 10,
                                        borderWidth: 1,
                                        borderColor: colors.trainerBorder,
                                    }}
                                >
                                    <Ionicons name="time-outline" size={14} color={colors.trainerPrimary} />
                                    <Text style={{ fontSize: fontSize.tag, color: colors.trainerPrimary, fontWeight: '600' }}>
                                        {scopeText}
                                    </Text>
                                </View>
                            ) : null}

                            {schedule.map((day) => (
                                <DayScheduleCard
                                    key={day.dayOfWeek}
                                    day={day}
                                    onToggle={() => toggleDay(day.dayOfWeek)}
                                    onAddSlot={() => addSlot(day.dayOfWeek)}
                                    onRemoveSlot={(slotId) => removeSlot(day.dayOfWeek, slotId)}
                                    onUpdateSlot={(slotId, field, value) => updateSlot(day.dayOfWeek, slotId, field, value)}
                                    onSessionModeChange={(mode) => setSessionMode(day.dayOfWeek, mode)}
                                />
                            ))}

                            {/* Save button */}
                            <TouchableOpacity
                                onPress={handleSavePress}
                                disabled={isSaving}
                                activeOpacity={0.8}
                                style={{
                                    height: 52,
                                    borderRadius: radius.card,
                                    backgroundColor: isSaving
                                        ? colors.trainerMuted
                                        : colors.trainerPrimary,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    gap: 8,
                                    marginTop: 8,
                                    ...shadow.trainer,
                                }}
                            >
                                <Ionicons name="save-outline" size={18} color={colors.white} />
                                <Text
                                    style={{
                                        fontSize: fontSize.body,
                                        fontWeight: '700',
                                        color: colors.white,
                                    }}
                                >
                                    {isSaving ? 'Saving...' : 'Save Availability'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── Presets tab ───────────────────────────────────────── */}
                    {activeTab === 'saved' && (
                        <View style={{ paddingHorizontal: 20 }}>
                            {presets.length === 0 ? (
                                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                                    <Ionicons name="bookmark-outline" size={40} color={colors.textDisabled} />
                                    <Text style={{ fontSize: fontSize.card, fontWeight: '600', color: colors.textMuted, marginTop: 12 }}>
                                        No saved schedules yet
                                    </Text>
                                    <Text style={{ fontSize: fontSize.tag, color: colors.textSubtle, marginTop: 4, textAlign: 'center' }}>
                                        Save your availability from the Daily tab
                                    </Text>
                                    <Text style={{ fontSize: fontSize.tag, color: colors.textSubtle, textAlign: 'center' }}>
                                        to see your history here.
                                    </Text>
                                </View>
                            ) : (
                                presets.map((preset) => (
                                    <PresetCard
                                        key={preset.id}
                                        preset={preset}
                                        isApplying={isApplyingPreset === preset.id}
                                        isActive={activePresetId === preset.id}
                                        activeScopeText={activePresetId === preset.id ? scopeText : null}
                                        onApply={applyPreset}
                                        onDelete={deletePreset}
                                    />
                                ))
                            )}
                        </View>
                    )}

                    {/* ── Monthly tab ───────────────────────────────────────── */}
                    {activeTab === 'monthly' && (
                        <View
                            style={{
                                marginHorizontal: 20,
                                backgroundColor: colors.white,
                                borderRadius: radius.card,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: colors.surfaceBorder,
                                ...shadow.cardSubtle,
                            }}
                        >
                            <MonthlyCalendarView
                                schedule={schedule}
                                scheduleScope={scheduleScope}
                                dateOverrides={dateOverrides}
                                scheduleOverrides={scheduleOverrides}
                                bookings={bookings}
                                onToggleDateOverride={toggleDateOverride}
                                onMonthChange={loadMonthOverrides}
                                onWeekCustomize={handleWeekCustomize}
                            />
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {weekModal && (
                <WeekOverrideSheet
                    visible
                    startDate={weekModal.startDate}
                    endDate={weekModal.endDate}
                    existingOverride={weekModal.existing}
                    defaultSchedule={schedule}
                    onSave={handleWeekSave}
                    onDelete={weekModal.existing ? handleWeekDelete : undefined}
                    onClose={() => setWeekModal(null)}
                />
            )}

            <ScheduleDurationSheet
                visible={durationSheetVisible}
                onConfirm={handleDurationConfirm}
                onClose={() => setDurationSheetVisible(false)}
            />
        </SafeAreaView>
    );
}
