import type { DaySchedule, SessionMode } from './trainerTypes';

export type AvailabilityTab = 'daily' | 'saved' | 'monthly';

export type ScheduleDurationType = 'forever' | 'this_year' | 'one_year' | 'months' | 'weeks' | 'this_week';

/**
 * The time-bound scope of the trainer's recurring weekly schedule.
 * effective_until = null means it repeats indefinitely.
 * planLabel is stored locally after each save — never derived from the date,
 * because the same date can correspond to different plan types.
 */
export interface ScheduleScope {
    effective_from: string;        // YYYY-MM-DD  — from API
    effective_until: string | null; // YYYY-MM-DD or null = forever  — from API
    planLabel?: string;            // e.g. "Forever", "1 Year", "4 weeks"  — from AsyncStorage
}

/**
 * A custom weekly schedule applied to a specific date range.
 * Multiple non-overlapping overrides are allowed. A week is just
 * a 7-day range — set start_date/end_date per week you want to customise.
 * Weeks without an override fall back to the default recurring weekly schedule.
 */
export interface ScheduleOverride {
    id: number;
    start_date: string; // YYYY-MM-DD
    end_date: string; // YYYY-MM-DD
    schedule: DaySchedule[]; // 7 days, same structure as weekly schedule
    created_at?: string;
    updated_at?: string;
}

export interface AvailabilityPreset {
    id: string;
    name: string;
    description: string;
    icon: string; // Ionicons icon name
    schedule: DaySchedule[];
    savedAt: string; // ISO date string — when this was saved from the Daily tab
}

/**
 * A specific calendar date (YYYY-MM-DD) the trainer has marked as unavailable,
 * overriding whatever the recurring weekly schedule says for that day-of-week.
 */
export interface DateOverride {
    id?: number; // backend-assigned ID — required for PATCH / DELETE calls
    date: string; // ISO format: "YYYY-MM-DD"
    reason?: string; // optional note e.g. "Vacation", "Sick day"
}

export type { SessionMode };

