/**
 * Static config for the client "Book Session" flow.
 * No hardcoded values inside components — everything lives here.
 */

// ─── Time slots ───────────────────────────────────────────────────────────────

export const BOOKING_TIME_SLOTS = [
    '07:00', '08:00', '09:00', '10:00', '11:00',
    '14:00', '15:00', '16:00', '17:00', '18:00',
] as const;

export type BookingTimeSlot = (typeof BOOKING_TIME_SLOTS)[number];

/** Pre-split into morning row and afternoon row for the grid. */
export const BOOKING_SLOT_ROWS = [
    BOOKING_TIME_SLOTS.slice(0, 5),
    BOOKING_TIME_SLOTS.slice(5),
] as const;

// ─── Date picker ──────────────────────────────────────────────────────────────

/**
 * Total days shown in the date strip, starting from tomorrow.
 * 60 days gives enough runway for a full-month selection.
 */
export const BOOKING_DATE_RANGE_DAYS = 60;

// ─── Selection modes ──────────────────────────────────────────────────────────

export type SelectionMode = 'single' | 'multi' | 'week' | 'month';

export interface SelectionModeOption {
    readonly label: string;
    readonly value: SelectionMode;
    /**
     * Number of consecutive days auto-selected on tap.
     * null → user picks individual dates (single / multi).
     */
    readonly days: number | null;
}

export const SELECTION_MODE_OPTIONS: SelectionModeOption[] = [
    { label: 'Single', value: 'single', days: null },
    { label: 'Multi-Day', value: 'multi', days: null },
    { label: 'Week', value: 'week', days: 7 },
    { label: 'Month', value: 'month', days: 30 },
];

// ─── Date label arrays (avoids toLocaleDateString locale inconsistencies) ────

export const WEEKDAY_LABELS_SHORT = [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
] as const;

export const WEEKDAY_LABELS_LONG = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

export const MONTH_LABELS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

// ─── Screen animations ────────────────────────────────────────────────────────

export const BOOKING_ANIM = {
    SLIDE: 40,
    DUR: 300,
    STAGGER: 100,
} as const;

// ─── Notes input ──────────────────────────────────────────────────────────────

export const BOOKING_NOTES_PLACEHOLDER = 'Any specific goals or requirements...';
export const BOOKING_NOTES_MAX_LENGTH = 300;
