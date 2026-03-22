import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { trainerService } from '@/api/services/trainer.service';
import { DEFAULT_NEW_SLOT } from '@/constants/trainerSchedule.constants';
import { showErrorToast, showSuccessToast } from '@/lib';
import type { AvailabilityPreset, AvailabilityTab, DateOverride, ScheduleOverride, ScheduleScope } from '@/types/trainerAvailability.types';
import type { DaySchedule, SessionMode } from '@/types/trainerTypes';

const SAVED_SCHEDULES_KEY = 'trainer_saved_schedules';
const SCHEDULE_SCOPE_LABEL_KEY = 'trainer_schedule_scope_label';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function schedulesMatch(a: DaySchedule[], b: DaySchedule[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((dayA) => {
        const dayB = b.find((d) => d.dayOfWeek === dayA.dayOfWeek);
        if (!dayB) return false;
        if (dayA.enabled !== dayB.enabled) return false;
        if (dayA.session_mode !== dayB.session_mode) return false;
        if (dayA.slots.length !== dayB.slots.length) return false;
        return dayA.slots.every((slotA, i) =>
            slotA.startTime === dayB.slots[i]?.startTime && slotA.endTime === dayB.slots[i]?.endTime,
        );
    });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTrainerSchedule() {
    const [activeTab, setActiveTab] = useState<AvailabilityTab>('daily');
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [scheduleScope, setScheduleScope] = useState<ScheduleScope | null>(null);
    const [presets, setPresets] = useState<AvailabilityPreset[]>([]);
    const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
    const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isApplyingPreset, setIsApplyingPreset] = useState<string | null>(null);
    const [lastSavedSchedule, setLastSavedSchedule] = useState<DaySchedule[]>([]);

    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    // ── Initial load ──────────────────────────────────────────────────────────

    const loadData = useCallback(async () => {
        console.warn('[hook:schedule] loadData → start');
        setIsLoading(true);
        try {
            const now = new Date();
            // Fetch overrides filtered to the current month — keeps response small
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            console.warn('[hook:schedule] loadData → currentMonth:', currentMonth);

            // Load AsyncStorage first (always succeeds, independent of API)
            const [storedRaw, storedScopeLabel] = await Promise.all([
                AsyncStorage.getItem(SAVED_SCHEDULES_KEY),
                AsyncStorage.getItem(SCHEDULE_SCOPE_LABEL_KEY),
            ]);
            console.warn('[hook:schedule] loadData → storedScopeLabel:', storedScopeLabel, '| presets:', storedRaw ? JSON.parse(storedRaw).length : 0);

            // Set presets immediately from AsyncStorage
            if (mountedRef.current) {
                setPresets(storedRaw ? (JSON.parse(storedRaw) as AvailabilityPreset[]) : []);
            }

            // Then fetch API data
            const [scheduleResult, loadedOverrides, loadedScheduleOverrides] = await Promise.all([
                trainerService.getSchedule(),
                trainerService.getDateOverrides(currentMonth),
                trainerService.getScheduleOverrides(currentMonth),
            ]);

            if (!mountedRef.current) return;
            console.warn('[hook:schedule] loadData ← schedule days:', scheduleResult.schedule.length, '| scope:', JSON.stringify(scheduleResult.scope));
            console.warn('[hook:schedule] loadData ← dateOverrides:', loadedOverrides.length, '| scheduleOverrides:', loadedScheduleOverrides.length);
            setSchedule(scheduleResult.schedule);
            // Merge API scope with the locally stored plan label
            setScheduleScope(scheduleResult.scope
                ? { ...scheduleResult.scope, planLabel: storedScopeLabel ?? undefined }
                : null,
            );
            setLastSavedSchedule(scheduleResult.schedule);
            setDateOverrides(loadedOverrides);
            setScheduleOverrides(loadedScheduleOverrides);
        } catch (error) {
            console.error('[loadData] Error:', error);
            if (mountedRef.current) {
                showErrorToast('Failed to load schedule', 'Error');
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    // ── Day-level mutations ───────────────────────────────────────────────────

    const toggleDay = useCallback((dayIndex: number) => {
        console.warn('[hook:schedule] toggleDay → dayIndex:', dayIndex);
        setSchedule((prev) =>
            prev.map((d) =>
                (d.dayOfWeek === dayIndex
                    ? {
                          ...d,
                          enabled: !d.enabled,
                          slots: !d.enabled
                              ? [{ id: `${dayIndex}-${Date.now()}`, ...DEFAULT_NEW_SLOT }]
                              : [],
                      }
                    : d),
            ),
        );
    }, []);

    const addSlot = useCallback((dayIndex: number) => {
        console.warn('[hook:schedule] addSlot → dayIndex:', dayIndex);
        setSchedule((prev) =>
            prev.map((d) => {
                if (d.dayOfWeek !== dayIndex) return d;

                // Smart default: start after the latest end time of existing slots
                let { startTime, endTime } = DEFAULT_NEW_SLOT;

                if (d.slots.length > 0) {
                    const latestEndMinutes = d.slots.reduce((latest, s) => {
                        const [h, m] = s.endTime.split(':').map(Number);
                        return Math.max(latest, h * 60 + m);
                    }, 0);

                    // Only apply smart default if there's room before 22:00
                    if (latestEndMinutes < 21 * 60) {
                        const latestH = Math.floor(latestEndMinutes / 60);
                        const latestM = latestEndMinutes % 60;
                        startTime = `${String(latestH).padStart(2, '0')}:${String(latestM).padStart(2, '0')}`;
                        const endMinutes = Math.min(latestEndMinutes + 60, 22 * 60);
                        const endH = Math.floor(endMinutes / 60);
                        const endM = endMinutes % 60;
                        endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                    }
                }

                return {
                    ...d,
                    slots: [...d.slots, { id: `${dayIndex}-${Date.now()}`, startTime, endTime }],
                };
            }),
        );
    }, []);

    const removeSlot = useCallback((dayIndex: number, slotId: string) => {
        console.warn('[hook:schedule] removeSlot → dayIndex:', dayIndex, 'slotId:', slotId);
        setSchedule((prev) =>
            prev.map((d) =>
                (d.dayOfWeek === dayIndex
                    ? { ...d, slots: d.slots.filter((s) => s.id !== slotId) }
                    : d),
            ),
        );
    }, []);

    const updateSlot = useCallback(
        (dayIndex: number, slotId: string, field: 'startTime' | 'endTime', value: string) => {
            console.warn('[hook:schedule] updateSlot → dayIndex:', dayIndex, 'slotId:', slotId, `${field}:`, value);
            setSchedule((prev) =>
                prev.map((d) =>
                    (d.dayOfWeek === dayIndex
                        ? {
                              ...d,
                              slots: d.slots.map((s) =>
                                  (s.id === slotId ? { ...s, [field]: value } : s),
                              ),
                          }
                        : d),
                ),
            );
        },
        [],
    );

    const setSessionMode = useCallback((dayIndex: number, mode: SessionMode) => {
        console.warn('[hook:schedule] setSessionMode → dayIndex:', dayIndex, 'mode:', mode);
        setSchedule((prev) =>
            prev.map((d) =>
                (d.dayOfWeek === dayIndex ? { ...d, session_mode: mode } : d),
            ),
        );
    }, []);

    // ── Date overrides ────────────────────────────────────────────────────────

    /**
     * Toggle a specific calendar date as unavailable / restore it.
     * Uses optimistic UI — state updates immediately, rolls back on API failure.
     */
    const toggleDateOverride = useCallback(async (dateStr: string, reason?: string) => {
        const existing = dateOverrides.find((o) => o.date === dateStr);
        console.warn('[hook:schedule] toggleDateOverride → date:', dateStr, existing ? `action: UNBLOCK id:${existing.id}` : 'action: BLOCK');

        if (existing) {
            // ── Unblock: optimistic remove ────────────────────────────────────
            setDateOverrides((prev) => prev.filter((o) => o.date !== dateStr));
            try {
                await trainerService.deleteDateOverride(existing.id!);
                console.warn('[hook:schedule] toggleDateOverride ← UNBLOCK success:', dateStr);
            } catch {
                // Rollback
                setDateOverrides((prev) => [...prev, existing]);
                console.warn('[hook:schedule] toggleDateOverride ← UNBLOCK failed, rolled back:', dateStr);
                if (mountedRef.current) showErrorToast('Failed to unblock date', 'Error');
            }
        } else {
            // ── Block: optimistic add (no id yet), swap with real after POST ──
            const optimistic: DateOverride = { date: dateStr, reason };
            setDateOverrides((prev) => [...prev, optimistic]);
            try {
                const { override: created } = await trainerService.createDateOverride(dateStr, reason);
                if (!mountedRef.current) return;
                console.warn('[hook:schedule] toggleDateOverride ← BLOCK success, id:', created.id, 'date:', created.date);
                // Replace the optimistic placeholder with the real object (which has the backend id)
                setDateOverrides((prev) =>
                    prev.map((o) => (o.date === dateStr && o.id === undefined ? created : o)),
                );
            } catch {
                // Rollback
                setDateOverrides((prev) => prev.filter((o) => o.date !== dateStr));
                console.warn('[hook:schedule] toggleDateOverride ← BLOCK failed, rolled back:', dateStr);
                if (mountedRef.current) showErrorToast('Failed to block date', 'Error');
            }
        }
    }, [dateOverrides]);

    /**
     * Load date overrides for a specific month.
     * Used when navigating between months in the calendar.
     */
    const loadMonthOverrides = useCallback(async (year: number, month: number) => {
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        console.warn('[hook:schedule] loadMonthOverrides → month:', monthStr);
        try {
            const [overrides, schedOverrides] = await Promise.all([
                trainerService.getDateOverrides(monthStr),
                trainerService.getScheduleOverrides(monthStr),
            ]);
            console.warn('[hook:schedule] loadMonthOverrides ← dateOverrides:', overrides.length, '| scheduleOverrides:', schedOverrides.length);
            if (mountedRef.current) {
                setDateOverrides(overrides);
                setScheduleOverrides(schedOverrides);
            }
        } catch (error) {
            console.error('[loadMonthOverrides] Error:', error);
        }
    }, []);

    // ── Schedule overrides (per-week custom schedules) ────────────────────────

    /**
     * Save a new schedule override for a date range (typically one week).
     * Uses optimistic UI — inserts immediately, rolls back on failure.
     */
    const createScheduleOverride = useCallback(async (
        startDate: string,
        endDate: string,
        weekSchedule: DaySchedule[],
    ) => {
        console.warn('[hook:schedule] createScheduleOverride → range:', startDate, '→', endDate, '| days:', weekSchedule.filter(d => d.enabled).length, 'enabled');
        const optimistic: ScheduleOverride = { id: -Date.now(), start_date: startDate, end_date: endDate, schedule: weekSchedule };
        setScheduleOverrides((prev) => [...prev, optimistic]);
        try {
            const created = await trainerService.createScheduleOverride(startDate, endDate, weekSchedule);
            if (!mountedRef.current) return;
            console.warn('[hook:schedule] createScheduleOverride ← success, id:', created.id);
            setScheduleOverrides((prev) => prev.map((o) => (o.id === optimistic.id ? created : o)));
            showSuccessToast('Week schedule saved!');
        } catch {
            setScheduleOverrides((prev) => prev.filter((o) => o.id !== optimistic.id));
            console.warn('[hook:schedule] createScheduleOverride ← failed, rolled back');
            if (mountedRef.current) showErrorToast('Failed to save week schedule', 'Error');
        }
    }, []);

    /**
     * Update an existing schedule override's dates and/or schedule.
     */
    const updateScheduleOverride = useCallback(async (
        id: number,
        startDate: string,
        endDate: string,
        weekSchedule: DaySchedule[],
    ) => {
        console.warn('[hook:schedule] updateScheduleOverride → id:', id, 'range:', startDate, '→', endDate, '| days:', weekSchedule.filter(d => d.enabled).length, 'enabled');
        const prev = scheduleOverrides.find((o) => o.id === id);
        const optimistic: ScheduleOverride = { id, start_date: startDate, end_date: endDate, schedule: weekSchedule };
        setScheduleOverrides((cur) => cur.map((o) => (o.id === id ? optimistic : o)));
        try {
            const updated = await trainerService.updateScheduleOverride(id, startDate, endDate, weekSchedule);
            if (!mountedRef.current) return;
            console.warn('[hook:schedule] updateScheduleOverride ← success, id:', updated.id);
            setScheduleOverrides((cur) => cur.map((o) => (o.id === id ? updated : o)));
            showSuccessToast('Week schedule updated!');
        } catch {
            if (prev) setScheduleOverrides((cur) => cur.map((o) => (o.id === id ? prev : o)));
            console.warn('[hook:schedule] updateScheduleOverride ← failed, rolled back id:', id);
            if (mountedRef.current) showErrorToast('Failed to update week schedule', 'Error');
        }
    }, [scheduleOverrides]);

    /**
     * Delete a schedule override — that week reverts to the default recurring schedule.
     */
    const deleteScheduleOverride = useCallback(async (id: number) => {
        console.warn('[hook:schedule] deleteScheduleOverride → id:', id);
        const removed = scheduleOverrides.find((o) => o.id === id);
        setScheduleOverrides((prev) => prev.filter((o) => o.id !== id));
        try {
            await trainerService.deleteScheduleOverride(id);
            console.warn('[hook:schedule] deleteScheduleOverride ← success, id:', id);
            if (mountedRef.current) showSuccessToast('Week reverted to default schedule');
        } catch {
            if (removed) setScheduleOverrides((prev) => [...prev, removed]);
            console.warn('[hook:schedule] deleteScheduleOverride ← failed, rolled back id:', id);
            if (mountedRef.current) showErrorToast('Failed to delete week schedule', 'Error');
        }
    }, [scheduleOverrides]);

    // ── Save weekly schedule ──────────────────────────────────────────────────

    /**
     * Persists the current schedule with an optional time-bound scope.
     * Duration selection (effectiveFrom / effectiveUntil) is handled by the
     * screen via ScheduleDurationSheet before this is called.
     */
    const saveSchedule = useCallback(async (effectiveFrom: string, effectiveUntil: string | null, planLabel: string) => {
        console.warn('[hook:schedule] saveSchedule → planLabel:', planLabel, '| effectiveFrom:', effectiveFrom, '| effectiveUntil:', effectiveUntil);
        console.warn('[hook:schedule] saveSchedule → schedule days:', schedule.length, '| enabled:', schedule.filter(d => d.enabled).length);
        setIsSaving(true);
        try {
            await trainerService.saveSchedule(schedule, effectiveFrom, effectiveUntil);
            if (mountedRef.current) {
                const now = new Date();
                const savedAt = now.toISOString();
                const label = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const timeLabel = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const activeDays = schedule.filter((d) => d.enabled).length;
                const historyEntry: AvailabilityPreset = {
                    id: `history-${Date.now()}`,
                    name: `${label} · ${timeLabel}`,
                    description: `${activeDays} active day${activeDays !== 1 ? 's' : ''}`,
                    icon: 'bookmark-outline',
                    schedule: schedule.map((d) => ({ ...d, slots: d.slots.map((s) => ({ ...s })) })),
                    savedAt,
                };
                setLastSavedSchedule(schedule.map((d) => ({ ...d, slots: d.slots.map((s) => ({ ...s })) })));
                console.warn('[hook:schedule] saveSchedule ← success | scope set:', effectiveFrom, '→', effectiveUntil ?? 'forever');
                setScheduleScope({ effective_from: effectiveFrom, effective_until: effectiveUntil, planLabel });
                const updatedPresets = [historyEntry, ...presets];
                setPresets(updatedPresets);

                try {
                    await AsyncStorage.setItem(SAVED_SCHEDULES_KEY, JSON.stringify(updatedPresets));
                    await AsyncStorage.setItem(SCHEDULE_SCOPE_LABEL_KEY, planLabel);
                } catch (storageError) {
                    console.error('[saveSchedule] AsyncStorage error:', storageError);
                    throw storageError;
                }

                showSuccessToast('Availability saved!');
            }
        } catch {
            if (mountedRef.current) showErrorToast('Failed to save availability', 'Error');
        } finally {
            if (mountedRef.current) setIsSaving(false);
        }
    }, [schedule, presets]);

    // ── Preset application ────────────────────────────────────────────────────

    /**
     * Applies a preset template to the local schedule state.
     * Presets are client-side only — no API call needed.
     * Trainer still needs to tap Save to persist the result.
     */
    const applyPreset = useCallback((preset: AvailabilityPreset) => {
        setIsApplyingPreset(preset.id);
        setSchedule(preset.schedule);
        setActiveTab('daily');
        setIsApplyingPreset(null);
    }, []);

    const deletePreset = useCallback(async (id: string) => {
        const updated = presets.filter((p) => p.id !== id);
        setPresets(updated);
        try {
            await AsyncStorage.setItem(SAVED_SCHEDULES_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('[deletePreset] AsyncStorage error:', error);
        }
    }, [presets]);

    const activePresetId = presets.find((p) => schedulesMatch(p.schedule, lastSavedSchedule))?.id ?? null;
    const scheduleDuplicateName = presets.find((p) => schedulesMatch(p.schedule, schedule))?.name ?? null;

    return {
        // state
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
        activePresetId,
        // actions
        loadData,
        toggleDay,
        addSlot,
        removeSlot,
        updateSlot,
        setSessionMode,
        saveSchedule,
        applyPreset,
        deletePreset,
        toggleDateOverride,
        loadMonthOverrides,
        createScheduleOverride,
        updateScheduleOverride,
        deleteScheduleOverride,
    };
}
